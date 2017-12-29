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


## Images
It is recommended to add the images as png and a good idea to include a regular and small icon

## Updating the constants.js file
The following are the instructions for adding the Constants File:
1. Add an entry in DIALECTS
2. Add an entry in SQL_DIALECTS_USING_EDITOR
3. Add an entry under CONNECTION_CONFIG
4. Add the location of the logo in 
5. Add the preview query in the PREVIEW_QUERY section
6. Add an entry in the SAMPLE_DBS 


## Updating the Tab.react.js 
The following are the instructions for adding the Tab React JS file
1. Add an entry for the connection label

## Datastore file should have the following functions
```javascript
function query(queryObject, connection); 

function connect(connection);

/**
 * The following method will return a list of schemas that are 
 */
function schemas(connection);

function tables(connection);

//Question are these required?
function files(connection);

function storage(connection); 
```