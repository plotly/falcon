import {createAction} from 'redux-actions';
import {CHANNEL} from './../../backend/messageHandler';
import {TASKS} from './../../backend/tasks';
const ipcRenderer = require('electron').ipcRenderer;

export const NEW_SESSION = 'NEW_SESSION';
export const SWITCH_SESSION = 'SWITCH_SESSION';
export const FORGET_SESSION = 'FORGET_SESSION';

export const newSession = createAction(NEW_SESSION);
export const switchSession = createAction(SWITCH_SESSION);
export const forgetSession = createAction(FORGET_SESSION);

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
        const sessionSelectedId = state.sessions.get('sessionSelectedId');
        const database = state.sessions[sessionSelectedId].configuration.database;
        ipcSend(TASKS.QUERY, sessionSelectedId, database, statement);
    };
}

export function connect () {
    return (_, getState) => {
        const state = getState();
        const sessionSelectedId = state.sessions.get('sessionSelectedId');
        const configuration = state.sessions.getIn(
            ['list', sessionSelectedId, 'configuration']
        ).toJS();
        ipcSend(
            TASKS.CONNECT_AND_SHOW_DATABASES,
            sessionSelectedId,
            configuration.database,
            configuration
        );
    };
}

export function deleteSession (sessionId) {
    return (_, getState) => {
        ipcSend(TASKS.DELETE_SESSION, sessionId, null, sessionId);
    };
}

export function selectDatabase () {
    return (_, getState) => {
        const state = getState();
        const sessionSelectedId = state.sessions.get('sessionSelectedId');
        const configuration = state.sessions.getIn(
            ['list', sessionSelectedId, 'configuration']
        ).toJS();
        ipcSend(
            TASKS.SELECT_DATABASE_AND_SHOW_TABLES,
            sessionSelectedId,
            configuration.database,
            configuration.database
        );
    };
}

export function previewTables (tableNames) {
    return (_, getState) => {
        const state = getState();
        const sessionSelectedId = state.sessions.get('sessionSelectedId');
        const database = state.sessions.getIn(
            ['list', sessionSelectedId, 'configuration', 'database']);
        ipcSend(TASKS.PREVIEW, sessionSelectedId, database, tableNames);
    };
}

export function disconnect () {
    return (_, getState) => {
        const state = getState();
        const sessionSelectedId = state.sessions.get('sessionSelectedId');
        const database = state.sessions.getIn(
            ['list', sessionSelectedId, 'configuration', 'database']);
        ipcSend(TASKS.DISCONNECT, sessionSelectedId, database);
    };
}

export function setupHttpsServer () {
    return (__, getState) => {
        const state = getState();
        const sessionSelectedId = state.sessions.get('sessionSelectedId');
        ipcSend(TASKS.SETUP_HTTPS_SERVER, sessionSelectedId);
    };
}

export function newOnPremSession (domain) {
    return (__, getState) => {
        const state = getState();
        const sessionSelectedId = state.sessions.get('sessionSelectedId');
        ipcSend(TASKS.NEW_ON_PREM_SESSION, sessionSelectedId, null, domain);
    };
}

function ipcSend(task, sessionSelectedId, database, message = {}) {
    ipcRenderer.send(CHANNEL, {task, sessionSelectedId, database, message});
}

// <- ipc specific
