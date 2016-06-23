import Sequelize from 'sequelize';
import {DIALECTS} from './app/components/Settings/Constants/SupportedDialects.react';
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

const EMPTY_TABLE = {
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

function assembleTablesPreviewMessage(tablePreviews) {
    /*
        topRows is an array of one or many responses of top 5 rows queries
        [ {'table1':[top5rows]}, {'table2': [top5rows]} ...]
    */
    let parsedRows;
    return tablePreviews.map( (tablePreview) => {
        const tableName = Object.keys(tablePreview);
        const rawData = tablePreview[tableName];

        if (isEmpty(rawData)) {
            parsedRows = EMPTY_TABLE;
        } else {
            parsedRows = parse(rawData);
        }
        return {[tableName]: parsedRows};
    });
}

export default class SequelizeManager {
    constructor(log) {
        this.log = log;
    }

    getDialect() {
        return this.connection.options.dialect;
    }

    setQueryType(type) {
        // type = SELECT for `SELECT` query
        return {type: this.connection.QueryTypes[type]};
    }

    intoTablesArray(results) {
        let tables;
        if (this.getDialect() === DIALECTS.SQLITE) {
            // sqlite returns an array by default
            tables = results;
        } else {
            // others return list of objects
            tables = intoArray(results);
        }
        return tables;
    }

    login({username, password, database, port, dialect, storage, host}) {
        this.connection = new Sequelize(database, username, password, {
            dialect,
            host,
            port,
            storage
        });

        if (this.connection.config.dialect === 'mssql') {
            this.connection.config.dialectOptions = {encrypt: true};
        }

        return this.connection.authenticate();
    }

    check_connection() {
        // when already logged in and simply want to check connection
        return this.connection.authenticate();
    }

    raiseError(errorMessage, callback) {
        const errorLog = merge(errorMessage, {timestamp: timestamp()});
        callback({error: errorLog});
    }

    // built-in query to show available databases/schemes
    showDatabases(callback) {
        // constants for cleaner code
        const query = this.getPresetQuery(PREBUILT_QUERY.SHOW_DATABASES);
        const dialect = this.getDialect();

        // deal with sqlite -> has no databases list
        if (dialect === DIALECTS.SQLITE) {
            callback({
                databases: ['SQLITE database accessed'],
                error: null,
                tables: null
            });
            // skip SHOW_DATABASES query and send SHOW_TABLES query right away
            return this.showTables(callback);
        }

        return () => this.connection.query(query, this.setQueryType('SELECT'))
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
        const showtables = this.getPresetQuery(PREBUILT_QUERY.SHOW_TABLES);
        const dialect = this.getDialect();

        return () => this.connection.query(showtables, this.setQueryType('SELECT'))
            .then(results => {
                const tables = this.intoTablesArray(results);

                const promises = tables.map(table => {
                    const show5rows = this.getPresetQuery(
                        PREBUILT_QUERY.SHOW5ROWS, table
                    );

                    return this.connection.query(show5rows, this.setQueryType('SELECT'))
                        .then(selectTableResults => {
                            return {
                                [table]: selectTableResults
                            };
                        });
                });

                return Promise.all(promises)
                    .then(tablePreviews => {
                        callback({
                            error: null,
                            tables: assembleTablesPreviewMessage(tablePreviews)
                        });

                });
            });
    }

    sendQuery(query, callback) {
        // TODO: SQL Injection security hole
        return this.connection.query(query, this.setQueryType('SELECT'))
            .then((results) => {
                callback(parse(results));
            });
    }

    disconnect(callback) {
        /*
            this.connection.close() does not return a promise for now.
            open issue here:
            https://github.com/sequelize/sequelize/pull/5776
        */

        this.connection.close();
        callback({databases: null, error: null, tables: null});
    }

    getPresetQuery(showQuerySelector, table = null) {
        const dialect = this.connection.options.dialect;
        switch (showQuerySelector) {
            case PREBUILT_QUERY.SHOW_DATABASES:
                switch (dialect) {
                    case DIALECTS.MYSQL:
                    case DIALECTS.SQLITE:
                    case DIALECTS.MARIADB:
                        return 'SHOW DATABASES';
                    case DIALECTS.POSTGRES:
                        return 'SELECT datname AS database FROM ' +
                        'pg_database WHERE datistemplate = false;';
                    case DIALECTS.MSSQL:
                        return 'SELECT name FROM Sys.Databases';
                    default:
                        throw new Error('could not build a presetQuery');
                }

            case PREBUILT_QUERY.SHOW_TABLES:
                switch (dialect) {
                    case DIALECTS.MYSQL:
                    case DIALECTS.MARIADB:
                        return 'SHOW TABLES';
                    case DIALECTS.POSTGRES:
                        return 'SELECT table_name FROM ' +
                            'information_schema.tables WHERE ' +
                            'table_schema = \'public\'';
                    case DIALECTS.MSSQL:
                        return 'SELECT TABLE_NAME FROM ' +
                            'information_schema.tables';
                    case DIALECTS.SQLITE:
                        return 'SELECT name FROM ' +
                        'sqlite_master WHERE type="table"';
                    default:
                        throw new Error('could not build a presetQuery');
                }

            case PREBUILT_QUERY.SHOW5ROWS:
                switch (dialect) {
                    case DIALECTS.MYSQL:
                    case DIALECTS.SQLITE:
                    case DIALECTS.MARIADB:
                    case DIALECTS.POSTGRES:
                        return `SELECT * FROM ${table} LIMIT 5`;
                    case DIALECTS.MSSQL:
                        return 'SELECT TOP 5 * FROM ' +
                            `${this.connection.config.database}.dbo.${table}`;
                    default:
                        throw new Error('could not build a presetQuery');
                }
        }
    }
}
