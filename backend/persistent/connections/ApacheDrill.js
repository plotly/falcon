import fetch from 'node-fetch';

export function connect(credentials) {
    const {host, port} = credentials;
    const url = `${host}:${port}/query.json`;
    return fetch(url);
}

export function query(queryStatement, credentials) {
    const {host, port} = credentials;
    const url = `${host}:${port}/query.json`;

    return new Promise((resolve, reject) => {
        fetch(url, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify({
                queryType: 'SQL',
                query: queryStatement
            })
        })
        .then(response => response.json())
        .then(json => {
            const {errorMessage, rows, columns} = json;
            if (errorMessage) {
                reject(errorMessage);
            } else {
                resolve({
                    rows: rows.map(row => columns.map(c => row[c])),
                    columnnames: columns,
                    nrows: rows.length,
                    ncols: columns.length
                });
            }
        })
        .catch(reject);
    });

}
