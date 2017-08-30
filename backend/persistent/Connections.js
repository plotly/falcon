// Save and load connection objects that contain the DB credentials, host, and more

import fs from 'fs';
import {assoc, assocPath, dissoc, findIndex, merge} from 'ramda';
import uuid from 'uuid';
import YAML from 'yamljs';
import Logger from '../logger';
import * as Datastores from './datastores/Datastores.js';

import {getSetting} from '../settings';

import {
    createStoragePath
} from '../utils/homeFiles';

export function sanitize(connection) {
    return dissoc('secretAccessKey', dissoc('password', connection));
}

export function getConnections() {
    if (fs.existsSync(getSetting('CONNECTIONS_PATH'))) {
        return YAML.load(getSetting('CONNECTIONS_PATH').toString());
    } else {
        return [];
    }
}

export function getSanitizedConnectionById(id) {
    const connection = getConnections().find(c => c.id === id);
    if (connection) {
        return sanitize(connection);
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
        fs.writeFileSync(getSetting('CONNECTIONS_PATH'), YAML.stringify(connections, 4));
    }
}

export function getSanitizedConnections() {
    const connections = getConnections();
    return connections.map(cred => sanitize(cred));
}

export function saveConnection(connectionObject) {
    const connections = getConnections();
    const connectionId = `${connectionObject.dialect}-${uuid.v4()}`;
    connections.push(assoc('id', connectionId, connectionObject));
    if (!fs.existsSync(getSetting('STORAGE_PATH'))) {
        createStoragePath();
    }
    fs.writeFileSync(getSetting('CONNECTIONS_PATH'), YAML.stringify(connections, 4));
    return connectionId;
}

export function validateConnection (connectionObject) {
    return Datastores.connect(connectionObject).then(() => {
        return {};
    }).catch(err => {
        return err;
    });
}

export function editConnectionById(newConnectionObject) {
    const {id} = newConnectionObject;
    const connections = getConnections();
    const newConnections = connections.map(connection => {
        if (connection.id === id) {
            return newConnectionObject;
        }
        return connection;
    });
    if (!fs.existsSync(getSetting('STORAGE_PATH'))) {
        createStoragePath();
    }
    fs.writeFileSync(getSetting('CONNECTIONS_PATH'), YAML.stringify(newConnections, 4));
    return {};
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
