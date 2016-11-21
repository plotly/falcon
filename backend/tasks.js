import {merge, contains} from 'ramda';
import {AUTHENTICATION, TASK} from './errors';
import {DIALECTS} from '../app/constants/constants';
import {trackEvent} from './mixpanel';


export const TASKS = {
	// v0
	// ugly names but explicit
	CHECK_CONNECTION_AND_SHOW_DATABASES: 'CHECK_CONNECTION_AND_SHOW_DATABASES',
	CONNECT_AND_SHOW_DATABASES: 'CONNECT_AND_SHOW_DATABASES',
	SELECT_DATABASE_AND_SHOW_TABLES: 'SELECT_DATABASE_AND_SHOW_TABLES',
	// used in v1
	PREVIEW: 'PREVIEW',
	QUERY: 'QUERY',
	DISCONNECT: 'DISCONNECT',
	// added in v1
	CONNECT: 'CONNECT',
	AUTHENTICATE: 'AUTHENTICATE',
	SESSIONS: 'SESSIONS',
    DELETE_SESSION: 'DELETE_SESSION',
    ADD_SESSION: 'ADD_SESSION',
	DATABASES: 'DATABASES',
	SELECT_DATABASE: 'SELECT_DATABASE',
	TABLES: 'TABLES',
    // OTHER
    NEW_ON_PREM_SESSION: 'NEW_ON_PREM_SESSION',
	SETUP_HTTPS_SERVER: 'SETUP_HTTPS_SERVER',
    GET_MAPPINGS: 'GET_MAPPINGS'
};


export function executeTask(responseTools, responseSender, payload) {

	/*
	 *	respond with responseSender(wantedResponse)
	 *	payload used to indentify which task to perform and on what message
	 */

    // unpack tools
    const {sequelizeManager, elasticManager} = responseTools;

    // unpack payload
	const {
		task,
		message = null // optional for some tasks
	} = payload;

    let {
        sessionSelectedId = null,
        database = null
    } = payload;

    // unpack sessionSelectedId and decide which responseManager to use
    const sessions = sequelizeManager.getSessions();
    const oldSessionSelectedId = sequelizeManager.getSessionSelectedId();
    const sessionsList = Object.keys(sessions);
    const setSessionSelectedId = sequelizeManager.setSessionSelectedId;
    // sessions should point to the same object for sequelize and elastic
    // Managers, see sequelizeManager and elasticManager constructors

    const isNewSession = !contains(sessionSelectedId, sessionsList);

    // here we want to establish which dialect and database to use for the task
    let dialect = null;
    // new session
    if (isNewSession && sessionSelectedId && message) {
        dialect = message.dialect;
        sequelizeManager.setSessionSelectedId(sessionSelectedId);
    // session is not new and was passed
    } else if (sessionSelectedId) {
        dialect = sessions[sessionSelectedId].options.dialect;
        if (!database) {
            database = sessions[sessionSelectedId].config.database;
        }
        setSessionSelectedId(sessionSelectedId);
    // no session? use current one
    } else if (!sessionSelectedId) {
        sessionSelectedId = oldSessionSelectedId;
        if (sessions[sessionSelectedId]) {
            dialect = sessions[sessionSelectedId].options.dialect;
        }
        if (!database && sessions[sessionSelectedId]) {
            database = sessions[sessionSelectedId].config.database;
        }
    }


    let responseManager = null;
    // choose responseManager (current choices: elastic and sequelize)
    switch (dialect) {
        // can add more cases here as more languages are supported
        case DIALECTS.ELASTICSEARCH:
            responseManager = elasticManager;
            break;

        case DIALECTS.MYSQL:
        case DIALECTS.MARIADB:
        case DIALECTS.POSTGRES:
        case DIALECTS.REDSHIFT:
        case DIALECTS.MSSQL:
        case DIALECTS.SQLITE:
            responseManager = sequelizeManager;
            break;

        default: {
            responseManager = sequelizeManager;
        }
    }

    // from now on responseManager should be used

    /*
	 * update current session before doing any tasks
	 * this will use the correct connection credentials
	 */

    // shorthands
    let connError = false;
    const log = (mes, lvl) => {
        return responseManager.log(mes, lvl);
    };
    const raiseError = (err, res) => {
        if (!connError) {
            responseManager.raiseError(err, res);
        }
    };
    const raiseConnectionError = (error) => {
        connError = true;
        responseManager.log('Raising connection error.', 1);
        return responseManager.raiseError(
            merge(
                {message: AUTHENTICATION(error)},
                {name: 'ConnectionError'}),
            responseSender
        );
    };

	switch (task) {
		/*
		 * https tasks -->
		 */


		case TASKS.SETUP_HTTPS_SERVER: {
            try {
                const {setupHTTPS} = require('./setupServers');
                trackEvent(task);
                log('Setting up https server...', 1);
                setupHTTPS(responseTools);
            } catch (e) {
                log('Could not set up https server...', 1);
            }
            break;
        }

        /*
		 * On-Prem tasks -->
		 */

         case TASKS.NEW_ON_PREM_SESSION: {
            try {
                const {newOnPremSession} = require('./setupServers');
                trackEvent(task);
                log(`Adding domain ${message} to CORS`, 1);
                newOnPremSession(message, responseTools);
            } catch (e) {
                log('Could not set up new on prem server...', 1);
            }
            break;
        }

		/*
		 * v1 API -->
		 */

		case TASKS.CONNECT: {
			responseManager.connect(message, responseSender)
            .catch((error) => raiseConnectionError(error))
			.then(() => {log(
				'TASK: you are logged in.', 1
			);})
			.then(responseManager.getConnection(responseSender))
			.catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.AUTHENTICATE: {

			responseManager.authenticate(responseSender)
			.then(responseManager.getConnection(responseSender))
			.then(() => {log(
				'TASK: connection authenticated.', 1
			);});
			break;

		}

		case TASKS.GET_MAPPINGS: {

			responseManager.authenticate(responseSender)
			.then(responseManager.getMappings(responseSender))
			.then(() => {log(
				'TASK: gettings mappings.', 1
			);});
			break;

		}

		case TASKS.SESSIONS: {

			responseManager.showSessions(responseSender)
			.then(() => {log(
				'TASK: fetched the list of sessions.', 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

        case TASKS.DELETE_SESSION: {

            responseManager.deleteSession(message)
            .then(() => {log(
                `TASK: deleted session ${message}`, 1
            );})
            .then(responseManager.showSessions(responseSender))
            .catch((error) => raiseError(error, responseSender));
            break;

        }

        case TASKS.ADD_SESSION: {

            responseManager.addSession(message)
            .then(() => {log(
                `TASK: added session ${message}`, 1
            );})
            .then(() => responseManager.showSessions(responseSender))
            .catch((error) => raiseError(error, responseSender));
            break;

        }

		case TASKS.DATABASES: {

			responseManager.authenticate(responseSender)
			.then(responseManager.showDatabases(responseSender))
			.then(() => {log(
				'TASK: fetched the list of databases.', 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.SELECT_DATABASE: {

			responseManager.selectDatabase(database)
            .catch((error) => raiseConnectionError(error))
			.then(() => {log(
				'TASK: you are logged in.', 1
			);})
			.then(responseManager.getConnection(responseSender))
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.TABLES: {

			responseManager.authenticate(responseSender)
			.then(responseManager.selectDatabase(database))
			.then(responseManager.showTables(responseSender))
			.then(() => {log(
				`TASK: fetched the list of tables for database ${database}`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.PREVIEW: {

			responseManager.authenticate(responseSender)
			.then(responseManager.selectDatabase(database))
			.then(responseManager.previewTables(message, responseSender))
			.then(() => {log(
				`TASK: you are previewing table(s) [${message}]`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.QUERY: {
            trackEvent(task, {databaseType: dialect});
			responseManager.authenticate(responseSender)
			.then(responseManager.selectDatabase(database))
			.then(responseManager.sendRawQuery(message, responseSender))
			.then(() => {log(
                `TASK: query executed "${message}"`, 1
            );})
            .then(() => {trackEvent(`${task}-success`, {databaseType: dialect});})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.DISCONNECT: {

			try {
				responseManager.disconnect(responseSender);
				log(
					'TASK: you are logged out.', 1
				);
			} catch (error) {
				raiseError(error, responseSender);
			}
			break;
		}

		/*
		 *	ipc only -->
		 */

		case TASKS.CONNECT_AND_SHOW_DATABASES: {
			/*
			 * @param {object} message - configuration for connecting a session
			 */
            trackEvent('CONNECTION', {databaseType: dialect});
			responseManager.connect(message, responseSender)
            .catch((error) => raiseConnectionError(error))
			.then(responseManager.showDatabases(responseSender))
			.then(() => {log(
                'TASK: you are logged in.', 1
            );})
            .then(() => {trackEvent('CONNECTION-success', {databaseType: dialect});})
            .catch((error) => {
                raiseError(error, responseSender);
            });
			break;

		}

		case TASKS.CHECK_CONNECTION_AND_SHOW_DATABASES: {
			/*
			 * no message required here
			 */

			responseManager.authenticate(responseSender)
			.then(responseManager.showDatabases(responseSender))
			.then(() => {log(
				'TASK: you are logged in.', 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.SELECT_DATABASE_AND_SHOW_TABLES: {
			/*
			 * @param {string} message - database to selectDatabase
			 */

			responseManager.authenticate(responseSender)
			.then(responseManager.selectDatabase(message))
            .catch((error) => raiseConnectionError(error))
			.then(responseManager.showTables(responseSender))
			.then(() => {log(
				`TASK: you are previewing database ${message}.`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		default: {
			raiseError({message: TASK(task)}, responseSender);
		}


	}
}
