import Sequelize from 'sequelize';
import {parseSQL} from '../../parse';
import {merge} from 'ramda';
import {DIALECTS} from '../../../app/constants/constants';

// http://stackoverflow.com/questions/32037385/using-sequelize-with-redshift
const REDSHIFT_OPTIONS = {
    dialect: 'postgres',
    pool: false,
    keepDefaultTimezone: true,  // avoid SET TIMEZONE
    databaseVersion: '8.0.2',   // avoid SHOW SERVER_VERSION
    dialectOptions: {
        ssl: true
    }
};

const SHOW_DATABASES_QUERY = {
    [DIALECTS.MYSQL]: 'SHOW DATABASES',
    [DIALECTS.SQLITE]: 'SHOW DATABASES',
    [DIALECTS.MARIADB]: 'SHOW DATABASES',
    [DIALECTS.POSTGRES]: 'SELECT datname AS database FROM pg_database WHERE datistemplate = false;',
    [DIALECTS.MSSQL]: 'SELECT name FROM Sys.Databases'
};

const SHOW_TABLES_QUERY = {
    [DIALECTS.MYSQL]: 'SHOW TABLES',
    [DIALECTS.MARIADB]: 'SHOW TABLES',
    [DIALECTS.SQLITE]: 'SELECT name FROM sqlite_master WHERE type="table"',
    [DIALECTS.POSTGRES]: (
        'SELECT table_name FROM ' +
        'information_schema.tables WHERE ' +
        'table_schema = \'public\''
    ),
    [DIALECTS.MSSQL]: (
        'SELECT TABLE_NAME FROM ' +
        'information_schema.tables'
    )
};


function createClient(credentials) {
    const {
        username, password, database, port, dialect, storage, host, ssl
    } = credentials;

    let options = {
        dialect, host, port, storage,
        dialectOptions: {ssl}
    };
    if (dialect === 'redshift') {
        Sequelize.HSTORE.types.postgres.oids.push('dummy');
        options = merge(options, REDSHIFT_OPTIONS);
    } else if (dialect === 'mssql') {
        options.dialectOptions.encrypt = true;
    }

    return new Sequelize(
        database, username, password, options
    );
}

export function connect(credentials) {
    return createClient(credentials).authenticate();
}

export function query(queryString, credentials) {
    return createClient(credentials).query(
        queryString,
        {type: Sequelize.QueryTypes.SELECT}
    ).then(results => parseSQL(results));
}

export function tables(credentials, database) {
    // TODO - Should databases be saved as part of credentials or not?
    return createClient(merge(credentials, {database})).query(
        SHOW_TABLES_QUERY[credentials.dialect],
        {type: Sequelize.QueryTypes.SELECT}
    ).map(data => data[0]);
}

export function databases(credentials) {
    return createClient(credentials).query(
        SHOW_DATABASES_QUERY[credentials.dialect],
        {type: Sequelize.QueryTypes.SELECT}
    ).map(data => data.database);
}
// TODO ^^ Test against all databases
