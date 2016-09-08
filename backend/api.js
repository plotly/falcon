import {TASKS} from './messageHandler';
import {has, map, merge, split, trim} from 'ramda';
import {QUERY_PARAM, DATABASE_PARAM, TABLES_PARAM} from './errors';

const foundParams = (params, wantedParam) => {

    if (Boolean(params) && has(wantedParam, params)) {
        return true;
    }

    return false;
};

const obtainDatabaseForTask = (
    requestEvent, sequelizeManager, sessionSelected, callback
) => {
    let database = null;
    if (foundParams(requestEvent.params, 'database')) {
        // check if there is a current database in use
        database = requestEvent.params.database;
    } else if (sequelizeManager.sessions[sessionSelected]) {
        database = sequelizeManager.sessions[sessionSelected].config.database;
    } else {
        // means can't figure out whih database to use, send an error back
        sequelizeManager.raiseError(
            {message: DATABASE_PARAM}, callback
        );
    }
    return database;
};

export function v1(requestEvent, sequelizeManager, callback) {

    let task = null;
    let message = null;
    let database = null;

    const endpoint = split('/', requestEvent.route.path)[2];

    let sessionSelected = sequelizeManager.sessionSelected;
    if (foundParams(requestEvent.params, 'session')) {
        sessionSelected = requestEvent.params.session;
    }

    switch (endpoint) {

        case 'connect': {

            /*
             * action: establish connection via config file when headless or
             * ipc payload when not
             * returns: connection state
             */

            task = TASKS.CONNECT;
            break;

        }

        case 'authenticate': {

            /*
             * action: checks for existing valid connection
             * returns: connection state
             */

            task = TASKS.AUTHENTICATE;
            break;

        }

        case 'databases': {

            /*
             * action: authenticate, get databases
             * returns: databases list = ['database1', 'database2' ...]
             */

            task = TASKS.DATABASES;
            break;

        }

        case 'selectdatabase': {

            /*
             * action: authenticate, get databases
             * returns: connection state
             */

            task = TASKS.SELECT_DATABASE;
            database = obtainDatabaseForTask(
                requestEvent, sequelizeManager, sessionSelected, callback
            );
            break;
        }

        case 'tables': {

            /*
             * action: authenticate, get tables
             * returns: tables list
             */

            task = TASKS.TABLES;
            database = obtainDatabaseForTask(
                requestEvent, sequelizeManager, sessionSelected, callback
            );
            break;

        }

        case 'preview': {

            /*
             * action: authenticate, send top 5 query
             * returns: table preview of 5 rows
             */

            task = TASKS.PREVIEW;
            database = obtainDatabaseForTask(
                requestEvent, sequelizeManager, sessionSelected, callback
            );
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
            database = obtainDatabaseForTask(
                requestEvent, sequelizeManager, sessionSelected, callback
            );
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
            break;

        }

        default: {

            sequelizeManager.raiseError(
                {message: `Endpoint ${endpoint} is not implemented in API v1.`},
                callback
            );

        }
    }

return {task, sessionSelected, database, message};

}
