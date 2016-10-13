import elasticsearch from 'elasticsearch';
import {merge} from 'ramda';
import YAML from 'yamljs';

import {parseES} from './parse';
import {ARGS} from './args';
import {APP_NOT_CONNECTED, AUTHENTICATION} from './errors';

const EMPTY_TABLE = {
    columnnames: ['NA'],
    rows: [['empty table']],
    ncols: 1,
    nrows: 1
};

const isEmpty = (table) => {
    return table.length === 0;
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
        parsedRows = (isEmpty(rawData)) ? EMPTY_TABLE : parseES(rawData);
        return {[tableName]: parsedRows};
    });

};


export class ElasticManager {

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


    getConnection(responseSender) {
        return () => responseSender({error: null});
    }


    createConnection(configuration) {
        const {host, port, username, password} = configuration;
        this.log(`Creating a connection to elasticsearch at ${host}:${port}`, 2);

        const newSession = new elasticsearch.Client({
          host: `${host}:${port}`,
          auth: `${username}:${password}`
        });
        newSession.options = {dialect: 'elasticsearch'};
        newSession.config = {username};
        this.createSession(this.getSessionSelected(), newSession);
    }


    authenticate(responseSender) {
        this.log('Authenticating elastic connection.');
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
            return new Promise((resolve, reject) => {
                this.getSession().ping({
                    // ping usually has a 3000ms timeout
                    requestTimeout: Infinity,
                    // undocumented params are appended to the query string
                    hello: 'hello elasticsearch!'
                }, (error) => {
                    if (error) {
                        reject(`An error occured when connecting to elasticsearch: ${error}`);
                    } else {
                        resolve(this.log('Authentication successful.', 2));
                    }
                });
            });
        }
    }


    connect(configFromApp, responseSender) {

        if (ARGS.headless) {
            // read locally stored configuration for sessionSelected
            const configFromFile = YAML.load(ARGS.configpath)[this.getSessionSelected()];
            this.createConnection(configFromFile);
        } else {
            this.createConnection(configFromApp);
        }
        return this.authenticate(responseSender);

    }


    selectDatabase(databaseToUse) {
        this.getSession().config = {database: databaseToUse};
        return this.authenticate();
    }


    showDatabases(responseSender) {
        this.log('Looking up indexes (databases).', 2);
        return () => this.getSession().indices.getMapping('_all')
        .then((response) => {
            this.log('Databases received', 2);
            responseSender({
                databases: Object.keys(response),
                error: null,
                tables: null
            });
        });
    }


    showTables(responseSender) {
        const index = this.getSession().config.database;
        this.log('Looking up docs (tables).', 2);
        return () => this.getSession().indices.getMapping('_all')
        .then((response) => {
            const requiredIndexMapping = response[index].mappings;
            this.log('Tables received', 2);
            const tables = Object.keys(requiredIndexMapping).map((table) => {
                    return {[table]: {}};
            });
            responseSender({
                error: null,
                tables
            });
        });
    }


    previewTables(tables, responseSender) {
        const index = this.getSession().config.database;
        const types = tables;

        const promises = types.map(type => {
            return this.getSession().search({
                index,
                type,
                size: 5,
                body: {
                    query: { 'match_all': {} }
                }
            }).then((response) => {
                return {[type]: response.hits.hits};
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


    sendRawQuery(queryObject, responseSender) {
        this.log('Querying elasticsearch database.', 2);
        return this.getSession().search(
            queryObject
        )
        .catch( error => {
            this.raiseError(error, responseSender);
        })
        .then((results) => {
            this.log('Results received.', 2);
            responseSender(merge(parseES(results), {error: null}));
        }); }


    disconnect(responseSender) {
        this.log('Disconnecting', 2);
        this.getSession().close();
        responseSender({
            databases: null, error: null, tables: null, previews: null
        });
    }


}
