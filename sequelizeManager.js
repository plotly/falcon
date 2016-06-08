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
    constructor() {
        // TODO: can respondEvent be part of the class?
    }

    login({username, password, database, portNumber, engine, databasePath, server}) {
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
        return this.connection.authenticate();
    }
    
    updateLog(respondEvent, message) {
        respondEvent.send('channel', {
            log: {
                message,
                timestamp: timestamp()
            }
        });
    }

    raiseError(respondEvent, error) {
        respondEvent.send('channel', {
            error: merge(error, {timestamp: timestamp()})
        });
    }

    // built-in query to show available databases/schemes
    showDatabases(respondEvent) {
        // constants for cleaner code
        const noMetaData = this.connection.QueryTypes.SELECT;
        const query = this.getPresetQuery(PREBUILT_QUERY.SHOW_DATABASES);
        const dialect = this.connection.options.dialect;

        // deal with sqlite -> has no databases list
        if (dialect === 'sqlite') {
            respondEvent.send('channel', {
                databases: ['SQLITE database accessed'],
                error: null,
                tables: null
            });
            // skip SHOW_DATABASES query and send SHOW_TABLES query right away
            return this.showTables(respondEvent);
        }

        return this.connection.query(query, {type: noMetaData})
            .then(results => {
                respondEvent.send('channel', {
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
    showTables(respondEvent) {
        // constants for cleaner code
        const noMetaData = this.connection.QueryTypes.SELECT;
        const query = this.getPresetQuery(PREBUILT_QUERY.SHOW_TABLES);
        const dialect = this.connection.options.dialect;

        const sendPreviewTable = (table, selectTableResult) => {
            let parsedRows;
            if (isEmpty(selectTableResult)) {
                parsedRows = emptyTable;
                this.updateLog(respondEvent, emptyTableLog(table));
            } else {
                parsedRows = parse(selectTableResult);
            }
            respondEvent.send('channel', {
                error: null,
                [table]: parsedRows
            });
        };

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
                respondEvent.send('channel', {
                    error: null,
                    tables
                });

                const promises = tables.map(table => {
                    const query = this.getPresetQuery(
                        PREBUILT_QUERY.SHOW5ROWS, table
                    );
                    this.updateLog(respondEvent, query);
                    return this.connection.query(query, {type: noMetaData})
                        .then(selectTableResult => {
                            sendPreviewTable(table, selectTableResult);
                        });
                });
                return Promise.all(promises);
            });
    }

    sendQuery(respondEvent, query) {
        // TODO: SQL Injection security hole
        return this.connection.query(query)
            .then((results, metadata) => {
                respondEvent.send('channel', {
                    error: null,
                    rows: parse(results)
                });
            });
    }

    receiveServerQuery(respondEvent, mainWindowContents, query) {
        // TODO: SQL Injection security hole
        const noMetaData = this.connection.QueryTypes.SELECT;
        return this.connection.query(query, {type: noMetaData})
            .then(results => {
                // send back to the server event
                respondEvent.send(parse(results));
                // send updated rows to the app
                mainWindowContents.send('channel', {
                    error: null,
                    rows: parse(results)
                });
            });
    }

    disconnect(respondEvent) {
        /*
            does not return a promise for now. open issue here:
            https://github.com/sequelize/sequelize/pull/5776
        */
        this.connection.close();
        respondEvent.send('channel', {
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
