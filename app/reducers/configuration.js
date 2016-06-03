import { MERGE } from '../actions/configuration.js';

import Immutable from 'immutable';

const INITIAL_STATE = Immutable.Map({
    username: null,
    password: null,
    database: null,
    engine: 'mysql', // TODO: don't hardcode this
    portNumber: null,
    databasePath: null
});

export default function configuration(state = INITIAL_STATE, action) {
    switch (action.type) {
        case MERGE:
            console.warn(`action: ${JSON.stringify(action)}`);
            return state.merge(action.payload);
        default:
            return state;
    }
}
