import fs from 'fs';
import os from 'os';
import path from 'path';

/*
 * This works with a few files in the user's ~/.plotly folder:
 * - ~/.plotly/connector/connections.yaml - an array of connections
 * - ~/.plotly/connector/queries.yaml - an array of query objects
 *
 * This module exposes some methods for accessing these files.
 */

const CONNECTOR_FOLDER_PATH_PARTS = [
    os.homedir(),
    '.plotly',
    'connector'
];

export const CONNECTOR_FOLDER_PATH = path.join(...CONNECTOR_FOLDER_PATH_PARTS);

export const CREDENTIALS_PATH = path.join(
    CONNECTOR_FOLDER_PATH,
    'connections.yaml'
);

export const QUERIES_PATH = path.join(
    CONNECTOR_FOLDER_PATH,
    'queries.yaml'
);

export const LOG_PATH = path.join(
    CONNECTOR_FOLDER_PATH,
    'log.log'
);

export const SETTINGS_PATH = path.join(
    CONNECTOR_FOLDER_PATH,
    'settings.yaml'
);

export function createConnectorFolder () {
    let partialPath = CONNECTOR_FOLDER_PATH_PARTS[0];
    CONNECTOR_FOLDER_PATH_PARTS.slice(1).forEach(pathPart => {
        partialPath = path.join(partialPath, pathPart);
        if (!fs.existsSync(partialPath)) {
            fs.mkdirSync(partialPath);
        }
    });
}
