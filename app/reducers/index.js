import { combineReducers } from 'redux';
import {assoc, assocPath, contains, dissoc, merge, omit, propOr} from 'ramda';


/*
{
    // If tabs map to saved connections, then that mapping is stored here.
    // If tabs aren't yet saved, then they won't be in this map.
    // Tab IDs and Connection IDs are used to index parts of the store below.
    tabMap: {
        [tabid1]: [connectionId1]
    },

    selectedTab: tabid1,
    selectedTable: {
        [tabid1]: 'my-table'
    }

    // Local store of the connections.
    // Preloaded with the response from connectionsRequest
    connections: {
        [tabid1]: {
            username: 'chris',
            [...]
        }
    }

    // API Requests that just hold the status and the content
    connectionsRequests: {
        statusCode: 200,
        content: [
            {

            }
        ]
    },

    connectRequests: {
        [connectionId]: {
            statusCode: 200
        }
    },

    saveConnectionsRequests: {
        [tabid1]: {
            statusCode: 200
        }
    }

    tablesRequests: {
        [connectionId1]: {
            status: 200,
            content: ['table1', 'table2', ...]
        }
    },

    getElasticsearchMappingsRequests: {
        [connectionId1]: {
            status: 200,
            content: {index1: {}, index2: {}}
        }
    },

    previewTableRequests: {
        [connectionId1]: {
            status: 200,
            content: ...
        }
    },

    s3KeysRequests: {
        [connectionId]: {
            status: 200,
            content: [...]
        }
    }

    apacheDrillStorageRequests: {
        [connectionId]: {
            status: 200,
            content: [...]
        }
    }

}
*/

// Some of the API reducers we want to reset in order to restart the fetchData flow inside Settings.react.js
// An example of such case is when the credentials are updated and we want to go through
// again the process of fetching tables/files etc. For that to be done easily these API reducers
// should be rester to initial values.

const canBeReset = [
    'apacheDrillStorageRequests',
    'apacheDrillS3KeysRequests',
    'elasticsearchMappingsRequests',
    'previewTableRequest',
    's3KeysRequests',
    'tablesRequests'
];

const isResetCall = (store, type) => contains(store, canBeReset) && type === 'RESET';

function createApiReducer(store) {
    return function ApiReducer(state = {}, action) {
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
        } else if (isResetCall(store, action.type)) {
            const {payload} = action;
            if (Array.isArray(payload.id)) {
                newState = assocPath(payload.id, {}, state);
            } else if (payload.id) {
                newState = assoc(payload.id, {}, state);
            } else {
                newState = {};
            }
        }
        return newState;
    };
}

export const connectionsRequest = createApiReducer('connectionsRequest');
export const settingsRequest = createApiReducer('settingsRequest');
export const deleteConnectionsRequests = createApiReducer('deleteConnectionsRequests');
export const saveConnectionsRequests = createApiReducer('saveConnectionsRequests');

export const connectorUrlsRequest = createApiReducer('connectorUrlsRequest');

export const apacheDrillStorageRequests = createApiReducer('apacheDrillStorageRequests');
export const apacheDrillS3KeysRequests = createApiReducer('apacheDrillS3KeysRequests');
export const createCertsRequest = createApiReducer('createCertsRequest');
export const connectRequests = createApiReducer('connectRequests');
export const elasticsearchMappingsRequests = createApiReducer('elasticsearchMappingsRequests');
export const previewTableRequests = createApiReducer('previewTableRequest');
export const s3KeysRequests = createApiReducer('s3KeysRequests');
export const tablesRequests = createApiReducer('tablesRequests');



function tabMap(state = {}, action) {
    let newState = state;
    if (action.type === 'MERGE_TAB_MAP') {
        newState = merge(state, action.payload);
    }
    return newState;
}

function selectedTab(state = '', action) {
    if (action.type === 'SET_TAB') {
        return action.payload;
    } else {
        return state;
    }
}

function selectedTables(state = {}, action) {
    if (action.type === 'SET_TABLE') {
        console.warn(state, action.payload);
        return merge(state, action.payload);
    } else if (action.type === 'RESET') {
        return merge(state, assoc(action.payload.id, '', state));
    } else {
        return state;
    }
}

// object for each tab that tells us if the credentials have been modified since last save to disk
function connectionsNeedToBeSaved(state = {}, action) {
    if (action.type === 'SET_CONNECTIONS_NEED_TO_BE_SAVED') {
        return assoc(
            action.payload.tabId,
            action.payload.content,
            state
        );
    } else {
        return state;
    }
}

function selectedIndecies(state = {}, action) {
    if (action.type === 'SET_INDEX') {
        return merge(state, action.payload);
    } else if (action.type === 'RESET') {
        return merge(state, assoc(action.payload.id, '', state));
    } else {
        return state;
    }
}

function connections(state = {}, action) {
    if (action.type === 'MERGE_CONNECTIONS') {
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

function previews(state = {}, action) {
    if (action.type === 'UPDATE_PREVIEW') {
        /*
         * deep-merge the new payload with the existing state, indexed
         * by connectionId
         */
        const {connectionId} = action.payload;
        return merge(
            state,
            {
                [connectionId]: merge(
                propOr({}, connectionId, state),
                omit('connectionId', action.payload)
                )
            }
        );
    } else {
        return state;
    }
}

const rootReducer = combineReducers({
    tabMap,
    connections,
    createCertsRequest,
    selectedTab,
    selectedTables,
    selectedIndecies,
    settingsRequest,
    connectRequests,
    connectionsRequest,
    connectionsNeedToBeSaved,
    connectorUrlsRequest,
    saveConnectionsRequests,
    deleteConnectionsRequests,
    tablesRequests,
    elasticsearchMappingsRequests,
    previewTableRequests,
    s3KeysRequests,
    apacheDrillStorageRequests,
    apacheDrillS3KeysRequests,
    previews
});

export default rootReducer;
