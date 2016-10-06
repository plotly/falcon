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
        const sessionSelected = state.sessions.get('sessionSelected');
        const database = state.sessions[sessionSelected].configuration.database;
        ipcSend(TASKS.QUERY, sessionSelected, database, statement);
    };
}

export function connect () {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        const configuration = state.sessions.getIn(
            ['list', sessionSelected, 'configuration']
        ).toJS();
        ipcSend(
            TASKS.CONNECT_AND_SHOW_DATABASES,
            sessionSelected,
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
        const sessionSelected = state.sessions.get('sessionSelected');
        const configuration = state.sessions.getIn(
            ['list', sessionSelected, 'configuration']
        ).toJS();
        ipcSend(
            TASKS.SELECT_DATABASE_AND_SHOW_TABLES,
            sessionSelected,
            configuration.database,
            configuration.database
        );
    };
}

export function previewTables (tableNames) {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        const database = state.sessions.getIn(
            ['list', sessionSelected, 'configuration']
        ).toJS().database;
        ipcSend(TASKS.PREVIEW, sessionSelected, database, tableNames);
    };
}

export function disconnect () {
    return (_, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        const database = state.sessions.getIn(
            ['list', sessionSelected, 'configuration']
        ).toJS().database;
        ipcSend(TASKS.DISCONNECT, sessionSelected, database);
    };
}

export function setupHttpsServer () {
    return (__, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        ipcSend(TASKS.SETUP_HTTPS_SERVER, sessionSelected);
    };
}

export function newOnPremSession (domain) {
    return (__, getState) => {
        const state = getState();
        const sessionSelected = state.sessions.get('sessionSelected');
        ipcSend(TASKS.NEW_ON_PREM_SESSION, sessionSelected, null, domain);
    };
}

function ipcSend(task, sessionSelected, database, message = {}) {
    ipcRenderer.send(CHANNEL, {task, sessionSelected, database, message});
}

// <- ipc specific
