import {assert} from 'chai';

import {DIALECTS} from '../../app/constants/constants.js';

import {
    query, connect, tables
} from '../../backend/persistent/datastores/Datastores.js';

import {disconnect, getActiveSessions} from '../../backend/persistent/datastores/livy.js';

const connection = {
    dialect: DIALECTS.APACHE_LIVY,
    host: '104.198.64.55',
    //host: '127.0.0.1',
    port: 8998,
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
    after(function() {
        return disconnect(connection);
    });

    it('connect succeeds', function() {
        this.timeout(180 * 1000);
        connection.setup = `
            val a = Array(("Belarus", 17.5), ("Moldova", 16.8), ("Lithuania", 15.4), ("Russia", 15.1), ("Romania", 14.4))
            val rdd = sc.parallelize(a)
            val df = rdd.toDF("LOCATION", "ALCOHOL")
            df.registerTempTable("ALCOHOL_CONSUMPTION_BY_COUNTRY_2010")
            //df.createOrReplaceTempView("ALCOHOL_CONSUMPTION_BY_COUNTRY_2010")
        `;
        return connect(connection);
    });

    it('tables returns list of tables', function() {
        return tables(connection).then(result => {
            assert.deepEqual(result, ['ALCOHOL_CONSUMPTION_BY_COUNTRY_2010']);
        });
    });

    it('query returns rows and column names', function() {
        return query(
            'SELECT * FROM ALCOHOL_CONSUMPTION_BY_COUNTRY_2010\nLIMIT 5',
            connection
        ).then(results => {
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
