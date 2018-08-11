

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

    const columnnames = ['table_name', 'column_name', 'data_type'];
    let rows = [];

    //@n-riesco - This could be encapsulated in connection but I know we had problems with serialization 
    // on athena connection data
    const bigquery = new BigQuery({
      keyFilename: connection.keyfileName,
      projectId: connection.projectId
    });

    return new Promise ((resolve,reject) =>{
        return bigquery.dataset( connection.database ).getTables().then( results =>{
            const tables = results[0];

            let tableMetadataPromise = [];
            tables.forEach(table => { 
                //@n-riesco - I know we recently upgraded to node 8.  I using promise all.  Your thoughts?
                tableMetadataPromise.push( table.getMetadata() );
            });

            return Promise.all( tableMetadataPromise ).then( result=> {
                result.forEach( m=>{
                    //@n-riesco - Is this a more efficent way to implement this
                    let tableName = m[0].tableReference.tableId;
                    let tableAtttributes = m[0].schema.fields.map( field => [tableName,field.name,field.type]);
                    rows = rows.concat( tableAtttributes );

                })
                resolve( {columnnames, rows});
            })
         })
    });

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
    let t = [];
    //let rows = ['A','B','C'];

    /*return new Promise(function(resolve, reject) {
        console.log( 'Returning tables');
        resolve( tables);
    });*/
    console.log( 'Tables about to be queried', connection);
    let tableNames = ['advanced'];
    const bigquery = new BigQuery({
      keyFilename: connection.keyfileName,
      projectId: connection.projectId
    });
    console.log( 'Accessing Big Query', connection);
    return bigquery.dataset( connection.database ).getTables().then( results =>{
        console.log( 'Results', results);
       const tables = results[0];

       if( results && results.length >0){
            tables.forEach(table => { 
                tableNames.push( table.id );
            });
       }
       console.log( 'Big Query tables', tableNames);
       return tableNames;
    });
}
