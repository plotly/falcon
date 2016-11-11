import fs from 'fs';
import {assoc, dissoc, findIndex} from 'ramda';
import uuid from 'node-uuid';
import YAML from 'yamljs';

import {
    CONNECTOR_FOLDER_PATH,
    CREDENTIALS_PATH,
    createConnectorFolder
} from '../utils/homeFiles';

export function getCredentials() {
    if (fs.existsSync(CREDENTIALS_PATH)) {
        return YAML.load(CREDENTIALS_PATH.toString());
    } else {
        return [];
    }
}

export function getSanitizedCredentialById(id) {
    const credential = getCredentials().find(credential => credential.id === id);
    if (credential) {
        // TODO - use reduce or w/e
        return dissoc('secretAccessKey', dissoc('password', credential));
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
        fs.writeFileSync(CREDENTIALS_PATH, YAML.stringify(credentials, 4));
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
    fs.writeFileSync(CREDENTIALS_PATH, YAML.stringify(credentials, 4));
    return credentialId;
}


/*
 * Find a pair of credentials from the disk by looking up each
 * of the keys in the configuration object.
 *
 * Note that the objects don't need to match exactly -
 * they only need to match in the keys that are provided by the
 * configuration object.
 *
 * This is used to find the unsanitized credentials (with the password)
 * saved on the disk given a set of sanitized
 * credentials (without the password)
 */
export function lookUpCredentials(configuration) {

    const savedDBCredentials = getCredentials();
    const requestedDBCredentials = savedDBCredentials.find(savedCredential => {
        let credentialsMatch = true;
        Object.keys(configuration).forEach(credKey => (
            credentialsMatch = credentialsMatch && (
                configuration[credKey] === savedCredential[credKey]
            )
        ));
        return credentialsMatch;
    });
    return requestedDBCredentials;
}
