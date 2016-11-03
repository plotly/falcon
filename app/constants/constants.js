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
    [DIALECTS.MYSQL]: ['username', 'password', 'host', 'port'],
    [DIALECTS.MARIADB]: ['username', 'password', 'host', 'port'],
	[DIALECTS.MSSQL]: ['username', 'password', 'host', 'port'],
    [DIALECTS.POSTGRES]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.REDSHIFT]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.SQLITE]: ['storage'],
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
    REDSHIFT: './images/redshift-logo.png',
    POSTGRES: './images/postgres-logo.png',
    ELASTICSEARCH: './images/elastic-logo.png',
    MYSQL: './images/mysql-logo.png',
    MARIADB: './images/mariadb-logo.png',
    MSSQL: './images/mssql-logo.png',
    SQLITE: './images/sqlite-logo.png',
    S3: './images/sqlite-logo.png',
    APACHE_DRILL: './images/sqlite-logo.png'
};
