// do not use import, otherwise other test units won't be able to reactivate nock
const nock = require('nock');

import {assert} from 'chai';

import {
    connect,
    query,
    schemas,
    tables
} from '../../backend/persistent/datastores/Datastores.js';

const csvFile = [
    'col1,col 2,"col 3",col 4',
    '1,1.1,2018-01-10,UK',
    '2,2.2,2019-02-20,ES',
    '3,3.3,2020-03-30,PL',
    '' // to test csv files with empty lines can be parsed
].join('\n');

const expected = {
    columnnames: ['col1', 'col 2', 'col 3', 'col 4'],
    rows: [
        [1, 1.1, '2018-01-10', 'UK'],
        [2, 2.2, '2019-02-20', 'ES'],
        [3, 3.3, '2020-03-30', 'PL']
    ],
    schemas: [
        ['?', 'col1', 'Number'],
        ['?', 'col 2', 'Number'],
        ['?', 'col 3', 'String'],
        ['?', 'col 4', 'String']
    ]
};

const host = 'https://csv.example.com';
const path = '/table.csv';
const url = host + path;
const connection = {
    dialect: 'csv',
    database: url
};

describe('CSV:', function () {
    before(function() {
        // Enable nock if it has been disabled by other specs
        if (!nock.isActive()) nock.activate();
    });

    after(function() {
        nock.restore();
    });

    it('connect succeeds', function() {
        // mock connect response
        nock(host)
        .get(path)
        .reply(200, csvFile);

        return connect(connection)
        .then(conn => {
            assert.equal(conn.dialect, 'csv', 'Unexpected connection.dialect');
            assert.equal(conn.database, url, 'Unexpected connection.database');
            assert(conn.meta, 'Missing connection.meta');
            assert.deepEqual(conn.meta.fields, expected.columnnames, 'Unexpected connection.meta.fields');
        });
    });

    it('tables succeeds', function() {
        return tables(connection)
        .then(obtained => {
            assert.deepEqual(obtained, ['?'], 'Unexpected list of tables');
        });
    });

    it('schemas succeeds', function() {
        return schemas(connection)
        .then(({columnnames, rows}) => {
            assert.equal(columnnames.length, 3, 'Unexpected columnnames');
            assert.deepEqual(rows, expected.schemas, 'Unexpected rows');
        });
    });

    it('query succeeds', function() {
        return query('SELECT * FROM ?', connection)
        .then(({columnnames, rows}) => {
            assert.deepEqual(columnnames, expected.columnnames, 'Unexpected columnnames');
            assert.deepEqual(rows, expected.rows, 'Unexpected rows');
        });
    });
});
