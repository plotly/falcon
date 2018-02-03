'use strict';

const AWS = require('aws-sdk');
import Logger from '../../../logger';
const NUMBER_OF_RETRIES = 50;

/**
 * The following function will create an AWS Athena Client
 * @param {object} connection - AWS Athena Connection Parameters
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @returns {object} AWS Athena Client
 */
export function createAthenaClient(connection) {
    const connectionParams = {
        apiVersion: '2017-05-18',
        accessKeyId: connection.accessKey,
        secretAccessKey: connection.secretAccessKey,
        region: connection.region,
        maxRetries: NUMBER_OF_RETRIES
    };

    if (connection.sslEnabled) {
        connectionParams.sslEnabled = connection.sslEnabled;
    }
    const athenaClient = new AWS.Athena(connectionParams);

    return athenaClient;
}

/**
 * The following method will execute the sql statement to query the
 * athena database
 * @param {object} athenaClient  - Object created using create athena client
 * @param {object} params - Connection Parameters
 * @param {string} params.database - Database name to connect to
 * @param {string} params.sqlStatement - SQL statement to execute
 * @param {string} params.outputS3Bucket - Location will Athena will output resutls of query
 * @return {string} requestId
 */
export function startQuery(athenaClient, params) {
    const client = athenaClient;

    const queryParams = {
        QueryString: params.sqlStatement,
        ResultConfiguration: {
          OutputLocation: params.outputS3Bucket,
          EncryptionConfiguration: {
            EncryptionOption: 'SSE_S3'
          }
        },
        QueryExecutionContext: {
          Database: params.database
        }
    };
    return new Promise(function(resolve, reject) {
        return client.startQueryExecution(queryParams, (err, data) => {
            if (err) {
                Logger.log(`Unexpected Error starting Athena Query ${err}`);
                return reject(err);
            }
                const queryId = data.QueryExecutionId;
                return resolve(queryId);
          });
    });
}

/**
 * The following method will check to see if the query results
 * have completed.  It will return -1 if the query errored, 0
 * if it is still executing or 1 if it has completed
 * @param {object} athenaClient  - Object created using create athena client
 * @param {string} queryExecutionId - AWS Query Execution Id
 * @returns {int} -1 : Error, 0 : Still running, 1 : Completed
 */
export function queryResultsCompleted(athenaClient, queryExecutionId) {
    const client = athenaClient;

    const queryParams = {
        QueryExecutionId: queryExecutionId
    };

    return new Promise(function(resolve, reject) {
        return client.getQueryExecution(queryParams, (err, data) => {
            if (err) {
                Logger.log(`Unexpected Error getting Athena Query Execution Status ${err}`);
                return reject(-1);
            }
            const state = data.QueryExecution.Status.State;
            let queryState = 0, queryStatus = '';
            switch (state) {
                case 'QUEUED':
                    queryState = 0;
                    queryStatus = 'Query is queued';
                    break;
                case 'RUNNING':
                    queryState = 0;
                    queryStatus = 'Query still executing';
                    break;
                case 'SUCCEEDED':
                    queryState = 1;
                    queryStatus = 'Query completed successfully';
                    break;
                case 'FAILED':
                    queryState = -1;
                    queryStatus = data.QueryExecution.Status.StateChangeReason;
                    break;
                case 'CANCELLED':
                    queryState = -1;
                    queryStatus = 'Query was cancelled';
                    break;
                default:
                    queryState = -1;
                    queryStatus = 'Unknown error executing the query';
                    break;
            }

            const rst = {
                queryState,
                queryStatus
            };
            return resolve(rst);
        });
    });
}

/**
 * The following method will stop the query execution based on the query id
 * @param {object} athenaClient  - Object created using create athena client
 * @param {string} queryExecutionId - AWS Athena Query Id
 * @returns {Promise} That resolves to AWS Stop Request
 */
export function stopQuery(athenaClient, queryExecutionId) {
    const client = athenaClient;

    const queryParams = {
        QueryExecutionId: queryExecutionId
    };

    return new Promise(function(resolve, reject) {
        return client.stopQueryExecution(queryParams, (err, data) => {
            if (err) {
                Logger.log(`Unexpected Error stoping Athena Query Execution ${err}`);
                return reject(err);
            }
            return resolve(data);
        });
    });
}

/**
 * The following method will get the query results based on the query id
 * @param {object} athenaClient  - Object created using create athena client
 * @param {string} queryExecutionId - AWS Athena Query Id
 * @returns {Promise} Resolves to AWS Query Response
 */
export function getQueryResults(athenaClient, queryExecutionId) {
    const client = athenaClient;

    const queryParams = {
        QueryExecutionId: queryExecutionId
    };

    return new Promise(function(resolve, reject) {
        client.getQueryResults(queryParams, (err, data) => {
            if (err) {
                return reject(err);
            }
            return resolve(data);
        });
    });
}

/**
 * The following function will execute a query against athena.  It will first start
 * by starting the query request.  It will then start a timer to periodically
 * check to see if the query results have completed. If the Query Timeout has
 * Exceeded it will reject the query.  If the it receives data before the query
 * times out it will return the response.
 * @param {object} queryParams - Query Parameters
 * @param {string} queryParams.accessKey - AWS Access Key
 * @param {string} queryParams.secretAccessKey - AWS Secret Key
 * @param {string} queryParams.region - AWS Region
 * @param {string} queryParams.region - AWS Region
 * @param {string} queryParams.dbName - Database name to connect to
 * @param {string} queryParams.sqlStatement - SQL statement to execute
 * @param {string} queryParams.s3Outputlocation - Location will Athena will output resutls of query
 * @param {number} queryParams.queryInterval  - The timeout interval when the query should stop
 * @returns {Promise} resolve to AWS Query Response
 */
export function executeQuery(queryParams) {
    const client = createAthenaClient(queryParams);

    return new Promise(function(resolve, reject) {
        return startQuery(client, queryParams).then(queryExecutionId => {

            // Define the wait interval
            let retryInterval = queryParams.queryInterval;

            // If retry interval is not defined or less 0 set retry to 1000
            if ((!retryInterval) || (retryInterval < 1)) {
                retryInterval = 1000;
            }

            const checkQueryStatus = () => {
                queryResultsCompleted(client, queryExecutionId).then(queryResult => {
                    if (queryResult.queryState < 0) {
                        return reject(new Error(queryResult.queryStatus));
                    } else if (queryResult.queryState === 1) {
                        return getQueryResults(client, queryExecutionId).then(rst => {

                            if (rst && rst.ResultSet && rst.ResultSet.Rows) {
                                return resolve(rst.ResultSet.Rows);
                            }
                            return resolve([]);
                        });
                    }
                    // Loop again
                    return setTimeout(checkQueryStatus, retryInterval);
                }).catch(err => {
                    return reject(err);
                });
            };

            checkQueryStatus();

        }).catch(err => {
            return reject(err);
        });
    });
}