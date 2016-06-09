import Sequelize from 'sequelize';
import parse from './parse';
import {merge} from 'ramda';

const PREBUILT_QUERY = {
    SHOW_DATABASES: 'SHOW_DATABASES',
    SHOW_TABLES: 'SHOW_TABLES',
    SHOW5ROWS: 'SHOW5ROWS'
};

const timestamp = () => (new Date()).toTimeString();
const emptyTableLog = (table) => {
    return `NOTE: table [${table}] seems to be empty`;
};
const emptyTable = {
    columnnames: ['NA'],
    rows: [['empty table']],
    ncols: 1,
    nrows: 1
};
const isEmpty = (table) => {
    return table.length === 0;
};
const intoArray = (objects) => {
    return objects.map(obj => obj[Object.keys(obj)]);
};


export default class SequelizeManager {
    constructor(log) {
        // TODO: can respondEvent be part of the class?
        this.log = log;
    }

    login({username, password, database, portNumber, engine, databasePath, server}, callback) {
        // create new sequelize object
        this.connection = new Sequelize(database, username, password, {
            dialect: engine,
            host: server,
            port: portNumber,
            storage: databasePath
        });

        if (this.connection.config.dialect === 'mssql') {
            this.connection.config.dialectOptions = {encrypt: true};
        }

        // returns a message promise from the database
        return this.connection.authenticate().then((message) => {
            callback(message);
        });
    }

    raiseErrorLog(error) {
        this.log(merge(error, {timestamp: timestamp()}));
    }

    // built-in query to show available databases/schemes
    showDatabases(callback) {
        // constants for cleaner code
        const noMetaData = this.connection.QueryTypes.SELECT;
        const query = this.getPresetQuery(PREBUILT_QUERY.SHOW_DATABASES);
        const dialect = this.connection.options.dialect;

        // deal with sqlite -> has no databases list
        if (dialect === 'sqlite') {
            callback({
                databases: ['SQLITE database accessed'],
                error: null,
                tables: null
            });
            // skip SHOW_DATABASES query and send SHOW_TABLES query right away
            return this.showTables(callback);
        }

        return this.connection.query(query, {type: noMetaData})
            .then(results => {
                callback({
                    databases: intoArray(results),
                    error: null,
                    /*
                        if user wants to see all databases/schemes, clear
                        tables from previously selected database/schemes
                    */
                    tables: null
                });
            });
    }

    // built-in query to show available tables in a database/scheme
    showTables(callback) {
        // constants for cleaner code
        const noMetaData = this.connection.QueryTypes.SELECT;
        const query = this.getPresetQuery(PREBUILT_QUERY.SHOW_TABLES);
        const dialect = this.connection.options.dialect;

        return this.connection.query(query, {type: noMetaData})
            .then(results => {
                let tables;
                if (dialect === 'sqlite') {
                    // sqlite returns an array by default
                    tables = results;
                } else {
                    // others return list of objects
                    tables = intoArray(results);
                }

                const promises = tables.map(table => {
                    const query = this.getPresetQuery(
                        PREBUILT_QUERY.SHOW5ROWS, table
                    );
                    this.log(ipc, query);
                    return this.connection.query(query, {type: noMetaData});
                });

                return Promise.all(promises).then(selectTableResults => {
                    let parsedRows;
                    if (isEmpty(selectTableResults)) {
                        parsedRows = emptyTable;

                        // we will probably keep this log statements in here
                        this.log(respondEvent, emptyTableLog(table));

                    } else {
                        parsedRows = parse(selectTableResults);
                    }
                    callback({
                        error: null,
                        [table]: parsedRows
                    });

                });
            });
    }

    sendQuery(respondEvent, query) {
        // TODO: SQL Injection security hole
        return this.connection.query(query)
            .then((results, metadata) => {
                callback({
                    error: null,
                    rows: parse(results)
                });
            });
    }

    disconnect(respondEvent, callback) {
        /*
            does not return a promise for now. open issue here:
            https://github.com/sequelize/sequelize/pull/5776
        */
        this.connection.close();
        callback({
            databases: null,
            error: null,
            rows: null,
            tables: null
        });
    }

    getPresetQuery(showQuerySelector, table = null) {
        const dialect = this.connection.options.dialect;
        switch (showQuerySelector) {
            case PREBUILT_QUERY.SHOW_DATABASES:
                switch (dialect) {
                    case 'mysql':
                    case 'sqlite':
                    case 'mariadb':
                        return 'SHOW DATABASES';
                    case 'postgres':
                        return 'SELECT datname AS database FROM ' +
                        'pg_database WHERE datistemplate = false;';
                    case 'mssql':
                        return 'SELECT name FROM Sys.Databases';
                    default:
                        throw new Error('could not build a presetQuery');
                }

            case PREBUILT_QUERY.SHOW_TABLES:
                switch (dialect) {
                    case 'mysql':
                    case 'mariadb':
                        return 'SHOW TABLES';
                    case 'postgres':
                        return 'SELECT table_name FROM ' +
                            'information_schema.tables WHERE ' +
                            'table_schema = \'public\'';
                    case 'mssql':
                        return 'SELECT TABLE_NAME FROM ' +
                            'information_schema.tables';
                    case 'sqlite':
                        return 'SELECT name FROM ' +
                        'sqlite_master WHERE type="table"';
                    default:
                        throw new Error('could not build a presetQuery');
                }

            case PREBUILT_QUERY.SHOW5ROWS:
                switch (dialect) {
                    case 'mysql':
                    case 'sqlite':
                    case 'mariadb':
                    case 'postgres':
                        return `SELECT * FROM ${table} LIMIT 5`;
                    case 'mssql':
                        return 'SELECT TOP 5 * FROM ' +
                            `${this.connection.config.database}.dbo.${table}`;
                    default:
                        throw new Error('could not build a presetQuery');
                }
        }
    }
}
