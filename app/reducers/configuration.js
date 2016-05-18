import { SET_VALUE } from '../actions/configuration.js';

import Immutable from 'immutable';

const INITIAL_STATE = Immutable.Map({
    username: null,
    password: null,
    database: null,
    engine: null,
    port: null
});

export default function configuration(state = INITIAL_STATE, action) {
    switch (action.type) {
        case SET_VALUE:
            console.warn(`action: ${JSON.stringify(action)}`);
            return state.set(action.payload.key, action.payload.value);
        default:
            return state;
    }
}
