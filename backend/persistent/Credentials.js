import fs from 'fs';

import {
    CONNECTOR_FOLDER_PATH,
    CREDENTIALS_PATH,
    createConnectorFolder
} from '../utils/homeFiles';

export function getCredentials() {
    if (fs.existsSync(CREDENTIALS_PATH)) {
        return JSON.parse(fs.readFileSync(CREDENTIALS_PATH).toString());
    } else {
        return [];
    }
}

export function saveCredential(credentialObject) {
    const credentials = getCredentials();
    credentials.push(credentialObject);
    if (!fs.existsSync(CONNECTOR_FOLDER_PATH)) {
        createConnectorFolder();
    }
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials));
}


export function lookUpCredentials(configuration) {
    // Look up the password from a configuration file
    const savedDBCredentials = getCredentials();
    const requestedDBCredentials = savedDBCredentials.find(savedCredential => {
        let credentialsMatch = false;
        Object.keys(configuration).forEach(credKey => (
            credentialsMatch = (
                configuration[credKey] === savedCredential[credKey]
            )
        ));
        return credentialsMatch;
    });
    return requestedDBCredentials;
}
