import * as fs from 'fs';
import restify from 'restify';
import {replace, splitAt} from 'ramda';
import YAML from 'yamljs';
import {getSetting, saveSetting} from './settings.js';

let sudo, dialog;
try {
    sudo = require('electron-sudo');
    dialog = require('electron').dialog;
    console.log('required electron');
} catch (e) {
    console.log(
        'Could not load electron dependencies. ' +
        'Make sure the app is not targeted at electron process.'
    );
}

// get settings
const keyFilePath = getSetting('KEY_FILE');
const csrFilePath = getSetting('CSR_FILE');

// generic directories
const HOSTS = '/etc/hosts';
const SCRIPTS_DIRECTORY = replace(/\ /g, '\\ ', `${__dirname}`);

// dialog messages
const SUDO_MESSAGE = 'Welcome to the Plotly Database Connector! ' +
'To get you setup with HTTPS we\'ll need your administrator password to create encrypted ' +
'certificates on this app. Behind the scenes we will be running the openssl command ' +
'to generate a self-signed certificate.';
const ERROR_MESSAGE = (error) => 'Yikes, an error occurred while setting up' +
    'HTTPS. Create an issue at ' +
    'https://github.com/plotly/plotly-database-connector/issues' +
    'and paste a screen shot of this error message:' +
    `${error}`;

// scripts
const REDIRECT_CONNECTOR_SCRIPT = `sh  "${SCRIPTS_DIRECTORY}"/../ssl/redirectConnector.sh`;
const CREATE_CERTS_SCRIPT = `sh  "${SCRIPTS_DIRECTORY}"/../ssl/createKeys.sh`;

// running sudo commands options
const SUDO_OPTIONS = {
    name: 'Connector',
    process: {
        options: {
            env: {'VAR': 'VALUE'}
        },
        on: (ps) => {
            ps.stdout.on('data', function() {});
            setTimeout(function() {
                ps.kill();
            }, 50000);
        }
    }
};

const ERROR_MESSAGE_BOX = (error) => {
    console.log(error);
    const charLengthOfMessage = 500;
    const shortenedMessage = splitAt(charLengthOfMessage, error.toString())[0];
    return dialog.showMessageBox({
        type: 'info',
        buttons: ['OK'],
        message: ERROR_MESSAGE(shortenedMessage)
    });
};

let messageShown;
const showSudoMessage = () => {
    if (!messageShown) {
        messageShown = true;
        dialog.showMessageBox(
            {type: 'info', buttons: ['OK'], message: SUDO_MESSAGE}
        );
    }
};

function isUrlRedirected(url) {
    console.log('looking in hosts for ', url);
    console.log(HOSTS);
    const contents = fs.readFileSync(HOSTS);
    console.log('contents ' + contents);
    return contents.indexOf(url) > -1;
}

function waitForRedirect(url) {
    return new Promise((resolve, reject) => {
        const waitPeriod = 1000;
        const maxWaitPeriod = 10000;
        let waited = 0;
        console.log('waiting redirect for ', url);
        while (!isUrlRedirected(url) && (waited < maxWaitPeriod)) {
            console.log('Waiting for redirect.');
            setTimeout(isUrlRedirected(url), waitPeriod);
            console.log('isUrlRedirected(url)', isUrlRedirected(url));
            waited += waitPeriod;
        }
        console.log('Exit waiting for redirect loop.');
        if (!isUrlRedirected(url)) {
            reject('Failed to redirect to seecure domain.');
        } else {
            resolve();
        }
    }).then(() => {return {};}).catch(err => {return err;});
}

export function redirectUrl(url) {
    const redirected = isUrlRedirected(url);
    console.log('redirected', redirected);
    if (!redirected) {
        try {
            sudo.exec(
                REDIRECT_CONNECTOR_SCRIPT,
                SUDO_OPTIONS,
                function(error) {
                    if (error) {
                        console.log('error', error);
                    }
                }
            );
        } catch (error) {
            console.log(error);
            return {error};
        }
    }
    return waitForRedirect(url);
}

// return HTTPS certs if they exist for a server to use when created or null
export function getCerts() {
    if (hasCerts()) {
        return {
            key: fs.readFileSync(getSetting('KEY_FILE')),
            certificate: fs.readFileSync(getSetting('CSR_FILE'))
        };
    }
    return {};
}

// check if there are certificates in the directory specified in settings.js
export function hasCerts() {
    try {
        // try reading certs
        fs.accessSync(keyFilePath, fs.F_OK);
        fs.accessSync(csrFilePath, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

// creates self-signed certificates
export function createCerts() {
    try {
        showSudoMessage();
        sudo.exec(
            CREATE_CERTS_SCRIPT,
            SUDO_OPTIONS,
            function(error) {
                if (error) {
                    console.log('error', error);
                }
            }
        );
    } catch (error) {
        console.log('error', error);
        return {error};
    }
    return {};
}

// TODO: complete this function using sudo
export function deleteCerts() {
    try {
        console.log('delete certs');
        // deleting certs
    } catch (error) {
        return error;
    }
}
