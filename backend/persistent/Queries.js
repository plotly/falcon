import fs from 'fs';
import {findIndex} from 'ramda';
import YAML from 'yamljs';

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
        return YAML.load(QUERIES_PATH.toString());
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
    fs.writeFileSync(QUERIES_PATH, YAML.stringify(queries, 4));
}

export function deleteQuery(fid) {
    const queries = getQueries();
    const index = findIndex(query => query.fid === fid, queries);

    if (index > -1) {
        queries.splice(index, 1);
        fs.writeFileSync(QUERIES_PATH, YAML.stringify(queries, 4));
    }

}
