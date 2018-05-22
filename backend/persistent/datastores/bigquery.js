

const SHOW_TABLES_QUERY = 'SHOW TABLES';
const SHOW_SCHEMA_QUERY =
    'SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema';
const BIGQUERY_DEFAULT_QUERY = `SELECT * FROM FROM ${database}.__TABLES__ `;
const DEFAULT_QUERY_INTERVAL = 2000;

const BigQuery = require('@google-cloud/bigquery');

//TODO.  1. Simple connect and run preview query
//2. Get a list of schema's via API
/*
 * The connection function will validate the parameters and return the connection
 * parameters
 * @param {object} connection
 * @param {string} connection.projectId - Google Cloud Project Id
 * @param {string} connection.database - Google Big Query Database
 * @param {string} connection.keyfileName - Google Service Account Key File
 * @returns {Promise} that resolves connection
 */
export function connect(connection) {
    let defaultQuery = `SELECT * FROM FROM ${connection.database}.__TABLES__ `;
    return query(defaultQuery, connection).then(() => connection);
}

/**
 * The following method will execute a query against the specified connection
 * @param {object} queryObject - The SQL to query against the connection
 * @param {object} connection - Connection parameters
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function query(queryObject, connection) {
    connection.sqlStatement = queryObject;

    /*return executeQuery(connection).then(dataSet => {
        let columnnames = [];
        let rows = [];

        if (dataSet && dataSet.length > 0) {
            // First row contains the column names
            columnnames = dataSet[0].Data.map(columnname => columnname.VarCharValue);

            // Loop through the remaining rows to extract data
            rows = dataSet.slice(1).map(row => row.Data.map(element => element.VarCharValue));
        }

        return {columnnames, rows};
    });*/
}

/**
 * Should return a list of tables and their columns that are defined within the database.
 * @param {object} connection - Connection parameters
 * @param {string} connection.projectId - Google Cloud Project Id
 * @param {string} connection.database - Google Big Query Database
 * @param {string} connection.keyfileName - Google Service Account Key File
 * @returns {Promise} that resolves connection
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function schemas(connection) {
    const sqlStatement = `${SHOW_SCHEMA_QUERY} = '${connection.database}'` ;
    //return query(sqlStatement, connection);
}


/**
 * Should return a list of tables that are in the database
 * @param {object} connection - Connection Parameters
 * @param {string} connection.projectId - Google Cloud Project Id
 * @param {string} connection.database - Google Big Query Database
 * @param {string} connection.keyfileName - Google Service Account Key File
 * @returns {Promise} that resolves connection
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function tables(connection) {
    connection.sqlStatement = SHOW_TABLES_QUERY;
    /*return executeQuery(connection).then(dataSet => {
        const tableNames = dataSet.slice(1).map(row => row.Data[0].VarCharValue);
        return tableNames;
    });*/
}
