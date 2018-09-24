module.exports = {
    connect: connect,
    tables: tables,
    schemas: schemas,
    query: query,
    disconnect: disconnect
};

let oracledb;
try {
    oracledb = require('oracledb');
} catch (err) {
    oracledb = err;
}

const Pool = require('./pool.js');
const pool = new Pool(newClient, sameConnection);

function newClient(connection) {
    if (oracledb instanceof Error) {
        throw new Error(oracledb.message);
    }

    return oracledb.getConnection({
        user: connection.username,
        password: connection.password,
        connectionString: connection.connectionString
    });
}

function sameConnection(connection1, connection2) {
    return (
        connection1.username === connection2.username &&
        connection1.password === connection2.password &&
        connection1.connectionString === connection2.connectionString
    );
}

function connect(connection) {
    return pool.getClient(connection);
}

function disconnect(connection) {
    return pool.remove(connection)
        .then(client => client && client.close());
}

function tables(connection) {
    const sqlQuery = `
        SELECT * FROM user_all_tables
        WHERE
           table_name NOT LIKE '%$%' AND
           (table_type IS NULL OR table_type <> 'XMLTYPE') AND
           (num_rows IS NULL OR num_rows > 0) AND
           secondary = 'N'
    `;

    return pool.getClient(connection)
        .then(client => client.execute(sqlQuery))
        .then(result => {
            return result.rows.map(row => row[0]);
        });
}

function schemas(connection) {
    const sqlQuery = `
        SELECT
            c.table_name,
            c.column_name,
            c.data_type
        FROM
            user_tab_columns c,
            user_all_tables t
        WHERE
           c.table_name = t.table_name AND
           t.table_name NOT LIKE '%$%' AND
           (t.table_type IS NULL OR t.table_type <> 'XMLTYPE') AND
           (t.num_rows IS NULL OR t.num_rows > 0) AND
           t.secondary = 'N'
    `;

    return query(sqlQuery, connection);
}

function query(queryString, connection) {
    return pool.getClient(connection)
        .then(client => client.execute(queryString))
        .then(result => {
            const columnnames = result.metaData.map(column => column.name);

            // convert buffers into an hexadecimal string
            const rows = result.rows.map(
                row => row.map(value => (value instanceof Buffer) ? value.toString('hex') : value)
            );

            return {columnnames, rows};
        });
}
