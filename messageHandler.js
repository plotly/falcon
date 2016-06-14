export const TASKS = {
	CONNECT: 'connect',
	CHECK_CONNECTION: 'checkConnection',
	GET_DATABASES: 'getDatabases',
	SEND_QUERY: 'sendQuery',
	SELECT_DATABASE: 'selectDatabase',
	DISCONNECT: 'disconnect'
};

export const timestamp = () => (new Date()).toTimeString();

export const channel = 'channel';

export function serverMessageHandler(sequelizeManager, mainWindowContents) {

	return (requestEvent, respondEvent) => {

		const payload = {};
		const sequelizeSetup = () => {
			const options = sequelizeManager.connection.options;
			const config = sequelizeManager.connection.config;
			const setup = {};
			Object.keys(options).forEach( key => {
				setup[key] = options[key];
			});
			Object.keys(config).forEach( key => {
				setup[key] = config[key];
			});
			return setup;
		};

		switch (requestEvent.route.path) {
			case '/connect':
			case '/v0/connect': {
				/*
					remote server does not send credentials,
					thus when it connects: it simply authenticates the
					connection already established and asks for the list
					of databases. thus the GET_DATABASES instead of CONNECT
				*/
				payload.task = TASKS.GET_DATABASES;
				/*
					use connection params as established by the app.
					no payload required here from remote server to connect
				*/
				payload.message = sequelizeSetup();
				break;
			}

			case '/query':
			case '/v0/query': {
				payload.task = TASKS.SEND_QUERY;
				// need a query statement entry here from remote server
				payload.message = requestEvent.params.statement;
				break;
			}

			case '/tables':
			case '/v0/tables': {
				payload.task = TASKS.SELECT_DATABASE;
				payload.message = sequelizeSetup();
				/*
					use connection params as established by the app.
					need a database entry here from the server to
					connect to a new database and receive its tables
				*/
				payload.message['database'] = requestEvent.params.database;
				break;
			}

			case '/disconnect':
			case '/v0/disconnect': {
				payload.task = TASKS.DISCONNECT;
				// no payload required here from remote server
				payload.message = sequelizeSetup();
				break;
			}
		}

		const callback = (message) => {
			// optionally modify message or payload here
			respondEvent.send(message);
			// send stuff back to front-end, too
			mainWindowContents.send('channel', message);
		};

		handleMessage(sequelizeManager, {
			callback, payload
		});

	};

}

export function ipcMessageHandler(sequelizeManager) {
	return (evt, payload) => {

		const callback = (message) => {
			evt.sender.send('channel', message);
		};

		handleMessage(sequelizeManager, {
			callback,
			payload
		});
	};
}

function handleMessage(sequelizeManager, opts) {
	/*
		respond with callback(wantedResponse)
		payload used to indentify which task to perform and on what message
	*/
	const {callback, payload} = opts;
	const {task, message} = payload;

	switch (task) {
		case TASKS.CONNECT: {
			sequelizeManager.login(message)
			.then(sequelizeManager.showDatabases(callback))
			.then(sequelizeManager.log(
				`NOTE: you are logged in as [${sequelizeManager.connection.config.username}]`
			))
			.catch( error => {
				callback(error);
			});
			break;
		}

		case TASKS.SELECT_DATABASE: {
			sequelizeManager.login(message)
			.then(sequelizeManager.showTables(callback))
			.then(sequelizeManager.log(
				`NOTE: connected to database [${sequelizeManager.connection.config.database}]`
			))
			.catch( error => {
				callback(error);
			});
			break;
		}

		case TASKS.GET_DATABASES: {
			sequelizeManager.check_connection(message)
			.then(sequelizeManager.showDatabases(callback))
			.then(sequelizeManager.log(
				`NOTE: you are logged in as [${sequelizeManager.connection.config.username}]`
			))
			.catch( error => {
				callback(error);
			});
			break;
		}

		case TASKS.SEND_QUERY: {
			const query = message;
			sequelizeManager.sendQuery(query, callback)
			.then(sequelizeManager.log(
				`QUERY EXECUTED: ${query}`
			))
			.catch( error => {
				callback(error);
			});
			break;
		}

		case TASKS.DISCONNECT: {
			sequelizeManager.disconnect(callback)
			.then(sequelizeManager.log(
				'NOTE: you logged out'
			));
			break;
		}
	}
}
