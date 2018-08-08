import fetch from 'node-fetch';
import FormData from 'form-data';

import Logger from '../logger.js';
import {
    getCredentials,
    getSetting
} from '../settings.js';
import {extractOrderedUids} from '../utils/gridUtils.js';


// Module to access Plot.ly REST API
//
// See API documentation at https://api.plot.ly/v2/
//
// TODO: Refactor as a class with a constructor that takes username as input,
// so that we don't call getCredentials(username) for every request.

export function plotlyAPIRequest(relativeUrl, {body, username, apiKey, accessToken, method}) {
    let authorization;
    if (apiKey) {
        authorization = 'Basic ' + new Buffer(
            username + ':' + apiKey
        ).toString('base64');
    } else if (accessToken) {
        authorization = `Bearer ${accessToken}`;
    } else {
        throw new Error('Missing apiKey or accessToken');
    }
    return fetch(`${getSetting('PLOTLY_API_URL')}/v2/${relativeUrl}`, {
        method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Plotly-Client-Platform': 'db-connect',
            'Authorization': authorization
        },
        body: body ? JSON.stringify(body) : null
    });
}

export function newDatacache(payloadJSON, type, requestor) {
    const {username, apiKey, accessToken} = getCredentials(requestor);

    const body = new FormData();
    body.append('type', type);
    body.append('origin', 'Falcon');
    body.append('payload', payloadJSON);

    if (username) {
        body.append('username', username);
    }

    /*
     * Authentication is only required for on-premise private-mode for this
     * endpoint, so even if the user is not logged in, we should still be able
     * to proceed with blank `Authorization` header.
     */
    let authorization = '';
    if (apiKey) {
        authorization = 'Basic ' + new Buffer(
            requestor + ':' + apiKey
        ).toString('base64');
    } else if (accessToken) {
        authorization = `Bearer ${accessToken}`;
    }

    return fetch(`${getSetting('PLOTLY_URL')}/datacache`, {
        method: 'POST',
        body: body,
        headers: {
            'Authorization': authorization
        }
    }).then(res => {
        if (res.status !== 200) {
            return res.text().then(text => {
                throw new Error(`Failed request 'datacache'. Status: ${res.status}. Body: ${text}`);
            });
        }
        return res.json();
    }).catch(err => {
        Logger.log(err, 0);
        throw err;
    });
}

export function getCurrentUser(requestor) {
    const {username, apiKey, accessToken} = getCredentials(requestor);

    return plotlyAPIRequest('users/current', {
        method: 'GET',
        username,
        apiKey,
        accessToken
    });
}

export function newGrid(filename, columnnames, rows, requestor) {
    const {username, apiKey, accessToken} = getCredentials(requestor);

    const columns = getColumns(rows, columnnames.length);

    const cols = {};
    columnnames.forEach((name, i) => {
        cols[name] = {'data': columns[i], order: i};
    });
    const grid = {cols};

    return plotlyAPIRequest('grids', {
        method: 'POST',
        username,
        apiKey,
        accessToken,
        body: {
            data: grid,
            world_readable: true,
            parent: -1,
            filename
        }
    });
}

export function getGridMeta(fid, requestor) {
    const {username, apiKey, accessToken} = getCredentials(requestor);

    return plotlyAPIRequest(`grids/${fid}`, {
        method: 'GET',
        username,
        apiKey,
        accessToken
    });
}

export function getGrid(fid, requestor) {
    const {username, apiKey, accessToken} = getCredentials(requestor);

    return plotlyAPIRequest(`grids/${fid}/content`, {
        method: 'GET',
        username,
        apiKey,
        accessToken
    });
}

export function deleteGrid(fid, requestor) {
    const {username, apiKey, accessToken} = getCredentials(requestor);

    return plotlyAPIRequest(`grids/${fid}`, {
        method: 'DELETE',
        username,
        apiKey,
        accessToken
    });
}

export function patchGrid(fid, requestor, body) {
    const {username, apiKey, accessToken} = getCredentials(requestor);

    return plotlyAPIRequest(`grids/${fid}`, {
        method: 'PATCH',
        username,
        apiKey,
        accessToken,
        body
    });
}

export function updateGrid(rows, columnnames, fid, requestor) {
    const numColumns = columnnames.length;
    const columns = getColumns(rows, numColumns);
    const columnEntries = columns.map((column, columnIndex) => {
        return { data: column, name: columnnames[columnIndex], order: columnIndex };
    });

    const {username, apiKey, accessToken} = getCredentials(requestor);
    const baseUrl = `grids/${fid}/col`;
    const baseParams = { username, apiKey, accessToken };

    // fetch latest grid to get the source of truth
    return plotlyAPIRequest(baseUrl, { ...baseParams, method: 'GET' })
        .then(res => {
            if (res.status !== 200) {
                return res;
            }
            return res.json();
        }).then(data => {
            if (data.status) {
                // bad res was passed along, return it
                return data;
            }

            const uids = extractOrderedUids(data);

            if (numColumns > uids.length) {
                // repopulate existing columns
                const putUrl = `${baseUrl}?uid=${uids.join(',')}`;
                const putBody = { cols: columnEntries.slice(0, uids.length) };

                // append new columns
                const postUrl = baseUrl;
                const postBody = { cols: columnEntries.slice(uids.length) };

                return plotlyAPIRequest(postUrl, {
                    ...baseParams,
                    body: postBody,
                    method: 'POST'
                }).then((res) => {
                    if (res.status !== 200) {
                        return res;
                    }

                    return plotlyAPIRequest(putUrl, {
                        ...baseParams,
                        body: putBody,
                        method: 'PUT'
                    });
                });
            } else if (numColumns < uids.length) {
                // delete unused existing columns
                const deleteUrl = `${baseUrl}?uid=${uids.slice(numColumns)}`;

                // repopulate used existing columns
                const putUrl = `${baseUrl}?uid=${uids.slice(0, numColumns).join(',')}`;
                const putBody = { cols: columnEntries };



                return plotlyAPIRequest(deleteUrl, {
                    ...baseParams,
                    method: 'DELETE'
                }).then((res) => {
                    if (res.status !== 204) {
                        return res;
                    }

                    return plotlyAPIRequest(putUrl, {
                        ...baseParams,
                        body: putBody,
                        method: 'PUT'
                    });
                });
            }

            // repopulate existing columns
            const putUrl = `${baseUrl}?uid=${uids.join(',')}`;
            const putBody = { cols: columnEntries };

            return plotlyAPIRequest(putUrl, {
                ...baseParams,
                body: putBody,
                method: 'PUT'
            });
    });
}

function getColumns(rows, maxColumns) {
    const columns = [];

    // don't return more than maxColumns
    const columnsLength = Math.min(maxColumns, (rows[0] || []).length);

    for (let i = 0; i < columnsLength; i++) {
        columns.push([]);
    }

    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        for (let columnIndex = 0; columnIndex < columnsLength; columnIndex++) {
            columns[columnIndex][rowIndex] = rows[rowIndex][columnIndex];
        }
    }

    return columns;
}

// Resolve if the requestor has permission to update fid, reject otherwise
export function checkWritePermissions(fid, requestor) {
    const {username, apiKey, accessToken} = getCredentials(requestor);

    // Check if the user even exists
    if (!username || !(apiKey || accessToken)) {
        /*
         * Warning: The front end looks for "Unauthenticated" in this error message. Don't change it!
         */
        const errorMessage = (
            `Unauthenticated: Attempting to update grid ${fid} but the ` +
            `authentication credentials for the user "${requestor}" do not exist.`
        );
        Logger.log(errorMessage, 0);
        throw new Error(errorMessage);
    }

    return plotlyAPIRequest(`grids/${fid}`, {
        username: requestor,
        apiKey,
        accessToken,
        method: 'GET'
    }).then(function(res) {
        if (res.status === 404) {
            throw new Error('Not found');
        } else if (res.status === 401) {
            throw new Error('Unauthenticated');
        } else if (res.status !== 200) {
            return res.text().then(body => {
                throw new Error(`Failed request 'grids/${fid}'. Status: ${res.status}. Body: ${body}`);
            });
        } else {
            return res.json();
        }
    }).then(function(filemeta) {
        const owner = fid.split(':')[0];

        if (owner === requestor) {
            return Promise.resolve();
        } else if (filemeta.collaborators &&
            filemeta.collaborators.results &&
            filemeta.collaborators.results.find(collab => requestor === collab.username)
        ) {
            return Promise.resolve();
        }

        throw new Error('Permission denied');
    });
}
