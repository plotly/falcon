import {executeQuery} from './drivers/athena';

const SHOW_TABLES_QUERY = 'SHOW TABLES';
const SHOW_SCHEMA_QUERY =
    'SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema';
const ATHENA_DEFAULT_QUERY = 'SELECT table_name FROM information_schema.columns LIMIT 1';
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
    if (!connection.timeout && connection.timeout < 0) {
        connection.timeout = DEFAULT_QUERY_INTERVAL;
    }

    return query(ATHENA_DEFAULT_QUERY, connection)
    .then(() => connection);
}

/**
 * The following method will execute a query against the specified connection
 * @param {object} queryObject - The SQL to query against the connection
 * @param {object} connection - Connection parameters
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function query(queryObject, connection) {
    connection.sqlStatement = queryObject;

    return executeQuery(connection).then(dataSet => {
        let columnnames = [];
        let rows = [];

        if (dataSet && dataSet.length > 0) {
            // First row contains the column names
            columnnames = dataSet[0].Data.map(columnname => columnname.VarCharValue);

            // Loop through the remaining rows to extract data
            rows = dataSet.slice(1).map(row => row.Data.map(element => element.VarCharValue));
        }

        return {columnnames, rows};
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
    const sqlStatement = `${SHOW_SCHEMA_QUERY} = '${connection.database}'` ;
    let rst= query(sqlStatement, connection);

    return rst.then( r=>{
        console.log( 'R',r);
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
    return executeQuery(connection).then(dataSet => {
        const tableNames = dataSet.slice(1).map(row => row.Data[0].VarCharValue);
        return tableNames;
    });
}
