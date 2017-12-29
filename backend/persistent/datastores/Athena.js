import {parseSQL} from '../../parse';
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


    let results = [];

    for( let i=0; i< 20; i++){

        let r = {};
        if( i % 2 === 0){
            r.first_name_0  = 'John';
            r.value = i;
            results.push( r );
        }else{
            r.first_name_0  = 'Joan';
            r.value = i;
            results.push( r );
        }
    }

    console.log( 'Returning results to query');
    let columnnames = ['first_name_0', 'value'];
    return new Promise(function(resolve, reject) {

        
        resolve( parseSQL( results ) );
    });
}


/**
 * Should return a list of databases that are defined within the database.
 * @param {object} connection 
 */
export function schemas(connection){
    console.log( 'Schemas', connection);

    let columnnames = ['Table', 'column_name', 'data_type'];
    let rows = [];

    for( let i=0; i< 4; i++){

        
        let r = [];
        r.push('Test');
        r.push(`first_name_${i}`);
        r.push(`varchar`);

        rows.push(r);
    }

    let rowData = [];
    rowData.push('Test');
    rowData.push( 'value');
    rowData.push('integer');

    rows.push( rowData );


    for( let i=0; i< 2; i++){

        
        let r = [];
        r.push('Sample');
        r.push(`last_name_${i}`);
        r.push(`varchar`);

        rows.push(r);
    }

    rowData = [];
    rowData.push('Sample');
    rowData.push( 'value');
    rowData.push('integer');

    rows.push( rowData );



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
    
    return new Promise(function(resolve, reject) {
        resolve( ['Sample', 'Test'] );
    });
}