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
    SQLITE: 'sqlite'
};

export const APP_STATUS = {
    INITIALIZED: 'INITIALIZED',
    CON_ERROR: 'CON_ERROR',
    ERROR: 'ERROR',
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED'
};

export const CONNETION_CONFIG = {
    [DIALECTS.MYSQL]: ['username', 'password', 'host', 'port'],
    [DIALECTS.MARIADB]: ['username', 'password', 'host', 'port'],
	[DIALECTS.MSSQL]: ['username', 'password', 'host', 'port'],
    [DIALECTS.POSTGRES]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.REDSHIFT]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.ELASTICSEARCH]: ['username', 'password', 'host', 'port'],
    [DIALECTS.SQLITE]: ['storage']
};

export const CONNETION_OPTIONS = {
    [DIALECTS.MYSQL]: ['ssl'],
    [DIALECTS.MARIADB]: ['ssl'],
	[DIALECTS.MSSQL]: ['ssl'],
    [DIALECTS.POSTGRES]: ['ssl'],
    [DIALECTS.REDSHIFT]: ['ssl'],
    [DIALECTS.ELASTICSEARCH]: [],
    [DIALECTS.SQLITE]: []
};

export const BUTTON_MESSAGE = {
    INITIALIZED: 'connect',
    CON_ERROR: 'try again',
    ERROR: 'connected',
    CONNECTED: 'connected',
    CONNECTING: 'connecting...',
    DISCONNECTED: 'connect'
};

export const EMPTY_SESSION =
{
    CONFIGURATION: {
        username: '',
        password: '',
        database: '',
        dialect: DIALECTS.MYSQL,
        port: '',
        storage: '',
        host: '',
        ssl: false
    },
    CONNECTION: {status: APP_STATUS.INITIALIZED}
};
