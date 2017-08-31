import {assert} from 'chai';

import {DIALECTS} from '../../app/constants/constants.js';

import {
    query, connect, tables
} from '../../backend/persistent/datastores/Datastores.js';

import {disconnect, getActiveSessions} from '../../backend/persistent/datastores/livy.js';

const connection = {
    dialect: DIALECTS.APACHE_SPARK,
    host: '130.211.124.41',
    port: 8998,
    database: 'plotly',
    timeout: 120
};

function setSessionId(connection) {
    return getActiveSessions(connection)
        .then(sessions => {
            const ids = sessions
                .filter(s => s.kind === 'spark')
                .map(s => s.id);

            if (ids.length <= 0) throw new Error('livy: no active spark sessions');

            connection.sessionId = ids[ids.length - 1];

            return connection;
        });
}

describe('Apache Livy:', function () {
    before(function() {
        connection.host = connection.host || '127.0.0.1';
        connection.database = connection.database || '';
        connection.setup = `
val a = Array(("Belarus", 17.5), ("Moldova", 16.8), ("Lithuania", 15.4), ("Russia", 15.1), ("Romania", 14.4))
val rdd = sc.parallelize(a)
val df = rdd.toDF("LOCATION", "ALCOHOL")
df.registerTempTable("ALCOHOL_CONSUMPTION_BY_COUNTRY_2010")
        `;
        connection.useSqlContext = false;
    });

    after(function() {
        return disconnect(connection);
    });

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
        let tableName = (connection.database) ?
            `${connection.database}.ALCOHOL_CONSUMPTION_BY_COUNTRY_2010`.toUpperCase() :
            'ALCOHOL_CONSUMPTION_BY_COUNTRY_2010';

        return query(`SELECT * FROM ${tableName}\nLIMIT 5`, connection).then(results => {
            assert.deepEqual(results.rows, [
                ['Belarus', 17.5],
                ['Moldova', 16.8],
                ['Lithuania', 15.4],
                ['Russia', 15.1],
                ['Romania', 14.4],
            ]);
            assert.deepEqual(results.columnnames, ['LOCATION', 'ALCOHOL']);
        });
    });
});
