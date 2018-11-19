import Logger from './logger';

import {
    deleteAllConnections,
    deleteBadConnections
} from './persistent/Connections.js';
import {getSetting} from './settings.js';

const {setCSVStorageSize} = require('db-connectors').CSV;

export default function init() {
    try {
        deleteBadConnections();
    } catch (error) {
        Logger.log(`Failed to delete bad connections: ${error.message}`);
        deleteAllConnections();
    }

    try {
        setCSVStorageSize(getSetting('CSV_STORAGE_SIZE'));
    } catch (error) {
        Logger.log(`Failed to get setting CSV_STORAGE_SIZE: ${error.message}`);
        setCSVStorageSize(0);
    }
}
