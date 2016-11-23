export const BACKEND = {
    CONNECTOR_URL: 'connector.plot.ly',
    OPTIONS: {port: 5000}
};

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

export const CONNECTION_CONFIG = {
    [DIALECTS.MYSQL]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.MARIADB]: ['username', 'password', 'host', 'port', 'database'],
	[DIALECTS.MSSQL]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.POSTGRES]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.REDSHIFT]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.SQLITE]: ['storage'],
    // TODO - What are the actual elasticsearch connections options?
    [DIALECTS.ELASTICSEARCH]: ['username', 'password', 'host', 'port'],
    [DIALECTS.S3]: ['bucket', 'accessKeyId', 'secretAccessKey'],
    [DIALECTS.APACHE_DRILL]: [
        'host',
        'port',
        'bucket',
        'accessKeyId',
        'secretAccessKey'
    ] // TODO - password for apache drill?
};

// TODO - Combine this with the CONNECTION_CONFIG
export const CONNECTION_OPTIONS = {
    [DIALECTS.MYSQL]: ['ssl'],
    [DIALECTS.MARIADB]: ['ssl'],
	[DIALECTS.MSSQL]: ['ssl'],
    [DIALECTS.POSTGRES]: ['ssl'],
    [DIALECTS.REDSHIFT]: ['ssl'],
    [DIALECTS.ELASTICSEARCH]: [],
    [DIALECTS.SQLITE]: [],
    [DIALECTS.S3]: [],
    [DIALECTS.APACHE_DRILL]: []

};

export const LOGOS = {
    [DIALECTS.REDSHIFT]: './images/redshift-logo.png',
    [DIALECTS.POSTGRES]: './images/postgres-logo.png',
    [DIALECTS.ELASTICSEARCH]: './images/elastic-logo.png',
    [DIALECTS.MYSQL]: './images/mysql-logo.png',
    [DIALECTS.MARIADB]: './images/mariadb-logo.png',
    [DIALECTS.MSSQL]: './images/mssql-logo.png',
    [DIALECTS.SQLITE]: './images/sqlite-logo.png',
    [DIALECTS.S3]: './images/s3-logo.png',
    [DIALECTS.APACHE_DRILL]: './images/apache_drill-logo.png'
};


export const INITIAL_CREDENTIALS = {
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
