import {TASKS} from './tasks';
import {has, map, merge, contains, split, trim} from 'ramda';
import {
    APP_NOT_CONNECTED, QUERY_PARAM, DATABASE_PARAM,
    TABLES_PARAM, SESSION_PARAM, DIALECT_PARAM
} from './errors';


const foundParams = (params, wantedParam) => {
    return Boolean(params) && has(wantedParam, params);
};

const timestamp = () => Math.floor(Date.now() / 1000);

const getNewId = (sessionsIds) => {
    let tries = 0;
    let newId = null;
    while (
        !newId || contains(newId, sessionsIds)
    ) {
        newId = timestamp();
        tries += 1;
    }
    return `${newId}`;
};

export function v1(requestEvent, sequelizeManager, callback) {

    let task = null;
    let message = null;
    let database = null;

    const endpoint = split('/', requestEvent.route.path)[2];

    let sessionSelectedId = sequelizeManager.sessionSelectedId;
    if (foundParams(requestEvent.params, 'session')) {
        sessionSelectedId = requestEvent.params.session;
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

        case 'sessions': {

            /*
             * action: authenticate, get sessions
             * returns: sessions list as [ {id: dialect:username@host}, ... ]
             */
            task = TASKS.DELETE_SESSION;
            task = TASKS.SESSIONS;
            break;

        }

        case 'deletesession': {

            /*
             * action: authenticate, delete session, get sessions
             * returns: sessions list as [ {id: dialect:username@host}, ... ]
             */

            task = TASKS.DELETE_SESSION;
            if (!foundParams(requestEvent.params, 'session')) {
                sequelizeManager.raiseError(
                    {message: SESSION_PARAM}, callback
                );
            } else {
                message = requestEvent.params.session;
            }
            if (!contains(message, Object.keys(sequelizeManager.sessions))) {
                sequelizeManager.raiseError(
                    {message: APP_NOT_CONNECTED}, callback
                );
            }
            break;

        }

        case 'addsession': {

            /*
             * action: authenticate, delete session, get sessions
             * returns: sessions list as [ {id: dialect:username@host}, ... ]
             */

            task = TASKS.ADD_SESSION;
            let dialect;
            if (!foundParams(requestEvent.params, 'dialect')) {
                sequelizeManager.raiseError(
                    {message: DIALECT_PARAM}, callback
                );
            } else {
                dialect = requestEvent.params.dialect;
            }
            if (!foundParams(requestEvent.params, 'database')) {
                sequelizeManager.raiseError(
                    {message: DATABASE_PARAM}, callback
                );
            } else {
                database = requestEvent.params.database;
            }
            message = {
                sessionId: getNewId(Object.keys(sequelizeManager.sessions)),
                dialect,
                database
            };

            break;

        }

        case 'databases': {

            /*
             * action: authenticate, get databases
             * returns: databases list = ['database1', 'database2' ...]
             */
            if (foundParams(requestEvent.params, 'session')) {
                sessionSelectedId = requestEvent.params.session;
            }
            task = TASKS.DATABASES;
            break;

        }

        case 'selectdatabase': {

            /*
             * action: authenticate, get databases
             * returns: connection state
             */

            task = TASKS.SELECT_DATABASE;
            if (foundParams(requestEvent.params, 'session')) {
                sessionSelectedId = requestEvent.params.session;
            }
            if (!foundParams(requestEvent.params, 'database')) {
                sequelizeManager.raiseError(
                    {message: DATABASE_PARAM}, callback
                );
            } else {
                database = requestEvent.params.database;
            }
            break;
        }

        case 'tables': {

            /*
             * action: authenticate, get tables
             * returns: tables list
             */

            task = TASKS.TABLES;
            if (foundParams(requestEvent.params, 'session')) {
                sessionSelectedId = requestEvent.params.session;
            }
            if (foundParams(requestEvent.params, 'database')) {
                database = requestEvent.params.database;
            }
            break;

        }

        case 'preview': {

            /*
             * action: authenticate, send top 5 query
             * returns: table preview of 5 rows
             */

            task = TASKS.PREVIEW;
            if (foundParams(requestEvent.params, 'session')) {
                sessionSelectedId = requestEvent.params.session;
            }
            if (foundParams(requestEvent.params, 'database')) {
                database = requestEvent.params.database;
            }
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
            if (foundParams(requestEvent.params, 'session')) {
                sessionSelectedId = requestEvent.params.session;
            }
            if (foundParams(requestEvent.params, 'database')) {
                database = requestEvent.params.database;
            }
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
             if (foundParams(requestEvent.params, 'session')) {
                 sessionSelectedId = requestEvent.params.session;
             }
             if (foundParams(requestEvent.params, 'database')) {
                 database = requestEvent.params.database;
             }
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

return {task, sessionSelectedId, database, message};

}
