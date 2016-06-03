import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import configuration from './configuration';
import ipc from './ipc';
import connection from './connection';

const rootReducer = combineReducers({
    configuration,
    ipc,
    connection,
    routing
});

export default rootReducer;
