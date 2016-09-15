import {createAction} from 'redux-actions';
import {TASKS} from './../../backend/messageHandler';
const ipcRenderer = require('electron').ipcRenderer;

export const NEW_SESSION = 'NEW_SESSION';
export const SWITCH_SESSION = 'SWITCH_SESSION';
export const DELETE_SESSION = 'DELETE_SESSION';

export const newSession = createAction(NEW_SESSION);
export const switchSession = createAction(SWITCH_SESSION);
export const deleteSession = createAction(DELETE_SESSION);

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
        ipcSend(TASKS.QUERY, sessionSelected, statement);
    };
}

export function connect () {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        const configuration = state.sessions.getIn(
            ['list', sessionSelected, 'configuration']
        );
        ipcSend(
            TASKS.CONNECT_AND_SHOW_DATABASES,
            sessionSelected,
            configuration.toJS()
        );
    };
}

export function selectDatabase () {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        const configuration = state.sessions.getIn(
            ['list', sessionSelected, 'configuration']
        );
        ipcSend(
            TASKS.SELECT_DATABASE_AND_SHOW_TABLES,
            sessionSelected,
            configuration.toJS().database
        );
    };
}

export function previewTables (tableNames) {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        ipcSend(TASKS.PREVIEW, sessionSelected, tableNames);
    };
}

export function disconnect () {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        ipcSend(TASKS.DISCONNECT, sessionSelected);
    };
}

export function setupHttpsServer () {
    return (__, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        ipcSend(TASKS.UPDATE_IPC_STATE, sessionSelected);
    };
}

function ipcSend(task, sessionSelected, message = {}) {
    ipcRenderer.send('channel', {task, sessionSelected, message});
}

// <- ipc specific
