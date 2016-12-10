import {contains, gt, keys, replace, type} from 'ramda';
import parse from 'csv-parse';

export function parseSQL(data) {
/*
        data is in the format

        [
            {
                firstColumn: 1,
                secondColumn: 1,
                thirdColumn: "one"
            },
            {
                firstColumn: 2,
                secondColumn: 2,
                thirdColumn: "two"
            },
            ...
        ]
    */
    if (data.length === 0) {
        return {
            columnnames: [],
            rows: [[]]
        };
    }

    // get column names of the first object (repeated for all objects)
    const columnnames = Object.keys(data[0]);

    // iterate over each object (each object becomes a row)
    // returns: a row of rows (table)
    const rows = [];
    for (let i = 0; i < data.length; i++) {
        rows[i] = [];
        for (let j = 0; j < columnnames.length; j++) {
            let cell = data[i][columnnames[j]];
            // Like PostGIS's GeoJSON
            if (type(cell) === 'Object') {
                try {
                    cell = JSON.stringify(cell);
                } catch (e) {
                    cell = cell;
                }
            }
            rows[i][j] = cell;
        }
    }

    // plotly workspace requires keys (columnnames, ncols, nrows, rows)
    // and they should be in this format
    return {columnnames, rows};
}


export function parseElasticsearch(inputJson, outputJson, mappings) {
    /*
     * Convert the output of an elasticsearch query into a columnar format.
     *
     * Elasticsearch's results aren't necessarily columnar.
     * If no aggregation was applied in the input query then we return the
     * values found in hits.hits.
     *
     * If an aggregation was applied, then we go into the aggregations
     * object and create a columnar representation.
     *
     * inputJson is like:
     * {
     *     'query': {
     *         'query_string': {
     *             'query': '*'
     *         }
     *     },
     *     'aggs': {
     *         'agg1': {
     *             'histogram': {
     *                 'interval': 10,
     *                 'field': 'my-number-1'
     *             },
     *             'aggs': {
     *                 'agg2': {
     *                     'value_count': {
     *                         'field': 'my-number-1'
     *                     }
     *                 }
     *             }
     *         }
     *     },
     *     'size': 2
     * }
     *
     * outputJson is like:
     * {
     *   "took": 2,
     *   "timed_out": false,
     *   "_shards": {
     *     "total": 1,
     *     "successful": 1,
     *     "failed": 0
     *   },
     *   "hits": {
     *     "total": 11,
     *     "max_score": 1,
     *     "hits": [
     *       {
     *         "_index": "sample-data",
     *         "_type": "test-type",
     *         "_id": "1",
     *         "_score": 1,
     *         "_source": {
     *           "my-date-1": "2015-01-01T12:30:40Z",
     *           "my-string-1": "NYC",
     *           "my-string-2": "USA",
     *           "my-date-2": "1915-01-01T12:30:40Z",
     *           "my-number-1": 1,
     *           "my-number-2": 10,
     *           "my-geo-point-2": [
     *             -10,
     *             -10
     *           ],
     *           "my-geo-point-1": [
     *             10,
     *             10
     *           ],
     *           "my-boolean-2": true,
     *           "my-boolean-1": true
     *         }
     *       },
     *       {
     *         "_index": "sample-data",
     *         "_type": "test-type",
     *         "_id": "2",
     *         "_score": 1,
     *         "_source": {
     *           "my-date-1": "2015-10-04T12:35:10Z",
     *           "my-string-1": "NYC",
     *           "my-string-2": "USA",
     *           "my-date-2": "1915-10-04T12:35:10Z",
     *           "my-number-1": 2,
     *           "my-number-2": 20,
     *           "my-geo-point-2": [
     *             -11,
     *             -11
     *           ],
     *           "my-geo-point-1": [
     *             11,
     *             11
     *           ],
     *           "my-boolean-2": false,
     *           "my-boolean-1": true
     *         }
     *       }
     *     ]
     *   },
     *   "aggregations": {
     *     "agg1": {
     *       "buckets": [
     *         {
     *           "key": 0,
     *           "doc_count": 9,
     *           "agg2": {
     *             "value": 9
     *           }
     *         },
     *         {
     *           "key": 10,
     *           "doc_count": 2,
     *           "agg2": {
     *             "value": 2
     *           }
     *         }
     *       ]
     *     }
     *   }
     * }
     *
     * mappings is like
     * {
     *     "my-boolean": {"type": "boolean"},
     *     "my-date": {"type": "date"},
     * }
     */

     if (inputJson.aggs) {
         const aggregationType = keys(inputJson.aggs.agg1)[0];
         const aggregationColumn = inputJson.aggs.agg1[aggregationType].field;
         const metricType = keys(inputJson.aggs.agg1.aggs.agg2)[0]; // e.g. 'value_count' or 'sum'
         const humanReadableMetricType = replace(/_/, ' ', metricType);
         const metricColumn = inputJson.aggs.agg1.aggs.agg2[metricType].field;
         const columnnames = [
            aggregationColumn,
            `${humanReadableMetricType} of ${metricColumn}`
         ];
         let rows;
         const buckets = outputJson.aggregations.agg1.buckets;
         if (buckets.length === 0) {
             rows = [[]];
         } else {
             rows = [];
             for (let i = 0; i < buckets.length; i++) {
                 rows[i] = [buckets[i].key, buckets[i].agg2.value];
             }
         }
         return {columnnames, rows};
     } else if (outputJson.hits.hits.length === 0) {
         return {
             columnnames: [],
             rows: [[]]
         };
     } else {
         const data = outputJson.hits.hits;

         const elasticColumns = keys(data[0]._source).sort();
         const columnnames = [];
         for (let i = 0; i < elasticColumns.length; i++) {
             const columnName = elasticColumns[i];
             if (mappings[columnName].type === 'geo_point') {
                 columnnames.push(`${columnName} (lat)`);
                 columnnames.push(`${columnName} (lon)`);
             } else {
                 columnnames.push(columnName);
             }
         }

         const rows = [];
         let cell;
         for (let i = 0; i < data.length; i++) {
             rows[i] = [];
             for (let j = 0; j < elasticColumns.length; j++) {
                 cell = data[i]._source[elasticColumns[j]];

                 if (mappings[elasticColumns[j]].type === 'geo_point') {
                     const cellType = type(cell);
                     if (cellType === 'String' && contains(',', cell)) {
                         const latlon = cell.split(',');
                         rows[i].push(parseFloat(latlon[0], 10));
                         rows[i].push(parseFloat(latlon[1], 10));
                     } else if (cellType === 'Object') {
                         rows[i].push(cell.lat);
                         rows[i].push(cell.lon);
                     } else if (cellType === 'Array') {
                         // geo_points as arrays are [lon, lat] not [lat, lon]
                         rows[i].push(cell[1]);
                         rows[i].push(cell[0]);
                     } else {
                         // geohash and anything that might've slipped through the cracks
                         rows[i].push(cell);
                     }
                 } else {
                     rows[i].push(cell);
                 }

             }
         }

         return {columnnames, rows};

     }
}

export function parseCSV(textData) {
    return new Promise((resolve, reject) => {
        parse(
            textData, {
                delimeter: ',',
                rowDelimeter: 'auto',
                quote: '"',
                escape: '"',
                columns: null,
                comment: '',
                relax: false,
                relax_column_count: false,
                skip_empty_lines: false,
                trim: true,
                auto_parse: false,
                auto_parse_date: false
            }, function callback(err, allRows) {
            if (err) {
                reject(err);
            }
            if (!allRows || allRows.length === 0) {
                resolve({
                    columnnames: [],
                    rows: [[]]
                });
            }
            const columnnames = allRows[0];
            const rows = allRows.slice(1);
            resolve({
                columnnames,
                rows
            });
        });
    });
}
