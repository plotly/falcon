import { createAction } from 'redux-actions';
const ipcRenderer = require('electron').ipcRenderer;

export const UPDATE_STATE = 'UPDATE_STATE';

export const updateState = createAction(UPDATE_STATE);

export function query (statement) {
    return () => {
        ipcRenderer.send('receive', {statement});
    };
}

export function connect (statement) {
    return () => {
        ipcRenderer.send('connect', {statement});
    };
}
