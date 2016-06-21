export const ENGINES = {
    MYSQL: 'mysql',
    MARIADB: 'mariadb',
    POSTGRES: 'postgres',
    MSSQL: 'mssql',
    SQLITE: 'sqlite'
};

export const APP_STATUS_CONSTANTS = {
    INITIALIZED: 'INITIALIZED',
    ERROR: 'ERROR',
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED'
};

export const USER_INPUT_FIELDS = {
    [ENGINES.MYSQL]: ['username', 'password', 'host', 'port'],
    [ENGINES.MARIADB]: ['username', 'password', 'host', 'port'],
	[ENGINES.MSSQL]: ['username', 'password', 'host', 'port'],
    [ENGINES.POSTGRES]: ['username', 'password', 'host', 'port', 'database'],
    [ENGINES.SQLITE]: ['storage']
};

export const BUTTON_MESSAGE = {
    INITIALIZED: 'connect',
    ERROR: 'try again',
    CONNECTED: 'connected',
    CONNECTING: 'connecting...',
    DISCONNECTED: 'connect'
};
