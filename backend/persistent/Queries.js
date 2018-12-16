import fs from 'fs';
import {findIndex, propEq} from 'ramda';
import YAML from 'yamljs';

import {getSetting} from '../settings.js';
import {
    createStoragePath
} from '../utils/homeFiles';


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
    queries.push(queryObject);
    if (!fs.existsSync(getSetting('STORAGE_PATH'))) {
        createStoragePath();
    }
    fs.writeFileSync(getSetting('QUERIES_PATH'), YAML.stringify(queries, 4));
}

export function deleteQuery(fid) {
    const queries = getQueries();
    const index = findIndex(propEq('fid', fid), queries);

    if (index > -1) {
        queries.splice(index, 1);
        fs.writeFileSync(getSetting('QUERIES_PATH'), YAML.stringify(queries, 4));
    }

}
