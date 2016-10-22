import fs from 'fs';
import {assoc, dissoc, findIndex} from 'ramda';
import uuid from 'node-uuid';

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

export function getSanitizedCredentialById(id) {
    const credential = getCredentials().find(credential => credential.id === id);
    if (credential) {
        return dissoc('password', credential);
    } else {
        return null;
    }
}

export function getCredentialById(id) {
    return getCredentials().find(credential => credential.id === id);
}


export function deleteCredentialById(id) {
    const credentials = getCredentials();
    const index = findIndex(credential => credential.id === id, credentials);
    if (index > -1) {
        credentials.splice(index, 1);
        fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials));
    }
}

export function getSanitizedCredentials() {
    const credentials = getCredentials();
    return credentials.map(cred => dissoc('password', cred));
}

export function saveCredential(credentialObject) {
    const credentials = getCredentials();
    const credentialId = uuid.v4();
    credentials.push(assoc('id', credentialId, credentialObject));
    if (!fs.existsSync(CONNECTOR_FOLDER_PATH)) {
        createConnectorFolder();
    }
    fs.writeFileSync(CREDENTIALS_PATH, JSON.stringify(credentials));
    return credentialId;
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
