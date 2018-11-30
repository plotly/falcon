// do not use import, otherwise other test units won't be able to reactivate nock
const nock = require('nock');
const {assert} = require('chai');

const {
    connect,
    query,
    schemas,
    tables,
    disconnect
} = require('db-connectors').Datastores;

const {
    getAvailableSize,
    setStorageSize
} = require('db-connectors').CSV;

const csvFile = [
    'col1,col 2,"col 3",col 4',
    '1,1.1,2018-01-10,UK',
    '2,2.2,2019-02-20,ES',
    '3,3.3,2020-03-30,PL',
    '' // to test csv files with empty lines can be parsed
].join('\n');

/* eslint-disable max-len */
const csvDataURL = 'data:text/plain;charset=utf-8;base64,Y29sMSxjb2wgMiwiY29sIDMiLGNvbCA0DQoxLDEuMSwyMDE4LTAxLTEwLFVLDQoyLDIuMiwyMDE5LTAyLTIwLEVTDQozLDMuMywyMDIwLTAzLTMwLFBM';
/* eslint-enable max-len */

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
const connectionDataURL = {
    dialect: 'csv',
    database: csvDataURL
};

describe('CSV:', function () {
    before(function() {
        // Enable nock if it has been disabled by other specs
        if (!nock.isActive()) nock.activate();
    });

    after(function() {
        nock.restore();
    });

    it('connect fails if storage size is exceeded', function() {
        // mock connect response
        nock(host)
        .get(path)
        .reply(200, csvFile);

        // set storage size of CSV connector to a small number,
        // so that next attempt to connect fails
        setStorageSize(84);

        return connect(connection)
        .then(() => {
            throw new Error('connect() should have thrown an exception');

        }, (error) => {
            assert.equal(error.name, 'FetchError', 'Unexpected error name');
            assert.equal(
                error.message,
                'content size at https://csv.example.com/table.csv over limit: 84',
                'Unexpected error message'
            );
        });
    });

    it('connect accepts data URLs', function() {
        // set storage size of CSV connector to 0 to disable size limit
        setStorageSize(0);

        return connect(connectionDataURL)
        .then(conn => {
            assert.equal(conn.dialect, 'csv', 'Unexpected connection.dialect');
            assert.equal(conn.database, csvDataURL, 'Unexpected connection.database');
            assert(conn.meta, 'Missing connection.meta');
            assert.deepEqual(conn.meta.fields, expected.columnnames, 'Unexpected connection.meta.fields');
        });
    });

    it('connect succeeds if storage size limit is disabled', function() {
        // mock connect response
        nock(host)
        .get(path)
        .reply(200, csvFile);

        // set storage size of CSV connector to 0 to disable size limit
        setStorageSize(0);

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

    it('disconnect removes a CSV file from the storage', function() {
        // mock connect response
        nock(host)
        .get(path)
        .reply(200, csvFile);

        // set storage size of CSV connector to 0 to disable size limit
        const storageSize = 200;
        setStorageSize(storageSize);

        // test connections.size has been set to the file size
        assert.equal(connection.size, csvFile.length, 'Unexpected connection size');

        // assuming the previous tests didn't disconnect connection and  connectionDataURL
        let expectedAvailableSize = storageSize - connection.size - connectionDataURL.size;
        assert.equal(getAvailableSize(), expectedAvailableSize, 'Unexpected available size');

        return disconnect(connection)
        .then(() => {
            expectedAvailableSize = storageSize - connectionDataURL.size;
            assert.equal(getAvailableSize(), expectedAvailableSize, 'Unexpected available size');

            return disconnect(connectionDataURL);
        })
        .then(() => {
            assert.equal(getAvailableSize(), storageSize, 'Unexpected storage size');
        });
    });
});
