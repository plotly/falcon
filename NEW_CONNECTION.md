# Add New Data Source

The following are the instructions for adding a new data source 

## The following are the files that need to be updated

1. app/constants/constants.js
2. app/actions/sessions.js
3. app/components/Settings/Tabs/Tab.react.js
4. app/components/Settings/Settings.react.js
5. backend/persistent/datastores/Datastores.js

## The following are the new files that need to be added

1. app/images
2. backend/persistent/datastores/NameOfDatastoreToConnect.js

# Detailed Implementation Instructions

## Images
It is recommended to add the images as png and a good idea to include a regular and small icon
You can add the new icon in the directory app/images.  It recommended to use png format
and name the file in lower case with dashes (ex: mysql-logo.png )

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

## New Datastore file
This file should be added in the following location
backend/persistent/datastores

```javascript

/**
 * The following function will connect to the datasource
 * @param {Object} connection
 */ 
function connect(connection);

/**
 * The following function will return a list of schemas.  The return 
 * array should return a list of array with each array containing the 
 * following information:
 * -row[0] schema name
 * -row[1] column name
 * -row[2] data type
 * @param {Object} connection 
 * @return {Array}
 */
function schemas(connection);

/**
 * The following function will return a list of tables.  
 * The return result should an array of strings
 * @param connection {object}
 * @return {Array}
 */
function tables(connection);

/**
 * The following function will execute a query against the 
 * data source.  The function should return a tuple which contains 
 * two elements.  The first is an array of strings which is the column names
 * The second is a two dimensional array which represents the rows to be displayed
 * @param {string|object} queryObject
 * @param {object} connection
 * @return {object} -- tuple {columnames, rows}
 */ 
function query(queryObject, connection); 

```

## Updating the Datastores.js 
The following are the instructions for updating the Datastores.js

1. Import the new Data source file
2. Update the function getDatastoreClient
``` javascript
    //The dialect name must match what was specified under
    //app/constants/constants.js for the Dialect name
    } else if (dialect === 'new dialect') {
        return MyNewDialect;
    }
```
# Development and Debugging Setup
TBD
