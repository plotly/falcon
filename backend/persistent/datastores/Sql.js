import Sequelize from 'sequelize';
import {parseSQL} from '../../parse';
import {
     contains,
     dissoc,
     flatten,
     gt,
     has,
     merge,
     mergeAll,
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
    ),
    [DIALECTS.REDSHIFT]: (
        'SELECT table_name FROM ' +
        'information_schema.tables WHERE ' +
        'table_schema = \'public\''
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
         const trimmedInstanceName = trim(connection.instanceName);
         if (trimmedInstanceName) {
              /*
               * port is mutually exclusive with instance name
               * see https://github.com/sequelize/sequelize/issues/3097
               */
              options = omit(['port'], options);
              options.dialectOptions.instanceName = trimmedInstanceName;
        }
        options.dialectOptions.encrypt = true;
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
    } else {
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
        })
    }

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

        if (contains(connection.dialect, ['postgres', 'redshift'])) {
            tableNames = tableList.map(data => {
                return data[0]
            });
        } else if(connection.dialect === 'sqlite'){
            tableNames = tableList;
        } else {
            tableNames = tableList.map(object => values(object)[0]);
        }

        return uniq(sort((a, b) => gt(a, b) ? 1 : -1, tableNames));

    });

}
