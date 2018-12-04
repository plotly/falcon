import { assert } from 'chai';

import { DIALECTS } from '../../app/constants/constants.js';
import {
  connect,
  query,
  schemas,
  tables
} from '../../backend/persistent/datastores/Datastores.js';

const connection = {
  dialect: DIALECTS.CLICKHOUSE,
  host: 'localhost',
  port: 8123,
  username: 'default',
  database: 'plotly'
};

describe('ClickHouse', function() {
  it('connect succeeds', function() {
    return connect(connection);
  });

  it('tables returns list of tables', function() {
    return tables(connection).then(result => assert.include(result, 'consumption'))
  });

  it('schemas returns schemas for all tables', function() {
    return schemas(connection).then(({ rows, columnnames }) => {
        assert.deepInclude(rows, ['consumption', 'alcohol', 'Float32']);
        assert.deepInclude(rows, ['consumption', 'location', 'String']);
        assert.deepEqual(columnnames, ['tablename', 'column_name', 'data_type']);
    });
  });

  it('query returns rows and column names', function() {
    return query(
        'SELECT * FROM consumption LIMIT 5',
        connection
    ).then(({ rows, columnnames }) => {
        assert.deepEqual(rows, [
            ['Belarus', 17.5],
            ['Moldova', 16.8],
            ['Lithuania', 15.4],
            ['Russia', 15.1],
            ['Romania', 14.4]
        ]);
        assert.deepEqual(columnnames, ['location', 'alcohol']);
    });
  });

  it('query rejects with an error when the query is invalid', function() {
    return query('invalid query', connection).catch(err => assert.isDefined(err))
  });
})