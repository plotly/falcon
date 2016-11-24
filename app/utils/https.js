import * as fs from 'fs';
import {replace, splitAt} from 'ramda';
import {getQuerystringParam} from './utils';

/*
 * Our app has two build targets - electron and node.
 * The electon target has the `electron` module e.g.
 * `require('electron')` works.
 * But the node target doesn't.
 * We are sharing a bunch of code across both of these targets
 * include these imports.
 * We're not really properly splitting apart the electron modules
 * from the non-electron modules, we're just blindly importing everything.
 *
 * To protect the node context from throwing an exception at `require('electron')`
 * we're wrapping the require statement in a try-catch statement and doing
 * a dynamic import.
 * Note that the dynamic import is required for babel not to throw an error
 * during compilation when it tries to resolve all of the require('any-string')
 * statements.
 */

function dynamicRequire(module) {
    return require(module);
}

let sudo, dialog;
try {
    sudo = require('electron-sudo');
    dialog = require('electron').remote.dialog;
    console.log('required electron');
} catch (e) {
    console.log(
        'Could not load electron dependencies. ' +
        'Make sure the app is not targeted at electron process.'
    );
}

// get settings
const keyFilePath = getQuerystringParam('KEY_FILE');
const csrFilePath = getQuerystringParam('CSR_FILE');

// generic directories
const HOSTS = '/etc/hosts';
const DIRECTORY_ENCODED = replace(/\ /g, '\\ ', `${__dirname}`);

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
const REDIRECT_CONNECTOR_SCRIPT = `sh  "${DIRECTORY_ENCODED}"/../ssl/redirectConnector.sh`;
const CREATE_CERTS_SCRIPT = `sh  "${DIRECTORY_ENCODED}"/../ssl/createKeys.sh`;

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
    }).then(() => {return {};})
    .catch(err => {return err;});
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
                        resolve({status: 500, content: error});
                    }
                }
            );
        } catch (error) {
            console.log(error);
            resolve({status: 500, content: error});
        }
    }
    waitForRedirect(url)
    .then(res => resolve({status: 200, content: res}));
}

// check if there are certificates in the directory specified in settings.js
export function hasCerts() {
    return new Promise((resolve, reject) => {
        try {
            // try reading certs
            fs.accessSync(keyFilePath, fs.F_OK);
            fs.accessSync(csrFilePath, fs.F_OK);
        } catch (e) {
            resolve({status: 404, content: false});
        }
        resolve({status: 200, content: true});
    });
}

// creates self-signed certificates
export function createCerts() {
    return new Promise((resolve, reject) => {
        try {
            showSudoMessage();
            sudo.exec(
                CREATE_CERTS_SCRIPT,
                SUDO_OPTIONS,
                function(error) {
                    if (error) {
                        console.log('error', error);
                        resolve({status: 500, content: error});
                    }
                }
            );
        } catch (error) {
            console.log('error', error);
            resolve({status: 500, content: error});
        }
        resolve({status: 200, content: {}});
    });
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
