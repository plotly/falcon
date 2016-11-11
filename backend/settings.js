import fs from 'fs';
import {has} from 'ramda';
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

    // TODO - Set to https://api.plot.ly
    PLOTLY_API_DOMAIN: 'https://api-local.plot.ly',
    // PLOTLY_API_DOMAIN: 'https://api.plot.ly',

    // TODO - Remove these sample accounts
    // TODO - This should just be an object keyed by username
    USERS: [
        // {username: 'plotly-database-connector', apiKey: 'reiptow6gu'}
        {username: 'chris', apiKey: '1c7f5rx2ef'}
    ],

    CORS_ALLOWED_ORIGINS: [
        'https://plot.ly',
        'https://stage.plot.ly',
        'https://local.plot.ly'
    ],
    PORT: 9000,

    LOG_TO_STDOUT: false
};

function loadSettings() {
    if (fs.existsSync(SETTINGS_PATH)) {
        return JSON.parse(fs.readFileSync(SETTINGS_PATH).toString());
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
    fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settingsOnFile));
}

/*
 * Load settings from process.env,
 * then from the saved file in SETTINGS_PATH,
 * then from the defaults above
 */
export function getSetting(settingName) {
    const settingsOnFile = loadSettings();
    if (has(settingName, process.env)) {
        let envObject = process.env[settingName];
        try {
            return JSON.parse(envObject);
        } catch(e) {
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
