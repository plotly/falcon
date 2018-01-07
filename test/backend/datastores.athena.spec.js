import {assert} from 'chai';

import {connect} from '../../backend/persistent/datastores/Athena';

//TODO
//Query tests case.  
//1. Validate connection and query object
//2. Validate empty results with column names and rows empty
//3. Validate one row and column
//4. Validate multiple rows and columns

//Schema
//1. Validate connection object

//Tables
//1. Validate connection object

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('Athena Unit Tests:', function () {
    
    it('connect succeeds', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'XXXXXXXX', 
            secretKey: 'XXXXXAAAA', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        connect( conn ).then( connection =>{
            assert.isDefined( connection, 'Connection is defined');
            done();
        }).catch( err =>{
            console.log( 'Error', err);
            done('Should have obtained a valid connection');
        })
    });

    it('connect fails missing region', function( done ) {
        const conn = {
            accessKey: 'XXXXXXXX', 
            secretKey: 'XXXXXAAAA', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing region');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails username is empty', function( done ) {
        const conn = {
            region: '', 
            accessKey: 'XXXXXXXX', 
            secretKey: 'XXXXXAAAA', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing region');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails missing AWS access key', function( done ) {
        const conn = {
            region: 'us-east-1', 
            secretKey: 'XXXXXAAAA', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing AWS access key');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails AWS Access key is empty', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: '', 
            secretKey: 'XXXXXAAAA', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing aws access key');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails missing secret key', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'XXXXXXXX',  
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing secret key');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails secret key is empty', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'AAAAAAA', 
            secretKey: '', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing secret key');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails missing db name', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'XXXXXXXX', 
            secretKey: 'XXXXXX',  
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing db name');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails db name is empty', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'AAAAAAA', 
            secretKey: 'XXXXXX', 
            dbName: '', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing db name');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    }); 

    it('connect fails missing sql statement', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'XXXXXXXX', 
            secretKey: 'XXXXXX',  
            dbName: 'PLOT.LY-TEST', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing sql statement');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails db name is empty', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'AAAAAAA', 
            secretKey: 'XXXXXX', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: '', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing sql statement');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    }); 
    

    it('connect fails missing S3 Output locaiont', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'XXXXXXXX', 
            secretKey: 'XXXXXX',  
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing S3 Location');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails db name is empty', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'AAAAAAA', 
            secretKey: 'XXXXXX', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: '', 
            queryTimeout: 10000
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing S3 Location');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails missing S3 Output locaiont', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'XXXXXXXX', 
            secretKey: 'XXXXXX',  
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing S3 Location');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

    it('connect fails db name is empty', function( done ) {
        const conn = {
            region: 'us-east-1', 
            accessKey: 'AAAAAAA', 
            secretKey: 'XXXXXX', 
            dbName: 'PLOT.LY-TEST', 
            sqlStatement: 'SELECT * FROM TEST_TABLE LIMIT 100', 
            s3Outputlocation: 's3://aws-athena-query-results-11111111-us-east-1/', 
            queryTimeout: -1
        };
        try{
            connect( conn ).then( connection =>{
                assert.isUnDefined( connection, 'Connection should not have been defined');
                done('Should have not have occured do to missing S3 Location');
            }).catch( err =>{
                done();
            })
        }catch( error ){
            done();
        }
    });

});
/* eslint-enable no-invalid-this */
