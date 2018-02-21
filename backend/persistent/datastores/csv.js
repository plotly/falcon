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

    setSize: setSize,
    CSVError: CSVError
};

/**
 * @typedef {object} PapaError Papaparse error
 *
 * @property {string} type    Error type
 * @property {string} code    Error code
 * @property {string} message Error description
 * @property {number} row     Row index that triggered the error
 */

/**
 *  Error thrown by CSV connector
 *  @class
 *  @param {string}      url    URL of the CSV file that triggered the error
 *  @param {PapaError[]} errors List of errors returned by Papaparse
 */
function CSVError(url, errors) {
      /**
       * Error class
       * @type {string}
       */
      this.name = 'CSVError';

      /**
       * Error description
       * @type {string}
       */
      this.message = 'Failed to parse CSV file ' + url;

      if (Error.captureStackTrace) {
          Error.captureStackTrace(this, CSVError);
      } else {
          /**
           * Error stack trace
           */
          this.stack = new Error(this.message).stack;
      }

      /**
       * URL to CSV file
       * @type {string}
       */
      this.url = url;

      /**
       * List of errors returned by Papaparse
       * @type {PapaError[]}
       */
      this.errors = errors;

      if (errors && errors[0] && errors[0].message) {
          this.message = errors[0].message;
      }
}
CSVError.prototype = Object.create(Error.prototype);
CSVError.prototype.constructor = CSVError;


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
    STORAGE.data[connection.database] = data;
}

function setSize(size) {
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

function increaseUsedSize(bytes) {
    STORAGE.used += bytes;
}


/**
 * @typedef {object} CSVConnection Connection to a CSV file
 *
 * @property {string} database URL to the CSV file
 */

/**
 * connect connects to a URL and downloads a CSV file
 * @param {CSVConnection} connection Connection to a CSV file
 * @returns {Promise.<CSVConnection>} that resolves when the connection succeeds
 */
function connect(connection) {
    const url = connection.database;

    const size = getAvailableSize();
    if (size === -1) {
        const error = new CSVError(url, []);
        error.message = 'Out of memory';
        throw error;
    }

    return fetch(url, {size: size})
    .then(res => res.text())
    .then(body => {
        increaseUsedSize(body.length);

        return new Promise(function(resolve) {
            papa.parse(body, {
                download: false,
                dynamicTyping: true,
                skipEmptyLines: true,
                header: true,
                worker: true,

                complete: function({data, errors, meta}) {
                    if (errors.length) {
                        throw new CSVError(url, errors);
                    }

                    connection.meta = meta;

                    putData(connection, data);

                    resolve(connection);
                }
            });
        });
    });
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
