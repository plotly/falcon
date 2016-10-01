import {split} from 'ramda';
import {v1} from './api';
import {API_VERSION} from './errors';
import {executeTask} from './tasks';

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
	 * - A `payload` and a `responseSender` will be forwarded to `executeTask`
	 * which will decide the combination of sequelizeManager methods to run
	 * depending on the `task`.
	 *
	 */

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
        
        executeTask(responseTools, responseSender, payload);

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
		executeTask(responseTools, responseSender, payload);
	};
}
