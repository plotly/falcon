// Reason for surpressing: would harm readability of a lot of long strings in this case
/* eslint-disable no-multi-str */
import {concat} from 'ramda';

export const DIALECTS = {
    MYSQL: 'mysql',
    MARIADB: 'mariadb',
    POSTGRES: 'postgres',
    REDSHIFT: 'redshift',
    ELASTICSEARCH: 'elasticsearch',
    MSSQL: 'mssql',
    SQLITE: 'sqlite',
    S3: 's3',
    IBM_DB2: 'ibm db2',
    APACHE_SPARK: 'apache spark',
    APACHE_IMPALA: 'apache impala',
    APACHE_DRILL: 'apache drill',
    DATA_WORLD: 'data.world',
    ATHENA: 'athena'
};

export const SQL_DIALECTS_USING_EDITOR = [
    'mysql',
    'mariadb',
    'postgres',
    'redshift',
    'mssql',
    'sqlite',
    'ibm db2',
    'apache spark',
    'apache impala',
    'data.world',
    'athena'
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
                        connections to plot.ly or your plotly instance are always encrypted.'
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
            'label': 'S3 Secret Access Key', 'value': 'secretKey', 'type': 'password'
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
                            connections to plot.ly or your plotly instance are always encrypted.'
        }
    ]
};


export const LOGOS = {
    [DIALECTS.APACHE_SPARK]: 'images/spark-logo.png',
    [DIALECTS.APACHE_IMPALA]: 'images/impala-logo.png',
    [DIALECTS.IBM_DB2]: 'images/ibmdb2-logo.png',
    [DIALECTS.REDSHIFT]: 'images/redshift-logo.png',
    [DIALECTS.POSTGRES]: 'images/postgres-logo.png',
    [DIALECTS.ELASTICSEARCH]: 'images/elastic-logo.png',
    [DIALECTS.MYSQL]: 'images/mysql-logo.png',
    [DIALECTS.MARIADB]: 'images/mariadb-logo.png',
    [DIALECTS.MSSQL]: 'images/mssql-logo.png',
    [DIALECTS.SQLITE]: 'images/sqlite-logo.png',
    [DIALECTS.S3]: 'images/s3-logo.png',
    [DIALECTS.APACHE_DRILL]: 'images/apache_drill-logo.png',
    [DIALECTS.DATA_WORLD]: 'images/dataworld-logo.png',
    [DIALECTS.ATHENA]: 'images/athena-logo.png'
};

export function PREVIEW_QUERY (dialect, table, database = '') {
    switch (dialect) {
        case DIALECTS.IBM_DB2:
            return `SELECT * FROM ${table} FETCH FIRST 1000 ROWS ONLY`;
        case DIALECTS.APACHE_IMPALA:
        case DIALECTS.APACHE_SPARK:
        case DIALECTS.MYSQL:
        case DIALECTS.SQLITE:
        case DIALECTS.MARIADB:
        case DIALECTS.POSTGRES:
        case DIALECTS.DATA_WORLD:
        case DIALECTS.REDSHIFT:
        case DIALECTS.ATHENA:
            return `SELECT * FROM ${table} LIMIT 1000`;
        case DIALECTS.MSSQL:
            return 'SELECT TOP 1000 * FROM ' +
                `${database}.dbo.${table}`;
        case DIALECTS.ELASTICSEARCH:
            return JSON.stringify({
                index: database || '_all',
                type: table || '_all',
                body: {
                    query: { 'match_all': {} },
                    size: 1000
                }
            });
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
        a: 'Head over to the Plotly Forum for help from other Plotly users: \
            https://community.plot.ly/c/database-connector. For guaranteed prompt support by a Plotly engineer, \
            consider purchasing a plot.ly Pro plan or Plotly On-Premises: https://plot.ly/plans.'
    }, {
        q: 'How does this app work?',
        a: 'This app is a SQL client. Connect to your database in the Connection tab, run SQL queries in the \
            Query tab, then export your results as a CSV or share them online through plot.ly. Optionally, \
            you can run this app as a middleman between plot.ly and your database (see the next question).'
    }, {
        q: 'I want a persistent connection between my database and a chart hosted on plot.ly. How do I do that?',
        a: 'Click the link in the "PLOT.LY" tab. This will open the plot.ly chart studio with a connection to this \
            app. From there, you can run, save, and schedule queries that will update your charts on plot.ly when your \
            database updates. As long as this app stays open, it will send the latest data to plot.ly to update your \
            chart. Here is a tutorial on scheduling queries: https://help.plot.ly/database-connectors/schedule-query/'
    }, {
        q: 'Am I exposing my database credentials to plot.ly?',
        a: 'No. All of your credentials are only saved locally on this computer (the computer where the app is run). \
            We do not recommend uploading your database credentials to any cloud service.'
    }, {
        q: 'Where do I make SQL queries?',
        a: 'For one-shot queries, make them in this app (see the "QUERY" tab). If you want a persistent connection \
            between your charts and your database, make them in the plot.ly chart studio (see the "PLOT.LY" tab).'
    }, {
        q: 'Is this app open-source?',
        a: 'Yep! You can view and contribute to the source code on GitHub: \
            https://github.com/plotly/falcon-sql-client'
    }, {
        q: '[Advanced] How do scheduled queries work?',
        a: 'You can run queries on a scheduler (ie daily or hourly) through the plot.ly chart studio. \
            Scheduled queries are saved and run by this app, so keep this app open as long as you want \
            your charts and dashboards to update. When you restart this app, all of the scheduled \
            queries will run automatically and their scheduling timer will reset. We recommend setting up \
            this app on an office computer or server if you want it to update a chart or dashboard 24/7. \
            If you have Plotly On-Premises, you\'re in luck - this app is already running in your Plotly \
            On-Premises container. Contact your On-Prem admin to learn how to access it.'
    }, {
        q: '[Advanced] What\'s an SSL certificate (and why do I need one?)',
        a: 'An SSL certificate is used to encrypt the requests between your web browser and this \
            connector. Unencrypted requests are blocked by default in modern web browsers. \
            We generate these certificates for you automatically through Let\'s Encrypt. This \
            certificate takes several minutes to generate.'
    }, {
        q: '[Advanced] How do you generate certificates for a localhost web server?',
        a: 'This application runs a server locally on localhost: It is not exposed to the network. SSL \
            certificates cannot be issued for localhost servers, so we create a unique, local URL for you \
            and a global DNS entry that points that URL to localhost. We use Let\'s Encrypt \
            to generate certificates for that unique, local URL.'
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
    [DIALECTS.IBM_DB2]: {
        username: 'db2user1',
        password: 'w8wfy99DvEmgkBsE',
        database: 'plotly',
        port: 50000,
        host: 'db2.test.plotly.host',
        dialect: DIALECTS.IBM_DB2
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
        secretKey: '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',
        region: 'us-west-2',
        database: 'default',
        queryTimeout: 5000
    },
    [DIALECTS.DATA_WORLD]: {
        url: 'https://data.world/rflprr/reported-lyme-disease-cases-by-state'
    }
};
