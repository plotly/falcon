

import {createAthenaClient, startQuery} from '../../backend/persistent/datastores/drivers/AWSAthenaDriver';


const client = createAthenaClient();

let params  = {
    dbName :'shopscreen_logs',
    sqlStatement: 'select * from clean_logs',
    s3Outputlocation: 's3://aws-athena-query-results-575576301786-us-east-1/'
};
startQuery( client, params ).then( rst =>{
    console.log( 'Got the query id back', rst);
}).catch( err =>{
    console.log( 'err', err);
});