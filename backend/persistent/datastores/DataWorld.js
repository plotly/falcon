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
  return new Promise((resolve, reject) => {
    fetch(`https://api.data.world/v0/datasets/${owner}/${id}`, {
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
    })
    .catch(err => {
      Logger.log(err);
      throw new Error(err);
    });
  });
 }

export function tables(connection) {
  return new Promise((resolve, reject) => {
    query('SELECT * FROM Tables', connection).then((res) => {
      const allTables = res.rows.map((table) => {
        return table[0];
      });

      resolve(allTables);
    })
    .catch(err => {
      reject(err);
    });
  });
}

export function schemas(connection) {
  const { owner, id } = parseUrl(connection.url);
  return new Promise((resolve, reject) => {
    const params = `${encodeURIComponent('query')}=${encodeURIComponent('SELECT * FROM TableColumns')}`;
    fetch(`https://api.data.world/v0/sql/${owner}/${id}?includeTableSchema=true`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.token}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
      },
      body: params
    }).then(res => {
      return res.json();
    })
    .then(json => {
      const rows = json.splice(1).map(table => {
        // Extract the datatype from datatype url e.g. http://www.w3.org/2001/XMLSchema#integer
        const dataType = /#(.*)/.exec(table.columnDatatype)[1];
        return [
          table.tableId,
          table.columnName,
          dataType
        ];
      });
      resolve({
        columnNames: [ 'tablename', 'column_name', 'data_type' ],
        rows
      });
    })
    .catch(err => {
      Logger.log(err);
      throw new Error(err);
    });
  });
}

export function query(queryString, connection) {
  const { owner, id } = parseUrl(connection.url);
  return new Promise((resolve, reject) => {
    const queryStatement = `${queryString.replace(/-/g, '_')}`;
    const params = `${encodeURIComponent('query')}=${encodeURIComponent(queryStatement)}`;
    fetch(`https://api.data.world/v0/sql/${owner}/${id}?includeTableSchema=true`, {
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
    })
    .catch(err => {
      Logger.log(err);
      throw new Error(err);
    });
  });
}
