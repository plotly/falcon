import {IPC_TASKS} from './ipcTasks';

export function ipcMessageHandler(sequelizeManager) {
	return ((event, payload) => {
		const respondEvent = event.sender;
		const {task, message} = payload;
		switch (task) {
			case IPC_TASKS.CONNECT: {
				sequelizeManager.login(message)
				.then(sequelizeManager.updateLog(respondEvent, 'you are connected'))
				.then(sequelizeManager.showDatabases(respondEvent))
				.catch( error => {
					sequelizeManager.raiseError(respondEvent, error);
				});
				break;
			}
			case IPC_TASKS.SEND_QUERY: {
				const query = message.statement;
				sequelizeManager.sendQuery(respondEvent, query)
				.catch( error => {
					sequelizeManager.raiseError(respondEvent, error);
				});
				break;
			}
			case IPC_TASKS.SELECT_DATABASE: {
				sequelizeManager.login(message)
				.then(sequelizeManager.updateLog(respondEvent, 'database accessed'))
				.then(sequelizeManager.showTables(respondEvent))
				.catch( error => {
					sequelizeManager.raiseError(respondEvent, error);
				});
				break;
			}
			case IPC_TASKS.DISCONNECT: {
				sequelizeManager.disconnect(respondEvent);
				sequelizeManager.updateLog(respondEvent, 'your are disconnected');
				break;
			}
			default: {
				console.log('non existing task');
				break;
			}
		}
	});
}
