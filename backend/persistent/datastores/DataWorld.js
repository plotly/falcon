import fetch from 'node-fetch';

export function connect(connection) {
  console.log('This is the connection', connection);
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

function getSchema(fileName, connection) {
  fetch(`https://api.data.world/v0/sql/${connection.owner}/${connection.id}`, {
    method: 'POST',
    headers: { 'Accept': 'application/json', 'Authorization': `Bearer ${connection.token}` },
    body: JSON.stringify({
      query: `SELECT * FROM ${fileName} LIMIT 1`
    })
  })
  .then(res => res.json())
  .then(json => {
    console.log(json)
  });
}

function getTables(allFiles) {
  const csvFiles = allFiles.filter((file) => {
    return /.csv$/.test(file.name);
  });
  
  return csvFiles;
}

export function schemas(connection) {
  return connect(connection)
    .then((json) => {
      const tables = getTables(json.files);
      const tableNames = tables.map((table) => {
        const tableName = table.name;
        return tableName.substring(0, tableName.length - 4);
      });
      tableNames.map((name) => {
        getSchema(name);
      });
      const rows = tableNames.map((tableName) => {
        return [tableName];
      });
    return {
      columnnames: ['?column?', 'column_name', 'data_type'],
      rows
    };
  }).catch(err => {
    throw new Error(err);
  });
}
