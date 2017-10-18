import fetch from 'node-fetch';
import {createClient} from 'node-impala';
import {dissoc, keys, values, init, map, prepend, unnest} from 'ramda';

import Logger from '../../logger';

const client = createClient();

export function connect(connection) {
    return client.connect({
        host: connection.host,
        port: connection.port,
        resultType: 'json-array'
    });
}

export function tables(connection) {
    const code = (connection.database) ?
        `show tables in ${connection.database}` :
        'show tables';
    return client.query(code)
    .then(json => {
        let tableNames = json.map(t => t.name);
        if (connection.database) tableNames = tableNames.map(tn => `${connection.database}.${tn}`);
        tableNames = tableNames.map(tn => tn.toUpperCase());

        return tableNames;
    }).catch(err => {
      Logger.log(err);
      throw new Error(err);
    });
}

export function schemas(connection) {
    let columnnames = ['tablename', 'column_name', 'data_type'];
    return tables(connection)
    .then(tableNames => {

        const promises = map(tableName => {
            return query(`describe ${tableName}`)
            .then(json => map(row => prepend(tableName, init(row)), json.rows));
        }, tableNames);

        // Wait for all the describe-table promises to resolve before resolving:
        return Promise.all(promises);
    }).then(res => {

      // The results are nested inside a list, so we need to un-nest first:
      const rows = unnest(res);
      return {columnnames, rows};
    }).catch(err => {
        Logger.log(err);
        throw new Error(err);
    });
}

export function query(query, connection) {
    return client.query(query)
    .then(json => {
        let columnnames = [];
        let rows = [];

        if (json.length !== 0) {
            columnnames = keys(json[0]);
            rows = json.map(obj => values(obj));
        }
        return {columnnames, rows};
    }).catch(err => {
        Logger.log(err);
        throw new Error(err)
    });
}
