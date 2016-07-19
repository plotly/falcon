import {TASKS} from './messageHandler';
import {merge, split} from 'ramda';
import {QUERY_NOT_FOUND, DATABASE_NOT_FOUND, TABLES_NOT_FOUND} from './errors';


const sequelizeSetup = (connection) => {
    return merge(
        connection ? connection.options : null,
        connection ? connection.config : null
    );
};


export function v0(requestEvent, sequelizeManager, callback) {

    const {connection} = sequelizeManager;

    let task;
    let message;

    const endpoint = split('/', requestEvent.route.path)[2];
    console.log(endpoint);
    switch (endpoint) {

        case 'connect': {
            task = TASKS.CHECK_CONNECTION_AND_SHOW_DATABASES;
            message = sequelizeSetup(connection);
            break;
        }

        case 'login': {
            task = TASKS.CONNECT_AND_SHOW_DATABASES;
            message = sequelizeSetup(connection);
            break;
        }

        case 'query': {
            task = TASKS.QUERY;
            message = requestEvent.params.statement;
            console.log('task and message in api');
            console.log('task and message');
            console.log(task);
            console.log(message);
            break;
        }

        case 'tables': {
            task = TASKS.SELECT_DATABASE_AND_SHOW_TABLES;
            message = sequelizeSetup(connection);
            message.database = requestEvent.params.database;
            console.log('task and message');
            console.log(task);
            console.log(message);
            break;
        }

        case 'disconnect': {
            task = TASKS.DISCONNECT;
            message = sequelizeSetup(connection);
            break;
        }

        default: {
            sequelizeManager.raiseError(
                merge(`Endpoint ${endpoint} is not implemented in API v0.`),
                callback
            );
        }

    }

    return {task, message};

}


export function v1(requestEvent, sequelizeManager, callback) {

    const {connection} = sequelizeManager;

    let task;
    let message;

    const endpoint = split('/', requestEvent.route.path)[2];

    switch (endpoint) {

        case 'connect': {
            /*
             * action: establish connection via config file when headless or
             * ipc payload when not
             * returns: connection state
             */
            task = TASKS.CONNECT;
            message = sequelizeSetup(connection);
            break;
        }

        case 'authenticate': {
            /*
             * action: checks for existing valid connection
             * returns: connection state
             */
            task = TASKS.AUTHENTICATE;
            message = sequelizeSetup(connection);
            break;
        }

        case 'databases': {
            /*
             * action: authenticate, get databases
             * returns: databases list = ['database1', 'database2' ...]
             */
            task = TASKS.DATABASES;
            message = sequelizeSetup(connection);
            break;
        }

        case 'selectdatabase': {
            /*
             * action: authenticate, get databases
             * returns: connection state
             */
            task = TASKS.CONNECT;
            message = sequelizeSetup(connection);
            if (requestEvent.params.database) {
                message.database = requestEvent.params.database;
            } else {
                sequelizeManager.raiseError(DATABASE_NOT_FOUND, callback);
            }
            break;
        }

        case 'tables': {
            /*
             * action: authenticate, get tables
             * returns: tables list
             */
            task = TASKS.TABLES;
            message = sequelizeSetup(connection);
            break;
        }

        case 'preview': {
            /*
             * action: authenticate, send top 5 query
             * returns: table preview of 5 rows
             */
            task = TASKS.PREVIEW;
            if (requestEvent.params.tables) {
                message = requestEvent.params.tables;
            } else {
                sequelizeManager.raiseError(TABLES_NOT_FOUND, callback);
            }
            break;
        }

        case 'query': {
            /*
             * action: authenticate, send raw query
             * returns: query response
             */
             console.log(requestEvent.params);
             console.log(requestEvent.params.statement);
            task = TASKS.QUERY;

            if (requestEvent.params !== {}) {
                message = requestEvent.params.statement;
            } else {
                sequelizeManager.raiseError(QUERY_NOT_FOUND, callback);
            }
            break;
        }

        case 'disconnect': {
            /*
             * action: disconnect, authenticate
             * return: connection state object
             */
            task = TASKS.DISCONNECT;
            message = sequelizeSetup(connection);
            break;
        }

        default: {
            sequelizeManager.raiseError(
                merge(`Endpoint ${endpoint} is not implemented in API v1.`),
                callback
            );
        }
    }

    return {task, message};

}
