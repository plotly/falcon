import Sequelize from 'sequelize';
import {parseSQL} from '../../parse';
import {
    dissoc,
    gt,
    has,
    merge,
    omit,
    sort,
    trim,
    uniq,
    values
} from 'ramda';
import {DIALECTS} from '../../../app/constants/constants';
import Logger from '../../logger';
import fs from 'fs';

// http://stackoverflow.com/questions/32037385/using-sequelize-with-redshift
const REDSHIFT_OPTIONS = {
    dialect: 'postgres',
    pool: false,
    keepDefaultTimezone: true, // avoid SET TIMEZONE
    databaseVersion: '8.0.2', // avoid SHOW SERVER_VERSION
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
    ),
    [DIALECTS.REDSHIFT]: (
        'SELECT table_schema || \'.\'  || table_name FROM ' +
        'information_schema.tables ' +
        'WHERE table_type != \'VIEW\' and ' +
        'table_schema != \'pg_catalog\' and ' +
        'table_schema != \'information_schema\''
    )
};


function createClient(connection) {
    const {
        username, password, database, port, dialect, storage, host, ssl
    } = connection;

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
        /*
         * See all options here:
         * http://tediousjs.github.io/tedious/api-connection.html
         */
        options.dialectOptions.encrypt = connection.encrypt;
        const trimmedInstanceName = trim(connection.instanceName || '');
        if (trimmedInstanceName) {
            /*
             * port is mutually exclusive with instance name
             * see https://github.com/sequelize/sequelize/issues/3097
             */
            options = omit(['port'], options);
            options.dialectOptions.instanceName = trimmedInstanceName;
        }
        ['connectTimeout', 'requestTimeout'].forEach(timeoutSetting => {
            if (has(timeoutSetting, connection) &&
                !isNaN(parseInt(connection[timeoutSetting], 10))) {
                options.dialectOptions[timeoutSetting] =
                    connection[timeoutSetting];
            }
        });
    }

    return new Sequelize(
        database, username, password, options,
    );
}

export function connect(connection) {
    Logger.log('' +
        'Attempting to authenticate with connection ' +
        `${JSON.stringify(dissoc('password', connection), null, 2)} ` +
        '(password omitted)'
    );
    if (connection.dialect !== 'sqlite') {
        return createClient(connection).authenticate();
    }

    /*
     * sqlite's createClient will create a sqlite file even if it
     * doesn't exist. that means that bad storage parameters won't
     * reject. Instead of trying `authenticate`, just check if
     * the file exists.
     */
    return new Promise(function(resolve, reject) {
        if (fs.existsSync(connection.storage)) {
            resolve();
        } else {
            reject(new Error(`SQLite file at path "${connection.storage}" does not exist.`));
        }
    });
}

export function query(queryString, connection) {
    return createClient(connection).query(
        queryString,
        {type: Sequelize.QueryTypes.SELECT}
    ).then(results => parseSQL(results));
}

export function tables(connection) {
    return createClient(connection).query(
        SHOW_TABLES_QUERY[connection.dialect],
        {type: Sequelize.QueryTypes.SELECT}
    ).then(tableList => {

        let tableNames;

        if (connection.dialect === 'redshift') {
            tableNames = tableList.map(data => {
                return data['?column?'];
            });
        } else if (connection.dialect === 'postgres') {
            tableNames = tableList.map(data => {
                return data[0];
            });
        } else if (connection.dialect === 'sqlite') {
            tableNames = tableList;
        } else {
            tableNames = tableList.map(object => values(object)[0]);
        }

        return uniq(sort((a, b) => gt(a, b) ? 1 : -1, tableNames));

    });
}

export function schemas(connection) {
    const {database, dialect} = connection;

    // Suppressing ESLint cause single quote strings beside template strings
    // would be inconvenient when changed queries
    /* eslint-disable quotes */
    let queryString;
    switch (dialect) {
        case DIALECTS.MYSQL:
        case DIALECTS.SQLITE:
        case DIALECTS.MARIADB:
            queryString = `SELECT table_name, column_name, data_type FROM information_schema.columns ` +
                `WHERE table_schema = '${database}' ORDER BY table_name`;
            break;
        case DIALECTS.POSTGRES:
            queryString = `SELECT table_name, column_name, data_type FROM information_schema.columns ` +
                `WHERE table_catalog = '${database}' AND table_schema = 'public' ORDER BY table_name`;
            break;
        case DIALECTS.REDSHIFT:
            queryString = `SELECT tablename, "column", "type" FROM pg_table_def WHERE schemaname = 'public';`;
            break;
        case DIALECTS.MSSQL:
            queryString =
                `SELECT T.name AS Table_Name, C.name AS Column_Name, P.name AS Data_Type, ` +
                `   P.max_length AS Size, ` +
                `   CAST(P.precision AS VARCHAR) + '/' + CAST(P.scale AS VARCHAR) AS Precision_Scale ` +
                `FROM sys.objects AS T ` +
                `   JOIN sys.columns AS C ON T.object_id = C.object_id ` +
                `   JOIN sys.types AS P ON C.system_type_id = P.system_type_id ` +
                `WHERE T.type_desc = 'USER_TABLE';`;
            break;
        default:
            throw new Error(`Dialect ${dialect} is not one of the SQL DIALECTS`);
    }
    /* eslint-enable quotes */

    return query(queryString, connection);
}
