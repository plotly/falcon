import {UPDATE} from '../actions/connection.js';
import {APP_STATUS_CONSTANTS} from '../constants/constants';
import Immutable from 'immutable';

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
