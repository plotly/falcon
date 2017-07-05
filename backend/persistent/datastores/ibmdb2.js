const ibmdb = require('ibm_db');

import {dissoc} from 'ramda';

import Logger from '../../logger';
import {parseSQL} from '../../parse';


const clients = {};

function getClient(connection) {
    const connectionString = getConnectionString(connection);

    let client = clients[connectionString];
    if (!client) {
        client = new Promise(function(resolve, reject) {
            ibmdb.open(connectionString, function(err, conn) {
                if (err) reject(err);
                else resolve(conn);
            });
        });

        clients[connectionString] = client;
    }
    
    return client;
}

function getConnectionString(connection) {
    return `DATABASE=${connection.database};UID=${connection.username};PWD=${connection.password};HOSTNAME=${connection.host};PORT=${connection.port}`;
}

export function connect(connection) {
    Logger.log('' +
        'Attempting to authenticate with connection ' +
        `${JSON.stringify(dissoc('password', connection), null, 2)} ` +
        '(password omitted)'
    );

    return getClient(connection);
}

export function query(query, connection) {
    return getClient(connection)
        .then(function(client) {
            return new Promise(function(resolve, reject) {
                client.query(query, function(err, rows) {
                    if (err) reject(err);
                    else resolve(parseSQL(rows));
                });
            });
        });
}

const QUERY_TABLES = 'SELECT NAME FROM SYSIBM.SYSTABLES WHERE TYPE = \'T\' AND DEFINERTYPE = \'U\' AND CREATOR <> \'SYSTOOLS\'';

export function tables(connection) {
    return getClient(connection)
        .then(function(client) {
            return new Promise(function(resolve, reject) {
                client.query(QUERY_TABLES, function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows.map(row => row.NAME));
                });
            });
        });
}
