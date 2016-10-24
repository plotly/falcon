import {expect, assert} from 'chai';

import {
    query, connect
} from '../../../../backend/persistent/connections/Connections.js';

const sqlCredentials = {
    username: 'masteruser',
    password: 'connecttoplotly',
    database: 'plotly_datasets',
    port: 5432,
    host: 'readonly-test-postgres.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
    dialect: 'postgres'
};

const elasticsearchCredentials = {
    dialect: 'elasticsearch',
    host: 'https://67a7441549120daa2dbeef8ac4f5bb2e.us-east-1.aws.found.io',
    port: '9243'
};

const publicReadableS3Credentials = {
    dialect: 's3',
    bucket: 'plotly-s3-connector-test',
    accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
    secretAccessKey: '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'
    // TODO - region here too?
};

const apacheDrillCredentials = {
    dialect: 'apache drill',
    host: 'http://ec2-35-160-151-112.us-west-2.compute.amazonaws.com',
    port: 8047
};

const transpose = m => m[0].map((x, i) => m.map(x => x[i]));


describe('SQL - Connections', function () {
    it('Connections.connect connects to a database', function(done) {
        this.timeout(4 * 1000);
        connect(sqlCredentials).then(done).catch(done);
    });

    it('Connections.query queries a database', function(done) {
        this.timeout(4 * 1000);
        query(
            'SELECT * from ebola_2014 LIMIT 2',
            sqlCredentials
        ).then(results => {
            assert.deepEqual(results.rows, [
                ['Guinea', 3, 14, '9.95', '-9.7', '122'],
                ['Guinea', 4, 14, '9.95', '-9.7', '224']
            ]);
            assert.deepEqual(results.columnnames, [
                'country', 'month', 'year', 'lat', 'lon', 'value'
            ]);
            assert.deepEqual(results.ncols, 6);
            assert.deepEqual(results.nrows, 2);
            done();
        }).catch(done);
    });
});



describe('Elasticsearch - Connections', function () {
    it ('Connections.connect connects to a database', function(done) {
        this.timeout(4 * 1000);
        connect(elasticsearchCredentials).then(done).catch(done);
    });

    it('Connections.query queries a database', function(done) {
        this.timeout(4 * 1000);
        query(
            {
                query: {
                    query_string: {query: '*'}
                },
                from: 0,
                size: 1000
            },
            elasticsearchCredentials
        ).then(results => {
            assert.deepEqual(results, {
                nrows: 11,
                ncols: 10,
                columnnames: [
                    'my-date-1',
                    'my-string-1', 'my-string-2',
                    'my-date-2',
                    'my-number-1', 'my-number-2',
                    'my-geo-point-2', 'my-geo-point-1',
                    'my-boolean-2', 'my-boolean-1'
                ],
                rows: transpose([
                    [
                        '2015-01-01T12:30:40Z',
                        '2015-10-04T12:35:10Z',
                        '2015-02-02T12:45:02Z',

                        '2015-04-12T12:55:05Z',
                        '2016-02-15T08:10:10Z',

                        '2016-01-10T06:05:02Z',
                        '2016-02-11T07:02:01Z',
                        '2012-03-13T05:01:05Z',

                        '2010-01-16T01:10:50Z',
                        '2011-04-19T02:15:38Z',

                        '2012-02-20T03:01:28Z'
                    ],

                    [
                        'NYC', 'NYC', 'NYC', 'Paris', 'Paris',
                        'Tokyo', 'Tokyo', 'Tokyo', 'SF', 'Sf', 'Montreal'
                    ],
                    [
                        'USA', 'USA', 'USA', 'France', 'France',
                        'Japan', 'Japan', 'Japan', 'USA', 'USA', 'Canada'
                    ],

                    [
                        '1915-01-01T12:30:40Z',
                        '1915-10-04T12:35:10Z',
                        '1915-02-02T12:45:02Z',

                        '1915-04-12T12:55:05Z',
                        '1916-02-15T08:10:10Z',

                        '1916-01-10T06:05:02Z',
                        '1916-02-11T07:02:01Z',
                        '1912-03-13T05:01:05Z',

                        '1910-01-16T01:10:50Z',
                        '1911-04-19T02:15:38Z',

                        '1912-02-20T03:01:28'
                    ],

                    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110],

                    [
                        [-10, -10],
                        [-11, -11],
                        [-12, -12],

                        [-20, -20],
                        [-21, -21],

                        [-30, -30],
                        [-31, -31],
                        [-32, -32],

                        [-40, -40],
                        [-41, -41],

                        [-50, -50]
                    ],

                    [
                        [10, 10],
                        [11, 11],
                        [12, 12],

                        [20, 20],
                        [21, 21],

                        [30, 30],
                        [31, 31],
                        [32, 32],

                        [40, 40],
                        [41, 41],

                        [50, 50]
                    ],

                    [true, false, true, false, true, false, true, false, true, false, true],
                    [true, true, true, false, false, true, true, true, false, false, true]

                ])
            });
            done();
        }).catch(done);
    });

});

describe('S3 - Connection', function () {
    it('connect succeeds with the right credentials', function(done) {
        this.timeout(4 * 1000);
        connect(publicReadableS3Credentials).then(done).catch(done);
    });

    it('connect fails with the wrong credentials', function(done) {
        this.timeout(4 * 1000);
        connect({dialect: 's3', accessKeyId: 'asdf', secretAccessKey: 'fdas'})
        .then(() => done('Error - should not have succeeded'))
        .catch(err => done());
    });

    it('query parses S3 CSV files', function(done) {
        this.timeout(20 * 1000);
        query('5k-scatter.csv', publicReadableS3Credentials)
        .then(grid => {
            assert.deepEqual(grid.rows[0], ['-0.790276857291', '-1.32900495883']);
            assert.deepEqual(grid.rows.length, 5 * 1000 + 1);
            assert.deepEqual(grid.columnnames, ['x', 'y']);
            done();
        }).catch(done);
    });

});

describe.only('Apache Drill - Connection', function () {
    it('connects', function(done) {
        connect(apacheDrillCredentials)
        .then(res => done())
        .catch(done);
    });

    it('query parses parquet files on S3', function(done) {
        this.timeout(20 * 1000);
        query('SELECT * FROM s3.root.`sample-data.parquet` LIMIT 10', apacheDrillCredentials)
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
