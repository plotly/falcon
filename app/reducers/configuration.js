import {MERGE} from '../actions/configuration.js';
import {ENGINES} from '../components/Settings/Constants/SupportedEngines.react';
import Immutable from 'immutable';

const INITIAL_STATE = Immutable.Map({
    username: null,
    password: null,
    database: null,
    dialect: ENGINES.MYSQL,
    port: null,
    storage: null,
    host: null
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
