import fetch from 'node-fetch';
import url from 'url';

import Logger from '../../logger';

function parseUrl(datasetUrl) {
  const pathnameArray = url.parse(datasetUrl).pathname.split('/');
  return {
    owner: pathnameArray[1],
    id: pathnameArray[2]
  };
}

export function connect(connection) {
  const { owner, id } = parseUrl(connection.url);
  return fetch(`https://api.data.world/v0/datasets/${owner}/${id}/`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${connection.token}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': `Falcon/Plotly - ${process.env.npm_package_version}`
    }
  })
  .then(res => res.json())
  .then(json => {
    // json.code is defined only when there is an error
    if (json.code) {
      throw new Error(JSON.stringify(json));
    }
  })
  .catch(err => {
    Logger.log(err);
    throw err;
  });
}

export function tables(connection) {
  return query('SELECT * FROM Tables', connection).then((res) => {
    const allTables = res.rows.map((table) => {
      return table[0].replace(/-/g, '_');
    });

    return allTables;
  })
  .catch(err => {
    Logger.log(err);
    throw err;
  });
}

export function schemas(connection) {
  return query('SELECT * FROM TableColumns', connection).then((res) => {
    const rows = res.rows.map((table) => {
      const tableName = table[0].replace(/-/g, '_');
      const columnName = table[3];
      // Extract the datatype from datatype url e.g. http://www.w3.org/2001/XMLSchema#integer
      const columnDataType = /#(.*)/.exec(table[6])[1];

      return [
        tableName,
        columnName,
        columnDataType
      ];
    });

    return ({
      columnnames: [ 'tablename', 'column_name', 'data_type' ],
      rows
    });
  })
  .catch(err => {
    Logger.log(err);
    throw err;
  });
}

export function query(queryString, connection) {
  const { owner, id } = parseUrl(connection.url);
  const params = `${encodeURIComponent('query')}=${encodeURIComponent(queryString)}`;

  return fetch(`https://api.data.world/v0/sql/${owner}/${id}?includeTableSchema=true`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${connection.token}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      'User-Agent': `Falcon/Plotly - ${process.env.npm_package_version}`
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

    return ({
      columnnames,
      rows
    });
  })
  .catch(err => {
    Logger.log(err);
    throw err;
  });
}
