import fetch from 'node-fetch';

export function connect(connection) {
    return new Promise((resolve, reject) => {
      fetch(`https://api.data.world/v0/datasets/${connection.owner}/${connection.id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${connection.token}` }
      })
      .then(res => res.json())
      .then(json => {
        // json.code is defined only when there is an error
        if (json.code) {
          reject(json);
        } else {
          resolve(json);
        }
      });
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
