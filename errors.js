export const API_VERSION = (apiVersion) => `Api version [${apiVersion}] is ` +
	'not implemented';
export const TASK = (task) => `Task ${task} is not implemented.`;
export const QUERY_NOT_FOUND = () => 'No query statement found. Please ' +
	'provide a query entry such as \'/query?statement=SELECT * FROM table\'';
export const DATABASE_NOT_FOUND = () => 'No database entry found. Please ' +
	'provide a database entry such as \'/endpoint?database=database_name';
export const TABLES_NOT_FOUND = () => 'No tables entry found. Please provide' +
	' a tables entry such as \'/preview?tables=[\'table1\', \'table2\'... ]';
export const APP_NOT_CONNECTED = () => 'There seems to be no connection at ' +
    'the moment. Please try connecting the application to your database.';
