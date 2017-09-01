import {concat} from 'ramda';

export const DIALECTS = {
    APACHE_LIVY: 'apache livy',
    IBM_DB2: 'ibm db2',
    MYSQL: 'mysql',
    MARIADB: 'mariadb',
    POSTGRES: 'postgres',
    REDSHIFT: 'redshift',
    ELASTICSEARCH: 'elasticsearch',
    MSSQL: 'mssql',
    SQLITE: 'sqlite',
    S3: 's3',
    APACHE_DRILL: 'apache drill'
};

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

export const CONNECTION_CONFIG = {
    [DIALECTS.APACHE_LIVY]: [
        {'label': 'Username', 'value': 'username', 'type': 'text'},
        {'label': 'Host', 'value': 'host', 'type': 'text' },
        {'label': 'Port', 'value': 'port', 'type': 'number'},
        {'label': 'Database', 'value': 'database', 'type': 'text'},
        {'label': 'Timeout', 'value': 'timeout', 'type': 'number', 'description': 'Number of seconds for a request to timeout.'}
    ],
    [DIALECTS.IBM_DB2]: commonSqlOptions,
    [DIALECTS.MYSQL]: commonSqlOptions,
    [DIALECTS.MARIADB]: commonSqlOptions,
	[DIALECTS.MSSQL]: concat(
        commonSqlOptions, [
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
    ] // TODO - password options for apache drill
};


export const LOGOS = {
    [DIALECTS.APACHE_LIVY]: 'images/livy-logo.png',
    [DIALECTS.IBM_DB2]: 'images/ibmdb2-logo.png',
    [DIALECTS.REDSHIFT]: 'images/redshift-logo.png',
    [DIALECTS.POSTGRES]: 'images/postgres-logo.png',
    [DIALECTS.ELASTICSEARCH]: 'images/elastic-logo.png',
    [DIALECTS.MYSQL]: 'images/mysql-logo.png',
    [DIALECTS.MARIADB]: 'images/mariadb-logo.png',
    [DIALECTS.MSSQL]: 'images/mssql-logo.png',
    [DIALECTS.SQLITE]: 'images/sqlite-logo.png',
    [DIALECTS.S3]: 'images/s3-logo.png',
    [DIALECTS.APACHE_DRILL]: 'images/apache_drill-logo.png'
};


export const INITIAL_CONNECTIONS = {
    username: '',
    password: '',
    database: '',
    index: '',
    doc: '',
    dialect: DIALECTS.MYSQL,
    port: '',
    host: '',
    ssl: false
};

export const FAQ = [
    {
        q: 'How does this app work?',
        a: 'This app listens for query requests from the plot.ly online chart editor. This application \
            queries the databases to which you have connected, then returns the results to plot.ly where \
            you can compose charts and dashbords with the data.'
    }, {
        q: 'Do I need this application open while making database queries?',
        a: 'Yes, keep this application open while making queries from within plot.ly.'
    }, {
        q: 'Do I need to expose my database to plot.ly?',
        a: 'No. Since this app sits between plot.ly and your database, you just need to make sure that you \
            can connect to your database from the computer or server this app is running on.'
    }, {
        q: 'Where do I make SQL queries?',
        a: 'The online plot.ly chart editor includes an SQL editor that you can use to import data from \
            your databases into Plotly. You can access the chart editor at plot.ly/create?upload=sql'
    }, {
        q: 'Are these database credentials shared on the Plotly server?',
        a: 'Your database credentials are only stored on your computer (they are not saved on any Plotly \
            servers). We do not recommmend giving your database credentials to any online service.'
    }, {
        q: 'Is this app open-source?',
        a: 'Yep! You can view and contribute to the code on GitHub: \
            https://github.com/plotly/plotly-database-connector.'
    }, {        
        q: '[Advanced] Can I schedule queries?',
        a: 'You can set queries to runon a scheduler (ie daily or hourly) from the plot.ly online chart editor. ' +
            'Scheduled queries are saved and managed by this application, so keep this app open ' +
            'if you want your queries to run and your datasets to update. When you restart this ' +
            'application, all of the scheduled queries will run automatically and their scheduling ' +
            'timer will reset.'
    }, {
        q: '[Advanced] What\'s an SSL certificate (and why do I need it?)',
        a: 'An SSL certificate is used to encrypt the requests between your web browser and this ' +
            'connector. Unencrypted requests are blocked by default in modern web browsers. ' +
            'We generate these certificates for you automatically through Let\'s Encrypt. ' +
            'This certificate takes a several minutes to generate.'
    }, {
        q: '[Advanced] How do you generate certificates for a localhost web server?',
        a: 'This application runs a server on localhost: it is not exposed to the network. SSL ' +
            'certificates cannot be issued for localhost servers, so we create a unique URL for you  ' +
            'and a global DNS entry that points that URL to localhost. We use Let\'s Encrypt ' +
            'to generate certificates on that unique URL.' 
    }                  
];

export const SAMPLE_DBS = {
    [DIALECTS.APACHE_LIVY]: {
        timeout: 180,
        username: 'user',
        database: 'plotly',
        port: 8998,
        host: '104.198.64.55',
        dialect: DIALECTS.APACHE_LIVY
    },
    [DIALECTS.IBM_DB2]: {
        username: 'db2user1',
        password: 'w8wfy99DvEmgkBsE',
        database: 'plotly',
        port: 50000,
        host: '104.197.158.0',
        dialect: DIALECTS.IBM_DB2
    },
    postgres: {
        username: 'masteruser',
        password: 'connecttoplotly',
        database: 'plotly_datasets',
        port: 5432,
        host: 'readonly-test-postgres.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
        dialect: 'postgres'
    },
    mysql: {
        dialect: 'mysql',
        username: 'masteruser',
        password: 'connecttoplotly',
        host: 'readonly-test-mysql.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
        port: 3306,
        database: 'plotly_datasets'
    },
    mariadb: {
        dialect: 'mariadb',
        username: 'masteruser',
        password: 'connecttoplotly',
        host: 'readonly-test-mariadb.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
        port: 3306,
        database: 'plotly_datasets'
    },
    redshift: {
        dialect: 'redshift',
        username: 'plotly',
        password: 'Qmbdf#3DU]pP8a=CKTK}',
        host: 'sql-connector-test.cfiaqtidutxu.us-east-1.redshift.amazonaws.com',
        port: 5439,
        database: 'plotly_datasets'
    },
    mssql: {
        dialect: 'mssql',
        username: 'masteruser',
        password: 'connecttoplotly',
        host: 'test-mssql.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
        port: 1433,
        database: 'plotly_datasets'
    },
    elasticsearch: {
        dialect: 'elasticsearch',
        host: 'https://67a7441549120daa2dbeef8ac4f5bb2e.us-east-1.aws.found.io',
        port: '9243'
    },
    s3: {
        dialect: 's3',
        bucket: 'plotly-s3-connector-test',
        accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
        secretAccessKey: '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'
    },
    'apache drill': {
        dialect: 'apache drill',
        host: 'http://ec2-35-164-71-216.us-west-2.compute.amazonaws.com',
        port: 8047,

        bucket: 'plotly-s3-connector-test',
        accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
        secretAccessKey: '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'
    },
    sqlite: {
        dialect: 'sqlite',
        storage: `${__dirname}/plotly_datasets.db`
    }
}
