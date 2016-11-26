import fetch from 'isomorphic-fetch';
import uuid from 'node-uuid';
import {createAction} from 'redux-actions';
import {DIALECTS, INITIAL_CREDENTIALS} from '../constants/constants';
import {baseUrl} from '../utils/utils';
import * as httpsUtils from '../utils/https';
import {contains} from 'ramda';
import queryString from 'query-string';

export const reset = createAction('RESET');
export const mergeTabMap = createAction('MERGE_TAB_MAP');
export const setTab = createAction('SET_TAB');
export const setTable = createAction('SET_TABLE');
export const setIndex = createAction('SET_INDEX');
export const mergeConnections = createAction('MERGE_CREDENTIALS');
export const updateConnection = createAction('UPDATE_CREDENTIAL');
export const deleteConnection = createAction('DELETE_CREDENTIAL');

const DELETE_TAB_MESSAGE = 'You are about to delete a connection. ' +
'If you have scheduled persistent queries with that connection, they ' +
'will stop refreshing. Are you sure you want to continue?';

const request = {GET, DELETE, POST, PUT};

function GET(path) {
    return fetch(`${baseUrl()}/${path}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function DELETE(path) {
    return fetch(`${baseUrl()}/${path}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function POST(path, body = {}) {
    return fetch(`${baseUrl()}/${path}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

function PUT(path, body = {}) {
    return fetch(`${baseUrl()}/${path}`, {
        method: 'PUT',
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
            console.error(err);
            dispatch({
                type: store,
                payload: {
                    id,
                    status: 500
                }
            });
        });
    };
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
            dispatch(mergeTabMap({[tabId]: json.connectionId}));
            return json;
        });
    };
}

export function getTables(connectionId) {
    return apiThunk(
        `connections/${connectionId}/sql-tables`,
        'POST',
        'tables',
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

export function previewTable (connectionId, dialect, table, database) {
    const body = {
        query: PREVIEW_QUERY(dialect, table, database)
    };
    return apiThunk(
        `connections/${connectionId}/query`,
        'POST',
        'previewTableRequest',
        [connectionId, table],
        body
    );
}

export function initializeTabs() {
    return function(dispatch, getState) {
        const state = getState();
        const {connectionsRequest} = state;
        if (connectionsRequest.status !== 200) {
            console.error(
                "Can't initialize tabs - credentials haven't been retreived yet."
            );
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
    return function(dispatch, getState) {
        const newId = uuid.v4();
        dispatch(mergeConnections({
            [newId]: INITIAL_CREDENTIALS
        }));
        dispatch(setTab(newId));
    };
}

export function deleteTab(tabId) {
    return function (dispatch, getState) {
        /* eslint no-alert: 0 */
        if (confirm(DELETE_TAB_MESSAGE)) {
        /* eslint no-alert: 0 */
            if (tabId === getState().selectedTab) {
                const tabIds = Object.keys(getState().connections);
                const currentIdIndex = tabIds.indexOf(tabId);
                const connectionId = getState().connections[tabId].id;
                let nextIdIndex;
                if (currentIdIndex === 0) {
                    if (tabIds.length > 1) {
                        nextIdIndex = 1;
                    } else {
                        nextIdIndex = -1; // null out
                    }
                } else {
                    nextIdIndex = currentIdIndex - 1;
                }
                dispatch(setTab(tabIds[nextIdIndex]));
                dispatch(apiThunk(
                    `connections/${connectionId}`,
                    'DELETE',
                    'deleteConnectionsRequests',
                    connectionId
                ));
            }
            dispatch(deleteConnection(tabId));
        } else {
            return;
        }
    };
}

// https ->
export function hasCerts() {
    return apiThunk(
        'has-certs',
        'GET',
        'hasCertsRequest'
    );
}

export function createCerts() {
    return dispatch => {
        httpsUtils.createCerts()
            .then(res => {
                dispatch({
                    type: 'createCertsRequest',
                    payload: {
                        status: res.status,
                        content: res.content
                    }
                });
            });
    };
}

export function redirectUrl() {
    return dispatch => {
        httpsUtils.redirectUrl()
            .then(res => {
                dispatch({
                    type: 'redirectUrlRequest',
                    payload: {
                        status: res.status,
                        content: res.content
                    }
                });
            });
    };
}

export function startTempHttpsServer () {
    return apiThunk(
        'start-temp-https-server',
        'GET',
        'startTempHttpsServerRequest'
    );
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

function PREVIEW_QUERY (dialect, table, database = '') {
    switch (dialect) {
        case DIALECTS.MYSQL:
        case DIALECTS.SQLITE:
        case DIALECTS.MARIADB:
        case DIALECTS.POSTGRES:
            return `SELECT * FROM ${table} LIMIT 5`;
        case DIALECTS.MSSQL:
            return 'SELECT TOP 5 * FROM ' +
                `${database}.dbo.${table}`;
        case DIALECTS.ELASTICSEARCH:
            return {
                index: database || '_all',
                type: table || '_all',
                body: {
                    query: { 'match_all': {} },
                    size: 5
                }
            };
        default:
            throw new Error(`Dialect ${dialect} is not one of the DIALECTS`);
    }
}
