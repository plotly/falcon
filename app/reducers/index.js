import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import counter from './counter';
import configuration from './configuration';
import ipc from './ipc';

const rootReducer = combineReducers({
    counter,
    configuration,
    ipc,
    routing
});

export default rootReducer;
