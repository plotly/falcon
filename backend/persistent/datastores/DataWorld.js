import fetch from 'node-fetch';

export function connect(connection) {
  return new Promise((resolve, reject) => {
    fetch(`https://api.data.world/v0/datasets/${connection.owner}/${connection.identifier}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${connection.token}` }
    })
    .then(res => res.json())
    .then(json => {
      // json.code is defined only when there is an error
      if (json.code) {
        reject(json);
      } else {
        resolve();
      }
    });
  });
 }

function getCsvs(allFiles) {
  const csvFiles = allFiles.filter((file) => {
    return /.csv$/.test(file.name);
  });
  const tablesNames = csvFiles.map((table) => {
    return table.name.substring(0, table.name.length - 4).toLowerCase();
  });

  return tablesNames;
}

export function tables(connection) {
  return new Promise((resolve, reject) => {
    query('SELECT * FROM Tables', connection).then((res) => {
      const allTables = res.rows.map((table) => {
        return table[0];
      });

      resolve(allTables);
    });
  });
}

function getSchema(connection, tableName) {
  return new Promise((resolve, reject) => {
    const table = tableName.replace(/-/g, '_')
    const params = encodeURIComponent('query') + '=' + encodeURIComponent(`select * from ${table} limit 1`);
    fetch(`https://api.data.world/v0/sql/${connection.owner}/${connection.identifier}?includeTableSchema=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: params
    })
    .then(res => {
      return res.json();
    })
    .then(json => {
      resolve({table, fields: json[0].fields });
    });
  });
}

export function schemas(connection) {
  return new Promise((resolve, reject) => {
    tables(connection).then((allTables) => {
      const promises = allTables.map((table) => {
        return getSchema(connection, table).then((schema) => {
          return schema.fields.map((field) => {
            return [schema.table, field.name, field.type];
          });
        });
      });

      Promise.all(promises).then((tableSchemas) => {
        resolve({
          columnNames: [ 'tablename', 'column_name', 'data_type' ],
          rows: [].concat.apply([], tableSchemas)
        });
      });
    });
  });
}

export function query(queryStmt, connection) {
  return new Promise((resolve, reject) => {
    const query = queryStmt.replace(/-/g, '_');
    const params = encodeURIComponent('query') + '=' + encodeURIComponent(query);
    fetch(`https://api.data.world/v0/sql/${connection.owner}/${connection.identifier}?includeTableSchema=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: params
    })
    .then(res => {
      return res.json();
    })
    .then(json => {
      const fields = json[0].fields;
      const columnnames = fields.map((field) => {
        return field.name;
      });
      const rows = json.slice(1).map((row) => {
        return Object.values(row);
      });
      resolve({
        columnnames,
        rows
      });
    });
  });
}
