
//TODO 
//1. What is expected object for connection
//2. What is expect results for the schems.  Is this a list of databases or 
// table definitions.  Must check against Postgres
//3. What is the expected results from the list of tables?
//4. What is the expected results for the query
//5. Hard code the format of the data to test


/*
 * The connection object will open a connection to the Athena database
 * @param {object} connection
 */
export function connect(connection) {
    let conn = {};
    return new Promise(function(resolve, reject) {
        resolve( conn );
    });
}

/**
 * The following method will execute a query against the specified connection
 * TODO.  What is expected Format
 * @param {object} queryObject 
 * @param {object} connection 
 */
export function query(queryObject, connection){

}


/**
 * Should return a list of databases that are defined within the database.
 * @param {object} connection 
 */
export function schemas(connection){
    
}

/**
 * Should return a list of tables that are in the database
 * @param {*} connection 
 */
function tables(connection);