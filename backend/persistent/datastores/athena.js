import {executeQuery} from './drivers/athena';

import Logger from '../../logger';
const SHOW_TABLES_QUERY = 'SHOW TABLES';
const SHOW_SCHEMA_QUERY = 'SELECT table_name, column_name, data_type FROM '
    + 'information_schema.columns WHERE table_schema ';
const DEFAULT_QUERY_INTERVAL = 2000;
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
    const {
        region, accessKey, secretKey, database, sqlStatement, outputS3Bucket, sslEnabled
    } = connection;
    let queryInterval = connection.timeout;

    return new Promise(function(resolve, reject) {

        if (!region) {
            return reject(new Error('The AWS Region was not defined'));
        }

        if (!accessKey) {
            return reject(new Error('The AWS access key was not defined'));
        }

        if (!secretKey) {
            return reject(new Error('The AWS secret key was not defined'));
        }

        if (!database) {
            return reject(new Error('The Database Name was not defined'));
        }

        if (!outputS3Bucket) {
            return reject(new Error('The Athena S3 Results Output Bucket was not defined'));
        }

        if (!queryInterval && queryInterval < 0) {
            queryInterval = DEFAULT_QUERY_INTERVAL;
        }

        const con = {
            region, accessKey, secretKey, database, sqlStatement, outputS3Bucket, queryInterval, sslEnabled
        };

        // Test the connection to get a list of schemas
        // This will validate that the connection properties work
        schemas(con).then(() => {
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