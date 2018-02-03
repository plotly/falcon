import {assert} from 'chai';

import {connect} from '../../backend/persistent/datastores/athena';

/* eslint-disable no-invalid-this */
describe('Athena Unit Tests:', function () {
    it('Invalid connection strings because incorrect credentials', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };
        connect(conn).then(() => {
           throw new Error('Should NOT have obtained a valid connection');
        }).catch(err => {
            assert.isDefined(err, 'Connection failed due to incorrect connection string');

        });
    });

    it('connect fails missing region', function() {
        const conn = {
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when missing region');
        }).catch(err => {
            assert.isDefined(err, 'err is defined as expected');
            assert.equal(err.message, 'The AWS Region was not defined');
        });
    });

    it('connect fails AWS Region is empty', function() {
        const conn = {
            region: '',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when region not defined?');
        }).catch((err) => {
            assert.isDefined(err, 'Error is defined as expected due to missing aws region');
            assert.equal(err.message, 'The AWS Region was not defined');
        });
    });

    it('connect fails missing AWS access key', function() {
        const conn = {
            region: 'us-east-1',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };
        return connect(conn).then(() => {
            throw new Error('Connection did not fail when AWS Access key not defined?');
        }).catch((err) => {
            assert.isDefined(err, 'Error defined as expected due to missing aws access key');
            assert.equal(err.message, 'The AWS access key was not defined');
        });
    });

    it('connect fails AWS Access key is empty', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: '',
            secretKey: 'XXXXXAAAA',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when AWS Access key not defined?');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing aws access key');
            assert.equal(err.message, 'The AWS access key was not defined');
        });
    });

    it('connect fails missing secret key', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when AWS Secret key not defined?');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing secret key');
            assert.equal(err.message, 'The AWS secret key was not defined');
        });
    });

    it('connect fails secret key is empty', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'AAAAAAA',
            secretKey: '',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when AWS Secret key is empty?');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing secret key');
            assert.equal(err.message, 'The AWS secret key was not defined');
        });
    });

    it('connect fails missing db name', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXX',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when DB Name not defind?');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing db namey');
            assert.equal(err.message, 'The Database Name was not defined');
        });
    });

    it('connect fails db name is empty', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'AAAAAAA',
            secretKey: 'XXXXXX',
            database: '',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
            queryInterval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when DB Name is empty?');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing db namey');
            assert.equal(err.message, 'The Database Name was not defined');
        });
    });

    it('connect fails missing S3 Output location', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'XXXXXXXX',
            secretKey: 'XXXXXX',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            queryInteval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when S3 Output Location is empty?');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing S3 Location');
            assert.equal(err.message, 'The Athena S3 Results Output Bucket was not defined');
        });
    });

    it('connect fails S3 Output Bucket is empty', function() {
        const conn = {
            region: 'us-east-1',
            accessKey: 'AAAAAAA',
            secretKey: 'XXXXXX',
            database: 'PLOT.LY-TEST',
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100',
            outputS3Bucket: '',
            queryInterval: 1000
        };

        return connect(conn).then(() => {
            throw new Error('Connection did not fail when DB Name is empty?');
        }).catch((err) => {
            assert.isDefined(err, 'Should have not have occured do to missing S3 Location');
            assert.equal(err.message, 'The Athena S3 Results Output Bucket was not defined');
        });
    });
});
/* eslint-enable no-invalid-this */
