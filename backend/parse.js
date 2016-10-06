function parseGeoJSON(rows) {

    /*
    input...
    rows: [
        [1, 1, {"type":"Point","coordinates":[-77.027429,38.951868]}]
    ]
    output...
    rows: [
        [1, 1, GeoJSON 1]
    ],
    geojson: [{
        "1": {
            "type": "FeatureCollection",
            "features": [{
                "properties": {},
                "type": "Feature"
                "geometry": {
                    "type": "GeometryCollection",
                    "geometries": [
                        {
                            "coordinates": [-77.027429, 38.951868],
                            "type": "Point"
                        }
                    ]
                }
            }]
        }
    }]
    */

    const toGeoJSON = (obj) => {
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'GeometryCollection',
                    geometries: [obj]
                    }
            }]
        };
    };

    // id's to identify GeoJSON objects
    let id = 1;

    const GeoJSONs = [];
    const newRows = rows.map((row) => {
        return row.map((el) => {
            if (el !== null && typeof el === 'object') {
                // push the object to GeoJSONs and replace it with an id
                GeoJSONs.push(
                    {[id]: toGeoJSON(el)}
                );
                id += 1;
                return `GeoJSON ${id - 1}`;
            }
            return el;
        });
    });
    // if response has no geojson, the geojson is returned as empty array
    return {rows: newRows, geojson: GeoJSONs};

}

export function parseSQL(data) {
    /*
        data received from database format ...

        data = [
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
            {
            firstColumn: 3,
            secondColumn: 3,
            thirdColumn: "three"
            },
            {
            firstColumn: 4,
            secondColumn: 4,
            thirdColumn: "four"
            },
            {
            firstColumn: 5,
            secondColumn: 5,
            thirdColumn: "five"
            }
        ]
    */

    // get column names of the first object (repeated for all objects)
    const columnnames = Object.keys(data[0]);
    const ncols = columnnames.length;
    const nrows = data.length;

    // iterate over eaech object (each object becomes a row)
    // returns: a row of rows (table)
    const table = data.map((obj) => {
        // get the value for each column => put them into an array
        // returns: a row
        return Object.keys(obj).map((columnname) => {
            // returns: a column's values
            return obj[columnname];
        });
    });

    const {rows, geojson} = parseGeoJSON(table);

    // plotly workspace requires keys (columnnames, ncols, nrows, rows)
    // and they should be in this format
    // TODO: keys geojson and raw are currently optional
    return {columnnames, ncols, nrows, rows, geojson, raw: data};
}


export function parseES(data) {

    /*
    recieves data as
    [
        {
            _index: 'indexName',
            _type: 'documentName',
            _id: '1234',
            _score: 1,
            _source:
                {
                    columnName1: 'blah',
                    columnName2: 'fiz',
                    columnName3: 'baz'
                }
        },
        {
            _index: 'indexName',
            _type: 'documentName',
            _id: '1235',
            _score: 1,
            _source:
                {
                    columnName1: 'beep',
                    columnName2: 'foo',
                    columnName3: 'bar'
                }
        }
    ]

    */

    const columnnames = Object.keys(data[0]._source);
    const ncols = columnnames.length;
    const nrows = data.length;

    const table = data.map((obj) => {
        // get the value for each column => put them into an array
        // returns: a row
        return Object.keys(obj._source).map((columnname) => {
            // returns: a column's values
            return obj._source[columnname];
        });
    });

    const {rows, geojson} = parseGeoJSON(table);

    return {columnnames, ncols, nrows, rows, geojson, raw: data};
}
