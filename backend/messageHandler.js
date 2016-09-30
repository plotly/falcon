import {merge, split} from 'ramda';
import {v1} from './api';
import {API_VERSION, AUTHENTICATION, TASK} from './errors';
import {setupHTTPS, newOnPremSession} from './setupServers';

	/*
	 * - An event is received via either the ipc CHANNEL or an endpoint.
	 *
	 * - Via endpoint:
	 * 	Depending on the route path's version v0 or v1, a `task` and `message`
	 *  will be assigned by api.js v0 or v1 functions respectively. They will
	 *  both return the `task` and `message` as props of variable `payload`.
	 *  A `responseSender` will be created that will be prepared to send back
	 *  the response to the app and to the origin (request) of the event.
	 *
	 * - Via ipc CHANNEL:
	 *	A `task` and `message` will be included within the ipc CHANNEL message.
	 *
	 * - A `payload` and a `responseSender` will be forwarded to `handleMessage`
	 * which will decide the combination of sequelizeManager methods to run
	 * depending on the `task`.
	 *
	 */

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

export const CHANNEL = 'CHANNEL';

export function serverMessageReceive(responseTools) {

    const {sequelizeManager, mainWindow} = responseTools;
	return (requestEvent, respondEvent) => {

		sequelizeManager.log(
			`Received a server message to ${requestEvent.route.path}`, 2
		);

		/*
		 * defines the responseSender strategy for the message received at the
		 * given endpoint
		 */

		const responseSender = (response, status = 200) => {
			respondEvent.status = status;
			respondEvent.send(response);
			// Sends over the IPC CHANNEL
			mainWindow.webContents.send(CHANNEL, response);
		};

		const apiVersion = split('/', requestEvent.route.path)[1];

		/*
		 * defines the payload of the responseSender for the message received
		 * at the given endpoint
		 */

		let payload = {};

		// payload will be {task, message} as returned from v0(...) or v1(...)

		switch (apiVersion) {

			// case 'v0':
				// no longer supported

			case 'v1':
				payload = v1(requestEvent, sequelizeManager, responseSender);
				break;

			default:
				sequelizeManager.raiseError(
					API_VERSION(apiVersion), responseSender
				);

		}
        handleMessage(responseTools, responseSender, payload);

	};
}


export function ipcMessageReceive(responseTools) {
	return (evt, payload) => {
		const responseSender = (response) => {
			evt.sender.send(CHANNEL, response);
		};
        responseTools.sequelizeManager.log(
            `Received IPC task ${payload.task}`, 1
        );
		handleMessage(responseTools, responseSender, payload);
	};
}


function handleMessage(responseTools, responseSender, payload) {

	/*
	 *	respond with responseSender(wantedResponse) in sequelizeManager
	 *	payload used to indentify which task to perform and on what message
	 */

    // unpack tools
	const {sequelizeManager} = responseTools;

    // shorthands
    const log = (mes, lvl) => sequelizeManager.log(mes, lvl);
    const raiseError = (err, res) => sequelizeManager.raiseError(err, res);

    // unpack payload
	const {
		task,
		sessionSelected = sequelizeManager.sessionSelected,
		message = null // optional for some tasks
	} = payload;

	log(`Sending task ${task} to sequelizeManager`, 1);
	log(`Sending session ${sessionSelected} to sequelizeManager`, 1);
	log(`Sending database ${database} to sequelizeManager`, 1);
    log(`Sending message ${message} to sequelizeManager`, 1);

	/*
	 * update current session before doing any tasks
	 * this will use the correct connection credentials
	 */

    sequelizeManager.setSessionSelected(sessionSelected);
    const currentSession = () => {
        return sequelizeManager.sessions[sequelizeManager.sessionSelected];
    };

    const raiseConnectionError = (error) => {
        sequelizeManager.log('raising connection error', 1);
        return sequelizeManager.raiseError(
            merge(
                {message: AUTHENTICATION(error)},
                {name: 'ConnectionError'}),
            responseSender
        );
    };

    // check if there is a current database in use
    let {database = null} = payload; // optional for some tasks
    if (!database) {
        if (currentSession()) {
            database = currentSession().config.database;
        }
    }

	switch (task) {

		/*
		 * https tasks -->
		 */

		case TASKS.SETUP_HTTPS_SERVER: {
            log('Setting up https server...', 1);
            setupHTTPS(serverMessageReceive, responseTools);
			break;
		}

		/*
		 * On-Prem tasks -->
		 */

		case TASKS.NEW_ON_PREM_SESSION: {
            log(`Adding domain ${message} to CORS`, 1);
			newOnPremSession(message, serverMessageReceive, responseTools);
			break;
		}

		/*
		 * v1 API -->
		 */

		case TASKS.CONNECT: {

			sequelizeManager.connect(message)
            .catch((error) => raiseConnectionError(error))
			.then(() => {log(
				'NOTE: you are logged in as ' +
				`[${currentSession().config.username}]`, 1
			);})
			.then(sequelizeManager.getConnection(responseSender))
			.catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.AUTHENTICATE: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.getConnection(responseSender))
			.then(() => {log(
				'NOTE: connection authenticated as ' +
				`[${currentSession().config.username}]`, 1
			);});
			break;

		}

		case TASKS.SESSIONS: {

			sequelizeManager.showSessions(responseSender)
			.then(() => {log(
				'NOTE: fetched the list of sessions', 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

        case TASKS.DELETE_SESSION: {

            sequelizeManager.deleteSession(message)
            .then(() => {log(
                `NOTE: deleted session ${message}`, 1
            );})
            .then(sequelizeManager.showSessions(responseSender))
            .catch((error) => {
				raiseError(error, responseSender);
			});
            .catch((error) => raiseError(error, responseSender));
            break;

        }

        case TASKS.ADD_SESSION: {

            sequelizeManager.authenticate(responseSender)
            .then(sequelizeManager.addSession(message))
            .then(() => {log(
                `NOTE: added session ${message}`, 1
            );})
            .then(() => sequelizeManager.showSessions(responseSender))
            .catch((error) => raiseError(error, responseSender));
            break;

        }

		case TASKS.DATABASES: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.showDatabases(responseSender))
			.then(() => {log(
				'NOTE: fetched the list of databases for user ' +
				`[${currentSession().config.username}]`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.SELECT_DATABASE: {

			sequelizeManager.selectDatabase(database)
			.catch((error) => {
				raiseError(
					merge(
						{message: AUTHENTICATION({error})},
						{name: 'ConnectionError'}),
					responseSender
				);
			})
			.then(() => {log(
				'NOTE: you are logged into database ' +
				`[${currentSession().config.database}]`, 1
			);})
			.then(sequelizeManager.getConnection(responseSender))
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.TABLES: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.selectDatabase(database))
			.then(sequelizeManager.showTables(responseSender))
			.then(() => {log(
				'NOTE: fetched the list of tables for database' +
				`[${currentSession().config.database}]`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.PREVIEW: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.selectDatabase(database))
			.then(sequelizeManager.previewTables(message, responseSender))
			.then(() => {log(
				`NOTE: you are previewing table(s) [${message}]`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.QUERY: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.selectDatabase(database))
			.then(sequelizeManager.sendRawQuery(message, responseSender))
			.then(() => {log(
				`QUERY EXECUTED: ${message}`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.DISCONNECT: {

			try {
				sequelizeManager.disconnect(responseSender);
				log(
					'NOTE: you are logged out as ' +
					`[${currentSession().config.username}]`, 1
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

			sequelizeManager.connect(message)
            .catch((error) => raiseConnectionError(error))
			.then(sequelizeManager.showDatabases(responseSender))
			.then(() => {log(
				'NOTE: you are logged in as ' +
				`[${currentSession().config.username}]`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.CHECK_CONNECTION_AND_SHOW_DATABASES: {
			/*
			 * no message required here
			 */

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.showDatabases(responseSender))
			.then(() => {log(
				'NOTE: you are logged in as ' +
				`[${currentSession().config.username}]`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		case TASKS.SELECT_DATABASE_AND_SHOW_TABLES: {
			/*
			 * @param {string} message - database to selectDatabase
			 */

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.selectDatabase(message))
			.catch((error) => {
				raiseError(
					merge(error, {name: 'ConnectionError'}),
					responseSender
				);
			})
			.then(sequelizeManager.showTables(responseSender))
			.then(() => {log(
				'NOTE: you are previewing database ' +
				`[${currentSession().config.database}]`, 1
			);})
            .catch((error) => raiseError(error, responseSender));
			break;

		}

		default: {
			raiseError({message: TASK(task)}, responseSender);
		}


	}
}
