import {merge, contains} from 'ramda';
import {AUTHENTICATION, TASK} from './errors';
import {setupHTTPS, newOnPremSession} from './setupServers';

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
	SETUP_HTTPS_SERVER: 'SETUP_HTTPS_SERVER'
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
		sessionSelected = null,
		message = null // optional for some tasks
	} = payload;

    // unpack sessionSelected and decide which responseManager to use
    console.log(sessionSelected);
    const sequelizeSessions = Object.keys(sequelizeManager.sessions);
    const elasticSessions = Object.keys(elasticManager.sessions);
    const isElasticSession = contains(sessionSelected, elasticSessions);
    const isSequelizeSession = contains(sessionSelected, sequelizeSessions);
    console.log(sequelizeSessions);
    console.log(elasticSessions);
    console.log(isElasticSession);
    console.log(isSequelizeSession);

    let responseManager;
    if (isElasticSession && !isSequelizeSession) {
        console.log('using elasticManager');
        responseManager = elasticManager;
    } else if (!isElasticSession && isSequelizeSession) {
        console.log('using sequelize');
        responseManager = sequelizeManager;
    } else if (!isElasticSession && !isSequelizeSession) {
        console.log('session does not exist');
        // see if new elasticSearch session
        if (message) {
            if (message.dialect) {
                console.log(message.dialect);
                responseManager = message.dialect === 'elasticsearch' ? elasticManager : sequelizeManager;
            }
        }
    }

    // from now on responseManager should be used

    /*
	 * update current session before doing any tasks
	 * this will use the correct connection credentials
	 */


    responseManager.setSessionSelected(sessionSelected);
    const currentSession = () => {
        return responseManager.sessions[responseManager.sessionSelected];
    };

    // check if there is a current database in use
    let {database = null} = payload; // optional for some tasks
    console.log(database);
    if (!database) {
        if (currentSession()) {
            database = currentSession().config.database;
        }
    }

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

	log(`Sending task ${task} to responseManager`, 1);
	log(`Sending session ${sessionSelected} to responseManager`, 1);
	log(`Sending database ${database} to responseManager`, 1);
    log(`Sending message ${message} to responseManager`, 1);

	switch (task) {

		/*
		 * https tasks -->
		 */

		case TASKS.SETUP_HTTPS_SERVER: {
            log('Setting up https server...', 1);
            setupHTTPS(responseTools);
			break;
		}

		/*
		 * On-Prem tasks -->
		 */

		case TASKS.NEW_ON_PREM_SESSION: {
            log(`Adding domain ${message} to CORS`, 1);
			newOnPremSession(message, responseTools);
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

            responseManager.authenticate(responseSender)
            .then(responseManager.addSession(message))
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

			responseManager.authenticate(responseSender)
			.then(responseManager.selectDatabase(database))
			.then(responseManager.sendRawQuery(message, responseSender))
			.then(() => {log(
				`TASK: query executed "${message}"`, 1
			);})
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

			responseManager.connect(message, responseSender)
            .catch((error) => raiseConnectionError(error))
			.then(responseManager.showDatabases(responseSender))
			.then(() => {log(
				'TASK: you are logged in.', 1
			);})
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
