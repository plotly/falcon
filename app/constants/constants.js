// Reason for surpressing: would harm readability of a lot of long strings in this case
/* eslint-disable no-multi-str */
import {concat} from 'ramda';

export const DIALECTS = {
    MYSQL: 'mysql',
    MARIADB: 'mariadb',
    ORACLE: 'oracle',
    POSTGRES: 'postgres',
    REDSHIFT: 'redshift',
    ELASTICSEARCH: 'elasticsearch',
    MSSQL: 'mssql',
    SQLITE: 'sqlite',
    S3: 's3',
    // IBM_DB2: 'ibm db2',
    APACHE_SPARK: 'apache spark',
    APACHE_IMPALA: 'apache impala',
    APACHE_DRILL: 'apache drill',
    DATA_WORLD: 'data.world',
    ATHENA: 'athena',
    CSV: 'csv',
    BIGQUERY: 'bigquery',
    CLICKHOUSE: 'clickhouse'
};

export const SQL_DIALECTS_USING_EDITOR = [
    'mysql',
    'mariadb',
    'oracle',
    'postgres',
    'redshift',
    'mssql',
    'sqlite',
    'ibm db2',
    'apache spark',
    'apache impala',
    'data.world',
    'athena',
    'csv',
    'bigquery',
    'clickhouse'
];

const commonSqlOptions = [
    {'label': 'Username', 'value': 'username', 'type': 'text'},
    {'label': 'Password', 'value': 'password', 'type': 'password'},
    {
        'label': 'Host',
        'value': 'host',
        'type': 'text'
    },
    {
        'label': 'Port',
        'value': 'port',
        'type': 'number',
        'description': 'Server port number (e.g. 3306)'
    },
    {'label': 'Database', 'value': 'database', 'type': 'text'},
    {
        'label': 'SSL Enabled', 'value': 'ssl', 'type': 'checkbox',
        'description': 'Does your database require that you connect to it via SSL? \
                        Note that this is just the connection between this app and your database; \
                        connections to Chart Studio are always encrypted.'
    }
];

const hadoopQLOptions = [
    {'label': 'Host', 'value': 'host', 'type': 'text' },
    {'label': 'Port', 'value': 'port', 'type': 'number'},
    {
        'label': 'Database',
        'value': 'database',
        'type': 'text',
        'description': 'Database Name (Optional). If database name is not specified, all tables are returned.'
    },
    {
        'label': 'Timeout',
        'value': 'timeout',
        'type': 'number',
        'description': 'Number of seconds for a request to timeout.'
    }
];

export const CONNECTION_CONFIG = {
    [DIALECTS.APACHE_IMPALA]: hadoopQLOptions,
    [DIALECTS.APACHE_SPARK]: hadoopQLOptions,
    [DIALECTS.CSV]: [{
        'inputLabel': 'Type URL to a CSV file',
        'dropLabel': '(or drop a CSV file here)',
        'value': 'database',
        'type': 'filedrop'
    }],
    [DIALECTS.IBM_DB2]: commonSqlOptions,
    [DIALECTS.MYSQL]: commonSqlOptions,
    [DIALECTS.MARIADB]: commonSqlOptions,
    [DIALECTS.MSSQL]: concat(
        commonSqlOptions, [
            {
                'label': 'Instance Name',
                'value': 'instanceName',
                'description': `
                    If your SQL Server was configured using an instance name
                    instead of a port, then set this option.
                    Note that if this option is specified, then the port
                    will be ignored.
                    For this to work, the SQL Server Browser service
                    must be running on the database server
                    and UDP port 1444 on the database server must be reachable.
                `,
                'type': 'text'
            },
            /*
             * TODO - This option might replace the `ssl` option above.
             * See https://github.com/sequelize/sequelize/issues/8497
             */
            {
                'label': 'Encrypt Connection',
                'value': 'encrypt',
                'description': `
                    If selected, the connection will be encrypted.
                    Select this option if you're on Windows Azure.
                `,
                'type': 'checkbox'
            },
            {
                'label': 'Connection Timeout',
                'value': 'connectTimeout',
                'description': `
                    The number of milliseconds before the
                    attempt to connect is considered failed
                    (default: 15000).
                `,
                'placeholder': 15000,
                'type': 'number'
            },
            {
                'label': 'Request Timeout',
                'value': 'requestTimeout',
                'description': `
                    The number of milliseconds before a request is considered
                    failed, or 0 for no timeout (default: 15000).
                `,
                'placeholder': 15000,
                'type': 'number'
            }
        ]
    ),
    [DIALECTS.ORACLE]: [
        {'label': 'Username', 'value': 'username', 'type': 'text'},
        {'label': 'Password', 'value': 'password', 'type': 'password'},
        {
            'label': 'Connection',
            'value': 'connectionString',
            'type': 'text',
            'description': `
                An Easy Connect string,
                a Net Service Name from a local 'tnsnames.ora' file or an external naming service,
                an SID of a local Oracle database instance,
                or leave empty to connect to the local default database.
                See https://oracle.github.io/node-oracledb/doc/api.html#connectionstrings for examples.
            `
        }
    ],
    [DIALECTS.POSTGRES]: commonSqlOptions,
    [DIALECTS.REDSHIFT]: commonSqlOptions,
    [DIALECTS.SQLITE]: [
        {'label': 'Path to SQLite File', 'value': 'storage', 'type': 'path'}
    ],

    [DIALECTS.ELASTICSEARCH]: [
        {'label': 'Username', 'value': 'username', 'type': 'text',
         'description': `
            These credentials are used to authenticate Elasticsearch instances
            that are protected with HTTP Basic Auth.
            You can leave this blank if your instance does not have
            HTTP Basic Auth.`},
        {'label': 'Password', 'value': 'password', 'type': 'text'},
        {'label': 'Host', 'value': 'host', 'type': 'text'},
        {'label': 'Port', 'value': 'port', 'type': 'text'}
    ],
    [DIALECTS.S3]: [
        {
            'label': 'S3 Bucket',
            'value': 'bucket',
            'type': 'text',
            'description': `
                The S3 connection will import CSV files from any
                directory in your S3 bucket.`
        },
        {'label': 'S3 Access Key ID', 'value': 'accessKeyId', 'type': 'text'},
        {
            'label': 'S3 Secret Access Key',
            'value': 'secretAccessKey',
            'type': 'password'
        }
    ],
    [DIALECTS.APACHE_DRILL]: [
        {'label': 'Host', 'value': 'host', 'type': 'text'},
        {'label': 'Port', 'value': 'port', 'type': 'text'},
        {
            'label': 'S3 Bucket Name',
            'value': 'bucket',
            'type': 'text',
            'description': `
                The Apache Drill connection will query and parse any Parquet
                files that are hosted in your S3 bucket through your
                Apache Drill instance.
            `},
        {'label': 'S3 Access Key ID', 'value': 'accessKeyId', 'type': 'text'},
        {
            'label': 'S3 Secret Access Key',
            'value': 'secretAccessKey',
            'type': 'password'
        }
    ], // TODO - password options for apache drill

    [DIALECTS.DATA_WORLD]: [
        {
            'label': 'Dataset/Project URL',
            'value': 'url',
            'type': 'text',
            'description': 'The URL of the dataset or project on data.world'
        },
        {
            'label': 'Read/Write API Token',
            'value': 'token',
            'type': 'password',
            'description': 'Your data.world read/write token. It can be obtained from https://data.world/settings/advanced'
        }
    ],
    [DIALECTS.ATHENA]: [
        {
            'label': 'S3 Access Key', 'value': 'accessKey', 'type': 'password'
        },
        {
            'label': 'S3 Secret Access Key', 'value': 'secretAccessKey', 'type': 'password'
        },
        {
            'label': 'AWS Region', 'value': 'region', 'type': 'text',
            'description': 'The AWS region (i.e. us-east-1) where the database resides'
        },
        {
            'label': 'S3 Bucket', 'value': 'outputS3Bucket', 'type': 'text',
            'description': 'The Athena connector will store query results in this location.'
        },
        {
            'label': 'Database', 'value': 'database', 'type': 'text'
        },
        {
            'label': 'Query Interval', 'value': 'queryInterval', 'type': 'number',
            'description': 'The Interval (In Milliseconds) that Falcon will check to see \
                             if the Athena Query is done. Default 2 seconds'
        },
        {
            'label': 'SSL Enabled', 'value': 'sslEnabled', 'type': 'checkbox',
            'description': 'Does your database require that you connect to it via SSL? \
                            Note that this is just the connection between this app and your database; \
                            connections to Chart Studio are always encrypted.'
        }
    ],
    [DIALECTS.BIGQUERY]: [
        {
            'label': 'Google Project Id',
            'value': 'projectId',
            'type': 'text',
            'description': 'The Google Cloud Project Id'
        },
        {'label': 'Database', 'value': 'database', 'type': 'text'},
        {
            'label': 'Key File',
            'value': 'keyFilename',
            'type': 'filedrop',
            'description': 'The location of the Google Service Account Key File'
        }
    ],
    [DIALECTS.CLICKHOUSE]: [
        {'label': 'Username', 'value': 'username', 'type': 'text'},
        {'label': 'Password', 'value': 'password', 'type': 'password'},
        {
            'label': 'Host',
            'value': 'host',
            'type': 'text'
        },
        {
            'label': 'Pathname',
            'value': 'pathname',
            'type': 'text',
        },   
        {
            'label': 'Port',
            'value': 'port',
            'type': 'number',
        },
        {'label': 'Database', 'value': 'database', 'type': 'text'},
        {
            'label': 'Profile',
            'value': 'profile',
            'type': 'text',
        },
        {
            'label': 'Max rows to read',
            'value': 'max_rows_to_read',
            'type': 'number'
        },
        {
            'label': 'Use https',
            'value': 'https',
            'type': 'checkbox'
        },
        {
            'label': 'Read only',
            'value': 'readonly',
            'type': 'checkbox',
        }
    ]
};


export const LOGOS = {
    [DIALECTS.APACHE_SPARK]: 'images/spark-logo.png',
    [DIALECTS.APACHE_IMPALA]: 'images/impala-logo.png',
    [DIALECTS.CSV]: 'images/csv-logo.png',
    [DIALECTS.IBM_DB2]: 'images/ibmdb2-logo.png',
    [DIALECTS.REDSHIFT]: 'images/redshift-logo.png',
    [DIALECTS.ORACLE]: 'images/oracle-logo.png',
    [DIALECTS.POSTGRES]: 'images/postgres-logo.png',
    [DIALECTS.ELASTICSEARCH]: 'images/elastic-logo.png',
    [DIALECTS.MYSQL]: 'images/mysql-logo.png',
    [DIALECTS.MARIADB]: 'images/mariadb-logo.png',
    [DIALECTS.MSSQL]: 'images/mssql-logo.png',
    [DIALECTS.SQLITE]: 'images/sqlite-logo.png',
    [DIALECTS.S3]: 'images/s3-logo.png',
    [DIALECTS.APACHE_DRILL]: 'images/apache_drill-logo.png',
    [DIALECTS.DATA_WORLD]: 'images/dataworld-logo.png',
    [DIALECTS.ATHENA]: 'images/athena-logo.png',
    [DIALECTS.BIGQUERY]: 'images/bigquery-logo.png',
    [DIALECTS.CLICKHOUSE]: 'images/clickhouse-logo.png'
};

export function PREVIEW_QUERY(connection, table, elasticsearchIndex) {
    switch (connection.dialect) {
        case DIALECTS.CSV:
            return 'SELECT TOP 1000 * FROM ?';
        case DIALECTS.IBM_DB2:
            return `SELECT * FROM ${table} FETCH FIRST 1000 ROWS ONLY`;
        case DIALECTS.ORACLE:
            return `SELECT * FROM ${table} WHERE ROWNUM <= 1000`;
        case DIALECTS.APACHE_IMPALA:
        case DIALECTS.APACHE_SPARK:
        case DIALECTS.MYSQL:
        case DIALECTS.SQLITE:
        case DIALECTS.MARIADB:
        case DIALECTS.POSTGRES:
        case DIALECTS.DATA_WORLD:
        case DIALECTS.REDSHIFT:
        case DIALECTS.ATHENA:
        case DIALECTS.CLICKHOUSE:
            return `SELECT * FROM ${table} LIMIT 1000`;
        case DIALECTS.MSSQL:
            return (connection.database) ?
                `SELECT TOP 1000 * FROM "${connection.database}".${table}` :
                `SELECT TOP 1000 * FROM ${table}`;
        case DIALECTS.ELASTICSEARCH:
            return JSON.stringify({
                index: elasticsearchIndex || '_all',
                type: table || '_all',
                body: {
                    query: { 'match_all': {} },
                    size: 1000
                }
            });
        case DIALECTS.BIGQUERY:
            return 'SELECT \'connected\' as status';
        default:
            return '';
    }
}

export const INITIAL_CONNECTIONS = {
    username: '',
    password: '',
    database: '',
    index: '',
    doc: '',
    dialect: DIALECTS.MYSQL,
    port: '',
    host: '',
    ssl: false,
    encrypt: false
};

export const FAQ = [
    {
        q: 'I ran into an issue - where can I get help?',
        a: 'Head over to the Community Forum for help from other Falcon users: \
            https://community.plot.ly/c/database-connector. For guaranteed prompt support by a Plotly engineer, \
            consider purchasing a Chart Studio Cloud Professional plan or Chart Studio Enterprise: https://plot.ly/plans.'
    }, {
        q: 'How does this app work?',
        a: 'This app is a SQL/NoSQL client. Connect to your database in the Connection tab, run queries in the \
            "QUERY" tab, then export your results as a CSV or share them online through Chart Studio. Optionally, \
            you can run this app as a middleman between Chart Studio and your database (see the next question).'
    }, {
        q: 'I want a live dataset in Chart Studio that is synced to my database. How do I do that?',
        a: 'In the "QUERY" tab, click on the "Schedule" button once you have written your query. You will be able \
            to create a live dataset that will be updated on the schedule of your choice. Falcon will run your query \
            and update your live dataset as long as it is open and running on this computer. We recommend setting up \
            this app on an office computer or server if you want it to update a chart or dashboard 24/7. \
            If you have Chart Studio Enterprise, you\'re in luck - this app is already running in your Chart Studio \
            Enterprise container. Contact your Enterprise admin to learn how to access it.'
    }, {
        q: 'Am I exposing my database credentials to Plotly or Chart Studio?',
        a: 'No. All of your credentials are only saved locally on the computer where the app is run. \
            We do not recommend uploading your database credentials to any cloud service.'
    }, {
        q: 'Is this app open-source?',
        a: 'Yes! You can view and contribute to the source code on GitHub at https://github.com/plotly/falcon'
    }
];

export const SAMPLE_DBS = {
    [DIALECTS.APACHE_IMPALA]: {
        timeout: 180,
        database: 'plotly',
        port: 21000,
        host: 'impala.test.plotly.host',
        dialect: DIALECTS.APACHE_IMPALA
    },
    [DIALECTS.APACHE_SPARK]: {
        timeout: 180,
        database: 'plotly',
        port: 8998,
        host: 'spark.test.plotly.host',
        dialect: DIALECTS.APACHE_SPARK
    },
    [DIALECTS.CSV]: {
        dialect: DIALECTS.CSV,
        database: 'http://www.fdic.gov/bank/individual/failed/banklist.csv'
    },
    [DIALECTS.IBM_DB2]: {
        username: 'db2user1',
        password: 'w8wfy99DvEmgkBsE',
        database: 'plotly',
        port: 50000,
        host: 'db2.test.plotly.host',
        dialect: DIALECTS.IBM_DB2
    },
    [DIALECTS.ORACLE]: {
        username: 'XDB',
        password: 'xdb',
        connectionString: 'localhost/XE'
    },
    [DIALECTS.POSTGRES]: {
        username: 'masteruser',
        password: 'connecttoplotly',
        database: 'plotly_datasets',
        port: 5432,
        host: 'readonly-test-postgres.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
        dialect: 'postgres'
    },
    [DIALECTS.MYSQL]: {
        dialect: 'mysql',
        username: 'masteruser',
        password: 'connecttoplotly',
        host: 'readonly-test-mysql.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
        port: 3306,
        database: 'plotly_datasets'
    },
    [DIALECTS.MARIADB]: {
        dialect: 'mariadb',
        username: 'masteruser',
        password: 'connecttoplotly',
        host: 'readonly-test-mariadb.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
        port: 3306,
        database: 'plotly_datasets'
    },
    [DIALECTS.REDSHIFT]: {
        dialect: 'redshift',
        username: 'plotly',
        password: 'Qmbdf#3DU]pP8a=CKTK}',
        host: 'sql-connector-test.cfiaqtidutxu.us-east-1.redshift.amazonaws.com',
        port: 5439,
        database: 'plotly_datasets'
    },
    [DIALECTS.MSSQL]: {
        dialect: 'mssql',
        username: 'masteruser',
        password: 'connecttoplotly',
        host: 'test-mssql.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
        port: 1433,
        database: 'plotly_datasets'
    },
    [DIALECTS.ELASTICSEARCH]: {
        dialect: 'elasticsearch',
        host: 'https://67a7441549120daa2dbeef8ac4f5bb2e.us-east-1.aws.found.io',
        port: '9243'
    },
    [DIALECTS.S3]: {
        dialect: 's3',
        bucket: 'plotly-s3-connector-test',
        accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
        secretAccessKey: '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'
    },
    [DIALECTS.APACHE_DRILL]: {
        dialect: 'apache drill',
        host: 'http://ec2-35-164-71-216.us-west-2.compute.amazonaws.com',
        port: 8047,

        bucket: 'plotly-s3-connector-test',
        accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
        secretAccessKey: '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'
    },
    [DIALECTS.SQLITE]: {
        dialect: 'sqlite',
        storage: `${__dirname}/plotly_datasets.db`
    },
    [DIALECTS.ATHENA]: {
        s3Outputlocation: 'plotly-s3-connector-test',
        accessKey: 'AKIAIMHMSHTGARJYSKMQ',
        secretAccessKey: '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',
        region: 'us-east-1',
        database: 'falcon',
        queryTimeout: 5000
    },
    [DIALECTS.DATA_WORLD]: {
        url: 'https://data.world/rflprr/reported-lyme-disease-cases-by-state'
    },
    [DIALECTS.BIGQUERY]: {
        projectId: 'Plotly',
        database: 'plotly',
        keyFilename: '/home/plotly/falcon/google-credentials.json'
    },
    [DIALECTS.CLICKHOUSE]: {
        username: 'default',
        password: 'connecttoplotly',
        host: 'clickhouse.test.plotly.host',
        port: 8123,
        pathname: '/path_to_clickhouse',
        database: 'plotly_datasets',
        profile: 'web',
        max_rows_to_read: 1000
    }
};

export function getHighlightMode(dialect) {
    if (!SQL_DIALECTS_USING_EDITOR.includes(dialect)) {
        return 'text/plain';
    }

    return {
            [DIALECTS.APACHE_SPARK]: 'text/x-sparksql',
            [DIALECTS.MYSQL]: 'text/x-mysql',
            [DIALECTS.SQLITE]: 'text/x-sqlite',
            [DIALECTS.MARIADB]: 'text/x-mariadb',
            [DIALECTS.ORACLE]: 'text/x-plsql',
            [DIALECTS.POSTGRES]: 'text/x-pgsql',
            [DIALECTS.REDSHIFT]: 'text/x-pgsql',
            [DIALECTS.MSSQL]: 'text/x-mssql'
    }[dialect] || 'text/x-sql';
}

export const WAITING_MESSAGE = 'This may take a long time. Your query is ' +
  'currently executing and must finish before the dataset can be updated.';

export const SAVE_WARNING = 'Note: the query will first execute and then ' +
    'create a dataset in Chart Studio with the resulting data. Thereafter, ' +
    'the query will execute and update the dataset on the requested schedule.';

export const COLORS = {
    red: '#EF553B'
};
