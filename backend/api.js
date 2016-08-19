import {TASKS} from './messageHandler';
import {has, map, merge, split, trim} from 'ramda';
import {QUERY_PARAM, DATABASE_PARAM, TABLES_PARAM} from './errors';


const sequelizeSetup = (connection) => {
    return merge(
        connection ? connection.options : null,
        connection ? connection.config : null
    );
};

const foundParams = (params, wantedParam) => {

    if (Boolean(params) && has(wantedParam, params)) {
        return true;
    }

    return false;
};


export function v0(requestEvent, sequelizeManager, callback) {

    const {connection} = sequelizeManager;

    let task;
    let message;

    const endpoint = split('/', requestEvent.route.path)[2];

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
            break;
        }

        case 'tables': {
            task = TASKS.SELECT_DATABASE_AND_SHOW_TABLES;
            message = sequelizeSetup(connection);
            message.database = requestEvent.params.database;
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

            if (!foundParams(requestEvent.params, 'database')) {
                sequelizeManager.raiseError(
                    {message: DATABASE_PARAM}, callback
                );
            } else {
                message.database = requestEvent.params.database;
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

            if (!foundParams(requestEvent.params, 'tables')) {
                sequelizeManager.raiseError(
                    {message: TABLES_PARAM}, callback
                );
            } else {
                message = map(trim(), split(',', requestEvent.params.tables));
            }

            break;

        }

        case 'query': {

            /*
             * action: authenticate, send raw query
             * returns: query response
             */
             
            task = TASKS.QUERY;

            if (!foundParams(requestEvent.params, 'statement')) {
                sequelizeManager.raiseError(
                    {message: QUERY_PARAM}, callback
                );
            } else {
                message = requestEvent.params.statement;
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
