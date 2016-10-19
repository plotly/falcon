import Sequelize from 'sequelize';
import {parseSQL} from '../../parse';
import {merge} from 'ramda';

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
