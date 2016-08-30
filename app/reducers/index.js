import { combineReducers } from 'redux';
import { routerReducer as routing } from 'react-router-redux';
import sessions from './sessions';

const rootReducer = combineReducers({
    sessions,
    routing
});

export default rootReducer;
