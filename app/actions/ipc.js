import {createAction} from 'redux-actions';
import Immutable from 'immutable';
import {IPC_TASKS} from './../../messageHandler';

const ipcRenderer = require('electron').ipcRenderer;

export const UPDATE_STATE = 'UPDATE_STATE';

export const updateState = createAction(UPDATE_STATE);

export function query (statement) {
    return () => {
        ipcSend(IPC_TASKS.SEND_QUERY, {statement});
    };
}

export function connect (credentials) {
    return () => {
        ipcSend(IPC_TASKS.CONNECT, immutableToJS(credentials));
    };
}

export function selectDatabase () {
    return function (dispatch, getState) {
        const state = getState();
        ipcSend(IPC_TASKS.SELECT_DATABASE, state.configuration.toJS());
    };
}

export function disconnect () {
    return () => {
        ipcSend(IPC_TASKS.DISCONNECT);
    };
}

function immutableToJS(immutableThing) {
    if (Immutable.Iterable.isIterable(immutableThing)) {
        return immutableThing.toJS();
    } else {
        return immutableThing;
    }
}

function ipcSend(task, message = {}) {
    ipcRenderer.send('channel', {task, message});
}
