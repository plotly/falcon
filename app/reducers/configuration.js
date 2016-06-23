import {UPDATE} from '../actions/configuration.js';
import {DIALECTS} from '../constants/constants';
import Immutable from 'immutable';

const INITIAL_STATE = Immutable.Map({
    username: '',
    password: '',
    database: '',
    dialect: DIALECTS.MYSQL,
    port: '',
    storage: '',
    host: ''
});

export default function configuration(state = INITIAL_STATE, action) {
    switch (action.type) {
        case UPDATE:
            return state.merge(action.payload);
        default:
            return state;
    }
}
