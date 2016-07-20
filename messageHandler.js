import {merge, split} from 'ramda';
import {v0, v1} from './api';
import {API_VERSION, AUTHENTICATION, TASK} from './errors';


	/*
	 * - An event is received via either the ipc channel or an endpoint.
	 *
	 * - Via endpoint:
	 * 	Depending on the route path's version v0 or v1, a `task` and `message`
	 *  will be assigned by api.js v0 or v1 functions respectively. They will
	 *  both return the `task` and `message` as props of variable `payload`.
	 *  A `callback` will be created that will be prepared to send back the
	 *  response to the app and to the origin (request) of the event.
	 *
	 * - Via ipc channel:
	 *	A `task` and `message` will be included within the ipc channel message.
	 *
	 * - A `payload` and a `callback` will be forwarded to `handleMessage`
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
	PREVIEW: 'PREVIEW',
	QUERY: 'QUERY',
	DISCONNECT: 'DISCONNECT',
	// added in v1
	CONNECT: 'CONNECT',
	AUTHENTICATE: 'AUTHENTICATE',
	DATABASES: 'DATABASES',
	SELECT_DATABASE: 'SELECT_DATABASE',
	TABLES: 'TABLES'
};


export const channel = 'channel';


export function serverMessageReceive(sequelizeManager, mainWindowContents) {

	return (requestEvent, respondEvent) => {

		sequelizeManager.log(
			`Received a server message to ${requestEvent.route.path}`, 2
		);

		/*
		 * defines the callback strategy for the message received at the
		 * given endpoint
		 */

		const callback = (response) => {
			respondEvent.send(response);
			mainWindowContents.send(channel, response);
		};

		const apiVersion = split('/', requestEvent.route.path)[1];

		/*
		 * defines the payload of the callback for the message received at the
		 * given endpoint
		 */

		let payload = {};

		// payload will be {task, message} as returned from v0(...) or v1(...)

		switch (apiVersion) {

			case 'v0':
				payload = v0(requestEvent, sequelizeManager, callback);
				break;

			case 'v1':
				payload = v1(requestEvent, sequelizeManager, callback);
				break;

			default:
				sequelizeManager.raiseError(API_VERSION(apiVersion), callback);

		}

		handleMessage(sequelizeManager, {
			callback, payload
		});

	};
}


export function ipcMessageReceive(sequelizeManager) {

	return (evt, payload) => {

		sequelizeManager.log(`Received an ipc message to ${payload.task}`, 2);
		const callback = (response) => {
			evt.sender.send(channel, response);
		};
		handleMessage(sequelizeManager, {callback, payload});

	};
}


function handleMessage(sequelizeManager, opts) {

	/*
	 *	respond with callback(wantedResponse) in sequelizeManager
	 *	payload used to indentify which task to perform and on what message
	 */

	const {callback, payload} = opts;
	const {task, message} = payload;

	sequelizeManager.log(`Sending task ${task} to squelizeManager`, 2);

	switch (task) {

		case TASKS.CONNECT: {

			sequelizeManager.connect(message)
			.catch((error) => {
				sequelizeManager.raiseError(
                    merge(
                        {message: AUTHENTICATION({error})},
                        {type: 'connection'}),
                    callback
                );
			})
			.then(() => {sequelizeManager.log(
				'NOTE: you are logged in as ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);})
			.then(sequelizeManager.getConnection(callback))
			.catch( error => {
				sequelizeManager.raiseError({error}, callback);
			});
			break;

		}

		case TASKS.AUTHENTICATE: {

			sequelizeManager.authenticate(callback)
			.then(sequelizeManager.getConnection(callback))
			.then(() => {sequelizeManager.log(
				'NOTE: connection authenticated as ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);});
			break;

		}

		case TASKS.DATABASES: {

			sequelizeManager.authenticate(callback)
			.then(sequelizeManager.showDatabases(callback))
			.then(() => {sequelizeManager.log(
				'NOTE: fetched the list of databases for user ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError({error}, callback);
			});
			break;

		}

		case TASKS.TABLES: {

			sequelizeManager.authenticate(callback)
			.then(sequelizeManager.showTables(callback))
			.then(() => {sequelizeManager.log(
				'NOTE: fetched the list of tables for database' +
				`[${sequelizeManager.connection.config.database}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError({error}, callback);
			});
			break;
		}

		case TASKS.PREVIEW: {

			sequelizeManager.authenticate(callback)
			.then(sequelizeManager.previewTables(message, callback))
			.then(() => {sequelizeManager.log(
				`NOTE: you are previewing table(s) [${message}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError({error}, callback);
			});
			break;

		}

		case TASKS.QUERY: {
			sequelizeManager.authenticate(callback)
			.then(sequelizeManager.sendRawQuery(message, callback))
			.then(() => {sequelizeManager.log(
				`QUERY EXECUTED: ${message}`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError({error}, callback);
			});
			break;

		}

		case TASKS.DISCONNECT: {

			try {
				sequelizeManager.disconnect(callback);
				sequelizeManager.log(
					'NOTE: you are logged out as ' +
					`[${sequelizeManager.connection.config.username}]`, 1
				);
			} catch (error) {
				sequelizeManager.raiseError({error}, callback);
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
					callback
				);
			})
			.then(sequelizeManager.showDatabases(callback))
			.then(() => {sequelizeManager.log(
				'NOTE: you are logged in as ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError({error}, callback);
			});
			break;

		}

		case TASKS.CHECK_CONNECTION_AND_SHOW_DATABASES: {

			sequelizeManager.authenticate(callback)
			.then(sequelizeManager.showDatabases(callback))
			.then(() => {sequelizeManager.log(
				'NOTE: you are logged in as ' +
				`[${sequelizeManager.connection.config.username}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError({error}, callback);
			});
			break;

		}

		case TASKS.SELECT_DATABASE_AND_SHOW_TABLES: {
			sequelizeManager.connect(message)

			.catch((error) => {
				sequelizeManager.raiseError(
					merge(error, {type: 'connection'}),
					callback
				);
			})
			.then(sequelizeManager.showTables(callback))
			.then(() => {sequelizeManager.log(
				'NOTE: you are previewing database ' +
				`[${sequelizeManager.connection.config.database}]`, 1
			);})
			.catch( error => {
				sequelizeManager.raiseError({error}, callback);
			});
			break;

		}

		default: {
			sequelizeManager.raiseError(TASK(task), callback);
		}


	}
}
