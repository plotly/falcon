import Sequelize from 'sequelize';
import {parseSQL} from '../../parse';
import {dissoc, flatten, merge, mergeAll, values} from 'ramda';
import {DIALECTS} from '../../../app/constants/constants';
import Logger from '../../logger';

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


function createClient(connections) {
    const {
        username, password, database, port, dialect, storage, host, ssl
    } = connections;

    let options = {
        dialect, host, port, storage,
        dialectOptions: {ssl},
        logging: Logger.log,
        benchmark: true
    };

    if (dialect === 'redshift') {
        Sequelize.HSTORE.types.postgres.oids.push('dummy');
        options = merge(options, REDSHIFT_OPTIONS);
    } else if (dialect === 'mssql') {
        options.dialectOptions.encrypt = true;
    }

    return new Sequelize(
        database, username, password, options,
    );
}

export function connect(connections) {
    Logger.log('' +
        'Attempting to authenticate with connections ' +
        `${JSON.stringify(dissoc('password', connections), null, 2)} ` +
        '(password omitted)'
    );
    return createClient(connections).authenticate();
}

export function query(queryString, connections) {
    return createClient(connections).query(
        queryString,
        {type: Sequelize.QueryTypes.SELECT}
    ).then(results => parseSQL(results));
}

export function tables(connections) {
    return createClient(connections).query(
        SHOW_TABLES_QUERY[connections.dialect],
        {type: Sequelize.QueryTypes.SELECT}
    ).map(data => {
        return values(data);
    });
}
