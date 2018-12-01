import {assert} from 'chai';

import {apacheImpalaConnection as connection} from './utils.js';
import {
    query, connect, tables
} from '../../backend/persistent/datastores/Datastores.js';

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe.skip('Apache Impala:', function () {

    it('connect succeeds', function() {
        this.timeout(180 * 1000);
        return connect(connection);
    });

    it('tables returns list of tables', function() {
        return tables(connection).then(result => {
            const tableName = (connection.database) ?
                `${connection.database}.ALCOHOL_CONSUMPTION_BY_COUNTRY_2010`.toUpperCase() :
                'ALCOHOL_CONSUMPTION_BY_COUNTRY_2010';

            assert.deepEqual(result, [tableName]);
        });
    });

    it('query returns rows and column names', function() {
        const tableName = (connection.database) ?
            `${connection.database}.ALCOHOL_CONSUMPTION_BY_COUNTRY_2010`.toUpperCase() :
            'ALCOHOL_CONSUMPTION_BY_COUNTRY_2010';

        return query(`SELECT * FROM ${tableName}\nLIMIT 5`, connection).then(results => {
            assert.deepEqual(results.rows, [
                ['Belarus', '17.5'],
                ['Moldova', '16.8'],
                ['Lithuania', '15.4'],
                ['Russia', '15.1'],
                ['Romania', '14.4']
            ]);
            assert.deepEqual(results.columnnames, ['loc', 'alcohol']);
        });
    });

    it('connect for invalid credentials fails', function() {
        connection.host = 'http://lah-lah.lemons.com';

        return connect(connection).catch(err => {
            // reset hostname
            connection.host = '35.184.155.127';

            assert.equal(err, ('Error: Error: getaddrinfo ENOTFOUND ' +
                               'http://lah-lah.lemons.com ' +
                               'http://lah-lah.lemons.com:21000'));
        });
    });
});
/* eslint-enable no-invalid-this */
