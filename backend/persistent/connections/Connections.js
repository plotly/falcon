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
 * ~/.plotly/connector/credentials.
 *
 * The queryObject is a string or object that describes the query.
 * For SQL-like interfaces, this is like `SELECT * FROM ebola_2014 LIMIT 10`.
 * But for other connections like elasticsearch will be an object.
 *
 * The type of connection is specified in "dialect" of the configuration.
 * Add new connection types by creating new files in this folder that export a
 * `query`, `connect`, `tables` function. Their interfaces are described below.
 */

function getConnection(credentials) {
    const {dialect} = credentials;
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
export function query(queryObject, credentials) {
    return getConnection(credentials).query(queryObject, credentials);
}

/*
 * connect functions attempt to ping the connection and
 * return a promise that is empty
 */
export function connect(credentials) {
    return getConnection(credentials).connect(credentials);
}

/* SQL-like Connectors */

/*
 * return a promise with the available tables from a database
 *
 * this can have flexible meaning for other datastores.
 * e.g., for elasticsearch, this means return the available
 * "documents" per an "index"
 */
export function tables(credentials) {
    return getConnection(credentials).tables(credentials);
}

/* FileSystem-like Connectors */

/*
 * Return a promise with the files that are available for querying.
 *
 * e.g. for S3 and ApacheDrill, this returns the list of S3 keys.
 * In the future, if we support local file querying, this could include
 * a list of local files
 */
export function files(credentials) {
    return getConnection(credentials).files(credentials);
}


/* Apache Drill specific functions */

/*
 * Return a list of configured Apache Drill storage plugins
 */
export function storage(credentials) {
    return getConnection(credentials).storage(credentials);
}
