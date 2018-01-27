import * as Sql from './Sql';
import * as Elasticsearch from './Elasticsearch';
import * as S3 from './S3';
import * as ApacheDrill from './ApacheDrill';
import * as IbmDb2 from './ibmdb2';
import * as ApacheLivy from './livy';
import * as ApacheImpala from './impala';
import * as DataWorld from './dataworld';
import * as DatastoreMock from './datastoremock';
import * as Athena from './athena';

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
    } else if (dialect === 'ibm db2') {
        return IbmDb2;
    } else if (dialect === 'data.world') {
        return DataWorld;
    } else if (dialect === 'athena') {
        return Athena;
    }
    return Sql;
}

/*
 * query functions take a configuration, query a connection and
 * return a promise with the results as an object:
 *
 *  {
 *      rows: [...],
 *      columnnames: [...]
 *  }
 *
 */
export function query(queryObject, connection) {
    return getDatastoreClient(connection).query(queryObject, connection);
}

/*
 * connect functions attempt to ping the connection and
 * return a promise that is empty
 */
export function connect(connection) {
    return getDatastoreClient(connection).connect(connection);
}

/* SQL-like Connectors */

/*
 * return a promise that resolves to an array of [table_name, column_name, data_type]
 * available from a database.
 *
 */
export function schemas(connection) {
    return getDatastoreClient(connection).schemas(connection);
}

/*
 * return a promise with the available tables from a database
 *
 * this can have flexible meaning for other datastores.
 * e.g., for elasticsearch, this means return the available
 * "documents" per an "index"
 */
export function tables(connection) {
    return getDatastoreClient(connection).tables(connection);
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
    return getDatastoreClient(connection).files(connection);
}


/* Apache Drill specific functions */

/*
 * Return a list of configured Apache Drill storage plugins
 */
export function storage(connection) {
    return getDatastoreClient(connection).storage(connection);
}

/*
 * List the S3 files that apache drill is connecting to to make
 * running queries easier for the user.
 * TODO - This should be more generic, should pass in the storage plugin
 * name or the storage connection and then return the available files for
 * that plugin.
 */
export function listS3Files(connection) {
    return getDatastoreClient(connection).listS3Files(connection);
}

export function elasticsearchMappings(connection) {
    return getDatastoreClient(connection).elasticsearchMappings(connection);
}
