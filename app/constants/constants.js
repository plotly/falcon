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
        'description': 'Check if your database is built with SSL support. Note that this is different than the SSL connection that Plotly initializes for you automatically.'}
];
export const CONNECTION_CONFIG = {
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
