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

    constructor(Logger) {
        this.log = Logger.log;
        this.raiseError = Logger.raiseError;
        this.sessionSelected = 0;
        this.sessions = {};
    }

    setSessionSelected(sessionSelected) {
        this.sessionSelected = sessionSelected;
    }

    getDialect() {
        return this.sessions[this.sessionSelected].options.dialect;
    }

    getConnection(responseSender) {
        return () => responseSender({error: null});
    }


    createConnection(configuration) {
        const {host, port, username, password} = configuration;
        this.log(`Creating a connection to elasticsearch at ${host}:${port}`, 1);
        this.sessions[this.sessionSelected] = new elasticsearch.Client({
          host: `${host}:${port}`,
          auth: `${username}:${password}`
        });
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
            return new Promise((resolve, reject) => {
                this.sessions[this.sessionSelected].ping({
                    // ping usually has a 3000ms timeout
                    requestTimeout: Infinity,
                    // undocumented params are appended to the query string
                    hello: 'hello elasticsearch!'
                }, (error) => {
                    if (error) {
                        reject(`An error occured when connecting to elasticsearch: ${error}`);
                    } else {
                        console.log('Authenticated.');
                        resolve(this.log('Authentication successful.', 2));
                    }
                });
            });
        }
    }

    connect(configFromApp, responseSender) {

        if (ARGS.headless) {
            // read locally stored configuration for sessionSelected
            const configFromFile = YAML.load(ARGS.configpath)[this.sessionSelected];
            this.createConnection(configFromFile);
        } else {
            this.createConnection(configFromApp);
        }
        return this.authenticate(responseSender);

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
        this.sessions[this.sessionSelected].config = {database: databaseToUse};
        return this.authenticate();
    }


    showDatabases(responseSender) {
        this.log('Looking up indexes (databases).', 2);
        return () => this.sessions[this.sessionSelected].indices.getMapping('_all')
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
        const index = this.sessions[this.sessionSelected].config.database;
        console.log(`index : ${index}`);
        this.log('Looking up docs (tables).', 2);
        return () => this.sessions[this.sessionSelected].indices.getMapping('_all')
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
        const index = this.sessions[this.sessionSelected].config.database;
        const types = tables;

        const promises = types.map(type => {
            return this.sessions[this.sessionSelected].search({
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

    sendRawQuery(query, responseSender) {
        // TODO:
    }

    disconnect(responseSender) {
        this.log('Disconnecting', 2);
        this.sessions[this.sessionSelected].close();
        responseSender({
            databases: null, error: null, tables: null, previews: null
        });
    }

}
