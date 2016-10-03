import Sequelize from 'sequelize';
import {DIALECTS} from '../app/constants/constants';
import parse from './parse';
import {merge} from 'ramda';
import {ARGS} from './args';
import {APP_NOT_CONNECTED, AUTHENTICATION} from './errors';
import YAML from 'yamljs';

const PREBUILT_QUERY = {
    SHOW_DATABASES: 'SHOW_DATABASES',
    SHOW_TABLES: 'SHOW_TABLES',
    SHOW5ROWS: 'SHOW5ROWS'
};

const timestamp = () => (new Date()).toTimeString();

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

const setupMSSQLOptions = (connection) => {
    connection.config.dialectOptions = {encrypt: true};
};

const rememberSubdialect = (connection, subDialect) => {
    connection.config = merge(connection.config, {subDialect});
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

const assembleTablesPreviewMessage = (tablePreviews) => {

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

};

export class SequelizeManager {

    constructor(Logger) {
        this.log = Logger.log;
        this.sessionSelected = 0;
        this.sessions = {};
    }

    setSessionSelected(sessionSelected) {
        this.sessionSelected = sessionSelected;
    }

    getDialect() {
        return this.sessions[this.sessionSelected].options.dialect;
    }

    setQueryType(type) {
        /*
         * set sequelize's query property type
         * helps sequelize to predict what kind of response it will get
         */
        return {type: this.sessions[this.sessionSelected].QueryTypes[type]};
    }

    intoTablesArray(results) {

        let tables;

        if (this.getDialect() === DIALECTS.SQLITE) {
            // sqlite returns an array by default
            tables = results;
        } else {
            /*
             * others return list of objects such as
             *  [ { Tables_in_testdb: 'consumercomplaints' },
             *    { Tables_in_testdb: 'test' } ]
             */
            tables = intoArray(results);
        }

        return tables;

    }

    raiseError(errorMessage, responseSender) {
        const errorLog = merge(errorMessage, {timestamp: timestamp()});
        this.log(errorMessage, 0);
        responseSender({error: errorLog}, 400);
    }

    getConnection(responseSender) {
        return () => responseSender({error: null});
    }

    createConnection(configuration) {
        const {
            username, password, database, port, dialect, storage, host, ssl
            } = configuration;

        let options = {
            dialect, host, port, storage,
            dialectOptions: {ssl}
        };

        this.log(`Creating a connection for user ${username}`, 1);

        const subDialect = dialect;

        if (dialect === 'redshift') {
            // avoid auto-dection
            Sequelize.HSTORE.types.postgres.oids.push('dummy');
            // dialect will be changed to 'postgres' by REDSHIFT_OPTIONS
            options = merge(options, REDSHIFT_OPTIONS);
        }

        this.sessions[this.sessionSelected] = new Sequelize(
            database, username, password, options
        );

        if (subDialect === 'mssql') {
            setupMSSQLOptions(this.sessions[this.sessionSelected]);
        }

        rememberSubdialect(this.sessions[this.sessionSelected], subDialect);

    }

    authenticate(responseSender) {
        this.log('Authenticating connection.');
        // when already logged in and simply want to check connection
        if (!this.sessions[this.sessionSelected]) {
			this.raiseError(
                merge(
                    {message: APP_NOT_CONNECTED},
                    {name: 'ConnectionError'}
                ),
                responseSender
			);
		} else {
            // this.sessions[this.sessionSelected].authenticate() returns a promise
            return this.sessions[this.sessionSelected].authenticate()
            .catch((error) => {
                this.raiseError(
                    merge(
                        {message: AUTHENTICATION(error)},
                        {name: 'ConnectionError'}),
                    responseSender
                );
            });
        }
    }

    connect(configFromApp) {

        if (ARGS.headless) {

            // read locally stored configuration for sessionSelected
            const configFromFile = YAML.load(ARGS.configpath)[this.sessionSelected];

            this.createConnection(configFromFile);

        } else {

            this.createConnection(configFromApp);

        }
        return this.sessions[this.sessionSelected].authenticate();

    }


    showSessions(responseSender) {
        const sessionKeys = Object.keys(this.sessions);
        return new Promise(
            (resolve, reject) => {
                resolve(responseSender({
                    error: null,
                    sessions: sessionKeys.map((key) => {
                        if (this.sessions[key]) {
                            const dialect = this.sessions[key].options.dialect;
                            const username = this.sessions[key].config.username;
                            let host = this.sessions[key].config.host;
                            if (!host) {host = 'localhost';}
                            return {[key]: `${dialect}:${username}@${host}`};
                        } else {
                            // if session created (with API) but not connected yet.
                            return {[key]: 'Session currently empty.'};
                        }
                    })
                }));
            }
        );
    }


    deleteSession(sessionId) {
        let setSessionTo = null;
        if (Object.keys(this.sessions).length > 0) {
            setSessionTo = Object.keys(this.sessions)[0];
        }
        this.log(`${setSessionTo}`, 1);
        return new Promise(
            (resolve, reject) => {
                this.setSessionSelected(Object.keys(this.sessions)[0]);
                resolve(delete this.sessions[`${sessionId}`]);
            });
    }


    addSession(sessionId) {
        return new Promise(
            (resolve, reject) => {
                resolve(this.sessions[`${sessionId}`] = null);
            });
    }


    selectDatabase(databaseToUse) {
        // take database entry check if its the same as in current connection
        const needToSwitchDatabases =
            databaseToUse !== this.sessions[this.sessionSelected].config.database;

        /*
         * if not, make a new one to the other database,
         * replacing the current one
         * simply changing the database parameter manually without rebuilding
         * the object does not work
         */

        if (needToSwitchDatabases) {

            const currentSetup = merge(
                this.sessions[this.sessionSelected].options,
                this.sessions[this.sessionSelected].config
            );

            const {
                username, password, port,
                dialect, storage, host, subDialect
            } = currentSetup;

            let options = {dialect, host, port, storage};

            this.log(`Switchin to a new database ${databaseToUse}`, 1);

            if (subDialect === 'redshift') {
                // avoid auto-dection
                Sequelize.HSTORE.types.postgres.oids.push('dummy');
                options = merge(options, REDSHIFT_OPTIONS);
            }
            this.sessions[this.sessionSelected] = new Sequelize(
                databaseToUse, username, password, options
            );

            if (subDialect === 'mssql') {
                setupMSSQLOptions(this.sessions[this.sessionSelected]);
            }

            if (subDialect === 'redshift') {
                rememberSubdialect(this.sessions[this.sessionSelected],
                subDialect);
            }

        }

        this.log('Authenticating connection.');
        return this.sessions[this.sessionSelected].authenticate();

    }


    showDatabases(responseSender) {

        const query = this.getPresetQuery(PREBUILT_QUERY.SHOW_DATABASES);
        const dialect = this.getDialect();

        // deal with sqlite -> has no databases list
        if (dialect === DIALECTS.SQLITE) {
            responseSender({
                databases: ['SQLITE database accessed'],
                error: null,
                tables: null
            });
            // skip SHOW_DATABASES query and send SHOW_TABLES query right away
            return this.showTables(responseSender);
        }

        this.log(`Querying: ${query}`, 2);

        return () => this.sessions[this.sessionSelected].query(query, this.setQueryType('SELECT'))
        .then(results => {
            this.log('Results recieved.', 2);
            responseSender({
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
    showTables(responseSender) {

        const showtables = this.getPresetQuery(PREBUILT_QUERY.SHOW_TABLES);
        this.log(`Querying: ${showtables}`, 2);

        return () => this.sessions[this.sessionSelected]
        .query(showtables, this.setQueryType('SELECT'))
        .then(results => {

            this.log('Results received', 2);
            // TODO: when switching fornt end to v1, simply send back an array
            const tablesObject = this.intoTablesArray(results).map(table => {
                return {[table]: {}};
            });

            responseSender({
                error: null,
                tables: tablesObject
            });
        });

    }

    previewTables(tables, responseSender) {

        const promises = tables.map(table => {

            const show5rows = this.getPresetQuery(
                PREBUILT_QUERY.SHOW5ROWS, table
            );
            this.log(`Querying: ${show5rows}`, 2);

            // sends the query for a single table
            return this.sessions[this.sessionSelected]
            .query(show5rows, this.setQueryType('SELECT'))
            .then(selectTableResults => {
                console.log('selectTableResults');
                console.log(selectTableResults);
                return {
                    [table]: selectTableResults
                };
            });

        });

        return Promise.all(promises)
        .then(tablePreviews => {
            this.log('Sending tables\' previews.', 2);
            responseSender({
                error: null,
                previews: assembleTablesPreviewMessage(tablePreviews)
            });
        });

    }

    sendRawQuery(query, responseSender) {

        this.log(`Querying: ${query}`, 2);

        return this.sessions[this.sessionSelected].query(query, this.setQueryType('SELECT'))
        .catch( error => {
            this.raiseError(error, responseSender);
        })
        .then((results) => {
            this.log('Results received.', 2);
            responseSender(merge(parse(results), {error: null}));
        });

    }

    disconnect(responseSender) {

        /*
            this.sessions[this.sessionSelected].close() does not return a promise for now.
            open issue here:
            https://github.com/sequelize/sequelize/pull/5776
        */

        this.log('Disconnecting', 2);
        this.sessions[this.sessionSelected].close();
        responseSender({
            databases: null, error: null, tables: null, previews: null
        });

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
                            `${this.sessions[this.sessionSelected].config.database}.dbo.${table}`;
                    default:
                        throw new Error('could not build a presetQuery');
                }

            default: {
                throw new Error('could not build a presetQuery');
            }

        }
    }
}

// need this in main, can't import directly due to circular dependancy
export const OPTIONS = ARGS;
