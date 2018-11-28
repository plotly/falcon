import Logger from '../../logger';
function logError(error) {
    Logger.log(`${error.constructor}: ${error.message}`);
    throw error;
}

import * as Sql from './sql.js';
import * as Elasticsearch from './Elasticsearch';
import * as S3 from './S3';
import * as ApacheDrill from './ApacheDrill';
// import * as IbmDb2 from './ibmdb2';
import * as ApacheLivy from './livy';
import * as ApacheImpala from './impala';
import * as DataWorld from './dataworld';
import * as DatastoreMock from './datastoremock';
import * as Athena from './athena';
import * as BigQuery from './bigquery';
import * as ClickHouse from './clickhouse';

const CSV = require('./csv');
const Oracle = require('./oracle.js');

/*
 * Switchboard to all of the different types of connections
 * that we support.
 *
 * The configuration object provides the necessary settings to initialize
 * a connection and is serializable as JSON and saved in
 * ~/.plotly/connector/connections.
 *
 * The queryObject is a string or object that describes the query.
 * For SQL-like interfaces, this is like `SELECT * FROM ebola_2014 LIMIT 10`.
 * But for other connection like elasticsearch will be an object.
 *
 * The type of connection is specified in "dialect" of the connection object.
 * Add new connection types by creating new files in this folder that export a
 * `query` or `connect` function. Some connections have
 * other functions that are exported too, like getting the s3 keys from a bucket.
 *  Their interfaces are described below.
 */

function getDatastoreClient(connection) {
    // handle test mode:
    if (connection.mock) {
        return DatastoreMock;
    }

    const {dialect} = connection;

    if (dialect === 'elasticsearch') {
        return Elasticsearch;
    } else if (dialect === 's3') {
        return S3;
    } else if (dialect === 'apache drill') {
        return ApacheDrill;
    } else if (dialect === 'apache spark') {
        return ApacheLivy;
    } else if (dialect === 'apache impala') {
        return ApacheImpala;
    } else if (dialect === 'csv') {
        return CSV;
    // } else if (dialect === 'ibm db2') {
    //    return IbmDb2;
    } else if (dialect === 'data.world') {
        return DataWorld;
    } else if (dialect === 'athena') {
        return Athena;
    } else if (dialect === 'oracle') {
        return Oracle;
    } else if (dialect === 'bigquery') {
        return BigQuery;
    } else if (dialect === 'clickhouse') {
        return ClickHouse;
    }
    return Sql;
}

/**
 * query makes a query
 * @param {(object|string)} queryStatement Query
 * @param {object}          connection     Connection object
 * @returns {Promise.<object>} that resolves to the results as:
 *   {
 *       columnnames: [...],
 *       rows: [...]
 *   }
 */
export function query(queryStatement, connection) {
    return getDatastoreClient(connection).query(queryStatement, connection).catch(logError);
}

/**
 * connect attempts to ping the connection
 * @param {object} connection Connection object
 * @returns {Promise} that resolves when the connection succeeds
 */
export function connect(connection) {
    return getDatastoreClient(connection).connect(connection).catch(logError);
}

/**
 * disconnect closes the connection and
 * @param {object} connection Connection object
 * @returns {Promise} that resolves when the connection succeeds
 */
export function disconnect(connection) {
    const client = getDatastoreClient(connection);
    return (client.disconnect) ?
        client.disconnect(connection).catch(logError) :
        Promise.resolve(connection);
}

/* SQL-like Connectors */

/**
 * schemas retrieves a list of table names, column names and column data types
 * @param {object} connection Connection object
 * @returns {Promise.<object>} that resolves to the results as:
 *   {
 *       columnnames: [...],
 *       rows: [[table_name, column_name, data_type], ...]
 *   }
 */
export function schemas(connection) {
    return getDatastoreClient(connection).schemas(connection).catch(logError);
}

/**
 * tables retrieves a list of table names
 * @param {object} connection Connection object
 * @returns {Promise.<Array>} that resolves to a list of the available tables.
 * This can have flexible meaning for other datastores. E.g.:
 * for elasticsearch, this means return the available "documents" per an "index"
 */
export function tables(connection) {
    return getDatastoreClient(connection).tables(connection).catch(logError);
}

/*
 * Return a promise with the files that are available for querying.
 *
 * e.g. for S3 and ApacheDrill, this returns the list of S3 keys.
 * In the future, if we support local file querying, this could include
 * a list of local files
 */
// TODO - I think specificity is better here, just name this to "keys"
// and if we ever add local file stuff, add a new function like "files".
export function files(connection) {
    return getDatastoreClient(connection).files(connection).catch(logError);
}


/* Apache Drill specific functions */

/*
 * Return a list of configured Apache Drill storage plugins
 */
export function storage(connection) {
    return getDatastoreClient(connection).storage(connection).catch(logError);
}

/*
 * List the S3 files that apache drill is connecting to to make
 * running queries easier for the user.
 * TODO - This should be more generic, should pass in the storage plugin
 * name or the storage connection and then return the available files for
 * that plugin.
 */
export function listS3Files(connection) {
    return getDatastoreClient(connection).listS3Files(connection).catch(logError);
}

export function elasticsearchMappings(connection) {
    return getDatastoreClient(connection).elasticsearchMappings(connection).catch(logError);
}
