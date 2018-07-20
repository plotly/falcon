import fetch from 'isomorphic-fetch';
import uuid from 'uuid';
import {createAction} from 'redux-actions';
import {INITIAL_CONNECTIONS, PREVIEW_QUERY} from '../constants/constants';
import {baseUrl} from '../utils/utils';

export const reset = createAction('RESET');
export const mergeTabMap = createAction('MERGE_TAB_MAP');
export const setTab = createAction('SET_TAB');
export const setTable = createAction('SET_TABLE');
export const setIndex = createAction('SET_INDEX');
export const mergeConnections = createAction('MERGE_CONNECTIONS');
export const updateConnection = createAction('UPDATE_CREDENTIAL');
export const deleteConnection = createAction('DELETE_CREDENTIAL');
export const updatePreview = createAction('UPDATE_PREVIEW');

const DELETE_TAB_MESSAGE = 'You are about to delete a connection. ' +
'If you have scheduled persistent queries with that connection, they ' +
'will stop refreshing. Are you sure you want to continue?';

const request = {GET, DELETE, POST, PUT};

function GET(path) {
    return fetch(`${baseUrl()}/${path}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function DELETE(path) {
    return fetch(`${baseUrl()}/${path}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function POST(path, body = {}) {
    const payload = {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    };

    return fetch(`${baseUrl()}/${path}`, payload);
}

function PUT(path, body = {}) {
    return fetch(`${baseUrl()}/${path}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

function apiThunk(endpoint, method, store, id, body) {
    return dispatch => {
        dispatch({
            type: store,
            payload: {id, status: 'loading'}
        });
        return request[method](endpoint, body)
        .then(res => res.json().then(
            json => {
                dispatch({
                    type: store,
                    payload: {
                        status: res.status,
                        content: json,
                        id
                    }
                });
                return json;
            }
        ))
        .catch(err => {
            console.error(err); // eslint-disable-line no-console
            dispatch({
                type: store,
                payload: {
                    id,
                    status: 500
                }
            });
            throw new Error(err);
        });
    };
}


export function getSettings() {
    return apiThunk(
        'settings',
        'GET',
        'settingsRequest'
    );
}

export function getConnectorUrls() {
    return apiThunk(
        'settings/urls',
        'GET',
        'connectorUrlsRequest'
    );
}

export function getConnections() {
    return apiThunk(
        'connections',
        'GET',
        'connectionsRequest'
    );
}

export function editConnections(connectionObject, connectionId) {
    return apiThunk(
        `connections/${connectionId}`,
        'PUT',
        'connectRequests',
        connectionId,
        connectionObject
    );
}

export function getScheduledQueries() {
    return dispatch => {
        return dispatch(apiThunk(
            'queries',
            'GET',
            'scheduledQueriesRequest'
        )).then((json => {
            dispatch({
                type: 'SET_SCHEDULED_QUERIES',
                payload: json
            });
            return json;
        }));
    };
}

export function createScheduledQuery(connectionId, payload = {}) {
  return (dispatch) => {
    return dispatch(apiThunk(
      'queries',
      'POST',
      'createScheduledQueryRequest',
      payload.fid,
      {
        requestor: payload.requestor,
        uids: payload.uids,
        fid: payload.fid,
        filename: payload.filename,
        name: payload.name,
        refreshInterval: payload.refreshInterval,
        query: payload.query,
        cronInterval: payload.cronInterval,
        connectionId
      }
    )).then((res) => {
      dispatch({
          type: 'CREATE_SCHEDULED_QUERY',
          payload: res
      });
      return res;
    });
  };
}

export function updateScheduledQuery(connectionId, payload = {}) {
  return (dispatch) => {
    const body = {
      requestor: payload.requestor,
      uids: payload.uids,
      fid: payload.fid,
      filename: payload.filename,
      name: payload.name,
      refreshInterval: payload.refreshInterval,
      query: payload.query,
      cronInterval: payload.cronInterval,
      connectionId
    };

    return dispatch(apiThunk(
      'queries',
      'POST',
      'createScheduledQueryRequest',
      payload.fid,
      body
    )).then((res) => {
      if (!res.error) {
        dispatch({
          type: 'UPDATE_SCHEDULED_QUERY',
          payload: body
        });
      }
      return res;
    });
  };
}

export function deleteScheduledQuery(fid) {
  return (dispatch) => {
    return dispatch(apiThunk(
      `queries/${fid}`,
      'DELETE',
      'createScheduledQueryRequest'
    )).then((res) => {
      dispatch({
          type: 'DELETE_SCHEDULED_QUERY',
          payload: fid
      });
      return res;
    });
  };
}

export function connect(connectionId) {
    return apiThunk(
        `connections/${connectionId}/connect`,
        'POST',
        'connectRequests',
        connectionId
    );
}

export function saveConnections(connectionsObject, tabId) {
    return dispatch => {
        return dispatch(apiThunk(
            'connections',
            'POST',
            'saveConnectionsRequests',
            tabId,
            connectionsObject
        )).then(json => {
            if (!json.error) {
               dispatch(mergeTabMap({[tabId]: json.connectionId}));
            }
            return json;
        });
    };
}

export function getTables(connectionId) {
    return apiThunk(
        `connections/${connectionId}/sql-tables`,
        'POST',
        'tablesRequests',
        connectionId
    );
}

export function getElasticsearchMappings(connectionId) {
    return apiThunk(
        `connections/${connectionId}/elasticsearch-mappings`,
        'POST',
        'elasticsearchMappingsRequests',
        connectionId
    );
}

export function getS3Keys(connectionId) {
    return apiThunk(
        `connections/${connectionId}/s3-keys`,
        'POST',
        's3KeysRequests',
        connectionId
    );
}

export function getApacheDrillStorage(connectionId) {
    return apiThunk(
        `connections/${connectionId}/apache-drill-storage`,
        'POST',
        'apacheDrillStorageRequests',
        connectionId
    );
}

export function getApacheDrillS3Keys(connectionId) {
    return apiThunk(
        `connections/${connectionId}/apache-drill-s3-keys`,
        'POST',
        'apacheDrillS3KeysRequests',
        connectionId
    );
}

export function previewTable(connectionId, connectionObject, table, elasticsearchIndex) {
    const body = {
        query: PREVIEW_QUERY(connectionObject, table, elasticsearchIndex)
    };
    return apiThunk(
        `connections/${connectionId}/query`,
        'POST',
        'previewTableRequest',
        [connectionId, table],
        body
    );
}

export function getSqlSchema (connectionId) {
    return apiThunk(
        `connections/${connectionId}/sql-schemas`,
        'POST',
        'schemaRequests',
        connectionId
    );
}

export function runSqlQuery (connectionId, query) {
    const body = {
        query: query
    };
    return apiThunk(
        `connections/${connectionId}/query`,
        'POST',
        'queryRequests',
        connectionId,
        body
    );
}


export function initializeTabs() {
    return function(dispatch, getState) {
        const state = getState();
        const {connectionsRequest} = state;
        if (connectionsRequest.status !== 200) {
            // eslint-disable-next-line no-console
            console.error("Can't initialize tabs - credentials haven't been retreived yet.");
            return;
        }
        const savedConnections = connectionsRequest.content;
        if (savedConnections.length > 0) {
            const tabs = savedConnections.map(() => uuid.v4());
            const tabMap = {};
            const connections = {};
            savedConnections.forEach((cred, i) => {
                tabMap[tabs[i]] = cred.id;
                connections[tabs[i]] = cred;
            });
            dispatch(mergeTabMap(tabMap));
            dispatch(mergeConnections(connections));
            dispatch(setTab(tabs[0]));
            savedConnections.forEach(cred => {
                dispatch(connect(cred.id));
            });
        } else {
            dispatch(newTab());
        }
    };
}

export function newTab() {
    return function(dispatch) {
        const newId = uuid.v4();
        dispatch(mergeConnections({
            [newId]: INITIAL_CONNECTIONS
        }));
        dispatch(setTab(newId));
    };
}

export function deleteTab(tabId) {
    return function (dispatch, getState) {
        const connectionId = getState().tabMap[tabId];
        const tabIds = Object.keys(getState().connections);
        const currentIdIndex = tabIds.indexOf(getState().selectedTab);
        const connectRequest = getState().connectRequests[connectionId];
        /*
         * Logic to dermine which tab index we should switch to once
         * the current tab is deleted.
         */
        let nextIdIndex = currentIdIndex;
        if (tabId === getState().selectedTab) {
            if (currentIdIndex === 0) {
                if (tabIds.length > 1) {
                    nextIdIndex = 1;
                } else {
                    nextIdIndex = -1; // null out
                }
            } else {
                nextIdIndex = currentIdIndex - 1;
            }
        } else {
            // Stay on the same tab if deleting another one.
            nextIdIndex = currentIdIndex;
        }
        const nextIdTab = tabIds[nextIdIndex];
        /*
         * If the connection has been successfully saved to disk,
         * we want to send an API call to delete it. Delete the tab after.
         * Otherwise, we simply want to delete the unsaved or failed connection.
         */
        if (connectionId && connectRequest.status === 200) {
            /*
             * Throw a dialog box at the user because deleting a connection erases
             * it from disk permanently and persistent queries may fail onwards.
             */
             /* eslint no-alert: 0 */
            if (confirm(DELETE_TAB_MESSAGE)) {
            /* eslint no-alert: 0 */
                dispatch(apiThunk(
                    `connections/${connectionId}`,
                    'DELETE',
                    'deleteConnectionsRequests',
                    connectionId
                )).then(json => {
                    if (!json.error) {
                        dispatch(setTab(nextIdTab));
                        dispatch(deleteConnection(tabId));
                    }
                });
            } else {
                return;
            }
        } else {
            dispatch(setTab(nextIdTab));
            dispatch(deleteConnection(tabId));
        }
    };
}

export function setConnectionNeedToBeSaved(tabId, bool) {
    return dispatch => {
        dispatch({
            type: 'SET_CONNECTIONS_NEED_TO_BE_SAVED',
            payload: {
                tabId,
                content: bool
            }
        });
    };
}
