import {assert} from 'chai';
import {merge} from 'ramda';

import {
    sqlConnections,
    mssqlConnection,
    publicReadableS3Connections,
    apacheDrillConnections,
    apacheDrillStorage,
    postgisConnection
} from './utils.js';

import {
    query, connect, files, storage, listS3Files
} from '../../backend/persistent/datastores/Datastores.js';

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('SQL - ', function () {
    it('connect connects to a database', function(done) {
        connect(sqlConnections).then(done).catch(done);
    });

    it('query queries a database', function(done) {
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
        query(
            'WAITFOR DELAY \'00:00:16\'',
            merge(mssqlConnection, {requestTimeout: 18 * 1000})
        ).then(() => {
            done();
        }).catch(done);
    });
});

xdescribe('S3 - Connection', function () {
    it('connect succeeds with the right connection', function(done) {
        connect(publicReadableS3Connections).then(done).catch(done);
    });

    it('connect fails with the wrong connection', function(done) {
        connect({dialect: 's3', accessKeyId: 'asdf', secretAccessKey: 'fdas'})
        .then(() => done('Error - should not have succeeded'))
        .catch(() => done());
    });

    it('query parses S3 CSV files', function(done) {
        query('5k-scatter.csv', publicReadableS3Connections)
        .then(grid => {
            assert.deepEqual(grid.rows[0], ['-0.790276857291', '-1.32900495883']);
            assert.deepEqual(grid.rows.length, 5 * 1000);
            assert.deepEqual(grid.columnnames, ['x', 'y']);
            done();
        }).catch(done);
    });

    it('files lists s3 files', function(done) {
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

xdescribe('Apache Drill - Connection', function () {
    it('connects', function(done) {
        connect(apacheDrillConnections)
        .then(() => done())
        .catch(done);
    });

    it('storage returns valid apache drill storage items', function(done) {
        storage(apacheDrillConnections)
        .then(config => {
            assert.deepEqual(
                config, apacheDrillStorage
            );
            done();
        }).catch(done);
    });

    it('s3-keys returns a list of files in the s3 bucket', function(done) {
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
