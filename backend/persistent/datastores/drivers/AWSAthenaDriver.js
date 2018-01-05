'use strict';

const AWS = require( 'aws-sdk' );
const credentials = require('../../../../aws.json');

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
    let dbName = params.dbName;
    let sqlStatement = params.sqlStatement;

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

        client.startQueryExecution( queryParams, (err, data) =>{
            if (err) {
                reject( err );
            }else{
                let queryId = data;
                resolve( queryId );
            }
          });
    });
}

export function queryResultsCompleted(){

}

export function cancelQuery(){

}

export function getQueryResults(){

}