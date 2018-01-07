

import {createAthenaClient, startQuery, stopQuery, queryResultsCompleted, executeQuery} from '../../backend/persistent/datastores/drivers/AWSAthenaDriver';

import {tables, schemas} from '../../backend/persistent/datastores/Athena';


const client = createAthenaClient();

const SQL_STATEMENT = `select * from clean_logs limit 1000`;
//const SQL_STATEMENT = `SHOW TABLES`; 
let params  = {
    dbName :'shopscreen_logs',
    sqlStatement: SQL_STATEMENT,
    s3Outputlocation: 's3://aws-athena-query-results-575576301786-us-east-1/',
    queryTimeout: 5000
};
/*startQuery( client, params ).then( rst =>{
    console.log( 'Got the query id back', rst);

    queryResultsCompleted( client, rst ).then( queryState =>{
        if( queryState === -1 ){
            console.log( 'Error Querying ');
        } else if( queryState === 0 ){
            stopQuery( client, rst ).then( stopRst =>{
                console.log( 'Query Stopped', stopRst);
            });
        }else{
            console.log( 'Query has completed and is done');
        }
    });
    //Stop the query
    //stopQuery( client, rst ).then( stopRst =>{
        //console.log( 'Query Stopped', stopRst);
    //})//
}).catch( err =>{
    console.log( 'err', err);
});*/

console.log( `Starting of executing query`);
/*executeQuery( params ).then( queryResult =>{
    console.log( `Received response `);
    console.log( queryResult );   
    console.log( 'Geting resposne');
    for( let i=0; i< queryResult.length; i++ ){
        console.log('Have row');
        let row = queryResult[i].Data;
        //console.log(row);
        let rowData = '';
        for( let j=0; j< row.length; j++ ){
            rowData = `${rowData}, ${row[j]}`;
            //console.log( row[j] );
        }
        console.log( rowData );
    }
    
}).catch( err =>{
    console.log( `Unexpected error returning the query result ${err}`);
});

console.log( `Completing Executin of query`);*/

schemas( params ).then( queryResult =>{
    console.log( 'Retrieved the results', queryResult);
}).catch( err =>{
    console.log( 'Error getting tables', err);
});