# Add New Data Source

The following are the instructions for adding a new data source 

## Add the following files for Creating a new Datasource

backend/persistent/datastores/Datastores.js
backend/persistent/datastores/NameOfDatastoreToConnec.js
app/constants/constants.js
app/images
app/actions/sessions.js
app/components/Settings/Tabs/Tab.react.js
app/components/Settings/Settings.react.js

## Datastore file should have the following functions

function query(queryObject, connection); 

function connect(connection);

function schemas(connection);

function tables(connection);

//Question are these required?
function files(connection);

function storage(connection); 