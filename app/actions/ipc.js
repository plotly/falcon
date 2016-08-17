import {createAction} from 'redux-actions';
import Immutable from 'immutable';
import {TASKS} from './../../backend/messageHandler';

const ipcRenderer = require('electron').ipcRenderer;

export const UPDATE_IPC = 'UPDATE_IPC';

// TODO: Rename this to updateIpcState and rename `UPDATE_IPC` to UPDATE_IPC_STATE
export const updateState = createAction(UPDATE_IPC);

export function query (statement) {
    return () => {
        ipcSend(TASKS.QUERY, {statement});
    };
}

export function connect (credentials) {
    return () => {
        ipcSend(
            TASKS.CONNECT_AND_SHOW_DATABASES, immutableToJS(credentials)
        );
    };
}

export function selectDatabase () {
    return function (dispatch, getState) {
        const state = getState();
        ipcSend(
            TASKS.SELECT_DATABASE_AND_SHOW_TABLES, state.configuration.toJS()
        );
    };
}

export function previewTables (tableNames) {
    return () => {
        ipcSend(
            TASKS.PREVIEW, tableNames
        );
    };
}

export function disconnect () {
    return () => {
        ipcSend(TASKS.DISCONNECT);
    };
}

export function setupHttpsServer () {
    return () => {
        // TODO - make this a constant
        ipcSend('SETUP_HTTPS_SERVER');
    };
}

function immutableToJS(immutableThing) {
    let jsonThing = {};
    if (Immutable.Iterable.isIterable(immutableThing)) {
        jsonThing = immutableThing.toJS();
    }
    return jsonThing;
}

function ipcSend(task, message = {}) {
    ipcRenderer.send('channel', {task, message});
}
