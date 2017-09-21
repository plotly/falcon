import fs from 'fs';
import {concat, contains, has, keys} from 'ramda';
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
    AUTH_ENABLED: true,
    PLOTLY_API_SSL_ENABLED: true,
    PLOTLY_API_DOMAIN: 'api.plot.ly',

    CERTIFICATE_LAST_UPDATED: '',
    CONNECTOR_HTTPS_DOMAIN: 'default',

    // TODO - This should just be an object keyed by username
    USERS: [],

    ACCESS_TOKEN: '',
    /*
     * The actual CORS origins is a "derived" setting
     * that is composed of ADDITIONAL_CORS_ALLOWED_ORIGINS,
     * DEFAULT_CORS_ALLOWED_ORIGINS, and the PLOTLY_API_DOMAIN if on-prem
     */
    ADDITIONAL_CORS_ALLOWED_ORIGINS: [],

    DEFAULT_CORS_ALLOWED_ORIGINS: [
        'https://plot.ly',
        'https://stage.plot.ly',
        'https://local.plot.ly',
        'http://localhost:9494'
    ],

    PORT: 9494,
    PORT_HTTPS: 9495,

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
    'PLOTLY_URL',
    'CONNECTIONS_PATH',
    'QUERIES_PATH',
    'LOG_PATH',
    'SETTINGS_PATH',
    'KEY_FILE',
    'CERT_FILE',
    'CORS_ALLOWED_ORIGINS'
];

function getDerivedSetting(settingName) {
    switch (settingName) {
        case 'PLOTLY_URL': {
            if (getSetting('PLOTLY_API_DOMAIN') ===
                DEFAULT_SETTINGS['PLOTLY_API_DOMAIN']) {
                return 'https://plot.ly'
            } else {
                return getSetting('PLOTLY_API_URL');
            }
        }

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

        case 'CORS_ALLOWED_ORIGINS': {
            const corsOrigins = concat(
                getSetting('DEFAULT_CORS_ALLOWED_ORIGINS'),
                getSetting('ADDITIONAL_CORS_ALLOWED_ORIGINS')
            );

            /*
             * Add the on-prem domain if the user is using the connector with
             * on-prem
             */
            if (getSetting('PLOTLY_API_DOMAIN') !==
                    DEFAULT_SETTINGS['PLOTLY_API_DOMAIN']) {

                corsOrigins.push(getSetting('PLOTLY_URL'));

            }
            return corsOrigins;
        }

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
    if (!has(settingName, DEFAULT_SETTINGS)) {
        throw new Error(`Setting ${settingName} does not exist`);
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
