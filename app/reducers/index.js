import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import configuration from './configuration';
import ipc from './ipc';

const rootReducer = combineReducers({
    configuration,
    ipc,
    routing
});

export default rootReducer;
