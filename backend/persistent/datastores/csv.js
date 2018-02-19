const alasql = require('alasql');
import fetch from 'node-fetch';
import papa from 'papaparse';
import {type} from 'ramda';

import {parseSQL} from '../../parse';

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
export function CSVError(url, errors) {
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
 * Store of CSV files parsed into JS objects and indexed by URL
 *
 * @const {Object.<string, object>}
 */
const connectionData = {};
function getData(connection) {
    return connectionData[connection.database];
}
function putData(connection, data) {
    connectionData[connection.database] = data;
}

export function connect(connection) {
    const url = connection.database;

    return fetch(url)
    .then(res => res.text())
    .then(body => {
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

export function tables() {
    return Promise.resolve([TABLENAME]);
}

export function schemas(connection) {
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

export function query(queryString, connection) {
    const data = getData(connection);

    // In the query `SELECT * FROM ?`, alaSQL replaces ? with data
    return alasql.promise(queryString, [data]).then(parseSQL);
}
