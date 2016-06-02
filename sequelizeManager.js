import Sequelize from 'sequelize';
import parse from './parse';

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
        respondEvent.send('channel', { log: logMessage });
    }

    raiseError(respondEvent, error) {
        respondEvent.send('channel', { error });
    }

    // built-in query to show available databases/schemes
    showDatabases(respondEvent) {
        // TODO: make the built in queries vary depending on dialect
        // TODO: define built-in queries strings at the top
        return this.connection.query('SHOW DATABASES')
            .spread((results, metadata) => {
                respondEvent.send('channel', {
                    databases: results,
                    error: null,
                    metadata,
                    /*
                        if user wants to see all databases/schemes, clear
                        tables from previously selected database/schemes
                    */
                    tables: null});
            });
    }

    // built-in query to show available tables in a database/scheme
    showTables(respondEvent) {
        // TODO: make the built in queries vary depending on dialect
        // TODO: define built-in queries strings at the top
        return this.connection.query('SHOW TABLES')
            .spread((results, metadata) => {
                respondEvent.send('channel', {
                    error: null,
                    metadata,
                    rows: results});
            });
    }

    sendQuery(respondEvent, query) {
        return this.connection.query(query)
            .spread((results, metadata) => {
                respondEvent.send('channel', {
                    error: null,
                    metadata,
                    rows: results
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
                    metadata,
                    tables: results
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
}
