
import {executeQuery} from './drivers/AWSAthenaDriver';

const SHOW_TABLES_QUERY = 'SHOW TABLES';
const SHOW_SCHEMA_QUERY = 'SELECT table_name, column_name, data_type FROM '
    + 'information_schema.columns WHERE table_schema ';
const DEFAULT_QUERY_TIMEOUT = 2000;

/*
 * The connection function will validate the parameters and return the connection
 * parameters
 * @param {object} connection
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.database - Database name to connect to
 * @param {string} connection.sqlStatement - SQL statement to execute
 * @param {string} connection.s3Outputlocation - Location will Athena will output resutls of query
 * @param {number} params.queryTimeout  - The timeout interval when the query should stop
 * @returns {Promise} that resolves connection
 */
export function connect(connection) {
    const {
        region, accessKey, secretKey, database, sqlStatement, s3Outputlocation, queryTimeout
    } = connection;

    if (!region) {
        throw new Error('The AWS Region was not defined');
    }

    if (!accessKey) {
        throw new Error('The AWS access key was not defined');
    }

    if (!secretKey) {
        throw new Error('The AWS secret key was not defined');
    }

    if (!database) {
        throw new Error('The Database Name was not defined');
    }

    if (!s3Outputlocation) {
        throw new Error('The Athena S3 Results Output location was not defined');
    }

    if (!queryTimeout && queryTimeout < 0) {
        throw new Error('The Athena Query Timeout was not defined');
    }
    const con = {
        region, accessKey, secretKey, database, sqlStatement, s3Outputlocation, queryTimeout
    };

    return new Promise(function(resolve) {
        resolve(con);
    });
}

/**
 * The following method will execute a query against the specified connection
 * @param {object} queryObject - The SQL to query against the connection
 * @param {object} connection - Connection parameters
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function query(queryObject, connection) {
    const columnnames = [], rows = [];
    let numberOfColumns = 0;

    connection.sqlStatement = queryObject;
    return new Promise(function(resolve, reject) {
        executeQuery(connection).then(dataSet => {
            if (dataSet && dataSet.length > 0) {
                // First column contains the column names
                const cols = dataSet[0].Data;
                numberOfColumns = cols.length;
                for (let j = 0; j < numberOfColumns; j++) {
                    columnnames.push(cols[j].VarCharValue);
                }

                // Loop through the remaining rows to extract data
                for (let i = 1; i < dataSet.length; i++) {
                    const row = dataSet[i];
                    // Ensure Row is defined and has expected number of columns
                    if (row && row.Data && row.Data.length === numberOfColumns) {
                        const r = [];

                        // Extract each element from the row
                        row.Data.map(element => {
                            if (element && element.VarCharValue) {
                                r.push(element.VarCharValue);
                            } else {
                                // Put empty results if element has no value
                                r.push('');
                            }
                        });
                        rows.push(r);
                    }
                }
            }
            resolve({columnnames, rows});
        }).catch(err => {
            reject(err);
        });
    });
}

/**
 * Should return a list of tables and their that are defined within the database.
 * @param {object} connection - Connection parameters
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.region - AWS Region
 * @param {string} connection.database - Database name to connect to
 * @param {string} connection.s3Outputlocation - Location will Athena will output resutls of query
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function schemas(connection) {
    const columnnames = ['Table', 'column_name', 'data_type'];
    const rows = [];

    connection.sqlStatement = `${SHOW_SCHEMA_QUERY} = '${connection.database}'` ;
    connection.queryTimeout = DEFAULT_QUERY_TIMEOUT;
    return new Promise(function(resolve, reject) {
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
            resolve({columnnames, rows});
        }).catch(err => {
            reject(err);
        });
    });
}


/**
 * Should return a list of tables that are in the database
 * @param {object} connection - Connection Parameters
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.region - AWS Region
 * @param {string} connection.database - Database name to connect to
 * @param {string} connection.s3Outputlocation - Location will Athena will output resutls of query
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function tables(connection) {

    connection.sqlStatement = SHOW_TABLES_QUERY;
    connection.queryTimeout = DEFAULT_QUERY_TIMEOUT;
    return new Promise(function(resolve, reject) {
        executeQuery(connection).then(dataSet => {

            let rst = [];
            if (dataSet && dataSet.length > 0) {
                rst = dataSet.map(data => {
                    if (data && data.Data && data.Data.length > 0) {
                        return data.Data[0].VarCharValue;
                    }
                });
            }
            resolve(rst);
        }).catch(err => {
            reject(err);
        });
    });
}