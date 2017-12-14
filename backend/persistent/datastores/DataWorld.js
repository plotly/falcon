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

function getTables(allFiles) {
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
        resolve(getTables(json.files));
      }
    });
  });
}

function getSchema(connection, table) {
  console.log('The table', table);
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
      return json.fields;
    });
}

export function schemas(connection) {
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
        const tableSchemas = getTables(json.files).map(table => {
          const rs = getSchema(connection, table);
          return rs;
        });

        console.log(tableSchemas);
      }
    });
    resolve({
      columnNames: [ 'tablename', 'column_name', 'data_type' ],
      rows: [
        [ 'plotly.alcohol_consumption_by_country_2010', 'loc', 'string' ],
        [ 'plotly.alcohol_consumption_by_country_2010', 'alcohol', 'double' ]
      ]
    });
  });
}
