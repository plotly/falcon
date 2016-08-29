export const DIALECTS = {
    MYSQL: 'mysql',
    MARIADB: 'mariadb',
    POSTGRES: 'postgres',
    MSSQL: 'mssql',
    REDSHIFT: 'redshift',
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

export const USER_INPUT_FIELDS = {
    [DIALECTS.MYSQL]: ['username', 'password', 'host', 'port'],
    [DIALECTS.MARIADB]: ['username', 'password', 'host', 'port'],
	[DIALECTS.MSSQL]: ['username', 'password', 'host', 'port'],
    [DIALECTS.POSTGRES]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.REDSHIFT]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.SQLITE]: ['storage']
};

export const BUTTON_MESSAGE = {
    INITIALIZED: 'connect',
    CON_ERROR: 'try again',
    ERROR: 'connected',
    CONNECTED: 'connected',
    CONNECTING: 'connecting...',
    DISCONNECTED: 'connect'
};
