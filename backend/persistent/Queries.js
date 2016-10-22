import fs from 'fs';
import {findIndex} from 'ramda';

import {
    CONNECTOR_FOLDER_PATH,
    QUERIES_PATH,
    createConnectorFolder
} from '../utils/homeFiles';

export function getQuery(fid) {
    const queries = getQueries();
    return queries.find(query => query.fid === fid);
}

export function getQueries() {
    if (fs.existsSync(QUERIES_PATH)) {
        return JSON.parse(fs.readFileSync(QUERIES_PATH).toString());
    } else {
        return [];
    }
}

export function saveQuery(queryObject) {
    const queries = getQueries();
    queries.push(queryObject);
    if (!fs.existsSync(CONNECTOR_FOLDER_PATH)) {
        createConnectorFolder();
    }
    fs.writeFileSync(QUERIES_PATH, JSON.stringify(queries));
}

export function deleteQuery(fid) {
    const queries = getQueries();
    const index = findIndex(query => query.fid === fid, queries);

    if (index > -1) {
        queries.splice(index, 1);
        fs.writeFileSync(QUERIES_PATH, JSON.stringify(queries));
    }

}
