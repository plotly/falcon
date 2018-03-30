import {executeQuery} from './drivers/athena';

import Logger from '../../logger';
const SHOW_TABLES_QUERY = 'SHOW TABLES';
const SHOW_SCHEMA_QUERY = 'SELECT table_name, column_name, data_type FROM '
    + 'information_schema.columns WHERE table_schema ';
const DEFAULT_QUERY_INTERVAL = 2000;

/**
 * The following function will create an AWS Athena Client
 * @param {object} connection - AWS Athena Connection Parameters
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @returns {object} AWS Athena Client
 */
function createAthenaClient(connection) {
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
/*
 * The connection function will validate the parameters and return the connection
 * parameters
 * @param {object} connection
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.database - Database name to connect to
 * @param {string} connection.outputS3Bucket - Location where Athena will output resutls of query
 * @param {number} connection.timeout  - The timeout interval when the query should stop
 * @param {boolean}
 * @returns {Promise} that resolves connection
 */
export function connect(connection) {


    return new Promise(function(resolve, reject) {

        if (!connection.timeout && connection.timeout < 0) {
            connection.timeout = DEFAULT_QUERY_INTERVAL;
        }

        connection.athenaClient = createAthenaClient( connection );
        // Test the connection to get a list of schemas
        // This will validate that the connection properties work
        schemas(connection).then(() => {
            resolve(con);
        }).catch(err => {
            Logger.log(err);
            reject(err);
        });
    });
}

/**
 * The following method will execute a query against the specified connection
 * @param {object} queryObject - The SQL to query against the connection
 * @param {object} connection - Connection parameters
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function query(queryObject, connection) {
    let columnnames = [];
    const rows = [];

    return new Promise(function(resolve, reject) {

        if (!queryObject) {
            return reject(new Error('The SQL Statement was not defined'));
        }
        connection.sqlStatement = queryObject;
        executeQuery(connection).then(dataSet => {
            if (dataSet && dataSet.length > 0) {
                // First column contains the column names
                const cols = dataSet[0].Data;
                columnnames = cols.map(col => col.VarCharValue);

                // Loop through the remaining rows to extract data
                for (let i = 1; i < dataSet.length; i++) {
                    const row = dataSet[i];
                    // Ensure Row is defined and has expected number of columns
                    if (row && row.Data && row.Data.length === columnnames.length) {
                        const r = row.Data.map(element => {
                            if (element && element.VarCharValue) {
                                return element.VarCharValue;
                            }
                            return '';
                        });
                        rows.push(r);
                    }
                }
            }
            resolve({columnnames, rows});
        }).catch(err => {
            Logger.log(err);
            throw err;
        });
    });
}

/**
 * Should return a list of tables and their columns that are defined within the database.
 * @param {object} connection - Connection parameters
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.database - Database name to connect to
 * @param {string} connection.outputS3Bucket - Location will Athena will output resutls of query
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function schemas(connection) {
    const columnnames = ['Table', 'column_name', 'data_type'];
    const rows = [];

    connection.sqlStatement = `${SHOW_SCHEMA_QUERY} = '${connection.database}'` ;
    connection.queryInterval = DEFAULT_QUERY_INTERVAL;
    return new Promise(function(resolve) {
        executeQuery(connection).then(dataSet => {
            if (dataSet && dataSet.length > 0) {
                for (let i = 0; i < dataSet.length; i++) {
                    const data = dataSet[i];

                    if (data && data.Data && data.Data.length > 0) {
                        if (i !== 0) {
                            const row = [];
                            row.push(data.Data[0].VarCharValue); // Table Name
                            row.push(data.Data[1].VarCharValue); // Column Name
                            row.push(data.Data[2].VarCharValue); // DataType
                            rows.push(row);
                        }
                    }
                }
            }
            return resolve({columnnames, rows});
        }).catch(err => {
            Logger.log(err);
            throw err;
        });
    });
}


/**
 * Should return a list of tables that are in the database
 * @param {object} connection - Connection Parameters
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.database - Database name to connect to
 * @param {string} connection.outputS3Bucket - Location will Athena will output resutls of query
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function tables(connection) {

    connection.sqlStatement = SHOW_TABLES_QUERY;
    connection.queryInterval = DEFAULT_QUERY_INTERVAL;
    return new Promise(function(resolve, reject) {
        executeQuery(connection).then(dataSet => {

            let rst = [];
            if (dataSet && dataSet.length > 0) {
                rst = dataSet.map(data => {
                    if (data && data.Data && data.Data.length > 0) {
                        return data.Data[0].VarCharValue;
                    }
                    return '';

                });
            }
            return resolve(rst);
        }).catch(err => {
            Logger.log(err);
            return reject(err);
        });
    });
}