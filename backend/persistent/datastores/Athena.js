import {parseSQL} from '../../parse';

const SHOW_TABLES_QUERY = `SHOW TABLES`;
const SHOW_SCHEMA_QUERY = `DESCRIBE `;

//TODO
// 0. Get the connection parameters working and validation
// 1. Get the list of tables
// 2. Get the list of schemas
// 3. Get the query working correctly 


/*
 * The connection object will open a connection to the Athena database
 * @param {object} connection
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.dbName - Database name to connect to 
 * @param {string} connection.sqlStatement - SQL statement to execute
 * @param {string} connection.s3Outputlocation - Location will Athena will output resutls of query
 * @param {number} params.queryTimeout  - The timeout interval when the query should stop
 */
export function validateConnection( connection ){

    //TODO Move validation of connection into common function
}


export function connect(connection) {
    console.log( 'Athena Connection', connection);
    const {
        region, accessKey, secretKey, dbName, sqlStatement, s3Outputlocation, queryTimeout
    } = connection;

    //Validate that the connection has a 
    if( !region ){
        throw new Error(`The AWS Region was not defined`);
    }

    if( !accessKey ){
        throw new Error(`The AWS access key was not defined`);
    }

    if( !secretKey ){
        throw new Error(`The AWS secret key was not defined`);
    }

    if( !dbName ){
        throw new Error(`The Database Name was not defined`);
    }

    if( !sqlStatement ){
        throw new Error(`The SQL Statement was not defined`);
    }

    if( !s3Outputlocation ){
        throw new Error(`The Athena S3 Results Output location was not defined`);
    }

    if( !queryTimeout && queryTimeout < 0){
        throw new Error(`The Athena Query Timeout was not defined`);
    }
    let con = {
        region, accessKey, secretKey, dbName, sqlStatement, s3Outputlocation, queryTimeout
    };

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