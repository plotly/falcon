import { createAction } from 'redux-actions';
const ipcRenderer = require('electron').ipcRenderer;

export const UPDATE_STATE = 'UPDATE_STATE';

export const updateState = createAction(UPDATE_STATE);

export function query (statement) {
    return dispatch => {
        console.warn('sending query');
        ipcRenderer.send('receive', {statement});
    }
}
