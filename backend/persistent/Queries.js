import fs from 'fs';
import {findIndex, propEq} from 'ramda';
import YAML from 'yamljs';

import {getSetting} from '../settings.js';
import {createStoragePath} from '../utils/homeFiles';
import {stripUndefinedKeys} from '../utils/persistenceUtils.js';

export function getQuery(fid) {
    const queries = getQueries();
    return queries.find(query => query.fid === fid);
}

export function getQueries() {
    if (fs.existsSync(getSetting('QUERIES_PATH'))) {
        return YAML.load(getSetting('QUERIES_PATH').toString());
    }
    return [];
}

export function saveQuery(queryObject) {
    const queries = getQueries();
    queries.push(stripUndefinedKeys(queryObject));
    if (!fs.existsSync(getSetting('STORAGE_PATH'))) {
        createStoragePath();
    }
    fs.writeFileSync(getSetting('QUERIES_PATH'), YAML.stringify(queries, 4));
}

export function updateQuery(fid, updatedQueryData) {
    const existingQuery = getQuery(fid);
    if (!existingQuery) {
        // don't allow appending data to query that doesn't exist
        return;
    }

    const updatedQuery = stripUndefinedKeys({
        ...existingQuery,
        ...updatedQueryData
    });

    deleteQuery(fid);
    saveQuery(updatedQuery);
}

export function deleteQuery(fid) {
    const queries = getQueries();
    const index = findIndex(propEq('fid', fid), queries);

    if (index > -1) {
        queries.splice(index, 1);
        fs.writeFileSync(getSetting('QUERIES_PATH'), YAML.stringify(queries, 4));
    }
}
