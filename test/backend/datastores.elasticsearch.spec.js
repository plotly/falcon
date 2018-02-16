import {assert} from 'chai';
import {range} from 'ramda';

import {
    assertResponseStatus,
    elasticsearchConnections,
    getResponseJson
} from './utils.js';

import {
    query, connect, elasticsearchMappings
} from '../../backend/persistent/datastores/Datastores.js';

const transpose = m => m[0].map((_, i) => m.map(x => x[i]));

describe('Elasticsearch:', function () {
    it('connect returns a list of indices', function() {
        return connect(elasticsearchConnections)
        .then(assertResponseStatus(200))
        .then(getResponseJson)
        .then(json => {
            const expected = [
                {
                    health: 'yellow',
                    status: 'open',
                    index: 'test-types',
                    pri: '1',
                    rep: '1',
                    'docs.count': '3',
                    'docs.deleted': '0',
                    'store.size': '8kb',
                    'pri.store.size': '8kb'
                }, {
                    health: 'yellow',
                    status: 'open',
                    index: 'plotly_datasets',
                    pri: '1',
                    rep: '1',
                    'docs.count': '28187',
                    'docs.deleted': '0',
                    'store.size': '5.8mb',
                    'pri.store.size': '5.8mb'
                }, {
                    health: 'yellow',
                    status: 'open',
                    index: 'test-scroll',
                    pri: '1',
                    rep: '1',
                    'docs.count': '200000',
                    'docs.deleted': '0',
                    'store.size': '42.5mb',
                    'pri.store.size': '42.5mb'
                }, {
                    health: 'yellow',
                    status: 'open',
                    index: 'live-data',
                    pri: '1',
                    rep: '1',
                    'docs.count': '1000',
                    'docs.deleted': '0',
                    'store.size': '576.9kb',
                    'pri.store.size': '576.9kb'
                }, {
                    health: 'yellow',
                    status: 'open',
                    index: 'sample-data',
                    pri: '1',
                    rep: '1',
                    'docs.count': '200111',
                    'docs.deleted': '0',
                    'store.size': '42.8mb',
                    'pri.store.size': '42.8mb'
                }
            ];

            const obtained = {};
            json.forEach(index => {
                obtained[index.index] = index;
            });

            expected.forEach(expectedIndex => {
                assert.deepEqual(
                    obtained[expectedIndex.index],
                    expectedIndex,
                    `Unexpected result for ${expectedIndex.index}`
                );
            });
        });
    });

    it('elasticsearchMappings returns mappings', function() {
        return elasticsearchMappings(elasticsearchConnections)
        .then(json => {
            const expected = {
                'test-types': {
                    'mappings': {
                        'elastic-2.4-types': {
                            'properties': {
                                'date': {'type': 'date', 'format': 'strict_date_optional_time||epoch_millis'},
                                'string-1': {'type': 'string'},
                                'string-2': {'type': 'string'},
                                'token': {'analyzer': 'standard', 'type': 'token_count'},
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
                                'date': {'type': 'date', 'format': 'strict_date_optional_time||epoch_millis'},
                                'string-1': {'type': 'string'},
                                'string-2': {'type': 'string'},
                                'token': {'analyzer': 'standard', 'type': 'token_count'},
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
                                'Country': {'type': 'string'},
                                'Lat': {'type': 'float'},
                                'Lon': {'type': 'float'},
                                'Month': {'type': 'integer'},
                                'Value': {'type': 'float'},
                                'Year': {'type': 'integer'},
                                'index': {'type': 'integer'}
                            }
                        }
                    }
                },
                'sample-data': {
                    'mappings': {
                        'test-ranges': {
                             'properties': {
                                 'Date': {'format': 'strict_date_optional_time||epoch_millis', 'type': 'date'},
                                 'Float': {'type': 'float'},
                                 'Integer': {'type': 'integer'},
                                 'Ipv4': {'type': 'ip'},
                                 'String': {'type': 'string'}
                             }
                        },
                        'test-type': {
                            'properties': {
                                'my-boolean-1': {'type': 'boolean'},
                                'my-boolean-2': {'type': 'boolean'},
                                'my-date-1': {'format': 'strict_date_optional_time||epoch_millis', 'type': 'date'},
                                'my-date-2': {'format': 'strict_date_optional_time||epoch_millis', 'type': 'date'},
                                'my-geo-point-1': {'type': 'geo_point'},
                                'my-geo-point-2': {'type': 'geo_point'},
                                'my-number-1': {'type': 'long'},
                                'my-number-2': {'type': 'long'},
                                'my-string-1': {'type': 'string'},
                                'my-string-2': {'type': 'string'}
                            }
                        },
                        'test-scroll': {
                            'properties': {
                                'fifth': {'type': 'float'},
                                'first': {'type': 'float'},
                                'fourth': {'type': 'float'},
                                'second': {'type': 'float'},
                                'third': {'type': 'float'}
                            }
                        }
                    }
                }
            };

            Object.keys(expected).forEach(index => {
                assert.deepEqual(json[index], expected[index]);
            });
        });
    });

    it('query queries an elasticsearch index', function() {
        return query(JSON.stringify({
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
        });
    });

    it('query queries an elasticsearch index and limits the size', function() {
        return query(JSON.stringify(
            {
                body: {
                    query: {
                        query_string: {
                            query: '*'
                        }
                    },
                    size: '1'
                },
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
        });
    });

    it('query can return more than 10K rows', function() {
        return query(JSON.stringify(
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
        });
    });

    it('query returns all the data when requested size is larger than the dataset', function() {
        return query(JSON.stringify(
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
        });
    });

    it('query returns valid aggregated data', function() {
        return query(JSON.stringify(
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
        });
    });
});
