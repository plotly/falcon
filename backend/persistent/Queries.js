import fs from 'fs';

import {
    CONNECTOR_FOLDER_PATH,
    QUERIES_PATH,
    createConnectorFolder
} from '../utils/homeFiles';


export function getQueries() {
    if (fs.existsSync(QUERIES_PATH)) {
        return JSON.parse(fs.readFileSync(QUERIES_PATH).toString());
    } else {
        return [];
    }
}

export function saveQuery(queryObject) {
    const credentials = getQueries();
    credentials.push(queryObject);
    if (!fs.existsSync(CONNECTOR_FOLDER_PATH)) {
        createConnectorFolder();
    }
    fs.writeFileSync(QUERIES_PATH, JSON.stringify(credentials));
}
