import * as fs from 'fs';
import Sequelize from 'sequelize';
import {DIALECTS} from './app/constants/constants';
import parse from './parse';
import {merge} from 'ramda';
import {ARGS} from './args';

const APP_NOT_CONNECTED_MESSAGE = 'There seems to be no connection at the ' +
    'moment. Please try connecting the application to your database.';

const PREBUILT_QUERY = {
    SHOW_DATABASES: 'SHOW_DATABASES',
    SHOW_TABLES: 'SHOW_TABLES',
    SHOW5ROWS: 'SHOW5ROWS'
};

const timestamp = () => (new Date()).toTimeString();

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

        parsedRows = (isEmpty(rawData)) ? EMPTY_TABLE : parse(rawData);

        return {[tableName]: parsedRows};
    });
}

export class SequelizeManager {
    constructor(log) {
        this.log = log;
    }

    getDialect() {
        return this.connection.options.dialect;
    }

    setQueryType(type) {
        // set sequelize's query property type
        // helps sequelize to predict what kind of response it will get
        return {type: this.connection.QueryTypes[type]};
    }

    intoTablesArray(results) {
        // helper function to
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

    createConnection(configuration) {

        const {
            username, password, database, port,
            dialect, storage, host
            } = configuration;

        this.log(`Creating a connection for user ${username}`, 1);

        this.connection = new Sequelize(database, username, password, {
            dialect,
            host,
            port,
            storage
        });

        this.log(`Connection for user ${username} established`, 2);

    }

    login(configFromApp) {
        if (ARGS.headless) {
            const configFromFile = JSON.parse(fs.readFileSync(ARGS.configpath));
            this.createConnection(configFromFile);
        } else {
            this.createConnection(configFromApp);
        }

        if (this.connection.config.dialect === 'mssql') {
            this.connection.config.dialectOptions = {encrypt: true};
        }

        return this.connection.authenticate();
    }

    checkConnection(callback) {
        // when already logged in and simply want to check connection
        if (!this.connection) {
			this.raiseError(
                merge(
                    {message: APP_NOT_CONNECTED_MESSAGE},
                    {type: 'connection'}),
                callback
			);
		} else {
            // returns a promise
            return this.connection.authenticate();
        }
    }

    raiseError(errorMessage, callback) {
        const errorLog = merge(errorMessage, {timestamp: timestamp()});
        this.log(errorMessage, 0);
        callback({error: errorLog});
    }

    showDatabases(callback) {
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

        this.log(`Querying: ${query}`, 1);

        return () => this.connection.query(query, this.setQueryType('SELECT'))
        .then(results => {
            this.log('Results recieved.', 1);

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
        const showtables = this.getPresetQuery(PREBUILT_QUERY.SHOW_TABLES);

        this.log(`Querying: ${showtables}`, 1);

        return () => this.connection
        .query(showtables, this.setQueryType('SELECT'))
        .then(results => {
            this.log('Results recieved.', 1);

            const tables = this.intoTablesArray(results);

            // construct prmises of table previews (top 5 rows)
            const promises = tables.map(table => {
                const show5rows = this.getPresetQuery(
                    PREBUILT_QUERY.SHOW5ROWS, table
                );
                this.log(`Querying: ${show5rows}`, 1);

                // sends the query for a single table
                return this.connection
                .query(show5rows, this.setQueryType('SELECT'))
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
        this.log(`Querying: ${query}`, 1);

        return this.connection.query(query, this.setQueryType('SELECT'))
        .then((results) => {
            this.log('Results received.', 1);

            callback(merge(parse(results), {error: null}));
        });
    }

    disconnect(callback) {
        this.log('Disconnecting', 1);

        /*
            this.connection.close() does not return a promise for now.
            open issue here:
            https://github.com/sequelize/sequelize/pull/5776
        */

        this.connection.close();
        callback({databases: null, error: null, tables: null});
    }

    getPresetQuery(showQuerySelector, table = null) {
        const dialect = this.getDialect();
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

            default: {
                throw new Error('could not build a presetQuery');
            }
        }
    }
}

export const OPTIONS = ARGS;
