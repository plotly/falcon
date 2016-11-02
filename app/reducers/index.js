import { combineReducers } from 'redux';
import sessions from './sessions';
import {assoc, assocPath, merge, dissoc} from 'ramda';


/*
{
    tabMap: {
        [tabid1]: [credentialId1]
    },

    selectedTab: tabid1,
    selectedTable: {
        [tabid1]: 'my-table'
    }

    credentials: {
        [tabid1]: {
            dirty: false,
            username: 'chris',
            [...]
        }
    }

    // API Requests that just hold the status and the content
    credentialsRequests: {
        statusCode: 200,
        content: [
            {

            }
        ]
    },

    connectRequests: {
        [credentialId]: {
            statusCode: 200
        }
    },

    saveCredentialsRequests: {
        [tabid1]: {
            statusCode: 200
        }
    }

    previewTableRequests: {
        [credentialId]: {
            status: 200,
            content: ...
        }
    }
}
*/


function createApiReducer(store) {
    return function(state = {}, action) {
        let newState = state;
        if (action.type === store) {
            const {payload} = action;
            if (Array.isArray(payload.id)) {
                newState = assocPath(payload.id, {
                    status: payload.status,
                    content: payload.content
                }, state);
            } else if (payload.id) {
                newState = assoc(payload.id, {
                    status: payload.status,
                    content: payload.content
                }, state);
            } else {
                newState = merge(
                    state,
                    {status: payload.status, content: payload.content}
                );
            }
        }
        return newState;
    };
}
export const connectRequests = createApiReducer('connectRequest');
export const credentialsRequest = createApiReducer('credentialsRequest');
export const saveCredentialsRequests = createApiReducer('saveCredentialsRequest');
export const previewTableRequests = createApiReducer('previewTableRequest');
export const tablesRequests = createApiReducer('tables');

function tabMap(state = {}, action) {
    let newState = state;
    if (action.type === 'tabMap') {
        newState = merge(state, action.payload);
    }
    return newState;
}


function selectedTab(state = '', action) {
    if (action.type === 'selectedTab') { // TODO - clean up all these types
        return action.payload;
    } else {
        return state;
    }
}
function selectedTables(state = {}, action) {
    if (action.type === 'SET_TABLE') {
        return merge(state, action.payload);
    } else {
        return state;
    }
}


function credentials(state = {}, action) {
    if (action.type === 'MERGE_CREDENTIALS') {
        return merge(state, action.payload);
    } else if (action.type === 'UPDATE_CREDENTIAL') {
        return assoc(
            action.payload.tableId,
            merge(
                state[action.payload.tableId],
                action.payload.update
            ),
            state
        );
    } else if (action.type === 'DELETE_CREDENTIAL') {
        return dissoc(action.payload, state);
    } else {
        return state;
    }
}


const rootReducer = combineReducers({
    tabMap,
    credentials,
    selectedTab,
    selectedTables,
    connectRequests,
    credentialsRequest,
    saveCredentialsRequests,
    tablesRequests,
    previewTableRequests
});

export default rootReducer;
