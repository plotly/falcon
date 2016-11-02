import fetch from 'isomorphic-fetch';
import uuid from 'node-uuid';
// Shortcuts


function GET(path) {
    return fetch(`http://localhost:9000/${path}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function DELETE(path) {
    return fetch(`http://localhost:9000/${path}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function POST(path, body = {}) {
    return fetch(`http://localhost:9000/${path}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}
const request = {GET, POST, DELETE};

import {createAction} from 'redux-actions';
import {CHANNEL} from './../../backend/messageHandler';
import {TASKS} from './../../backend/tasks';
const ipcRenderer = require('electron').ipcRenderer;
import {APP_STATUS, DIALECTS, EMPTY_SESSION} from '../constants/constants';

export const NEW_SESSION = 'NEW_SESSION';
export const SWITCH_SESSION = 'SWITCH_SESSION';
export const FORGET_SESSION = 'FORGET_SESSION';
export const SWAP_SESSION_ID = 'SWAP_SESSION_ID';

export const newSession = createAction(NEW_SESSION);
export const switchSession = createAction(SWITCH_SESSION);
export const forgetSession = createAction(FORGET_SESSION);
export const swapSessionId = createAction(SWAP_SESSION_ID);

// update calls
export const UPDATE_CONNECTION = 'UPDATE_CONNECTION';
export const UPDATE_CONFIGURATION = 'UPDATE_CONFIGURATION';
export const UPDATE_IPC_STATE = 'UPDATE_IPC_STATE';

export const updateConnection = createAction(UPDATE_CONNECTION);
export const updateConfiguration = createAction(UPDATE_CONFIGURATION);
export const updateIpcState = createAction(UPDATE_IPC_STATE);

export const updateState = createAction('UPDATE_STATE');

export const setTable = createAction('SET_TABLE');
export const setTab = createAction('selectedTab');

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

export function getCredentials() {
    return apiThunk(
        'credentials',
        'GET',
        'credentialsRequest'
    );
}

export function connect(credentialId) {
    return apiThunk(
        `connect/${credentialId}`,
        'POST',
        'connectRequest',
        credentialId
    );
}

export function saveCredentials(credentialsObject, tabId) {
    return dispatch => {
        return dispatch(apiThunk(
            'credentials',
            'POST',
            'saveCredentialsRequest',
            tabId,
            credentialsObject
        )).then(json => {
            dispatch({
                type: 'tabMap',
                payload: {[tabId]: json.credentialId}
            });
            return json;
        })

    }
}

export function getTables(credentialId) {
    return apiThunk(
        `tables/${credentialId}`,
        'POST',
        'tables',
        credentialId
    );
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
        default:
            throw new Error(`Dialect ${dialect} is not one of the DIALECTS`);
    }
};
export function previewTable (credentialId, dialect, table, database) {
    const body = {
        query: PREVIEW_QUERY(dialect, table, database)
    };
    return apiThunk(
        `query/${credentialId}`,
        'POST',
        'previewTableRequest',
        [credentialId, table],
        body
    );
}

export function initializeTabs() {
    return function(dispatch, getState) {
        const state = getState();
        const {credentialsRequest} = state;
        if (credentialsRequest.status !== 200) {
            console.error(
                "Can't initialize tabs - crednetials haven't been retreived yet."
            );
            return;
        }
        const savedCredentials = credentialsRequest.content;
        if (savedCredentials.length > 0) {
            const tabs = savedCredentials.map(() => uuid.v4());
            const tabMap = {};
            const credentials = {};
            savedCredentials.forEach((cred, i) => {
                tabMap[tabs[i]] = cred.id;
                credentials[tabs[i]] = cred;
            });
            dispatch({
                type: 'tabMap',
                payload: tabMap
            });
            dispatch({
                type: 'MERGE_CREDENTIALS',
                payload: credentials
            });
            dispatch({
                type: 'selectedTab',
                payload: tabs[0]
            });
            savedCredentials.forEach(cred => {
                console.warn(`dispatching connect: ${cred.id}`);
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
        dispatch({
            type: 'MERGE_CREDENTIALS',
            payload: {
                [newId]: {
                    username: '',
                    password: '',
                    database: '',
                    dialect: DIALECTS.MYSQL,
                    port: '',
                    host: '',
                    ssl: false
                }
            }
        });
        dispatch({
            type: 'selectedTab',
            payload: newId
        });
    }
}

export function deleteTab(tabId) {
    return function (dispatch, getState) {
        // TODO - Make a delete request to delete the request from the disk.
        // TODO - Check if any persistent connections depend on this before deleting
        //        and warn the user if so.
        if (tabId === getState().selectedTab) {
            const tabIds = Object.keys(getState().credentials);
            const currentIdIndex = tabIds.indexOf(tabId);
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
            dispatch({type: 'selectedTab', payload: tabIds[nextIdIndex]})
        }
        dispatch({
            type: 'DELETE_CREDENTIAL',
            payload: tabId
        });
    }
}

//
// export function connect(credentialId) {
//     return dispatch => {
//         POST(`connect/${credentialId}`)
//         .then(res => res.json().then(json => {
//             dispatch();
//         }));
//     };
// }
//
//
// // API calls
// function fetchSessionData(dispatch, credentialId) {
//     return POST(`connect/${credentialId}`)
//     .then(res => {
//         if (res.status === 200) {
//             dispatch(updateIpcState({
//                 id: credentialId,
//                 error: null
//             }));
//         } else {
//             throw new Error(`res.status error when connecting to connect/${credentialId}`);
//         }
//     })
//     .catch(error => {
//         console.error(error);
//         dispatch(updateConnection({
//             status: APP_STATUS.ERROR,
//             id: credentialId
//         }));
//     });
// }

/*
 * Initialize the app's state by loading up the saved credentials
 * (if available) or an empty state
 */
// export function initializeSessions () {
//     return dispatch => {
//         GET('credentials')
//         .then(res => res.json())
//         .then(credentials => {
//             credentials.forEach(credential => {
//                 dispatch(newSession(credential.id));
//                 dispatch(updateConfiguration(credential));
//             });
//             dispatch(switchSession(credentials[0].id));
//             return Promise.all(credentials.map(
//                 credential => fetchSessionData(dispatch, credential.id)
//             ));
//         })
//         .catch(error => console.error(error));
//     };
// }



/*
 * Action associated when a user clicks "connect".
 * - Check if credentials exist on disk, save them if they don't
 * - If credentials were created, then swap out the assigned credentials ID
 *   with the existing temporary sessionSelectedId
 * - Load up a list of databases and tables
 */
// export function connect () {
//     return (dispatch, getState) => {
//         const state = getState();
//         const sessionSelectedId = state.sessions.get('sessionSelectedId');
//         const configuration = state.sessions.getIn(
//             ['list', sessionSelectedId, 'configuration']
//         ).toJS();
//         // Save credentials to the file if they don't exist
//         POST('credentials', configuration)
//         .then(res => res.json().then(json => {
//             if (res.status === 200) {
//                 // credentials were created
//                 dispatch(swapSessionId(json.credentialId));
//             } else if (json.credentialId !== sessionSelectedId) {
//                 /*
//                  * credentials already existed on the disk but were entered
//                  * in a new settings tab that didn't have the credentialId
//                  */
//                 dispatch(swapSessionId(json.credentialId));
//             }
//             // Now attempt to connect
//             return fetchSessionData(dispatch, json.credentialId);
//         }))
//         .catch(error => console.error(error));
//     };
// }
//
// export function deleteSession (sessionId) {
//
//     return (dispatch, getState) => {
//         const state = getState();
//         const list = state.sessions.get('list');
//         const sessionSelectedId = state.sessions.get('sessionSelectedId');
//         // Delete the credentials from the disk (if they exist).
//         DELETE(`/credentials/${sessionSelectedId}`)
//         .then(res => {
//             if (res.status === 204 || res.status === 404) {
//                 /*
//                  * If we're deleting the tab that we're on, then figure out
//                  * the next tab to switch to
//                  */
//                 if (sessionId === sessionSelectedId) {
//                     const ids = list.keySeq().map(k => k).toJS();
//                     const currentIdIndex = ids.indexOf(sessionId);
//                     let nextIdIndex;
//                     if (currentIdIndex === 0) {
//                         nextIdIndex = 1;
//                     } else {
//                         nextIdIndex = currentIdIndex - 1;
//                     }
//                     dispatch(switchSession(ids[nextIdIndex]));
//                 }
//                 // delete the old tab
//                 dispatch(forgetSession(sessionId));
//             }
//         })
//         .catch(error => console.error(error));
//     };
// }


//
// export function disconnect () {
//     return (_, getState) => {
//     };
//
//     //     const state = getState();
//     //     const sessionSelectedId = state.sessions.get('sessionSelectedId');
//     //     const database = state.sessions.getIn(
//     //         ['list', sessionSelectedId, 'configuration', 'database']);
//     //
//     //     ipcSend(TASKS.DISCONNECT, sessionSelectedId, database);
//     // };
//
// }

export function setupHttpsServer () {
    return (__, getState) => {
        const state = getState();
        const sessionSelectedId = state.sessions.get('sessionSelectedId');

        // ipcSend(TASKS.SETUP_HTTPS_SERVER, sessionSelectedId);
    };
}

export function newOnPremSession (domain) {
    return (__, getState) => {
        const state = getState();
        const sessionSelectedId = state.sessions.get('sessionSelectedId');

        // ipcSend(TASKS.NEW_ON_PREM_SESSION, sessionSelectedId, null, domain);
    };
}
//
// function ipcSend(task, sessionSelectedId, database, message = {}) {
//     ipcRenderer.send(CHANNEL, {task, sessionSelectedId, database, message});
// }
