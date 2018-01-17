# Add New Data Source

## Images
The connector must provide an icon to be displayed on the selection tab and
it is recommended to add the images as png format.  
Please verify that the icon looks good with the following CSS specs:
```css
 max-width: 100px;
 max-height: 70px;
```

## Updating the constants.js file
The following are the instructions for updating the Constants File:
1. Add an entry in DIALECTS
2. Add an entry in SQL_DIALECTS_USING_EDITOR
3. Add an entry under CONNECTION_CONFIG
4. Add the location logo into the LOGOS Constants  
5. Add the preview query in the PREVIEW_QUERY section
6. Add sample credentials for your connector in the SAMPLE_DBS 

## Updating the Tab.react.js 
The following are the instructions for updating the Tab React JS file
1. Customise the label for your connector in the render function:

```javascript
    let label;
    if (dialect === DIALECTS.S3) {
            label = `S3 - (${connectionObject.bucket})`;
        } else if (dialect === DIALECTS.NEW_CONNECTION) {
            //Specify the label
            label = `NEW CONNECTION (${connectionObject.host})`;
        }
    ....
```

## Updating the Settings.react.js
Update the fetchData function to make the calls to appropriate sessions.js backend.  
Add your new connection to the following list:

```javascript
    if (contains(connectionObject.dialect, [
                    DIALECTS.APACHE_IMPALA,
                    DIALECTS.APACHE_SPARK,
                    DIALECTS.IBM_DB2,
                    DIALECTS.MYSQL, DIALECTS.MARIADB, DIALECTS.POSTGRES,
                    DIALECTS.REDSHIFT, DIALECTS.MSSQL, DIALECTS.SQLITE
    ])) {
```

## New Datastore file
This file should be added in the following location
backend/persistent/datastores

```javascript

/**
 * The following function will connect to the datasource
 * @param {Object} connection
 * @returns {Promise} that resolves when the connection succeeds
 */ 
function connect(connection);

/**
 * The following function will return a list of schemas.  
 * @param {Object} connection 
 * @returns {Promise} that resolves to { 
 *                    columnnames: [ 'tablename', 'column_name','data_type' ], 
 *                    rows: [[tablename1, columnname1, datatype1], ...]] }
 */
function schemas(connection);

/**
 * The following function will return a list of tables.  
 * The return result should an array of strings
 * @param connection {object}
 * @returns {Promise} that resolves to an array of table names
 */
function tables(connection);

/**
 * The following function will execute a query against the 
 * data source.  The function should return a tuple which contains 
 * two elements.  The first is an array of strings which is the column names
 * The second is a two dimensional array which represents the rows to be displayed
 * @param {string|object} queryObject
 * @param {object} connection
 * @returns {Promise} that resolves to { columnnames, rows }
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
