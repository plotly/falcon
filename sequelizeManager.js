import Sequelize from 'sequelize';
import parse from './parse';
import {merge} from 'ramda';

const timestamp = () => (new Date()).toTimeString();

const SHOW_QUERY_SELECTOR = {
    DATABSES: 'DATABASES',
    TABLES: 'TABLES'
};

export default class SequelizeManager {
    constructor() {
        // TODO: can respondEvent be part of the class?
        this.connectionState = 'none: credentials were not sent';
    }

    login({username, password, database, portNumber, engine, databasePath}) {
        // create new sequelize object
        this.connection = new Sequelize('examples', username, password, {
            dialect: engine,
            port: portNumber,
            storage: databasePath
        });
        // returns a message promise from the database
        return this.connection.authenticate();
    }

    updateLog(respondEvent, logMessage) {
        respondEvent.send('channel', {
            log: {
                message: logMessage,
                timestamp: timestamp()
            }
        });
    }

    raiseError(respondEvent, error) {
        console.error(error);
        respondEvent.send('channel', {
            error: merge(error, {timestamp: timestamp()})
        });

    }

    // built-in query to show available databases/schemes
    showDatabases(respondEvent) {
        // TODO: make the built in queries vary depending on dialect
        // TODO: define built-in queries strings at the top
        const SHOW_DATABASES = this.getPresetQuery(SHOW_QUERY_SELECTOR.DATABASES);
        this.updateLog(respondEvent, query);
        return this.connection.query(SHOW_DATABASES)
            .then(results => {
                respondEvent.send('channel', {
                    databases: results[0], // TODO - why is this nested in an array? can it have multiple arrays of arrays?
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
        // TODO: make the built in queries vary depending on dialect
        // TODO: define built-in queries strings at the top
        this.updateLog(respondEvent, query);
        return this.connection.showAllSchemas()
            .then(results => {
                const tables = results.map(result => result[0]);
                respondEvent.send('channel', {
                    error: null,
                    tables
                });
                const promises = tables.map(table => {
                    // TODO: SQL Injection security hole
                    const query = `SELECT * FROM ${table} LIMIT 5`;
                    this.updateLog(respondEvent, query);
                    return this.connection.query(query)
                        .then(selectTableResult => {
                            let parsedRows;
                            if (selectTableResult.rowCount === 0) {
                                parsedRows = {
                                    columnnames: [],
                                    rows: [[]],
                                    ncols: 0,
                                    nrows: 0
                                };
                            } else {
                                parsedRows = parse(selectTableResult[0]);
                            }
                            respondEvent.send('channel', {
                                error: null,
                                [table]: parsedRows
                            });

                        });
                });
                return Promise.all(promises);
            });
    }

    sendQuery(respondEvent, query) {
        this.updateLog(respondEvent, query);
        return this.connection.query(query)
            .then(results => {
                respondEvent.send('channel', {
                    error: null,
                    rows: results
                });
                return results;
            });
    }

    receiveServerQuery(respondEvent, mainWindowContents, query) {
        return this.connection.query(query)
            .then(results => {
                // send back to the server event
                respondEvent.send(parse(results));
                // send updated rows to the app
                mainWindowContents.send('channel', {
                    error: null,
                    rows: results
                });
            });
    }

    disconnect(event) {
        /*
            does not return a promise for now. open issue here:
            https://github.com/sequelize/sequelize/pull/5776
        */
        this.connection.close();
        event.sender.send('channel', {
            databases: null,
            error: null,
            rows: null,
            tables: null
        });
    }

    getPresetQuery(showQuerySelector) {
        const dialect = this.connection.options.dialect;
        switch (showQuerySelector) {
            case SHOW_QUERY_SELECTOR.DATABASES:
                switch (dialect) {
                    case 'mysql':
                    case 'mariadb':
                        return 'SHOW DATABASES';
                    case 'postgres':
                        return 'SELECT datname AS Database FROM pg_database WHERE datistemplate = false;';
                    case 'mssql':
                        return 'SELECT * FROM Sys.Databases';
                    default:
                        throw new Error('dialect not detected by getPresetQuery');
                }

            case SHOW_QUERY_SELECTOR.TABLES:
                return this.connection.showAllSchemas();

            default:
                throw new Error('showQuerySelector not detected by getPresetQuery');
        }
    }
}
