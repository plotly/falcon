import fs from 'fs';
import {has} from 'ramda';
import YAML from 'yamljs';
import {
    LOG_PATH,
    SETTINGS_PATH,
    CONNECTOR_FOLDER_PATH,
    createConnectorFolder
} from './utils/homeFiles';

// TODO - Since these settings can set as ENV variables, we should
// probably prefix them with like `PLOTLY_` to prevent any namespace
// clashes.
const DEFAULT_SETTINGS = {
    LOG_PATH: LOG_PATH,
    HEADLESS: false,

    // TODO - Needs to be set for on-prem
    PLOTLY_API_DOMAIN: 'https://api.plot.ly',

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

    // certificates paths
    // TODO - This isn't portable - should move this to the home folder
    KEY_FILE: '/ssl/certs/server/privkey.pem',
    CSR_FILE: '/ssl/certs/server/fullchain.pem',

    LOG_TO_STDOUT: false
};

function loadSettings() {
    if (fs.existsSync(SETTINGS_PATH)) {
        return YAML.load(SETTINGS_PATH);
    } else {
        return {};
    }
}

// Save settings to a file - primarily used for setting up tests
export function saveSetting(settingName, settingValue) {
    if (!fs.existsSync(CONNECTOR_FOLDER_PATH)) {
        createConnectorFolder();
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
    fs.writeFileSync(SETTINGS_PATH, YAML.stringify(settingsOnFile));
}

/*
 * Load settings from process.env prefixed with `PLOTLY_CONNECTOR_`
 * then from the saved file in SETTINGS_PATH,
 * then from the defaults above
 */
export function getSetting(settingName) {
    const settingsOnFile = loadSettings();
    if (has(`PLOTLY_CONNECTOR_${settingName}`, process.env)) {
        let envObject = process.env[`PLOTLY_CONNECTOR_${settingName}`];
        try {
            return JSON.parse(envObject);
        } catch (e) {
            return envObject;
        }
    } else if (has(settingName, settingsOnFile)) {
        return settingsOnFile[settingName];
    } else if (has(settingName, DEFAULT_SETTINGS)) {
        return DEFAULT_SETTINGS[settingName];
    } else {
        throw new Error(`${settingName} is not a valid setting`);
    }
}
