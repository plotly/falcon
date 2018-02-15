const alasql = require('alasql');
import fetch from 'node-fetch';
import papa from 'papaparse';
import {type} from 'ramda';

import {parseSQL} from '../../parse';

// define type error thrown by this connector
export function CSVError(url, errors) {
      this.name = 'CSVError';
      this.message = 'Failed to parse CSV file ' + url;

      if (Error.captureStackTrace) {
          Error.captureStackTrace(this, CSVError);
      } else {
          this.stack = new Error(this.message).stack;
      }

      this.url = url;
      this.errors = errors;

      if (errors && errors[0] && errors[0].message) {
          this.message = errors[0].message;
      }
}
CSVError.prototype = Object.create(Error.prototype);
CSVError.prototype.constructor = CSVError;

// the data parsed from CSV files is stored here
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

export function tables() {
    // To take advantage of alaSQL's parser, the table is named '?'
    return Promise.resolve(['?']);
}

export function schemas(connection) {
    const columnnames = ['TABNAME', 'COLNAME', 'TYPENAME'];
    const rows = connection.meta.fields.map(columnName => {
        return ['?', columnName, getType(columnName)];
    });

    return Promise.resolve({columnnames, rows});

    function getType(columnName) {
        const data = getData(connection);

        for (let i = 0; i < data.length; i++) {
            const cell = data[i][columnName];
            if (cell) return type(cell);
        }

        return 'String';
    }
}

export function query(queryString, connection) {
    const data = getData(connection);

    // In the query `SELECT * FROM ?`, alaSQL replaces ? with data
    return alasql.promise(queryString, [data]).then(parseSQL);
}
