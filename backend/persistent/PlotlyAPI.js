import fetch from 'node-fetch';

export function PlotlyAPIRequest(relativeUrl, body, method = 'POST') {
    // TODO - template in on-prem

    const username = 'chris';
    const apiKey = 'lpa5m34jje';

    return fetch(`https://api-local.plot.ly/v2/${relativeUrl}`, {
        method,
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Plotly-Client-Platform': 'db-connect',
            'Authorization': 'Basic ' + new Buffer(
                username + ':' + apiKey
            ).toString('base64')
        },
        body: JSON.stringify(body)
    }).then(response => {
        return response.text();
    }).then(responseText => {
        try {
            const responseJson = JSON.parse(responseText);
            if (responseJson.errors) {
                throw new Error(JSON.stringify(responseJson));
            }
            return responseJson;
        } catch (e) {
            throw new Error(
                `Error parsing response at ${relativeUrl}\n` +
                responseText
            );
        }
    });
}


export function updateGrid(rows, fid, uids) {
    // TODO - if the grid doesn't exist, we should delete the query.
    const columns = uids.map(() => []);
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        for (let j = 0; j < row.length; j++) {
            columns[j][i] = row[j];
        }
    }
    const url = `grids/${fid}/col?uid=${uids.join(',')}`;
    const body = {
        cols: JSON.stringify(columns.map(column => ({
            data: column
        })))
    };
    return PlotlyAPIRequest(url, body, 'PUT');
}
