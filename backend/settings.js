import fs from 'fs';
import {has} from 'ramda';
import {
    LOG_PATH,
    SETTINGS_PATH,
    CONNECTOR_FOLDER_PATH,
    createConnectorFolder
} from './utils/homeFiles';

const DEFAULT_SETTINGS = {
    LOG_PATH: LOG_PATH,
    HEADLESS: false,
    PLOTLY_API_DOMAIN: 'https://api-local.plot.ly',
    USERS: [
        {username: 'chris', apikey: '1c7f5rx2ef'}
    ],
    CORS_ALLOWED_ORIGINS: [
        'https://plot.ly',
        'https://stage.plot.ly',
        'https://local.plot.ly'
    ]
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

export function getSetting(settingName) {
    const settingsOnFile = loadSettings();
    if (has(settingName, settingsOnFile)) {
        return settingsOnFile[settingName];
    } else if (has(settingName, DEFAULT_SETTINGS)) {
        return DEFAULT_SETTINGS[settingName];
    } else {
        throw new Error(`${settingName} is not a valid setting`);
    }
}
