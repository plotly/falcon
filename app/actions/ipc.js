import { createAction } from 'redux-actions';
import Immutable from 'immutable';

const ipcRenderer = require('electron').ipcRenderer;

export const UPDATE_STATE = 'UPDATE_STATE';

export const updateState = createAction(UPDATE_STATE);

export function query (statement) {
    return () => {
        ipcRenderer.send('receive', {statement});
    };
}

export function connect (credentials) {
    return () => {
        ipcRenderer.send('connect', immutableToJS(credentials));
    };
}

export function useDatabase (credentials) {
    return () => {
        ipcRenderer.send('useDatabase', immutableToJS(credentials));
    };
}

export function disconnect () {
    return () => {
        ipcRenderer.send('disconnect');
    };
}

function immutableToJS(thing) {
    if (Immutable.Iterable.isIterable(thing)) {
        return thing.toJS();
    } else {
        return thing;
    }
}
