// Save and load connection objects that contain the DB credentials, host, and more

import fs from 'fs';
import {assoc, dissoc, findIndex} from 'ramda';
import uuid from 'node-uuid';
import YAML from 'yamljs';

import {
    CONNECTOR_FOLDER_PATH,
    CREDENTIALS_PATH,
    createConnectorFolder
} from '../utils/homeFiles';

export function getConnections() {
    if (fs.existsSync(CREDENTIALS_PATH)) {
        return YAML.load(CREDENTIALS_PATH.toString());
    } else {
        return [];
    }
}

export function getSanitizedConnectionById(id) {
    const connection = getConnections().find(connection => connection.id === id);
    if (connection) {
        // TODO - use reduce or w/e
        return dissoc('secretAccessKey', dissoc('password', connection));
    } else {
        return null;
    }
}

export function getConnectionById(id) {
    return getConnections().find(connection => connection.id === id);
}


export function deleteConnectionById(id) {
    const connections = getConnections();
    const index = findIndex(connection => connection.id === id, connections);
    if (index > -1) {
        connections.splice(index, 1);
        fs.writeFileSync(CREDENTIALS_PATH, YAML.stringify(connections, 4));
    }
}

export function getSanitizedConnections() {
    const connections = getConnections();
    return connections.map(cred => dissoc('password', cred));
}

export function saveConnection(connectionObject) {
    const connections = getConnections();
    const connectionId = `${connectionObject.dialect}-${uuid.v4()}`;
    connections.push(assoc('id', connectionId, connectionObject));
    if (!fs.existsSync(CONNECTOR_FOLDER_PATH)) {
        createConnectorFolder();
    }
    fs.writeFileSync(CREDENTIALS_PATH, YAML.stringify(connections, 4));
    return connectionId;
}


/*
 * Find a pair of connections from the disk by looking up each
 * of the keys in the configuration object.
 *
 * Note that the objects don't need to match exactly -
 * they only need to match in the keys that are provided by the
 * configuration object.
 *
 * This is used to find the unsanitized connection (with the password)
 * saved on the disk given a set of sanitized
 * connections (without the password)
 */
export function lookUpConnections(configuration) {

    const savedDBConnections = getConnections();
    const requestedDBConnections = savedDBConnections.find(savedConnection => {
        let connectionsMatch = true;
        Object.keys(configuration).forEach(credKey => (
            connectionsMatch = connectionsMatch && (
                configuration[credKey] === savedConnection[credKey]
            )
        ));
        return connectionsMatch;
    });
    return requestedDBConnections;
}
