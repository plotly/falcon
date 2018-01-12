import nock from 'nock';
import {assert} from 'chai';

import {
    dataWorldConnection as connection,
    dataWorldTablesResponse,
    dataWorldQueryResponse,
    dataWorldColumnsResponse
} from './utils.js';
import {connect, tables, query, schemas} from '../../backend/persistent/datastores/dataworld';

// Mock dataset GET request
nock('https://api.data.world/v0/datasets/falcon/test-dataset', {
    reqheaders: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    }
})
.get('/')
.reply(200, {
    owner: 'falcon',
    id: 'test-dataset',
    title: 'test-dataset',
    tags: [],
    visibility: 'PUBLIC',
    files: []
});

// Mock table query POST request
nock('https://api.data.world', {
    reqheaders: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    }
})
.post('/v0/sql/falcon/test-dataset', 'query=SELECT%20*%20FROM%20Tables')
.query({
    includeTableSchema: 'true'
})
.reply(200, dataWorldTablesResponse);

// Mock query POST request
nock('https://api.data.world', {
    reqheaders: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    }
})
.post('/v0/sql/falcon/test-dataset', 'query=SELECT%20*%20FROM%20sampletable%20LIMIT%205')
.query({
    includeTableSchema: 'true'
})
.reply(200, dataWorldQueryResponse);

// Mock table columns query POST request
nock('https://api.data.world', {
    reqheaders: {
        'Authorization': 'Bearer token',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    }
})
.post('/v0/sql/falcon/test-dataset', 'query=SELECT%20*%20FROM%20TableColumns')
.query({
    includeTableSchema: 'true'
})
.reply(200, dataWorldColumnsResponse);

describe('Data World:', function () {

    it('connect succeeds', function() {
        return connect(connection);
    });

    it('tables returns list of tables', function() {
        return tables(connection).then(result => {
            assert.deepEqual(result, ['sampletable']);
        });
    });

    it('query returns rows and column names', function() {
        return query('SELECT * FROM sampletable LIMIT 5', connection).then(result => {
            assert.deepEqual(
                result.columnnames,
                [ 'stringcolumn', 'datecolumn', 'decimalcolumn' ]
            );
            assert.deepEqual(result.rows, [
                [ 'First column', '2017-05-24', 1 ],
                [ 'Second column', '2017-05-25', 2 ],
                [ 'Third column', '2017-05-26', 3 ],
                [ 'Fourth column', '2017-05-27', 4 ],
                [ 'Fifth column', '2017-05-28', 5 ]
            ]);
        });
    });

    it('schemas returns table schemas', function() {
        return schemas(connection).then(result => {
            assert.deepEqual(
                result.columnnames,
                [ 'tablename', 'column_name', 'data_type' ]
            );
            assert.deepEqual(result.rows, [
                [ 'sampletable', 'stringcolumn', 'string' ],
                [ 'sampletable', 'datecolumn', 'date' ],
                [ 'sampletable', 'decimalcolumn', 'decimal' ]
            ]);
        });
    });
});
