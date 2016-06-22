import {UPDATE} from '../actions/connection.js';

import Immutable from 'immutable';

export const APP_STATUS_CONSTANTS = {
    INITIALIZED: 'INITIALIZED',
    ERROR: 'ERROR',
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED'
};

const INITIAL_STATE = Immutable.Map({
    status: APP_STATUS_CONSTANTS.DISCONNECTED
});

export default function connection(state = INITIAL_STATE, action) {
    switch (action.type) {
        case UPDATE:
            return state.merge(action.payload);
        default:
            return state;
    }
}
