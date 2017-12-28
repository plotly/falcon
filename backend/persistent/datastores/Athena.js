
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
    console.log( 'Athena Connection', connection);
    const {
        username, password, database, port, dialect, accessKey, secretKey
    } = connection;

    let con = {
        username, 
        password, 
        database, 
        port, 
        dialect, 
        accessKey, 
        secretKey
    };

    console.log( 'Connection object', con);
    return new Promise(function(resolve, reject) {
        resolve( con );
    });
}

/**
 * The following method will execute a query against the specified connection
 * TODO.  What is expected Format
 * @param {object} queryObject 
 * @param {object} connection 
 */
export function query(queryObject, connection){
    console.log( 'Athena Query Conn', connection);
    console.log( 'Athena Query Obj', queryObject);

    return [];

    return new Promise(function(resolve, reject) {
        resolve( [] );
    });
}


/**
 * Should return a list of databases that are defined within the database.
 * @param {object} connection 
 */
export function schemas(connection){
    console.log( 'Schemas', connection);

    let columnnames = ['FirstName', 'LastName', 'Date'];
    let rows = [];

    for( let i=0; i< 4; i++){
        let r = [];
        r.push( `John-${i}`);
        r.push( `Smith-${i}`);
        r.push( `0${i}/12/2017`);

        rows.push(r);
    }


    return new Promise(function(resolve, reject) {
        resolve( {columnnames, rows} );
    });
}

/**
 * Should return a list of tables that are in the database
 * @param {*} connection 
 */
export function tables(connection){
    console.log( 'Tables', connection);
    return [];

    return new Promise(function(resolve, reject) {
        resolve( [] );
    });
}