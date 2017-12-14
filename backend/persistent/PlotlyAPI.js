import fetch from 'node-fetch';
import {getSetting} from '../settings.js';
import Logger from '../logger';
import FormData from 'form-data';

export function PlotlyAPIRequest(relativeUrl, {body, username, apiKey, accessToken, method}) {
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
    const form = new FormData();
    form.append('type', type);
    form.append('payload', payloadJSON);
    const body = form;

    const users = getSetting('USERS');
    const user = users.find(
        u => u.username === requestor
    );

    /*
     * Authentication is only required for on-premise private-mode for this
     * endpoint, so even if the user is not logged in, we should still be able
     * to proceed with blank `Authorization` header.
     */
    let authorization = '';
    if (user) {
        const apiKey = user.apiKey;
        const accessToken = user.accessToken;

        if (apiKey) {
            authorization = 'Basic ' + new Buffer(
                requestor + ':' + apiKey
            ).toString('base64');
        } else if (accessToken) {
            authorization = `Bearer ${accessToken}`;
        }
    }

    return fetch(`${getSetting('PLOTLY_URL')}/datacache`, {
        method: 'POST',
        body: body,
        headers: {
            'Authorization': authorization
        }
    }).then(res => {
        return res;
    }).catch(err => {
        Logger.log(err, 0);
        throw new Error(err);
    });
}

export function updateGrid(rows, fid, uids, requestor) {
    const username = requestor;
    const users = getSetting('USERS');
    const user = users.find(
        u => u.username === username
    );
    const apiKey = user.apiKey;
    const accessToken = user.accessToken;

    // TODO - Test case where no rows are returned.
    if (uids.length !== rows[0].length) {
        Logger.log(`
            A different number of columns was returned in the
            query than what was initially saved in the grid.
            ${rows[0].length} columns were queried,
            ${uids.length} columns were originally saved.
            The connector does not create columns (yet),
            and so we will only update the first ${uids.length}
            columns.
        `);
    }

    const columns = uids.map(() => []);
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        /*
         * For now, only update up to the number of columns that are
         * already saved. In the future, we should just create more
         * columns. See error message above.
         */
        for (let j = 0; j < Math.min(uids.length, row.length); j++) {
            columns[j][i] = row[j];
        }
    }
    const url = `grids/${fid}/col?uid=${uids.join(',')}`;
    const body = {
        cols: JSON.stringify(columns.map(column => ({
            data: column
        })))
    };
    return PlotlyAPIRequest(url, {body, username, apiKey, accessToken, method: 'PUT'});
}

// Resolve if the requestor has permission to update fid, reject otherwise
export function checkWritePermissions(fid, requestor) {
    const owner = fid.split(':')[0];
    const user = getSetting('USERS').find(
         u => u.username === requestor
    );

    // Check if the user even exists
    if (!user || !(user.apiKey || user.accessToken)) {
        /*
         * Heads up - the front end looks for "Unauthenticated" in this
         * error message. So don't change it!
         */
        const errorMessage = (
            `Unauthenticated: Attempting to update grid ${fid} but the ` +
            `authentication credentials for the user "${requestor}" do not exist.`
        );
        Logger.log(errorMessage, 0);
        throw new Error(errorMessage);
    }
    const {apiKey, accessToken} = user;
    return PlotlyAPIRequest(`grids/${fid}`, {
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
            return res.json().then(json => {
                throw new Error(`${res.status}: ${JSON.stringify(json, null, 2)}`);
            });
        } else {
            return res.json();
        }
    }).then(function(filemeta) {
        if (filemeta.collaborators &&
            filemeta.collaborators.results &&
            Boolean(filemeta.collaborators.results.find(collab => requestor === collab.username))
        ) {
            return new Promise(function(resolve) {resolve();});
        } else if (owner === requestor) {
            return new Promise(function(resolve) {resolve();});
        }
        throw new Error('Permission denied');
    });
}
