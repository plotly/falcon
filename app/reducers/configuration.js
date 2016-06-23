import {UPDATE} from '../actions/configuration.js';
import {DIALECTS} from '../components/Settings/Constants/SupportedDialects.react';
import Immutable from 'immutable';

const INITIAL_STATE = Immutable.Map({
    username: null,
    password: null,
    database: null,
    dialect: DIALECTS.MYSQL,
    port: null,
    storage: null,
    host: null
});

export default function configuration(state = INITIAL_STATE, action) {
    switch (action.type) {
        case UPDATE:
            return state.merge(action.payload);
        default:
            return state;
    }
}
