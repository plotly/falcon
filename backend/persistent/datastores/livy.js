import fetch from 'node-fetch';

import {dissoc} from 'ramda';

import Logger from '../../logger';
import {parseSQL} from '../../parse';

export function connect(connection) {
    Logger.log('' +
        'Attempting to authenticate with connection ' +
        `${JSON.stringify(dissoc('password', connection), null, 2)} ` +
        '(password omitted)'
    );

    return newSession(connection);
}

export function tables(connection) {
    const code = (connection.database) ?
        `val r = plotlyContext.sql("show tables in ${connection.database}").toJSON\n%json r` :
        `val r = plotlyContext.sql("show tables").toJSON\n%json r`;
    return sendRequest(connection, code)
        .then(tables => {
            let tableNames = (Array.isArray(tables)) ?
                tables.map(t => JSON.parse(t).tableName) :
                [];

            if (connection.database) tableNames = tableNames.map(tn => `${connection.database}.${tn}`);

            tableNames = tableNames.map(tn => tn.toUpperCase());

            return tableNames;
        });
}

export function query(query, connection) {
    const code = `val r = plotlyContext.sql("""${query}""").toJSON\n%json r`;
    return sendRequest(connection, code)
        .then(data => {
            return (Array.isArray(data)) ?
                parseSQL(data.map(JSON.parse)) :
                {columnnames: [], rows: []};
        });
}

export function disconnect(connection) {
    return fetch(getSessionUrl(connection), {
            method: 'DELETE',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
}

function getServerUrl(connection) {
    return `http://${connection.host}:${connection.port}/sessions`;
}

function getSessionUrl(connection) {
    return `http://${connection.host}:${connection.port}/sessions/${connection.sessionId}`;
}

function getStatementUrl(connection) {
    return `http://${connection.host}:${connection.port}/sessions/${connection.sessionId}/statements`;
}

export function newSession(connection) {
    return fetch(getServerUrl(connection), {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                'kind': 'spark'
            })
        })
        .then(response => response.json())
        .then(session => {
            connection.sessionId =  session.id;
            return connection;
        })
        .then(function() {
            // Here we run any code needed to setup the session
            let setup = (connection.useSqlContext) ?
                'val plotlyContext = sqlContext\n' :
                'val plotlyContext = new org.apache.spark.sql.hive.HiveContext(sc)\n';
            if (connection.setup) setup += connection.setup;

            return sendRequest(connection, setup).then(function() {
                return connection;
            });
        });
}

export function getActiveSessions(connection) {
    return fetch(getServerUrl(connection), {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(json => json.sessions);
}

function getState(connection) {
    return fetch(getSessionUrl(connection), {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(json => json.state);
}

function wait(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds);
    });
}

function getClient(connection, attempts) {
    const timeout = connection.timeout || 180;

    attempts = attempts || 1
    if (attempts++ > connection.timeout) new Error("livy: connect: timeout");

    return getState(connection).then(state => {
        return (state === 'idle') ?
            connection :
            wait(1000).then(function() {
                return getClient(connection, attempts);
            });
    });
}

function sendRequest(connection, code) {
    return getClient(connection)
        .then(function() {
            return fetch(getStatementUrl(connection), {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        'code': code
                    })
                })
                .then(response => response.json())
                .then(statement => getResponse(connection, statement.id));
        });
}

function getResponse(connection, statementId) {
    return fetch(`${getStatementUrl(connection)}/${statementId}`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => response.json())
        .then(statement => {
            if (statement.state !== 'available') {
                return wait(1000).then(function() {
                    return getResponse(connection, statementId);
                });
            }

            let json;
            try {
                json = statement.output.data['application/json'];
            } catch (err) {};
            return json;
        });
}
