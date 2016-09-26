export const API_VERSION = (apiVersion) => `Api version [${apiVersion}] is ` +
	'not implemented';
export const TASK = (task) => `Task ${task} is not implemented.`;
export const QUERY_PARAM = 'No query statement found. Please ' +
	'provide a query entry such as \'/query?statement=SELECT * FROM table\'';
export const DATABASE_PARAM = 'No database entry found. Please ' +
	'provide a database entry such as \'/endpoint?database=database_name';
export const TABLES_PARAM = 'No tables entry found. Please provide' +
	' a tables entry such as \'/preview?tables=table1,table2... ]';
export const SESSION_PARAM = 'No session entry found. Please provide' +
	' a session entry such as \'/deletesession?session=sessionID';
export const NON_EXISTENT_SESSION = 'No such session entry found. Please' +
	' provide a session value that has been created. You can obtain the list' +
    ' of available sessions at the end poitn /v1/sessions';
export const APP_NOT_CONNECTED = 'There seems to be no connection at ' +
    'the moment. Please try connecting the application to your database.';
export const AUTHENTICATION = (error) => 'Authentication failed. ' +
    `Make sure you are connected ${error}`;
