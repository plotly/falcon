import {createAction} from 'redux-actions';
import Immutable from 'immutable';
import {TASKS} from './../../backend/messageHandler';
const ipcRenderer = require('electron').ipcRenderer;

export const NEW_SESSION = 'NEW_SESSION';
export const SWITCH_SESSION = 'SWITCH_SESSION';

export const newSession = createAction(NEW_SESSION);

export const switchSession = createAction(SWITCH_SESSION);

// update calls
export const UPDATE_CONNECTION = 'UPDATE_CONNECTION';
export const UPDATE_CONFIGURATION = 'UPDATE_CONFIGURATION';
export const UPDATE_IPC_STATE = 'UPDATE_IPC_STATE';

export const updateConnection = createAction(UPDATE_CONNECTION);
export const updateConfiguration = createAction(UPDATE_CONFIGURATION);
export const updateIpcState = createAction(UPDATE_IPC_STATE);

// ipc specific ->
export function query (statement) {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        ipcSend(TASKS.QUERY, statement);
    };
}

export function connect (credentials) {
    console.warn('connect action dispatched');
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        ipcSend(
            TASKS.CONNECT_AND_SHOW_DATABASES, immutableToJS(credentials)
        );
    };
}

export function selectDatabase () {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        const configuration = state.sessions.getIn(['list', `${sessionSelected}`, 'configuration']);
        ipcSend(
            TASKS.SELECT_DATABASE_AND_SHOW_TABLES, configuration.toJS()
        );
    };
}

export function previewTables (tableNames) {
    return () => {
        ipcSend(TASKS.PREVIEW, tableNames);
    };
}

export function disconnect () {
    return () => {
        ipcSend(TASKS.DISCONNECT);
    };
}

export function setupHttpsServer () {
    return () => {
        ipcSend(TASKS.UPDATE_IPC_STATE);
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
// <- ipc specific
