import Sequelize from 'sequelize';

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
        console.log(this.connection.config);
        // returns a promise of database msg
        return this.connection.authenticate();
    }

    updateLog(event, logMessage) {
        event.sender.send('channel', { log: logMessage });
    }

    raiseError(event, error) {
        event.sender.send('channel', { error });
    }

    showDatabases(event) {
        return this.connection.query('SHOW DATABASES')
            .spread((rows, metadata) => {
                event.sender.send('channel', {
                    databases: rows,
                    error: null,
                    metadata,
                    tables: null});
            });
    }

    showTables(event) {
        return this.connection.query('SHOW TABLES')
            .spread((rows, metadata) => {
                event.sender.send('channel', {
                    error: null,
                    metadata,
                    tables: rows});
                console.log(rows);
            });

    }

    sendQuery(event, query) {
        return this.connection.query(query)
            .spread((rows, metadata) => {
                event.sender.send('channel', {
                    error: '',
                    metadata,
                    rows
                });
            });
    }

    disconnect(event) {
        /*
            does not return a promise for now but issue is open
            https://github.com/sequelize/sequelize/pull/5776
        */
        this.connection.close();
        event.sender.send('channel', {
            databases: null,
            error: null,
            metadata: null,
            rows: null,
            tables: null});
    }
}
