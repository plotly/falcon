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
    return `DATABASE=${connection.database};UID=${connection.username};PWD=${connection.password};` +
        `HOSTNAME=${connection.host};PORT=${connection.port};PROTOCOL=TCPIP`;
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

const SYSTEM_SCHEMAS = ['SYSCAT', 'SYSIBM', 'SYSIBMADM', 'SYSPUBLIC', 'SYSSTAT', 'SYSTOOLS'];
const WHERE = SYSTEM_SCHEMAS.map(t => `CREATOR <> '${t}'`).join(' AND ');
const QUERY = `SELECT NAME, CREATOR FROM SYSIBM.SYSTABLES WHERE ${WHERE}`;

export function tables(connection) {
    return getClient(connection)
        .then(function(client) {
            return new Promise(function(resolve, reject) {
                client.query(QUERY, function(err, rows) {
                    if (err) reject(err);
                    else resolve(rows.map(row => `${row.CREATOR}.${row.NAME}`));
                });
            });
        });
}

export function schemas(connection) {
    return query(
        "SELECT TABNAME, COLNAME, TYPENAME FROM syscat.columns WHERE SUBSTR(TABSCHEMA,1,3) != 'SYS'",
        connection
    );
}
