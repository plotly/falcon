// do not use import, otherwise other test units won't be able to reactivate nock
const nock = require('nock');

const {assert} = require('chai');
const uuid = require('uuid');

const {connect, schemas, query, tables} = require('db-connectors').Athena;

describe('Athena:', function () {
    const URL = 'https://athena.us-east-1.amazonaws.com:443';
    const PATH = '/';

    // Connection object shared by all the tests
    const conn = {
        region: 'us-east-1',
        accessKey: 'XXXXXXXX',
        secretAccessKey: 'XXXXXAAAA',
        database: 'PLOT.LY-TEST',
        outputS3Bucket: 's3://aws-athena-query-results-11111111-us-east-1/',
        queryInterval: 1000,
        maxRetries: 50
    };

    before(function() {
        // Enable nock if it has been disabled by other specs
        if (!nock.isActive()) nock.activate();
    });

    after(function() {
        // Disable nock
        nock.restore();
    });

    it('connect() succeeds', function() {
        const queryStatement = 'SELECT table_name FROM information_schema.columns LIMIT 1';
        const columnNames = [];
        const rows = [];

        mockAthenaResponses(queryStatement, columnNames, rows);

        return connect(conn).then(function(connection) {
            assert.isDefined(connection, 'connection is defined');
        });
    });

    it('schemas() retrieves schemas of all tables', function() {
        const queryStatement = `
            SELECT table_name, column_name, data_type
            FROM information_schema.columns
            WHERE table_schema  = '${conn.database}'
        `;

        const columnNames = [
            'table_name',
            'column_name',
            'data_type'
        ];

        const rows = [
            ['table_name', 'column_name', 'data_type'],
            ['clean_logs', 'serialnumber', 'varchar'],
            ['clean_logs', 'email', 'varchar'],
            ['clean_logs', 'company', 'varchar'],
            ['clean_logs', 'platform', 'varchar'],
            ['test', 'company', 'varchar'],
            ['test', 'log_type', 'varchar'],
            ['test', 'product', 'varchar'],
            ['test', 'timestamp', 'timestamp'],
            ['clean_logs_json', 'company', 'varchar'],
            ['clean_logs_json', 'loglevel', 'varchar'],
            ['clean_logs_json', 'type', 'varchar'],
            ['clean_logs_json', 'subtype', 'varchar'],
            ['glue_cleaned_logs', 'company', 'varchar'],
            ['glue_cleaned_logs', 'loglevel', 'varchar'],
            ['glue_cleaned_logs', 'type', 'varchar'],
            ['glue_cleaned_logs', 'subtype', 'varchar']
        ];

        mockAthenaResponses(queryStatement, columnNames, rows);

        return schemas(conn).then(function(results) {
            assert.deepEqual(results.columnnames, columnNames, 'Unexpected column names');
            assert.deepEqual(results.rows, rows, 'Unexpected rows');
        });
    });

    it('query() executes a query', function() {
        const queryStatement = "select serialnumber from clean_logs where serialnumber != '' limit 10";

        const columnNames = [
            'serialnumber'
        ];

        const rows = [
            [ '9e2c31ec-b944-4baf-aaa5-4c672a0c048f-2017-06-22-14:49:36.458' ],
            [ '864041030069248' ],
            [ '3190d6df-325d-431b-aea7-a7fb8f306b9d-2017-07-18-19:00:27.284' ],
            [ 'd72afd2e-be50-436e-88bd-60e9ee2841bf-2017-06-21-19:58:04.638' ],
            [ '355757082591351' ],
            [ '05c4cb35-0cec-4877-a645-f9dd8eba4940-2017-09-11-16:18:32.274' ],
            [ '357125071914133' ],
            [ '864041030068687' ],
            [ '862789030222843' ],
            [ '864875034115451' ]
        ];

        mockAthenaResponses(queryStatement, columnNames, rows);

        return query(queryStatement, conn).then(function(results) {
            assert.deepEqual(results.columnnames, columnNames, 'Unexpected column names');
            assert.deepEqual(results.rows, rows, 'Unexpected rows');
        });
    });

    it('tables() executes a query', function() {
        const queryStatement = 'SHOW TABLES';

        const columnNames = [
            'table_name'
        ];

        const rows = [
            [ 'clean_logs' ],
            [ 'clean_logs_json' ],
            [ 'glue_cleaned_logs' ],
            [ 'test' ]
        ];

        mockAthenaResponses(queryStatement, columnNames, rows);

        return tables(conn).then(function(results) {
            const expectedRows = rows.map(row => row[0]);
            assert.deepEqual(results, expectedRows, 'Unexpected rows');
        });
    });

    function mockAthenaResponses(queryStatement, columnNames, rows) {
        const {database, outputS3Bucket} = conn.database;
        const queryExecutionId = uuid.v4();
        const submissionDateTime = 1522797420.024;

        // mock connect response
        nock(URL).post(PATH).reply(200, {
            QueryExecutionId: queryExecutionId
        });

        nock(URL).post(PATH).reply(200, {
            'QueryExecution': {
                'Query': queryStatement,
                'QueryExecutionContext': {'Database': database},
                'QueryExecutionId': queryExecutionId,
                'ResultConfiguration': {
                    'EncryptionConfiguration': {'EncryptionOption': 'SSE_S3'},
                    'OutputLocation': outputS3Bucket
                },
                'Statistics': {},
                'Status': {
                    'State': 'RUNNING',
                    'SubmissionDateTime': submissionDateTime
                }
            },
            'QueryExecutionDetail': {
                'OutputLocation': outputS3Bucket,
                'Query': queryStatement,
                'QueryExecutionContext': {'Database': database},
                'QueryExecutionId': queryExecutionId,
                'ResultConfiguration': {
                    'EncryptionConfiguration': {'EncryptionOption': 'SSE_S3'},
                    'OutputLocation': outputS3Bucket
                },
                'Stats': {},
                'Status': {
                    'State': 'RUNNING',
                    'SubmissionDateTime': submissionDateTime
                }
            }
        });

        nock(URL).post(PATH).reply(200, {
            'QueryExecution': {
                'Query': queryStatement,
                'QueryExecutionContext': {'Database': database},
                'QueryExecutionId': queryExecutionId,
                'ResultConfiguration': {
                    'EncryptionConfiguration': {'EncryptionOption': 'SSE_S3'},
                    'OutputLocation': outputS3Bucket
                },
                'Statistics': {},
                'Status': {
                    'State': 'SUCCEEDED',
                    'SubmissionDateTime': submissionDateTime
                }
            },
            'QueryExecutionDetail': {
                'OutputLocation': outputS3Bucket,
                'Query': queryStatement,
                'QueryExecutionContext': {'Database': database},
                'QueryExecutionId': queryExecutionId,
                'ResultConfiguration': {
                    'EncryptionConfiguration': {'EncryptionOption': 'SSE_S3'},
                    'OutputLocation': outputS3Bucket
                },
                'Stats': {},
                'Status': {
                    'State': 'SUCCEEDED',
                    'SubmissionDateTime': submissionDateTime
                }
            }
        });

        const headerAndRows = [columnNames].concat(rows);

        const columnInfos = columnNames.map(function(name) {
            return {
                'CaseSensitive': true,
                'CatalogName': 'hive',
                'Label': name,
                'Name': name,
                'Nullable': 'UNKNOWN',
                'Precision': 2147483647,
                'Scale': 0,
                'SchemaName': '',
                'TableName': '',
                'Type': 'varchar'
            };
        });

        const resultRows = headerAndRows.map(function(row) {
            return {
                'Data': row
            };
        });

        const resultRows2 = headerAndRows.map(function(row) {
            return {
                'Data': row.map(function(value) {
                    return {'VarCharValue': value};
                })
            };
        });

        nock(URL).post(PATH).reply(200, {
            'ResultSet': {
                'ColumnInfos': columnInfos,
                'ResultRows': resultRows,
                'ResultSetMetadata': {
                    'ColumnInfo': columnInfos
                },
                'Rows': resultRows2
            },
            'UpdateCount': 0,
            'UpdateType': ''
        });
    }
});
