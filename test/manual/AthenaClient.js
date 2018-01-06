

import {createAthenaClient, startQuery, stopQuery, queryResultsCompleted, executeQuery} from '../../backend/persistent/datastores/drivers/AWSAthenaDriver';


const client = createAthenaClient();

let params  = {
    dbName :'shopscreen_logs',
    sqlStatement: 'select * from clean_logs limit 100000',
    s3Outputlocation: 's3://aws-athena-query-results-575576301786-us-east-1/',
    queryTimeout: 20000
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

executeQuery( params ).then( queryResult =>{
    console.log( `Received response `);
    console.log( queryResult );    
}).catch( err =>{
    console.log( `Unexpected error returning the query result ${err}`);
});