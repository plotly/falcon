import {assert} from 'chai';

import {DIALECTS} from '../../app/constants/constants.js';

import {
    connect,
    disconnect,
    query,
    schemas,
    tables
} from '../../backend/persistent/datastores/Datastores.js';

const connection = {
    dialect: DIALECTS.ORACLE,
    username: 'XDB',
    password: 'xdb',
    connectionString: 'localhost/XE'
};

// Skip tests if there is no working installation of oracledb
let oracledb;
try {
    oracledb = require('oracledb');
} catch (err) {
    if (!process.env.CIRCLECI) {
        console.log('Skipping `datastores.oracle.spec.js`:', err); // eslint-disable-line
    }
}

((oracledb) ? describe : xdescribe)('Oracle:', function () {
    it('connect succeeds', function() {
        return connect(connection);
    });

    it('tables returns list of tables', function() {
        return tables(connection).then(result => {
            assert.include(result, 'CONSUMPTION2010', result);
        });
    });

    it('schemas returns schemas for all tables', function() {
        return schemas(connection).then(results => {
            assert.deepInclude(results.rows, ['CONSUMPTION2010', 'ALCOHOL', 'NUMBER']);
            assert.deepInclude(results.rows, ['CONSUMPTION2010', 'LOCATION', 'VARCHAR2']);
            assert.deepEqual(results.columnnames, ['TABLE_NAME', 'COLUMN_NAME', 'DATA_TYPE']);
        });
    });

    it('query returns rows and column names', function() {
        return query(
            'SELECT * FROM CONSUMPTION2010 WHERE ROWNUM <= 5',
            connection
        ).then(results => {
            assert.deepEqual(results.rows, [
                ['Belarus', 17.5],
                ['Moldova', 16.8],
                ['Lithuania', 15.4],
                ['Russia', 15.1],
                ['Romania', 14.4]
            ]);
            assert.deepEqual(results.columnnames, ['LOCATION', 'ALCOHOL']);
        });
    });

    it('disconnect succeeds', function() {
        return disconnect(connection);
    });
});
