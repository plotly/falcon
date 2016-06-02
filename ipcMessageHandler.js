import SequelizeManager from './sequelizeManager';
import {IPC_TASKS} from './ipcTasks';
const sequelizeManager = new SequelizeManager();

export function ipcMessageHandler() {
	return ((event, payload) => {
		const {task, message} = payload;
		switch (task) {
			case IPC_TASKS.CONNECT: {
				sequelizeManager.login(message)
				.then(sequelizeManager.updateLog(event, 'you are connected'))
				.then(sequelizeManager.showDatabases(event))
				.catch( error => {
					sequelizeManager.raiseError(event, error);
				});
				break;
			}
			case IPC_TASKS.SEND_QUERY: {
				const query = message.statement;
				sequelizeManager.sendQuery(event, query)
				.catch( error => {
					sequelizeManager.raiseError(event, error);
				});
				break;
			}
			case IPC_TASKS.SELECT_DATABASE: {
				console.log('ipctask executing....');
				sequelizeManager.login(message)
				.then(sequelizeManager.updateLog(event, 'database accessed'))
				.then(sequelizeManager.showTables(event))
				.catch( error => {
					sequelizeManager.raiseError(event, error);
				});
				break;
			}
			case IPC_TASKS.DISCONNECT: {
				sequelizeManager.disconnect(event);
				sequelizeManager.updateLog(event, 'your are disconnected');
				break;
			}
			default: {
				console.log('non existing task');
				break;
			}
		}
	});
}
