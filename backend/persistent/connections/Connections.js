import * as Sql from './Sql';
import * as Elasticsearch from './Elasticsearch';

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
 * Add new connection types to files in this folder that export a
 * `query` and a `connect` function. Their interfaces are described below.
 */

function getConnection(credentials) {
    const {dialect} = credentials;
    if (dialect === 'elasticsearch') {
        return Elasticsearch;
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
