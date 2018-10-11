
const BigQuery = require('@google-cloud/bigquery');

/**
 * The following function will create a big query client
 * @param {string} projectId - Google Big Query unique id for project
 * @param {string} keyFilename - Google File Name where credentials are 
 */
function getBigQueryClient( projectId, keyFilename){
    return new BigQuery({
        keyFilename,
        projectId
      });
}
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
    return new Promise(function(resolve, reject) {
        tables( connection ).then( ()=>{
            resolve( connection );
        }).catch( err =>{
            reject(err);
        })
    });
}

/**
 * The following method will execute a query against the specified connection
 * @param {object} queryObject - The SQL to query against the connection
 * @param {object} connection - Connection parameters
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function query(queryObject, connection) {
    const bigQuery = getBigQueryClient(connection.projectId,connection.keyfileName);
    connection.sqlStatement = queryObject;

    let columnnames = [];
    let rows = [];
    let rs = [];
    let cols = [];

    const options = {
        query: connection.sqlStatement,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    let job;
    return new Promise(function(resolve, reject) {

        //@n-riesco. This should be refactored to use async or co.  Your thoughts?
        bigQuery.createQueryJob(options).then(results => {
          job = results[0];
          return job.promise();
        }).then(metadata => {
            const errors = metadata[0].status.errors;
            if (errors && errors.length > 0) {
              reject(errors);
            }
        }).then(() => {
            return job.getQueryResults();
        }).then(results => {
            const rowResult = results[0];

            if( rowResult && rowResult.length > 0 ){
                for( let key in rowResult[0]){
                    columnnames.push( key);
                }
                rowResult.forEach(row => {
                    let r1 = [];
                    for( var key in row ){
                        r1.push( row[key] );
                    }
                    rows.push( r1 );

                });
            }
            resolve( {columnnames, rows});

        }).catch(err => {
            reject( err );
        });
    });
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
    const bigquery = getBigQueryClient(connection.projectId,connection.keyfileName);
    const columnnames = ['table_name', 'column_name', 'data_type'];
    let rows = [];
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
                    //@n-riesco - This feels hacky:)  Do you have a better way?
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
    const bigquery = getBigQueryClient(connection.projectId,connection.keyfileName);
    let tableNames = [];
    return bigquery.dataset( connection.database ).getTables().then( results =>{
       const tables = results[0];
       if( results && results.length >0){
            tables.forEach(table => { 
                tableNames.push( table.id );
            });
       }
       return tableNames;
    });
}