import {assert} from 'chai';

import {connect} from '../../backend/persistent/datastores/athena';

/* eslint-disable no-invalid-this */
describe('Athena Unit Tests:', function () {
    it('Invalid connection strings because incorrect credentials', function(done) {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };
        connect(conn).then(connection => {
           done(`Should NOT have obtained a valid connection ${connection}`);
        }).catch(err => {
            assert.isDefined(err, 'Connection failed due to incorrect connection string');
            done();
        });
    });

    it('connect fails missing region', function() {
        const conn = {
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch(err => {
            assert.isDefined(err, 'Err is defined as expected');
        });
    });

    it('connect fails AWS Region is empty', function() {
        const conn = {
            region: '',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Error is defined as expected due to missing aws region');
        });
    });

    it('connect fails missing AWS access key', function() {
        const conn = {
            region: 'us-east-1',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };
        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Error defined as expected due to missing aws access key');
        });
    });

    it('connect fails AWS Access key is empty', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: '',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing aws access key');
        });
    });

    it('connect fails missing secret key', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing secret key');
        });
    });

    it('connect fails secret key is empty', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'AAAAAAA',
            secretKey: '',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing secret key');
        });
    });

    it('connect fails missing db name', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXX',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing db namey');
        });
    });

    it('connect fails db name is empty', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'AAAAAAA',
            secretKey: 'XXXXXX',
            database: '',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing db namey');
        });
    });

    it('connect fails missing S3 Output locaiont', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXX',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing S3 Location');
        });
    });

    it('connect fails db name is empty', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'AAAAAAA',
            secretKey: 'XXXXXX',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: '',
            queryTimeout: 10000
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing S3 Location');
        });
    });

    it('connect fails missing S3 Output locaiont', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXX',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/'
        };

        return connect(conn).then(connection => {
            assert.isUnDefined(connection, 'Connection should not have been defined');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing S3 Location');
        });
    });

});
/* eslint-enable no-invalid-this */
