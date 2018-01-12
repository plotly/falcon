import {assert} from 'chai';

import {DIALECTS} from '../../app/constants/constants.js';

import {
    query, connect, tables
} from '../../backend/persistent/datastores/Datastores.js';

const connection = {
    dialect: DIALECTS.IBM_DB2,
    username: 'db2user1',
    password: 'w8wfy99DvEmgkBsE',
    host: 'db2.test.plotly.host',
    port: 50000,
    database: 'plotly'
};

// Circle CI uses test databases running locally on machine:
if (process.env.CIRCLECI) {
    connection.host = 'localhost';
}

describe('IBM DB2:', function () {
    it('connect succeeds', function(done) {
        connect(connection).then(database => {
            assert(database.connected);
        }).then(done);
    });

    it('query returns rows and column names', function(done) {
        query(
            'SELECT * FROM DB2INST1.ALCOHOL_CONSUMPTION_BY_COUNTRY_2010 FETCH FIRST 5 ROWS ONLY',
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
        }).then(done);
    });

    it('tables returns list of tables', function(done) {
        tables(connection).then(result => {
            assert.deepEqual(result, ['DB2INST1.ALCOHOL_CONSUMPTION_BY_COUNTRY_2010']);
        }).then(done);
    });
});
