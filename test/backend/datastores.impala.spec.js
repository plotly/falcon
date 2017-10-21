import {assert} from 'chai';

import {DIALECTS} from '../../app/constants/constants.js';

import {
    query, connect, tables
} from '../../backend/persistent/datastores/Datastores.js';


const connection = {
    dialect: DIALECTS.APACHE_IMPALA,
    host: '35.184.155.127', // default: '127.0.0.1'
    port: 21000,
    database: 'plotly', // default: ''
    timeout: 60
};

describe('Apache Impala:', function () {

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
                ['Belarus', "17.5"],
                ['Moldova', "16.8"],
                ['Lithuania', "15.4"],
                ['Russia', "15.1"],
                ['Romania', "14.4"]
            ]);
            assert.deepEqual(results.columnnames, ['loc', 'alcohol']);
        });
    });

    it('connect for invalid credentials fails', function() {
        connection.host = 'http://lah-lah.lemons.com';

        return connect(connection).catch(err => {
            assert.equal(err, ('Error: Error: getaddrinfo ENOTFOUND ' +
                               'http://lah-lah.lemons.com ' +
                               'http://lah-lah.lemons.com:21000'));
        });
    });
});
