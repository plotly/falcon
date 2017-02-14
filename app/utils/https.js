import {join, slice, replace, splitAt } from 'ramda';
import {baseUrl, getQuerystringParam} from './utils';

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

let sudo, dialog;
try {
    sudo = require('electron-sudo');
    dialog = require('electron').remote.dialog;
    console.log('Required successfully electron and sudo.');
} catch (e) {
    console.log('Could not load electron dependencies. ');
}

// generic directories
const APP_DIRECTORY = getQuerystringParam('APP_DIRECTORY');
const DIRECTORY_ENCODED = replace(/\ /g, '\\ ', `${APP_DIRECTORY}`);

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
const REDIRECT_CONNECTOR_SCRIPT = `sh  "${DIRECTORY_ENCODED}"/ssl/redirectConnector.sh`;
const CREATE_CERTS_SCRIPT = `sh  "${DIRECTORY_ENCODED}"/ssl/createKeys.sh`;

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

function isUrlRedirected() {
    return fetch(`${baseUrl()}/is-url-redirected`, {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    }).then(res => res.json().then(json => {return json.content;}));
}

function waitForRedirect(url) {
    return new Promise((resolve, reject) => {
        const waitPeriod = 1000;
        const maxWaitPeriod = 10000;
        let waited = 0;
        while (!isUrlRedirected() && (waited < maxWaitPeriod)) {
            setTimeout(isUrlRedirected(), waitPeriod);
            waited += waitPeriod;
        }
        if (!isUrlRedirected()) {
            reject({status: 404, content: 'Failed to redirect to seecure domain.'});
        } else {
            resolve({status: 200, content: {}});
        }
    });
}

export function redirectUrl() {
    // CONNECTOR_HTTPS_DOMAIN is shared between backend and the app
    const url = getQuerystringParam('CONNECTOR_HTTPS_DOMAIN');
    const redirected = isUrlRedirected(url);
    if (!redirected) {
        try {
            sudo.exec(
                REDIRECT_CONNECTOR_SCRIPT,
                SUDO_OPTIONS,
                function(error) {
                    if (error) {
                        return {status: 500, content: error};
                    }
                }
            );
        } catch (error) {
            return {status: 500, content: error};
        }
    }
    return waitForRedirect(url);
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
                        resolve({status: 500, content: error});
                    }
                }
            );
        } catch (error) {
            resolve({status: 500, content: error});
        }
        resolve({status: 200, content: {}});
    });
}
