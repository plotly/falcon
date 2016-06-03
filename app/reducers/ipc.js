import { UPDATE_STATE } from '../actions/ipc.js';

import Immutable from 'immutable';

const INITIAL_STATE = Immutable.Map();

export default function ipc(state = INITIAL_STATE, action) {
    switch (action.type) {
        case UPDATE_STATE:
            console.warn(`action: ${JSON.stringify(action)}`);
            return state.merge(Immutable.fromJS(action.payload));
        default:
            return state;
    }
}
