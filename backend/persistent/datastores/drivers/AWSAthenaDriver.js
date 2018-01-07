'use strict';

const AWS = require( 'aws-sdk' );
const credentials = require('../../../../aws.json');
const NUMBER_OF_RETRIES = 5;

/**
 * The following function will create an AWS Athena Client
 * @param {object} connection 
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 */
export function createAthenaClient( connection ){
    /*let connectionParams = {
        accessKeyId: connection.accessKey,
        secretAccessKey: connection.secretAccessKey,
        region: connection.region,
        maxRetries: 5
    }*/

    let connectionParams = {
        apiVersion: '2017-05-18',
        accessKeyId: credentials.accessKey,
        secretAccessKey: credentials.secretAccessKey,
        region: credentials.region,
        maxRetries: 5
    }
    let athenaClient = new AWS.Athena( connectionParams );

    return athenaClient;
}

/**
 * The following method will execute the sql statement to query the 
 * athena database
 * @param {object} athenaClient  - Object created using create athena client
 * @param {object} params
 * @param {string} params.dbName - Database name to connect to 
 * @param {string} params.sqlStatement - SQL statement to execute
 * @param {string} params.s3Outputlocation - Location will Athena will output resutls of query
 * @return {string} requestId 
 */
export function startQuery( athenaClient, params ){
    let client = athenaClient;

    let queryParams = {
        QueryString: params.sqlStatement,
        ResultConfiguration: { 
          OutputLocation: params.s3Outputlocation, 
          EncryptionConfiguration: {
            EncryptionOption: 'SSE_S3'
          }
        },
        QueryExecutionContext: {
          Database: params.dbName
        }
    };
    return new Promise(function(resolve, reject) {
        return client.startQueryExecution( queryParams, (err, data) =>{
            if (err) {
                return reject( err );
            }else{
                let queryId = data.QueryExecutionId;
                return resolve( queryId );
            }
          });
    });
}

/**
 * The following method will check to see if the query results 
 * have completed.  It will return -1 if the query errored, 0 
 * if it is still executing or 1 if it has completed
 * @param {object} athenaClient  - Object created using create athena client
 * @param {string} queryExecutionId 
 * @param {int} -1 : Error, 0 : Still running, 1 : Completed
 */
export function queryResultsCompleted( athenaClient, queryExecutionId  ){
    let client = athenaClient;

    let queryParams = {
        QueryExecutionId: queryExecutionId
    };

    return new Promise(function(resolve, reject) {
        console.log( 'Start checking query execution');
        return client.getQueryExecution( queryParams, (err, data) =>{
            console.log( 'Start returning checking query execution');
            if (err) {
                console.log( `Error getting query execution ${err}`);
                return reject( -1 );
            }else{
                console.log( `Got Response ${data}`);
                let state = data.QueryExecution.Status.State;
                console.log( `The query Result state ${state}`);
                let queryState = 0;
                switch (state) {
                    case 'QUEUED':
                        queryState = 0;
                        break;
                    case 'RUNNING':
                        queryState = 0;
                        break;
                    case 'SUCCEEDED':
                        queryState = 1;
                        break;
                    case 'FAILED':
                        queryState = -1;
                        break;
                    case 'CANCELLED':
                        queryState = -1;
                        break;
                    default:
                        queryState = -1;
                        break;
                }
                return resolve( queryState );
            }
        });
    });
}

/**
 * The following method will stop the query execution based on the query id
 * @param {object} athenaClient  - Object created using create athena client
 * @param {string} queryExecutionId 
 */
export function stopQuery( athenaClient, queryExecutionId ){
    let client = athenaClient;

    let queryParams = {
        QueryExecutionId: queryExecutionId
    };

    return new Promise(function(resolve, reject) {

        return client.stopQueryExecution( queryParams, (err, data) =>{
            if (err) {
                return reject( err );
            }else{
                return resolve( data);
            }
        });
    });
}

/**
 * The following method will get the query results based on the query id
 * @param {object} athenaClient  - Object created using create athena client
 * @param {string} queryExecutionId 
 */
export function getQueryResults( athenaClient, queryExecutionId ){
    let client = athenaClient;

    let queryParams = {
        QueryExecutionId: queryExecutionId
    };

    return new Promise(function(resolve, reject) {
        client.getQueryResults(queryParams, (err, data) => {
            if ( err ) {
                return reject(err);
            } else {
                console.log( `Got response for query results`);
                return resolve(data);
            }
        });
    });
}

/**
 * The following function will create an AWS Athena Client
 * @param {object} queryParams 
 * @param {string} queryParams.accessKey - AWS Access Key
 * @param {string} queryParams.secretAccessKey - AWS Secret Key
 * @param {string} queryParams.region - AWS Region
 * @param {string} queryParams.region - AWS Region
 * @param {string} queryParams.dbName - Database name to connect to 
 * @param {string} queryParams.sqlStatement - SQL statement to execute
 * @param {string} queryParams.s3Outputlocation - Location will Athena will output resutls of query
 * @param {number} queryParams.queryTimeout  - The timeout interval when the query should stop
 */
export function executeQuery( queryParams ){
    let client = createAthenaClient( queryParams );

    return new Promise(function(resolve, reject) {
        return startQuery(client, queryParams).then( queryExecutionId => {

            //Define the wait interval 
            let retryInterval = queryParams.queryTimeout/ NUMBER_OF_RETRIES;

            let retryCount = 0;
            //If retry interval is not defined or less 0 set retry to 1000
            if( ( !retryInterval )  || (retryInterval < 1 ) ){
                retryInterval = 1000;
            }

            let checkQueryStatus = ()=>{
                retryCount++;
                queryResultsCompleted( client, queryExecutionId).then( queryStatus =>{
                    if( queryStatus < 0 ){
                        return reject( `There was an error completing the query`);
                    }else if( queryStatus === 1){
                        return getQueryResults( client, queryExecutionId ).then( rst =>{

                            if( rst && rst.ResultSet && rst.ResultSet.Rows ){
                                return resolve( rst.ResultSet.Rows );
                            }else{
                                return resolve( [] );
                            }
                        });
                    }else{
                        //Loop again
                        return setTimeout( checkQueryStatus, retryInterval );
                    }
                }).catch( err =>{
                    console.log( `Unexpected error checking query results ${err}`);
                    return reject( err );
                });
            };

            checkQueryStatus();
               
        }).catch( err =>{
            return reject( err );
        });
    });
}