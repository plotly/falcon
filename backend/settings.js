import fs from 'fs';
import {contains, has} from 'ramda';
import YAML from 'yamljs';
import {createStoragePath} from './utils/homeFiles';
import path from 'path';
import os from 'os';

const DEFAULT_SETTINGS = {
    HEADLESS: false,

    STORAGE_PATH: path.join(
        os.homedir(),
        '.plotly',
        'connector'
    ),

    PLOTLY_API_SSL_ENABLED: true,
    PLOTLY_API_DOMAIN: 'api.plot.ly',

    // TODO - Should this be configurable or should it just be a constant?
    CONNECTOR_HTTPS_DOMAIN: 'connector.plot.ly',

    // TODO - This should just be an object keyed by username
    USERS: [],

    CORS_ALLOWED_ORIGINS: [
        'https://plot.ly',
        'https://stage.plot.ly',
        'https://local.plot.ly'
    ],
    PORT: 9494,

    APP_DIRECTORY: `${__dirname}/../`,

    LOG_TO_STDOUT: false,

    /*
     * Whether or not this is running on the on-premise server.
     * Note that if the connector is running on a user's local machine
     * but accessing a remote on-premise instance, then this should remain
     * false.
     *
     * Generally set through the ENV variable:
     * PLOTLY_CONNECTOR_IS_RUNNING_INSIDE_ON_PREM
     */
    IS_RUNNING_INSIDE_ON_PREM: false
};

// Settings that depend on other settings are described here
const derivedSettingsNames = [
    'PLOTLY_API_URL',
    'CONNECTIONS_PATH',
    'QUERIES_PATH',
    'LOG_PATH',
    'SETTINGS_PATH',
    'KEY_FILE',
    'CERT_FILE'
];
function getDerivedSetting(settingName) {
    switch (settingName) {
        case 'PLOTLY_API_URL':
            return (
                (getSetting('PLOTLY_API_SSL_ENABLED') ? 'https://' : 'http://') +
                 getSetting('PLOTLY_API_DOMAIN')
            );

        case 'CONNECTIONS_PATH':
            return path.join(
                getSetting('STORAGE_PATH'),
                'connections.yaml'
            );

        case 'QUERIES_PATH':
            return path.join(
                getSetting('STORAGE_PATH'),
                'queries.yaml'
            );

        case 'LOG_PATH':
            return path.join(
                getSetting('STORAGE_PATH'),
                'log.log'
            );

        case 'SETTINGS_PATH':
            return path.join(
                getSetting('STORAGE_PATH'),
                'settings.yaml'
            );

        case 'KEY_FILE':
            return path.join(
                getSetting('STORAGE_PATH'),
                'privkey.pem'
            );

        case 'CERT_FILE':
            return path.join(
                getSetting('STORAGE_PATH'),
                'fullchain.pem'
            );

        default:
            return null;
    }
}

/*
 * Load settings from process.env prefixed with `PLOTLY_CONNECTOR_`
 * then from the saved file in SETTINGS_PATH,
 * then from the defaults above
 */
export function getSetting(settingName) {
    if (contains(settingName, derivedSettingsNames)) {
        return getDerivedSetting(settingName);
    } else if (has(`PLOTLY_CONNECTOR_${settingName}`, process.env)) {
        let envObject = process.env[`PLOTLY_CONNECTOR_${settingName}`];
        try {
            return JSON.parse(envObject);
        } catch (e) {
            return envObject;
        }
    } else {
        /*
         * STORAGE_PATH is the only variable that can't be saved in the
         * settings file because of recursion.
         */
        if (settingName !== 'STORAGE_PATH') {
            const settingsOnFile = loadSettings();
            if (has(settingName, settingsOnFile)) {
                return settingsOnFile[settingName];
            }
        }
        if (has(settingName, DEFAULT_SETTINGS)) {
            return DEFAULT_SETTINGS[settingName];
        } else {
            throw new Error(`Setting ${settingName} does not exist`);
        }
    }
}

function loadSettings() {
    if (fs.existsSync(getSetting('SETTINGS_PATH'))) {
        return YAML.load(getSetting('SETTINGS_PATH'));
    } else {
        return {};
    }
}

// Save settings to a file - primarily used for setting up tests
export function saveSetting(settingName, settingValue) {
    if (settingName !== 'STORAGE_PATH') {
        if (!fs.existsSync(getSetting('STORAGE_PATH'))) {
            createStoragePath();
        }
    }
    const settingsOnFile = loadSettings();
    settingsOnFile[settingName] = settingValue;
    /*
     * TODO - Should add `Infinity` to this call so that YAML
     * stringify's this recursively. Currently it just stringifys
     * on the first level, meaning that
     * {a: {b: 5}}
     * converts to:
     * - a: {b: 5}
     * instead of
     * - a:
     * -    b: 5
     *
     * I'm hesistant to make this change right now because of this
     * bug in the YAML library: https://github.com/jeremyfa/yaml.js/issues/59.
     * Converting empty objects or arrays to nulls could break some code
     * without a more thorough investigation.
     */
    fs.writeFileSync(getSetting('SETTINGS_PATH'), YAML.stringify(settingsOnFile));
}
