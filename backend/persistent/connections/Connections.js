import * as Sql from './Sql';
import * as Elasticsearch from './Elasticsearch';
import * as S3 from './S3';
import * as ApacheDrill from './ApacheDrill';

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
 * But for other connections like elasticsearch will be an object.
 *
 * The type of connection is specified in "dialect" of the configuration.
 * Add new connection types by creating new files in this folder that export a
 * `query`, `connect`, `tables` function. Their interfaces are described below.
 */

function getConnection(connections) {
    const {dialect} = connections;
    if (dialect === 'elasticsearch') {
        return Elasticsearch;
    } else if (dialect === 's3') {
        return S3;
    } else if (dialect === 'apache drill') {
        return ApacheDrill;
    } else {
        return Sql;
    }
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
export function query(queryObject, connections) {
    return getConnection(connections).query(queryObject, connections);
}

/*
 * connect functions attempt to ping the connection and
 * return a promise that is empty
 */
export function connect(connections) {
    return getConnection(connections).connect(connections);
}

/* SQL-like Connectors */

/*
 * return a promise with the available tables from a database
 *
 * this can have flexible meaning for other datastores.
 * e.g., for elasticsearch, this means return the available
 * "documents" per an "index"
 */
export function tables(connections) {
    return getConnection(connections).tables(connections);
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
export function files(connections) {
    return getConnection(connections).files(connections);
}


/* Apache Drill specific functions */

/*
 * Return a list of configured Apache Drill storage plugins
 */
export function storage(connections) {
    return getConnection(connections).storage(connections);
}

/*
 * List the S3 files that apache drill is connecting to to make
 * running queries easier for the user.
 * TODO - This should be more generic, should pass in the storage plugin
 * name or the storage connection and then return the available files for
 * that plugin.
 */
export function listS3Files(connections) {
    return getConnection(connections).listS3Files(connections);
}

export function elasticsearchMappings(connections) {
    return getConnection(connections).elasticsearchMappings(connections);
}
