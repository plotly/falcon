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
    ).then(results => {
        return parseSQL(results);
    });
}

export function tables(connection) {
    const {dialect} = connection;

    const SHOW_TABLES_QUERY = {
        [DIALECTS.MYSQL]: 'SHOW TABLES',
        [DIALECTS.MARIADB]: 'SHOW TABLES',
        [DIALECTS.SQLITE]: 'SELECT name FROM sqlite_master WHERE type="table"',
        [DIALECTS.MSSQL]: `
            SELECT '"' + table_schema + '"."' + table_name + '"'
            FROM information_schema.tables
            ORDER BY table_schema, table_name
        `,
        [DIALECTS.POSTGRES]: `
            SELECT table_schema || '."' || table_name || '"'
            FROM information_schema.tables
            WHERE table_type != 'VIEW'
               AND table_schema != 'pg_catalog'
               AND table_schema != 'information_schema'
            ORDER BY table_schema, table_name
        `,
        [DIALECTS.REDSHIFT]: `
            SELECT table_schema || '."'  || table_name || '"'
            FROM information_schema.tables
            WHERE table_type != 'VIEW'
               AND table_schema != 'pg_catalog'
               AND table_schema != 'information_schema'
            ORDER BY table_schema, table_name
        `
    };

    return createClient(connection).query(
        SHOW_TABLES_QUERY[dialect],
        {type: Sequelize.QueryTypes.SELECT}
    ).then(tableList => {

        let tableNames;

        if (dialect === 'postgres' || dialect === 'redshift') {
            tableNames = tableList.map(data => {
                let tableName = String(data['?column?']);

                // if schema is public, remove it from table name
                if (tableName.startsWith('public.')) {
                    tableName = tableName.substring(7);

                    // if table name is lowercase, remove unnecessary quote marks
                    const lowercase = tableName.toLowerCase();
                    if (tableName === lowercase) {
                        tableName = lowercase.substring(1, lowercase.length - 1);
                    }
                }

                return tableName;
            });
        } else if (dialect === 'sqlite') {
            tableNames = tableList;
        } else {
            tableNames = tableList.map(object => values(object)[0]);
        }

        return uniq(sort((a, b) => gt(a, b) ? 1 : -1, tableNames));

    });
}

export function schemas(connection) {
    const {database, dialect} = connection;

    let queryString;
    switch (dialect) {
        case DIALECTS.MYSQL:
        case DIALECTS.MARIADB:
            queryString = `
                SELECT table_name, column_name, data_type
                FROM information_schema.columns
                WHERE table_schema = '${database}'
                ORDER BY table_name
            `;
            break;
        case DIALECTS.SQLITE:
            return sqlite_schemas(connection);
        case DIALECTS.POSTGRES:
        case DIALECTS.REDSHIFT:
            queryString = `
                SELECT table_schema || '."' || table_name || '"', column_name, data_type
                FROM information_schema.columns
                WHERE table_catalog = '${database}'
                    AND table_schema != 'pg_catalog'
                    AND table_schema != 'information_schema'
                ORDER BY table_schema, table_name, column_name
            `;
            break;
        case DIALECTS.MSSQL:
            queryString = `
                SELECT '"' + table_schema + '"."' + table_name + '"', column_name, data_type
                FROM information_schema.columns
                ORDER BY table_schema, table_name, column_name
            `;
            break;
        default:
            throw new Error(`Dialect ${dialect} is not one of the SQL DIALECTS`);
    }

    return query(queryString, connection);
}

function sqlite_schemas(connection) {
    // Unfortunately, we need to make one query per table
    return tables(connection).then(tableNames => {
        const queries = tableNames.map(tableName => {
            return createClient(connection).query(
                `PRAGMA table_info(${tableName})`,
                {type: Sequelize.QueryTypes.SELECT}
            );
        });

        return Promise.all(queries).then(responses => {
            const schemasResponse = {
                columnnames: ['table_name', 'column_name', 'data_type'],
                rows: []
            };

            responses.forEach((response, index) => {
                const tableName = tableNames[index];
                response.forEach(row => {
                    schemasResponse.rows.push([
                        tableName,
                        row.name,
                        row.type
                    ]);
                });
            });

            return schemasResponse;
        });
    });
}
