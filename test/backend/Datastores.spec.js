import {assert} from 'chai';
import {merge, range} from 'ramda';

import {
    sqlConnections,
    mssqlConnection,
    elasticsearchConnections,
    publicReadableS3Connections,
    apacheDrillConnections,
    apacheDrillStorage,
    postgisConnection
} from './utils.js';

import {
    query, connect, files, storage, listS3Files, elasticsearchMappings
} from '../../backend/persistent/datastores/Datastores.js';

// eslint-disable-next-line no-shadow
const transpose = m => m[0].map((x, i) => m.map(x => x[i]));

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('SQL - ', function () {
    it('connect connects to a database', function(done) {
        this.timeout(4 * 1000);
        connect(sqlConnections).then(done).catch(done);
    });

    it('query queries a database', function(done) {
        this.timeout(4 * 1000);
        query(
            'SELECT * from ebola_2014 LIMIT 2',
            sqlConnections
        ).then(results => {
            assert.deepEqual(results.rows, [
                ['Guinea', 3, 14, '9.95', '-9.7', '122'],
                ['Guinea', 4, 14, '9.95', '-9.7', '224']
            ]);
            assert.deepEqual(results.columnnames, [
                'country', 'month', 'year', 'lat', 'lon', 'value'
            ]);
            done();
        }).catch(done);
    });

    /*
     * Unfortunately we don't have a PostGIS table that doesn't update
     * with random data yet, so we have to skip this test on CI.
     * It worked at a single point in time.
     * TODO - Create a static PostGIS table for testing
     */
    xit('query stringifies boolean, date, and geojson objects', function(done) {
        this.timeout(5 * 1000);

        query(
            'SELECT * from test LIMIT 1',
            postgisConnection
        ).then(results => {
            assert.deepEqual(
                results.rows,
                [[
                    1,
                    '2016-12-12T07:46:36.144Z',
                    'blue',
                    0,
                    0.641140648704853,
                    'true',
                    '{"type":"Point","coordinates":[7,9]}',
                    '{"type":"LineString","coordinates":[[6,6],[8,2],[7,5]]}',
                    '{"type":"Polygon","coordinates":[[[0,0],[3,0],[3,3],[0,3],[0,0]]]}',
                    '{"type":"MultiPoint","coordinates":[[0,1],[0,1]]}',
                    '{"type":"MultiLineString","coordinates":[[[3,8],[4,5],[9,5]],[[8,6],[4,8],[0,3]]]}',
                    '{"type":"MultiPolygon","coordinates":[[[[0,0],[7,0],[7,7],'
                    + '[0,7],[0,0]]],[[[0,0],[7,0],[7,7],[0,7],[0,0]]]]}',
                    '{"type":"GeometryCollection","geometries":[{"type":"Point",'
                    + '"coordinates":[9,8]},{"type":"Polygon","coordinates":[[[0,0],[7,0],[7,7],[0,7],[0,0]]]}]}'
                ]]
            );
            done();
        }).catch(done);
    });

});


describe('MSSQL - ', function () {
    it('times out after 15 seconds by default', function(done) {
        this.timeout(20 * 1000);
        query(
            'WAITFOR DELAY \'00:00:16\'',
            mssqlConnection
        ).then(() => {
            done('Was supposed to fail');
        }).catch(e => {
            assert.equal(
                e.message,
                'Timeout: Request failed to complete in 15000ms'
            );
            done();
        }).catch(done);
    });

    it('doesn\'t timeout if requestTimeout was set', function(done) {
        this.timeout(20 * 1000);
        query(
            'WAITFOR DELAY \'00:00:16\'',
            merge(mssqlConnection, {requestTimeout: 18 * 1000})
        ).then(() => {
            done();
        }).catch(done);
    });
});

describe('Elasticsearch - ', function () {
    it('connect connects to an index', function(done) {
        this.timeout(4 * 1000);
        connect(elasticsearchConnections).then(res => res.json().then(json => {
            assert.deepEqual(
                json[1],
                {
                    'health': 'yellow',
                    'status': 'open',
                    'index': 'plotly_datasets',
                    'pri': '1',
                    'rep': '1',
                    'docs.count': '28187',
                    'docs.deleted': '0',
                    'store.size': '5.8mb',
                    'pri.store.size': '5.8mb'
                }
            );

            /*
             * The 3rd index is frequently changing, so just test against
             * an immutable field
             */
            assert.equal(json[2].index, 'test-scroll');

            assert.equal(res.status, 200);

            done();
        })).catch(done);
    });

    it('mappings returns mappings', function(done) {
        elasticsearchMappings(elasticsearchConnections).then(json => {
            assert.deepEqual(
                json,
                {
                    'test-types': {
                        'mappings': {
                            'elastic-2.4-types': {
                                'properties': {
                                    'date': {
                                        'type': 'date',
                                        'format': 'strict_date_optional_time||epoch_millis'
                                    },
                                    'string-1': {'type': 'string'},
                                    'string-2': {'type': 'string'},
                                    'token': {
                                        'analyzer': 'standard',
                                        'type': 'token_count'
                                    },
                                    'integer': {'type': 'integer'},
                                    'double': {'type': 'double'},
                                    'boolean': {'type': 'boolean'},
                                    'geo_point-1': {'type': 'geo_point'},
                                    'geo_point-2': {'type': 'geo_point'},
                                    'geo_point-3': {'type': 'geo_point'},
                                    'ip': {'type': 'ip'}
                                }
                            }
                        }
                    },
                    'test-scroll': {
                        'mappings': {
                            '200k': {
                                'properties': {
                                    'Column 1': {'type': 'double'},
                                    'Column 2': {'type': 'double'},
                                    'Column 3': {'type': 'double'},
                                    'Column 4': {'type': 'double'}
                                }
                            }
                        }
                    },
                    'live-data': {
                        'mappings': {
                            'test-type': {
                                'properties': {
                                    'date': {
                                        'type': 'date',
                                        'format': 'strict_date_optional_time||epoch_millis'
                                    },
                                    'string-1': {'type': 'string'},
                                    'string-2': {'type': 'string'},
                                    'token': {
                                        'analyzer': 'standard',
                                        'type': 'token_count'
                                    },
                                    'integer': {'type': 'integer'},
                                    'double': {'type': 'double'},
                                    'boolean': {'type': 'boolean'},
                                    'geo_point-1': {'type': 'geo_point'},
                                    'geo_point-2': {'type': 'geo_point'},
                                    'geo_point-3': {'type': 'geo_point'},
                                    'ip': {'type': 'ip'}
                                }
                            }
                        }
                    },
                    'plotly_datasets': {
                      'mappings': {
                        'consumer_complaints': {
                            'properties': {
                              'Company': {'type': 'string'},
                              'Company response': {'type': 'string'},
                              'Complaint ID': {'type': 'integer'},
                              'Consumer disputed?': {'type': 'string'},
                              'Date received': {'type': 'date', 'format': 'strict_date_optional_time'},
                              'Date sent to company': {'type': 'date', 'format': 'strict_date_optional_time'},
                              'Issue': {'type': 'string'},
                              'Product': {'type': 'string'},
                              'State': {'type': 'string'},
                              'Sub-issue': {'type': 'string'},
                              'Sub-product': {'type': 'string'},
                              'Timely response?': {'type': 'string'},
                              'ZIP code': {'type': 'integer'}
                            }
                        },
                        'ebola_2014': {
                          'properties': {
                            'Country': {
                              'type': 'string'
                            },
                            'Lat': {
                              'type': 'float'
                            },
                            'Lon': {
                              'type': 'float'
                            },
                            'Month': {
                              'type': 'integer'
                            },
                            'Value': {
                              'type': 'float'
                            },
                            'Year': {
                              'type': 'integer'
                            },
                            'index': {
                              'type': 'integer'
                            }
                          }
                        }
                      }
                    },
                    'sample-data': {
                      'mappings': {
                         'test-ranges': {
                            'properties': {
                              'Date': {
                                'format': 'strict_date_optional_time||epoch_millis',
                                'type': 'date'
                                },
                              'Float': {
                                'type': 'float'
                                },
                              'Integer': {
                                'type': 'integer'
                                },
                              'Ipv4': {
                                'type': 'ip'
                                },
                              'String': {
                                'type': 'string'
                                }
                              }
                          },
                        'test-type': {
                          'properties': {
                            'my-boolean-1': {
                              'type': 'boolean'
                          },
                            'my-boolean-2': {
                              'type': 'boolean'
                          },
                            'my-date-1': {
                              'format': 'strict_date_optional_time||epoch_millis',
                              'type': 'date'
                          },
                            'my-date-2': {
                              'format': 'strict_date_optional_time||epoch_millis',
                              'type': 'date'
                          },
                            'my-geo-point-1': {
                              'type': 'geo_point'
                          },
                            'my-geo-point-2': {
                              'type': 'geo_point'
                          },
                            'my-number-1': {
                              'type': 'long'
                          },
                            'my-number-2': {
                              'type': 'long'
                          },
                            'my-string-1': {
                              'type': 'string'
                          },
                            'my-string-2': {
                              'type': 'string'
                            }
                          }
                      },
                    'test-scroll': {
                      'properties': {
                        'fifth': {
                          'type': 'float'
                      },
                        'first': {
                          'type': 'float'
                      },
                        'fourth': {
                          'type': 'float'
                      },
                        'second': {
                          'type': 'float'
                      },
                        'third': {
                          'type': 'float'
                      }
                     }
                 }
                  }
                }
              }
            );
            done();
        }).catch(done);
    });

    it('query queries an elasticsearch index', function(done) {
        this.timeout(4 * 1000);
        query(JSON.stringify({
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    from: 0,
                    size: 1000
                },
                index: 'test-types',
                type: 'elastic-2.4-types'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(results, {
               'columnnames': [
                  'boolean',
                  'date',
                  'double',
                  'geo_point-1 (lat)',
                  'geo_point-1 (lon)',
                  'geo_point-2 (lat)',
                  'geo_point-2 (lon)',
                  'geo_point-3 (lat)',
                  'geo_point-3 (lon)',
                  'integer',
                  'ip',
                  'string-1',
                  'string-2',
                  'token'
               ],
               'rows': [
                  [
                     true,
                     '2016-12-04T16:05:13.816943-05:00',
                     0.6310475331632162,

                     // original form: {lat: -45.0..., lon: -11.9...}
                     -45.06490630412356,
                    -11.918386596878577,

                    // original form '-45.0..,-11.91...'
                     -45.0649063041,
                     -11.9183865969,

                     // original form: [-11.9..., -45.0...]
                     -45.06490630412356,
                     -11.918386596878577,

                     0,
                     '205.7.19.54',
                     'connection harmonies camp loss customs',
                     'Cyprus',
                     'Hector Jai Brenna Mary Gabrielle'
                  ],

                  [
                     true,
                     '2016-12-04T16:04:43.816943-05:00',
                     0.04016600628707845,

                     73.45986451687563,
                     94.96976806404194,

                     73.4598645169,
                     94.969768064,

                     73.45986451687563,
                     94.96976806404194,

                     1,
                     '208.49.20.91',
                     'meters recruiter chases villages platter',
                     'South Africa',
                     'Winston Aubrey Perla'
                  ],

                  [
                     true,
                     '2016-12-04T16:04:13.816943-05:00',
                     0.4387754352694577,

                     57.4913300090476,
                    -28.004109046235016,

                     57.491330009,
                     -28.0041090462,

                     57.4913300090476,
                     -28.004109046235016,

                     2,
                     '134.119.173.12',
                     'kites clump circles reduction parcel',
                     'Angola',
                     'Jorge Arthur Scott Kaleigh Chad Roanne'
                  ]

               ]
            });
            done();
        }).catch(done);
    });

    it('query queries an elasticsearch index and limits the size', function(done) {
        this.timeout(4 * 1000);
        query(JSON.stringify(
            {
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    size: '1'
                },
                // TODO - this should just be 'index' and 'type'
                index: 'sample-data',
                type: 'test-type'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(results, {
                columnnames: [
                    'my-boolean-1', 'my-boolean-2',
                    'my-date-1', 'my-date-2',
                    'my-geo-point-1 (lat)', 'my-geo-point-1 (lon)',
                    'my-geo-point-2 (lat)', 'my-geo-point-2 (lon)',
                    'my-number-1', 'my-number-2',
                    'my-string-1', 'my-string-2'
                ],
                rows: transpose([
                    [true],
                    [true],
                    [
                        '2015-01-01T12:30:40Z'
                    ],
                    [
                        '1915-01-01T12:30:40Z'
                    ],

                    [10],
                    [10],

                    [-10],
                    [-10],

                    [1],
                    [10],
                    [
                        'NYC'
                    ],
                    [
                        'USA'
                    ]
                ])
            });
            done();
        }).catch(done);
    });

    it('query returns more than 10K rows', function(done) {
        this.timeout(60 * 1000);
        query(JSON.stringify(
            {
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    size: '10001'
                },
                index: 'test-scroll',
                type: '200k'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(
                {
                    columnnames: results.columnnames,
                    rows: results.rows
                },
                {
                    columnnames:
                        [
                            'Column 1',
                            'Column 2',
                            'Column 3',
                            'Column 4'
                        ],
                    rows: transpose([
                        range(1, 10001 + 1).map(i => i + 0.1),
                        range(1, 10001 + 1).map(i => i + 0.2),
                        range(1, 10001 + 1).map(i => i + 0.3),
                        range(1, 10001 + 1).map(i => i + 0.4)
                    ])
                }
            );
            done();
        }).catch(done);
    });

    it('query returns all the data when size is larger than the dataset', function(done) {
        this.timeout(60 * 1000);
        query(JSON.stringify(
            {
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    size: '200001'
                },
                index: 'test-scroll',
                type: '200k'
            }),
            elasticsearchConnections
        ).then(results => {
            for (let j = 0; j < 200 * 1000; j++) {
                for (let i = 0; i < 4; i++) {
                    assert.equal(
                        (j + 1) + ((i + 1) * 0.1),
                        results.rows[j][i]
                    );
                }
            }
            assert.deepEqual(results.columnnames, [
                'Column 1',
                'Column 2',
                'Column 3',
                'Column 4'
            ]);
            assert.equal(results.rows.length, 200 * 1000);
            done();
        }).catch(done);
    });

    it('Returns valid aggregated data', function(done) {
        this.timeout(4 * 1000);
        query(JSON.stringify(
            {
                body: {
                    'query': {
                        'query_string': {
                            'query': '*'
                        }
                    },
                    'aggs': {
                        'agg1': {
                            'histogram': {
                                'interval': 10,
                                'field': 'my-number-1'
                            },
                            'aggs': {
                                'agg2': {
                                    'sum': {
                                        'field': 'my-number-2'
                                    }
                                }
                            }
                        }
                    },
                    'size': 2
                },
                // TODO - this should just be 'index' and 'type'
                index: 'sample-data',
                type: 'test-type'
            }),
            elasticsearchConnections
        ).then(results => {
            assert.deepEqual(results, {
                columnnames: [
                    'my-number-1',
                    'sum of my-number-2'
                ],
                rows: [
                    [0, 450],
                    [10, 210]
                ]
            });
            done();
        }).catch(done);

    });

});

describe('S3 - Connection', function () {
    it('connect succeeds with the right connection', function(done) {
        this.timeout(4 * 1000);
        connect(publicReadableS3Connections).then(done).catch(done);
    });

    it('connect fails with the wrong connection', function(done) {
        this.timeout(4 * 1000);
        connect({dialect: 's3', accessKeyId: 'asdf', secretAccessKey: 'fdas'})
        .then(() => done('Error - should not have succeeded'))
        .catch(() => done());
    });

    it('query parses S3 CSV files', function(done) {
        this.timeout(20 * 1000);
        query('5k-scatter.csv', publicReadableS3Connections)
        .then(grid => {
            assert.deepEqual(grid.rows[0], ['-0.790276857291', '-1.32900495883']);
            assert.deepEqual(grid.rows.length, 5 * 1000);
            assert.deepEqual(grid.columnnames, ['x', 'y']);
            done();
        }).catch(done);
    });

    it('files lists s3 files', function(done) {
        this.timeout(5 * 1000);
        files(publicReadableS3Connections)
        .then(connFiles => {
            assert.deepEqual(
                JSON.stringify(connFiles[0]),
                JSON.stringify({
                    'Key': '311.parquet/._SUCCESS.crc',
                    'LastModified': '2016-10-26T03:27:31.000Z',
                    'ETag': '"9dfecc15c928c9274ad273719aa7a3c0"',
                    'Size': 8,
                    'StorageClass': 'STANDARD',
                    'Owner': {
                        'DisplayName': 'chris',
                        'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                    }
                })
            );
            done();
        }).catch(done);
    });

});

describe('Apache Drill - Connection', function () {
    it('connects', function(done) {
        connect(apacheDrillConnections)
        .then(() => done())
        .catch(done);
    });

    it('storage returns valid apache drill storage items', function(done) {
        this.timeout(10 * 1000);
        storage(apacheDrillConnections)
        .then(config => {
            assert.deepEqual(
                config, apacheDrillStorage
            );
            done();
        }).catch(done);
    });

    it('s3-keys returns a list of files in the s3 bucket', function(done) {
        this.timeout(10 * 1000);
        listS3Files(apacheDrillConnections)
        .then(connFiles => {
            assert.deepEqual(
                JSON.stringify(connFiles[0]),
                JSON.stringify({
                    'Key': '311.parquet/._SUCCESS.crc',
                    'LastModified': '2016-10-26T03:27:31.000Z',
                    'ETag': '"9dfecc15c928c9274ad273719aa7a3c0"',
                    'Size': 8,
                    'StorageClass': 'STANDARD',
                    'Owner': {
                        'DisplayName': 'chris',
                        'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                    }
                })
            );
            done();
        }).catch(done);
    });

    it('query parses parquet files on S3', function(done) {
        this.timeout(20 * 1000);
        query('SELECT * FROM s3.root.`sample-data.parquet` LIMIT 10', apacheDrillConnections)
        .then(grid => {

            /*
             * TODO - For some reason, the date rows (columns 5-7)
             * come out looking like "[B@15477e8a".
             * Skip these rows for now.
             */

            assert.deepEqual(
                grid.rows[0].slice(0, 5),
                [
                     '0',

                     'NYC',
                     'USA',

                     '1',
                     '10'
                 ]
             );

             assert.deepEqual(
                 grid.rows[0].slice(7, 11),
                 [
                     'true',
                     'true',

                     '[10, 10]',
                     '[-10, -10]'
                 ]
            );

            assert.deepEqual(
                grid.columnnames,
                [
                    '_c0',

                    'my-string-1',
                    'my-string-2',

                    'my-number-1',
                    'my-number-2',

                    'my-date-1',
                    'my-date-2',

                    'my-boolean-1',
                    'my-boolean-2',

                    'my-geo-point-1',
                    'my-geo-point-2'
                ]
            );
            done();
        }).catch(done);
    });
});
/* eslint-enable no-invalid-this */
