import Sequelize from 'sequelize';
import parse from './parse';

const SHOW_QUERY_SELECTOR = {
    DATABSES: 'DATABASES',
    TABLES: 'TABLES'
};

export default class SequelizeManager {
    constructor() {
        this.connectionState = 'none: credentials were not sent';
    }

    login({username, password, database, portNumber, engine, databasePath}) {
        // create new sequelize object
        this.connection = new Sequelize(database, username, password, {
            dialect: engine,
            port: portNumber,
            storage: databasePath
        });
        // returns a message promise from the database
        return this.connection.authenticate();
    }

    updateLog(respondEvent, logMessage) {
        respondEvent.send('channel', {log: logMessage});
    }

    raiseError(respondEvent, error) {
        respondEvent.send('channel', {error});
    }

    // built-in query to show available databases/schemes
    showDatabases(respondEvent) {
        // TODO: make the built in queries vary depending on dialect
        // TODO: define built-in queries strings at the top
        const SHOW_DATABASES = this.getPresetQuery(SHOW_QUERY_SELECTOR.DATABASES);

        return this.connection.query(SHOW_DATABASES)
            .spread((results, metadata) => {
                respondEvent.send('channel', {
                    databases: results,
                    metadata,
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
        return this.connection.showAllSchemas()
            .then((results, metadata) => {
                respondEvent.send('channel', {
                    error: null,
                    tables: results,
                    metadata
                });
            });
    }

    sendQuery(respondEvent, query) {
        return this.connection.query(query)
            .spread((results, metadata) => {
                respondEvent.send('channel', {
                    error: null,
                    rows: results,
                    metadata
                });
            });
    }

    receiveServerQuery(respondEvent, mainWindowContents, query) {
        return this.connection.query(query)
            .spread((results, metadata) => {
                // send back to the server event
                respondEvent.send(parse(results));
                // send updated rows to the app
                mainWindowContents.send('channel', {
                    error: null,
                    rows: results,
                    metadata
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
            metadata: null,
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
                        return "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'";
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
