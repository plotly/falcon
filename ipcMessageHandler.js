import {IPC_TASKS} from './ipcTasks';

export function serverMessageHandler(sequelizeManager, mainWindowContents) {

	return (requestEvent, respondEvent) => {
		// you could like, update payload depending on the request if you need to
		const payload = {};
		if (requestEvent.url === 'query') {
			payload.task = 'query';
		} else if (requestEvent.url === 'connect') {
			payload.task = 'databases';
		}
		payload.message = requestEvent.body;

		const callback = (message) => {
			// optionally modify message or payload here
			const responsePayload = message; // ..
			respondEvent.send(responsePayload);
			// send stuff back to front-end, too.
			mainWindowContents.send('channel', message);
		}

		handleMessage(sequelizeManager, {
			callback, payload
		});

	};
}

export function ipcMessageHandler(sequelizeManager) {
	return (evt, payload) => {

		const callback = (message) => {
			// optionally modify message or channel here
			evt.sender.send('channel', message)
		}

		handleMessage(sequelizeManager, {
			callback,
			payload
		});
	}
}

function handleMessage(sequelizeManager, opts) {
	const {callback, payload} = opts;
	const {task, message} = payload;

	switch (task) {
		case IPC_TASKS.CONNECT: {
			sequelizeManager.login(message, callback)
			.then(() => {
				sequelizeManager.updateLog(
					respondEvent, 'NOTE: you are connected'
				 	callback
				);
				return sequelizeManager.showDatabases(
					callback
				);
			})
			.catch( error => {
				sequelizeManager.raiseError(respondEvent, error);
			});
			break;
		}

		case IPC_TASKS.SELECT_DATABASE: {
			sequelizeManager.login(message)
			.then(() => {
				sequelizeManager.updateLog(
					respondEvent, 'NOTE: accessing database' +
					`${sequelizeManager.connection.config.database}`
				);
				return sequelizeManager.showTables(respondEvent);
			})
			.catch( error => {
				sequelizeManager.raiseError(respondEvent, error);
			});
			break;
		}

		case IPC_TASKS.SEND_QUERY: {
			const query = message.statement;
			sequelizeManager.updateLog(respondEvent, query);
			sequelizeManager.sendQuery(respondEvent, query)
			.catch( error => {
				sequelizeManager.raiseError(respondEvent, error);
			});
			break;
		}

		case IPC_TASKS.DISCONNECT: {
			sequelizeManager.disconnect(respondEvent);
			sequelizeManager.updateLog(
				respondEvent, 'NOTE: you are disconnected'
			);
			break;
		}

		default: {
			throw new Error('non-existant IPC_TASK');
		}
	}
}
