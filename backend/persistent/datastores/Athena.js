import {parseSQL} from '../../parse';
import {executeQuery} from './drivers/AWSAthenaDriver';

const SHOW_TABLES_QUERY = `SHOW TABLES`;
const SHOW_SCHEMA_QUERY = `SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema `;
const DEFAULT_QUERY_TIMEOUT = 2000;

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
    //console.log( 'Athena Query Conn', connection);
    //console.log( 'Athena Query Obj', queryObject);

    let columnnames = [];
    let rows = [];

    connection.sqlStatement = queryObject;
    return new Promise(function(resolve, reject) {
        executeQuery( connection ).then( dataSet =>{

            console.log('sql',dataSet );
            let rows = [];
            if( dataSet && dataSet.length > 0){
                let cols = dataSet[0].Data
                console.log( 'Columns?', dataSet[0].Data)
                console.log( 'Columns?', dataSet[0].Data)

                for (let j = 0; j< cols.length; j++ ){
                    columnnames.push( cols[j].VarCharValue );
                    console.log( 'Column Name', cols[j].VarCharValue);
                }

                for( let i=1; i< dataSet.length; i++){
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
            reject( err );
        });
    });

    /*let results = [];

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
    });*/
}


/**
 * Should return a list of databases that are defined within the database.
 * @param {object} connection 
 */
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

    connection.sqlStatement = `${SHOW_SCHEMA_QUERY} = '${connection.dbName}'` ;
    connection.queryTimeout = DEFAULT_QUERY_TIMEOUT;
    return new Promise(function(resolve, reject) {
        executeQuery( connection ).then( dataSet =>{

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