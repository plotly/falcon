import ClickHouse from '@apla/clickhouse';

/**
 * The following function will create a ClickHouse client
 * @param {String} host
 * @param {Number} port
 * @param {String} username
 * @param {String} password
 * @param {String} database
 * @returns {Object} ClickHouse client
 */ 
function createClient({ host, port, https, username = '', password = '', database, readonly, max_rows_to_read }) {
  console.log('CREATING with READONLY', readonly)
  return new ClickHouse({
    host,
    port,
    protocol: https ? 'https:' : 'http:',
    auth: `${username}:${password}`,
    queryOptions: {
      database,
      readonly: readonly ? 1 : 0,
      ...(max_rows_to_read && { max_rows_to_read }),
    }
  });
}

/**
 * The following function will connect to the datasource
 * @param {Object} connection
 * @returns {Promise} that resolves when the connection succeeds
 */ 
export function connect(connection) {
  return createClient(connection).pinging()
}

/**
 * The following function will return a list of schemas.  
 * @param {Object} connection 
 * @returns {Promise} that resolves to { 
 *                    columnnames: [ 'tablename', 'column_name','data_type' ], 
 *                    rows: [[tablename1, columnname1, datatype1], ...]] }
 */
export function schemas(connection) {
  return query(`
    SELECT table, name, type
    FROM system.columns
    WHERE database = '${connection.database}'
    ORDER BY table
  `, connection).then(({ rows }) => ({
    columnnames: [ 'tablename', 'column_name','data_type' ],
    rows
  }))
}


/**
 * The following function will return a list of tables.  
 * @param {Object} connection
 * @returns {Promise} that resolves to an array of table names
 */
export function tables(connection) {
  return query('SHOW TABLES', connection).then(({ rows }) => rows.map(row => row[0]))
}

/**
 * The following function will execute a query against the 
 * data source.  The function should return a tuple which contains 
 * two elements.  The first is an array of strings which is the column names
 * The second is a two dimensional array which represents the rows to be displayed
 * @param {String|Object} queryObject
 * @param {Object} connection
 * @returns {Promise} that resolves to { columnnames, rows }
 */ 
export function query(queryObject, connection) {
  const client = createClient(connection)

  const stream = client.query(queryObject)

  let columnnames = []
  const rows = [];

  return new Promise((resolve, reject) => {
    stream.on('metadata', columns => {
      columnnames = columns.map(({ name }) => name)
    })

    stream.on('data', row => rows.push(row))

    stream.on('error', err => reject(err))

    stream.on('end', () => resolve({ columnnames, rows }))
  })
}