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
