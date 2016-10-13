import Sequelize from 'sequelize';
import {DIALECTS} from '../app/constants/constants';
import {parseSQL} from './parse';
import {merge} from 'ramda';
import {ARGS} from './args';
import {APP_NOT_CONNECTED, AUTHENTICATION} from './errors';
import YAML from 'yamljs';

const PREBUILT_QUERY = {
    SHOW_DATABASES: 'SHOW_DATABASES',
    SHOW_TABLES: 'SHOW_TABLES',
    SHOW5ROWS: 'SHOW5ROWS'
};

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
        parsedRows = (isEmpty(rawData)) ? EMPTY_TABLE : parseSQL(rawData);
        return {[tableName]: parsedRows};
    });

};

export class SequelizeManager {

    constructor(Logger, Sessions) {
        this.log = Logger.log;
        this.raiseError = Logger.raiseError;
        this.getSession = Sessions.getSession;
        this.setSessionSelected = Sessions.setSessionSelected;
        this.getDialect = Sessions.getDialect;
        this.getSessionSelected = Sessions.getSessionSelected;
        this.getSessions = Sessions.getSessions;
        this.createSession = Sessions.createSession;
        this.updateSession = Sessions.updateSession;
        this.showSessions = Sessions.showSessions;
        this.deleteSession = Sessions.deleteSession;
        this.addSession = Sessions.addSession;
    }

    setQueryType(type) {
        /*
         * set sequelize's query property type
         * helps sequelize to predict what kind of response it will get
         */
        return {type: this.getSession().QueryTypes[type]};
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

        this.log(`Creating a connection for user ${username}`, 2);

        const subDialect = dialect;

        if (dialect === 'redshift') {
            // avoid auto-dection
            Sequelize.HSTORE.types.postgres.oids.push('dummy');
            // dialect will be changed to 'postgres' by REDSHIFT_OPTIONS
            options = merge(options, REDSHIFT_OPTIONS);
        }

        const newSession = new Sequelize(
            database, username, password, options
        );

        if (subDialect === 'mssql') {
            setupMSSQLOptions(newSession);
        }

        rememberSubdialect(newSession, subDialect);

        this.createSession(
            this.getSessionSelected(),
            newSession
        );
    }

    authenticate(responseSender) {

        this.log('Authenticating connection.');
        // when already logged in and simply want to check connection
        if (!this.getSession()) {
			this.raiseError(
                merge(
                    {message: APP_NOT_CONNECTED},
                    {name: 'ConnectionError'}
                ),
                responseSender
			);
		} else {
            // this.getSession().authenticate() returns a promise
            return this.getSession().authenticate()
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
            const configFromFile = YAML.load(ARGS.configpath)[this.getSessionSelected()];
            this.createConnection(configFromFile);
        } else {
            this.createConnection(configFromApp);
        }
        return this.getSession().authenticate();

    }


    selectDatabase(databaseToUse) {
        // take database entry check if its the same as in current connection
        const needToSwitchDatabases =
            databaseToUse !== this.getSession().config.database;

        /*
         * if not, make a new one to the other database,
         * replacing the current one
         * simply changing the database parameter manually without rebuilding
         * the object does not work
         */

        if (needToSwitchDatabases) {

            const currentSetup = merge(
                this.getSession().options,
                this.getSession().config
            );

            const {
                username, password, port,
                dialect, storage, host, subDialect
            } = currentSetup;

            let options = {dialect, host, port, storage};

            this.log(`Switchin to a new database ${databaseToUse}`, 2);

            if (subDialect === 'redshift') {
                // avoid auto-dection
                Sequelize.HSTORE.types.postgres.oids.push('dummy');
                options = merge(options, REDSHIFT_OPTIONS);
            }

            const newSession = new Sequelize(
                databaseToUse, username, password, options
            );

            if (subDialect === 'mssql') {
                setupMSSQLOptions(newSession);
            }

            if (subDialect === 'redshift') {
                rememberSubdialect(newSession, subDialect);
            }

            this.createSession(this.getSessionSelected(), newSession);

        }

        this.log('Authenticating connection.');
        return this.getSession().authenticate();

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

        return () => this.getSession().query(query, this.setQueryType('SELECT'))
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

        return () => this.getSession()
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
            return this.getSession()
            .query(show5rows, this.setQueryType('SELECT'))
            .then(selectTableResults => {
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

        return this.getSession().query(query, this.setQueryType('SELECT'))
        .catch( error => {
            this.raiseError(error, responseSender);
        })
        .then((results) => {
            this.log('Results received.', 2);
            responseSender(merge(parseSQL(results), {error: null}));
        });

    }

    disconnect(responseSender) {

        /*
            this.getSession().close() does not return a promise for now.
            open issue here:
            https://github.com/sequelize/sequelize/pull/5776
        */

        this.log('Disconnecting', 2);
        this.getSession().close();
        responseSender({
            databases: null, error: null, tables: null, previews: null
        });

    }

    getPresetQuery(showQuerySelector, table = null) {

        const dialect = this.getDialect();
        const errorMessage = 'Could not build a presetQuery';

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
                        throw new Error(errorMessage);
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
                        throw new Error(errorMessage);
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
                            `${this.getSession().config.database}.dbo.${table}`;
                    default:
                        throw new Error(errorMessage);
                }

            default: {
                throw new Error(errorMessage);
            }

        }
    }
}

// need this in main, can't import directly due to circular dependancy
export const OPTIONS = ARGS;
