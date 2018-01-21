import {parseSQL} from '../../parse';
import {executeQuery} from './drivers/AWSAthenaDriver';

const SHOW_TABLES_QUERY = `SHOW TABLES`;
const SHOW_SCHEMA_QUERY = `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema `;
const DEFAULT_QUERY_TIMEOUT = 2000;
const SHOW_DATABASE_QUERY = `SHOW DATABASES`;


//TODO
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
    let columnnames = [], rows = [], numberOfColumns = 0;

    connection.sqlStatement = queryObject;
    return new Promise(function(resolve, reject) {
        executeQuery( connection ).then( dataSet =>{
            if( dataSet && dataSet.length > 0){
                //First column contains the column names
                let cols = dataSet[0].Data
                numberOfColumns = cols.length;
                for (let j = 0; j< numberOfColumns; j++ ){
                    columnnames.push( cols[j].VarCharValue );
                }

                //Loop through the remaining rows to extract data
                for( let i=1; i< dataSet.length; i++){
                    let row = dataSet[i];
                    //Ensure Row is defined and has expected number of columns
                    if( row && row.Data && row.Data.length === numberOfColumns ){
                        let r = [];

                        //Extract each element from the row
                        row.Data.map( element =>{
                            if( element && element.VarCharValue ){
                                r.push( element.VarCharValue);
                            }else{
                                //Put empty results if element has no value
                                r.push( '' );
                            }
                        } )
                        rows.push( r );
                    }
                }
            }
            resolve( {columnnames, rows} );
        }).catch( err =>{
            reject( err );
        });
    });
}

/**
 * Should return a list of databases
 * @param {object} connection 
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.region - AWS Region
 * @param {string} connection.dbName - Database name to connect to 
 * @param {string} connection.s3Outputlocation - Location will Athena will output resutls of query
 * @returns {Array} - returns an array of the database names in the system
 */
function getDatabases( connection ){

    connection.sqlStatement = SHOW_DATABASE_QUERY;
    connection.queryTimeout = DEFAULT_QUERY_TIMEOUT;
    return new Promise(function(resolve, reject) {
        executeQuery( connection ).then( dataSet =>{
            let rows = [];
            if( dataSet && dataSet.length > 0){
                for( let i=0; i< dataSet.length; i++){
                    let data = dataSet[i];

                    if( data && data.Data && data.Data.length > 0 ){
                        rows.push( data.Data[0].VarCharValue ); //Database Name
                    }
                }
            }
            resolve( rows );
        }).catch( err =>{
            reject( err );
        });
    });
}

/**
 * Should return a list of databases
 * @param {object} connection 
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.region - AWS Region
 * @param {string} connection.dbName - Database name to connect to 
 * @param {string} connection.s3Outputlocation - Location will Athena will output resutls of query
 * @returns {Array} - returns an array of the table names, columns and types
 */
function getDatabaseSchema( connection, dbName ){
    let columnnames = ['Table', 'column_name', 'data_type'];
    let rows = [];

    return new Promise(function(resolve, reject) {
        connection.sqlStatement = `${SHOW_SCHEMA_QUERY} = '${dbName}'` ;
        connection.queryTimeout = DEFAULT_QUERY_TIMEOUT;
        return  executeQuery( connection ).then( dataSet =>{
            console.log( 'Calling execute Query');
            let rows = [];
            if( dataSet && dataSet.length > 0){
                for( let i=0; i< dataSet.length; i++){
                    let data = dataSet[i];

                    if( data && data.Data && data.Data.length > 0 ){
                        if( i != 0){
                            let row = [];
                            let tableName = `${dbName}.data.Data[0].VarCharValue`;
                            row.push( tableName ); //Table Name
                            row.push( data.Data[1].VarCharValue ); //Column Name
                            row.push( data.Data[2].VarCharValue ); //DataType
                            rows.push( row );
                        }   
                    }
                }
            }
            resolve( {columnnames, rows} );
        }).catch( err =>{
            console.log( 'Unexpected error', err);
            reject( err );
        });
    });
}


/**
 * Should return a list of tables and their that are defined within the database.
 * @param {object} connection 
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.region - AWS Region
 * @param {string} connection.dbName - Database name to connect to 
 * @param {string} connection.s3Outputlocation - Location will Athena will output resutls of query
 */
export function schemas(connection){
    let columnnames = ['Table', 'column_name', 'data_type'];
    let rows = [];

    return new Promise(function(resolve, reject) {
        console.log( 'Start getting databases');
        return getDatabases( connection ).then( dbNames =>{
            console.log( 'Calling Get Database Names', dbNames);

            getDatabaseSchema( connection, dbNames[0]).then( rst =>{
                console.log( 'Schema result', rst);
                connection.sqlStatement = `${SHOW_SCHEMA_QUERY} = '${connection.dbName}'` ;
                connection.queryTimeout = DEFAULT_QUERY_TIMEOUT;
    
                //TODO Implement a Promise All where pass in DB name
                return  executeQuery( connection )
            });

        }).then( dataSet =>{
            console.log( 'Calling execute Query');
            let rows = [];
            if( dataSet && dataSet.length > 0){
                for( let i=0; i< dataSet.length; i++){
                    let data = dataSet[i];

                    if( data && data.Data && data.Data.length > 0 ){
                        if( i != 0){
                            let row = [];
                            row.push( data.Data[0].VarCharValue ); //Table Name
                            row.push( data.Data[1].VarCharValue ); //Column Name
                            row.push( data.Data[2].VarCharValue ); //DataType
                            rows.push( row );
                        }   
                    }
                }
            }
            resolve( {columnnames, rows} );
        }).catch( err =>{
            console.log( 'Unexpected error', err);
            reject( err );
        });
    });
}


/**
 * Should return a list of tables that are in the database
 * @param {object} connection 
 * @param {string} connection.accessKey - AWS Access Key
 * @param {string} connection.secretAccessKey - AWS Secret Key
 * @param {string} connection.region - AWS Region
 * @param {string} connection.region - AWS Region
 * @param {string} connection.dbName - Database name to connect to 
 * @param {string} connection.s3Outputlocation - Location will Athena will output resutls of query
 */
export function tables(connection){

    connection.sqlStatement = SHOW_TABLES_QUERY;
    connection.queryTimeout = DEFAULT_QUERY_TIMEOUT;
    return new Promise(function(resolve, reject) {
        executeQuery( connection ).then( dataSet =>{

            let rst = [];
            //console.log( 'data set', dataSet );
            if( dataSet && dataSet.length > 0){
                rst = dataSet.map( data =>{
                    if( data && data.Data && data.Data.length > 0 ){
                        return data.Data[0].VarCharValue;
                    }
                });
            }
            resolve( rst );
        }).catch( err =>{
            reject( err );
        });
    });
}