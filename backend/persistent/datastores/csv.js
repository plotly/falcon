const alasql = require('alasql');
import fetch from 'node-fetch';
import papa from 'papaparse';
import {type} from 'ramda';

import {parseSQL} from '../../parse';

module.exports = {
    connect: connect,
    tables: tables,
    schemas: schemas,
    query: query,
    disconnect: disconnect,

    getAvailableSize: getAvailableSize,
    setStorageSize: setStorageSize
};

/**
 * @typedef {object} CSVStorage Global storage of CSV connector
 *
 * @property {Object.<string, object>}
 *                    data   Store of CSV files parsed into JS objects and indexed by URL
 * @property {number} size   Available size in bytes (0 to disable limit)
 * @property {number} used   Used size in bytes
 */

/**
 * CSV-connector global storage.
 *
 * Note the difference between:
 * - `const CSV = require('./csv');`
 * - `import * as CSV from './csv';`
 * Files using `require` will share STORAGE.
 * Files using `import` will have their own copy of STORAGE.
 *
 * @const {CSVStorage}
 */
const STORAGE = {
    data: {},
    size: 0,
    used: 0
};

function getData(connection) {
    return STORAGE.data[connection.database];
}

function putData(connection, data) {
    const size = connection.size || 0;
    STORAGE.used += size;
    STORAGE.data[connection.database] = data;
}

function deleteData(connection) {
    const size = connection.size || 0;
    STORAGE.used = Math.max(0, STORAGE.used - size);
    delete STORAGE.data[connection.database];
}

function setStorageSize(size) {
    STORAGE.size = size;
}

function getAvailableSize() {
    // no size limit
    if (STORAGE.size === 0) {
        return 0;
    }

    const available = STORAGE.size - STORAGE.used;

    // storage is full
    if (available <= 0) {
        return -1;
    }

    // available size
    return available;
}


/**
 * @typedef {object} CSVConnection Connection to a CSV file
 *
 * @property {string} database URL of the CSV file
 * @property {number} size     File size
 */

/**
 * connect downloads and parses an URL of a CSV file
 * @param {CSVConnection} connection Connection to a CSV file
 * @returns {Promise.<CSVConnection>} that resolves when the connection succeeds
 */
function connect(connection) {
    // check if the CSV file is already in the storage
    if (getData(connection)) {
        return Promise.resolve(connection);
    }

    const url = connection.database;

    const availableSize = getAvailableSize();
    if (availableSize === -1) {
        throw new Error('Out of memory');
    }

    let getCSVFile;
    if (url.startsWith('data:')) {
        const data = url.slice(1 + url.indexOf(','));

        // base64 encodes 6 bits per byte
        const estimatedSize = data.length * 6 / 8;
        if (availableSize !== 0 && estimatedSize > availableSize) {
            throw new Error('Out of memory');
        }

        const body = new Buffer(url.slice(1 + url.indexOf(',')), 'base64').toString();
        getCSVFile = Promise.resolve(body);

    } else {
        getCSVFile = fetch(url, {size: availableSize}).then(res => res.text());
    }

    return getCSVFile.then(body => {
        const fileSize = body.length;
        if (availableSize !== 0 && fileSize > availableSize) {
            throw new Error('Out of memory');
        }

        return new Promise(function(resolve) {
            papa.parse(body, {
                download: false,
                dynamicTyping: true,
                skipEmptyLines: true,
                header: true,
                worker: true,

                complete: function({data, errors, meta}) {
                    if (errors.length) {
                        throw new Error('Failed to parse CSV file ' + url);
                    }

                    connection.meta = meta;
                    connection.size = fileSize;

                    putData(connection, data);

                    resolve(connection);
                }
            });
        });
    });
}

/**
 * disconnect deletes the CSV file from the storage
 * @param {CSVConnection} connection Connection to a CSV file
 * @returns {Promise.<CSVConnection>} that resolves when the connection has been disconnected
 */
function disconnect(connection) {
    deleteData(connection);
    return Promise.resolve(connection);
}

/**
 * Table name used in SQL queries to refer to the data imported from a CSV file,
 * so that we can take advantage of alaSQL's parser.
 * @const {string}
 */
const TABLENAME = '?';

function tables() {
    return Promise.resolve([TABLENAME]);
}

function schemas(connection) {
    const columnnames = ['TABNAME', 'COLNAME', 'TYPENAME'];
    const rows = connection.meta.fields.map(columnName => {
        return [TABLENAME, columnName, getType(columnName)];
    });

    return Promise.resolve({columnnames, rows});

    function getType(columnName) {
        const data = getData(connection);

        for (let i = 0; i < data.length; i++) {
            const cell = data[i][columnName];
            if (cell) return type(cell);
        }

        // If we reach this point, the column is empty.
        // Let's return 'String', as none of the cells can be converted to Number.
        return 'String';
    }
}

function query(queryString, connection) {
    const data = getData(connection);

    // In the query `SELECT * FROM ?`, alaSQL replaces ? with data
    return alasql.promise(queryString, [data]).then(parseSQL);
}
