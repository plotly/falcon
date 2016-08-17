import {merge, split, contains} from 'ramda';
import {v0, v1} from './api';
import {API_VERSION, AUTHENTICATION, TASK} from './errors';
import {setupHTTPS} from './setupServers';

	/*
	 * - An event is received via either the ipc channel or an endpoint.
	 *
	 * - Via endpoint:
	 * 	Depending on the route path's version v0 or v1, a `task` and `message`
	 *  will be assigned by api.js v0 or v1 functions respectively. They will
	 *  both return the `task` and `message` as props of variable `payload`.
	 *  A `responseSender` will be created that will be prepared to send back
	 *  the response to the app and to the origin (request) of the event.
	 *
	 * - Via ipc channel:
	 *	A `task` and `message` will be included within the ipc channel message.
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
	DATABASES: 'DATABASES',
	SELECT_DATABASE: 'SELECT_DATABASE',
	TABLES: 'TABLES',
	SETUP_HTTPS_SERVER: 'SETUP_HTTPS_SERVER'
};


// can we make this CHANNEL?
export const channel = 'channel';


export function serverMessageReceive(sequelizeManager, mainWindowContents) {

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
			// Sends over the IPC channel
			mainWindowContents.send(channel, response);
		};

		const apiVersion = split('/', requestEvent.route.path)[1];

		/*
		 * defines the payload of the responseSender for the message received
		 * at the given endpoint
		 */

		let payload = {};

		// payload will be {task, message} as returned from v0(...) or v1(...)

		switch (apiVersion) {

			case 'v0':
				payload = v0(requestEvent, sequelizeManager, responseSender);
				break;

			case 'v1':
				payload = v1(requestEvent, sequelizeManager, responseSender);
				break;

			default:
				sequelizeManager.raiseError(
					API_VERSION(apiVersion), responseSender
				);

		}

		handleMessage(sequelizeManager, {
			responseSender, payload
		});

	};
}


export function ipcMessageReceive(sequelizeManager, mainWindow, OPTIONS) {

	return (evt, payload) => {

		sequelizeManager.log(`Received an ipc message to ${payload.task}`, 2);
		const responseSender = (response) => {
			evt.sender.send(channel, response);
		};
		handleMessage(sequelizeManager, {
			responseSender, payload, mainWindow, OPTIONS
		});

	};
}


function handleMessage(sequelizeManager, opts) {

	/*
	 *	respond with responseSender(wantedResponse) in sequelizeManager
	 *	payload used to indentify which task to perform and on what message
	 */

	const {responseSender, payload} = opts;
	const {task, message} = payload;

	sequelizeManager.log(`Sending task ${task} to sequelizeManager`, 2);

	switch (task) {

		/*
		 * IPC messages
		 */
		case TASK.SETUP_HTTPS_SERVER: {
			// TODO: shell scripts for HTTPS setup don't work on windows

			if (
				(process.platform === 'darwin' || process.platform === 'linux')
				&&
				!contains('--test-type=webdriver', process.argv.slice(2))
			) {

				setupHTTPS({
					sequelizeManager,
					serverMessageReceive,
					mainWindow: opts.mainWindow,
					OPTIONS: opts.OPTIONS,
					onSuccess: () => {
						responseSender({hasSelfSignedCert: true});
					}
				});

			}
			break;
		}

		/*
		 * v1 API
		 */
		case TASKS.CONNECT: {

			sequelizeManager.connect(message)
			.catch((error) => {
				sequelizeManager.raiseError(
                    merge(
                        {message: AUTHENTICATION({error})},
                        {type: 'connection'}),
                    responseSender
                );
			})
			.then(() => {sequelizeManager.log(
				'NOTE: you are logged in as ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);})
			.then(sequelizeManager.getConnection(responseSender))
			.catch( error => {
				sequelizeManager.raiseError(error, responseSender);
			});
			break;

		}

		case TASKS.AUTHENTICATE: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.getConnection(responseSender))
			.then(() => {sequelizeManager.log(
				'NOTE: connection authenticated as ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);});
			break;

		}

		case TASKS.DATABASES: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.showDatabases(responseSender))
			.then(() => {sequelizeManager.log(
				'NOTE: fetched the list of databases for user ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError(error, responseSender);
			});
			break;

		}

		case TASKS.TABLES: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.showTables(responseSender))
			.then(() => {sequelizeManager.log(
				'NOTE: fetched the list of tables for database' +
				`[${sequelizeManager.connection.config.database}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError(error, responseSender);
			});
			break;
		}

		case TASKS.PREVIEW: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.previewTables(message, responseSender))
			.then(() => {sequelizeManager.log(
				`NOTE: you are previewing table(s) [${message}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError(error, responseSender);
			});
			break;

		}

		case TASKS.QUERY: {
			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.sendRawQuery(message, responseSender))
			.then(() => {sequelizeManager.log(
				`QUERY EXECUTED: ${message}`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError(error, responseSender);
			});
			break;

		}

		case TASKS.DISCONNECT: {

			try {
				sequelizeManager.disconnect(responseSender);
				sequelizeManager.log(
					'NOTE: you are logged out as ' +
					`[${sequelizeManager.connection.config.username}]`, 1
				);
			} catch (error) {
				sequelizeManager.raiseError(error, responseSender);
			}
			break;
		}

		/*
		 *	v0 api only -->
		 */

		case TASKS.CONNECT_AND_SHOW_DATABASES: {

			sequelizeManager.connect(message)
			.catch((error) => {
				sequelizeManager.raiseError(
					merge(error, {type: 'connection'}),
					responseSender
				);
			})
			.then(sequelizeManager.showDatabases(responseSender))
			.then(() => {sequelizeManager.log(
				'NOTE: you are logged in as ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError(error, responseSender);
			});
			break;

		}

		case TASKS.CHECK_CONNECTION_AND_SHOW_DATABASES: {

			sequelizeManager.authenticate(responseSender)
			.then(sequelizeManager.showDatabases(responseSender))
			.then(() => {sequelizeManager.log(
				'NOTE: you are logged in as ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError(error, responseSender);
			});
			break;

		}

		case TASKS.SELECT_DATABASE_AND_SHOW_TABLES: {
			sequelizeManager.connect(message)

			.catch((error) => {
				sequelizeManager.raiseError(
					merge(error, {type: 'connection'}),
					responseSender
				);
			})
			.then(sequelizeManager.showTables(responseSender))
			.then(() => {sequelizeManager.log(
				'NOTE: you are previewing database ' +
				`[${sequelizeManager.connection.config.database}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError(error, responseSender);
			});
			break;

		}

		default: {
			sequelizeManager.raiseError(TASK(task), responseSender);
		}


	}
}
