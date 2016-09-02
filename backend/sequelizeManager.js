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
    }

    getDialect() {
        return this.connection.options.dialect;
    }

    setQueryType(type) {
        /*
         * set sequelize's query property type
         * helps sequelize to predict what kind of response it will get
         */
        return {type: this.connection.QueryTypes[type]};
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
        let {
            username, password, database, port,
            dialect, storage, host
            } = configuration;

        let options = {
            dialect,
            host,
            port,
            storage
        };

        this.log(`Creating a connection for user ${username}`, 1);

        let subDialect = null;
        if (this.connection) {
            subDialect = this.connection.config.subDialect || null;
        }
        let redshiftOptions = null;

        if ((dialect === 'redshift') || (subDialect === 'redshift')) {
            subDialect = 'redshift';
            // http://stackoverflow.com/questions/32037385/using-sequelize-with-redshift
            Sequelize.HSTORE.types.postgres.oids.push('dummy');
            redshiftOptions = {
                dialect: 'postgres',
                pool: false,
                keepDefaultTimezone: true, // avoid SET TIMEZONE
                databaseVersion: '8.0.2' // avoid SHOW SERVER_VERSION
            };

            options = merge(options, redshiftOptions);
        }

        this.connection = new Sequelize(database, username, password, options);

        if (this.connection.config.dialect === 'mssql') {
            this.connection.config.dialectOptions = {encrypt: true};
        }

        if (subDialect) {
            this.connection.config = merge(this.connection.config, {subDialect: 'redshift'});
        }

    }

    connect(configFromApp) {

        if (ARGS.headless) {

            const configFromFile = YAML.load(ARGS.configpath);
            /*
             * if server is sending a headless app a new database,
             * use that one instead of the one in the config file
             */
            if (configFromApp.database) {
                configFromFile.database = configFromApp.database;
            }
            this.createConnection(configFromFile);
        } else {
            this.createConnection(configFromApp);
        }
        return this.connection.authenticate();

    }

    authenticate(responseSender) {

        this.log('Authenticating connection.');
        // when already logged in and simply want to check connection

        if (!this.connection) {
			this.raiseError(
                merge(
                    {message: APP_NOT_CONNECTED},
                    {type: 'connection'}
                ),
                responseSender
			);
		} else {
            // this.connection.authenticate() returns a promise
            return this.connection.authenticate()
            .catch((error) => {
                this.raiseError(
                    merge(
                        {mesage: AUTHENTICATION(error)},
                        {type: 'connection'}),
                    responseSender
                );
            });
        }

    }

    raiseError(errorMessage, responseSender) {
        const errorLog = merge(errorMessage, {timestamp: timestamp()});
        this.log(errorMessage, 0);
        responseSender({error: errorLog}, 400);
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

        this.log(`Querying: ${query}`, 1);

        return () => this.connection.query(query, this.setQueryType('SELECT'))
        .then(results => {
            this.log('Results recieved.', 1);
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
        this.log(`Querying: ${showtables}`, 1);

        return () => this.connection
        .query(showtables, this.setQueryType('SELECT'))
        .then(results => {
            this.log('Results received', 1);
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
            this.log('Sending tables\' previews.', 1);
            responseSender({
                error: null,
                previews: assembleTablesPreviewMessage(tablePreviews)
            });
        });

    }

    sendRawQuery(query, responseSender) {

        this.log(`Querying: ${query}`, 1);

        return this.connection.query(query, this.setQueryType('SELECT'))
        .catch( error => {
            this.raiseError(error, responseSender);
        })
        .then((results) => {
            this.log('Results received.', 1);
            responseSender(merge(parse(results), {error: null}));
        });

    }

    disconnect(responseSender) {

        /*
            this.connection.close() does not return a promise for now.
            open issue here:
            https://github.com/sequelize/sequelize/pull/5776
        */

        this.log('Disconnecting', 1);
        this.connection.close();
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

// need this in main, can't import directly due to circular dependancy
export const OPTIONS = ARGS;
