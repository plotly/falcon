import {parseSQL} from '../../parse.js';

const BigQuery = require('@google-cloud/bigquery');
const Pool = require('./pool.js');
const pool = new Pool(newClient, sameConnection);

function newClient(connection) {
    return new BigQuery({
        keyFilename: connection.keyFilename,
        projectId: connection.projectId
    });
}

function sameConnection(connection1, connection2) {
    return (
        connection1.projectId === connection2.projectId &&
        connection1.database === connection2.database &&
        connection1.keyFilename === connection2.keyFilename
    );
}

/*
 * The connection function will validate the parameters and return the connection
 * parameters
 * @param {object} connection
 * @param {string} connection.projectId - Google Cloud Project Id
 * @param {string} connection.database - Google Big Query Database
 * @param {string} connection.keyFilename - Google Service Account Key File
 * @returns {Promise} that resolves connection
 */
export function connect(connection) {
    const client = pool.getClient(connection);
    return Promise.resolve(client);
}

export function disconnect(connection) {
    return pool.remove(connection);
}

/**
 * The following method will execute a query against the specified connection
 * @param {object} queryObject - The SQL to query against the connection
 * @param {object} connection - Connection parameters
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function query(queryObject, connection) {
    const client = pool.getClient(connection);
    const options = {
        query: queryObject,
        useLegacySql: false // Use standard SQL syntax for queries.
    };

    let job;

    return client
        .createQueryJob(options)
        .then(results => {
            job = results[0];
            return job.promise();
        })
        .then(() => {
            return job.getMetadata();
        })
        .then(metadata => {
            const errors = metadata[0].status.errors;
            if (errors && errors.length > 0) {
                throw new Error(errors.join(':'));
            }
        })
        .then(() => {
            return job.getQueryResults().then(rst => {
                return rst[0];
            });
        })
        .then(parseSQL);
}

/**
 * Should return a list of tables and their columns that are defined within the database.
 * @param {object} connection - Connection parameters
 * @param {string} connection.projectId - Google Cloud Project Id
 * @param {string} connection.database - Google Big Query Database
 * @param {string} connection.keyFilename - Google Service Account Key File
 * @returns {Promise} that resolves to { columnnames, rows }
 */
export function schemas(connection) {
    if (!connection.database || connection.database === '') {
        const columnnames = ['table_name', 'column_name', 'data_type'];
        const rows = [];
        return {columnnames, rows};
    }

    const client = pool.getClient(connection);

    return client
        .dataset(connection.database)
        .getTables()
        .then(results => {
            const metadataPromises = results[0].map(table => table.getMetadata());
            return Promise.all(metadataPromises);
        }).
        then(results => {
            const columnnames = ['table_name', 'column_name', 'data_type'];
            const rows = [];

            // iterate tables
            results.forEach(result => {
                const metadata = result[0];
                const tableName = metadata.tableReference.tableId;

                // iterate fields
                if (metadata.schema && metadata.schema.fields)
                {
                    metadata.schema.fields.forEach(({name, type}) => {
                        rows.push([tableName, name, type]);
                    });
                }
            });

            return {columnnames, rows};
        });
}


/**
 * Should return a list of tables that are in the database
 * @param {object} connection - Connection Parameters
 * @param {string} connection.projectId - Google Cloud Project Id
 * @param {string} connection.database - Google Big Query Database
 * @param {string} connection.keyFilename - Google Service Account Key File
 * @returns {Promise} that resolves to an array of table names
 */
export function tables(connection) {
    if (!connection.database || connection.database === '') {
        return [];
    }

    const client = pool.getClient(connection);

    return client
        .dataset(connection.database)
        .getTables()
        .then(results => {
            return (results[0] || []).map(table => table.id);
        });
}
