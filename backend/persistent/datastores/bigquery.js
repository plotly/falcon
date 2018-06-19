

const SHOW_TABLES_QUERY = 'SHOW TABLES';
const SHOW_SCHEMA_QUERY =
    'SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema';
//const BIGQUERY_DEFAULT_QUERY = `SELECT * FROM FROM ${database}.__TABLES__ `;
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
    //let defaultQuery = `SELECT * FROM FROM ${connection.database}.__TABLES__ `;
    //return query(defaultQuery, connection).then(() => connection);
    return new Promise(function(resolve, reject) {
        console.log( 'Returning connection');
        resolve( connection );
    });
}

/**
 * The following method will execute a query against the specified connection
 * @param {object} queryObject - The SQL to query against the connection
 * @param {object} connection - Connection parameters
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function query(queryObject, connection) {
    connection.sqlStatement = queryObject;

    let columnnames = ['advanced'];
    let rows = [[1],[2],[3]];

    return new Promise(function(resolve, reject) {
        console.log( 'Returning query');
        resolve( {columnnames, rows});
    });
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

    //TODO Complete this.

    let columnnames = ['advanced'];
    let rows = ['A','B','C'];

    return new Promise(function(resolve, reject) {
        console.log( 'Returning schema');
        resolve( {columnnames, rows});
    });

    /*let tableNames = [];
    const bigquery = new BigQuery({
      keyFilename: connection.keyfileName,
      projectId: connection.projectId
    });
    bigquery.dataset( dbname ).getTables().then( results =>{
        const tables = results[0];
        console.log('Tables:', tables);
        console.log('Number of tables :', tables.length);
        tables.forEach(table => { 
            console.log(table);
            console.log( 'Table name', table.id);
            return table.getMetadata().then( m =>{
                const meta = m[0];
                console.log( 'Meta data', meta.schema.fields);
            })
        });
     })*/
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



    let tables = ['advanced'];
    //let rows = ['A','B','C'];

    return new Promise(function(resolve, reject) {
        console.log( 'Returning tables');
        resolve( tables);
    });
    /*let tableNames = [];
    const bigquery = new BigQuery({
      keyFilename: connection.keyfileName,
      projectId: connection.projectId
    });
 
    bigquery.dataset( connection.database ).getTables().then( results =>{
       const tables = results[0];

       if( results && results.length >0){
            tables.forEach(table => { 
                tableNames.push( table.id );
            });
       }
       return tableNames;
    });*/
}
