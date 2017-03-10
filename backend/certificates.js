import {getSetting, saveSetting} from './settings.js';
import * as fs from 'fs';
import fetch from 'node-fetch';
import Logger from './logger';

import {fakeCerts} from '../test/backend/utils';

const CA_HOST = {
    PROTOCOL: 'http',
    DOMAIN: 'plotly-connector-test.com',
    ROUTE: 'certificate'
};

export const LOCAL_SETTINGS = {
    CA_HOST_URL: `${CA_HOST.PROTOCOL}://${CA_HOST.DOMAIN}/${CA_HOST.ROUTE}`,
    DAYS_CERT_IS_GOOD: 24,
    MAX_TRIES_COUNT: 5,
    ONGOING_COUNT: 0,
    TIMEOUT_BETWEEN_TRIES: 1,  // seconds
    USE_MOCK_CERTS: false
};

export function setCertificatesSettings(setting, value) {
    LOCAL_SETTINGS[setting] = value;
}

// return HTTPS certs if they exist for a server to use when created or null
export function getCerts() {
    try {
        return {
            key: fs.readFileSync(getSetting('KEY_FILE'), 'utf-8'),
            cert: fs.readFileSync(getSetting('CERT_FILE'), 'utf-8')
        };
    } catch (e) {
        return {};
    }
}

export function saveCertsLocally({key, cert, subdomain}) {
    Logger.log('Saving certificates locally.');
    // (renewal) -> fs.writeFile replaces the file if it already exists
    const saveCert = new Promise((resolve, reject) => {
        fs.writeFile(getSetting('CERT_FILE'), cert, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
    const saveKey = new Promise((resolve, reject) => {
        fs.writeFile(getSetting('KEY_FILE'), key, (err) => {
            if (err) reject(err);
            else resolve();
        });
    });

    return Promise.all([saveCert, saveKey])
    .then(() => {
        saveSetting('CONNECTOR_HTTPS_DOMAIN', `${subdomain}.${CA_HOST.DOMAIN}`);
        saveSetting('CERTIFICATE_LAST_UPDATED', new Date());
        return;
    });
}

export function fetchCertsFromCA() {
    const {username, accessToken} = getSetting('USERS')[0];
    Logger.log('Sending request to the CA:' + LOCAL_SETTINGS.CA_HOST_URL);
    return fetch(
        `${LOCAL_SETTINGS.CA_HOST_URL}`, {
            method: 'POST',
            body: JSON.stringify({
                credentials: {
                    username,
                    access_token: accessToken,
                    plotly_api_domain: getSetting('PLOTLY_API_URL')
                }
            })
        }
    ).then((res) => {
        if (res.status !== 201) {
            throw `An error occured requesting certificates from the CA. Status ${res.status} was returned.`;
        }
        return res.json();
    }).catch((e) => {
        Logger.log(`CA Server fails to respond. ${JSON.stringify(e)}`);
        if (e.code === 'ECONNREFUSED') {
            Logger.log('Caught ECONNREFUSED from CA server.');
            // If server is down, increase TIMEOUT to try a 1 minute later.
            setCertificatesSettings('TIMEOUT_BETWEEN_TRIES', 60);
        }
    });
}

export function mockFetchCertsFromCA() {
    return new Promise((resolve, reject) => {
        resolve(fakeCerts);
    });
}

export function fetchAndSaveCerts() {
    /*
     * This returns a promise to save certificates.
     * When developing and debugging, you may want to quickly use the
     * mocked certs (MOCK_CERTS=true) returned as a promise.
     */

    Logger.log('Fetching the CA for new certificates.');
    Logger.log('Mocking certs is ' + LOCAL_SETTINGS.USE_MOCK_CERTS);
    let fetchCerts;
    if (LOCAL_SETTINGS.USE_MOCK_CERTS) {
        fetchCerts = mockFetchCertsFromCA;
    } else {
        fetchCerts = fetchCertsFromCA;
    }
    return fetchCerts().then(response => {
        if (!response.key || !response.cert || !response.subdomain) {
            throw 'CA did not return one or more of [key, cert, subdomain].';
        }
        Logger.log('Received a successful response from the CA.');
        return saveCertsLocally(response);
    });
}

// Wrapper around fetchAndSaveCerts to try again with a sleep period specified.
// Callback is used for renewals as a function that restarts the https server.
export function timeoutFetchAndSaveCerts(callback = () => {}) {
    // Increment tries.
    LOCAL_SETTINGS.ONGOING_COUNT += 1;
    fetchAndSaveCerts()
    .then (() => {
        Logger.log('Fetched and Saved certificates. Resetting count.');
        LOCAL_SETTINGS.ONGOING_COUNT = 0;
        try {
            callback();
        } catch (e) {
            Logger.log(
                `Failed to restart the https server. Please restart manually. ${e}.
            `);
        }
    }).catch((e) => {
        // Retry calling CA if less than max count of tries.
        const {ONGOING_COUNT, MAX_TRIES_COUNT, TIMEOUT_BETWEEN_TRIES} = LOCAL_SETTINGS;
        if (ONGOING_COUNT < MAX_TRIES_COUNT) {
            Logger.log(`Trying to fetch certs again. ${ONGOING_COUNT} tries so far`);
            setTimeout(() => {
                timeoutFetchAndSaveCerts(callback);
            }, TIMEOUT_BETWEEN_TRIES * 1000);
        }
        Logger.log(`Stopped trying after ${ONGOING_COUNT} tries.`);
    });
}

const msInOneDay = 1000 * 3600 * 24;

function toMilliseconds(days) {
    return days * msInOneDay;
}

export function calculateDaysToRenewal() {
    // setTimeout is using a 32 bit int to store the delay so the max value allowed
    // would be 2147483647 => 24.8 days.
    const lastUpdated = getSetting('CERTIFICATE_LAST_UPDATED');
    const timePassed = new Date().getTime() - new Date(lastUpdated).getTime();
    return Math.ceil(LOCAL_SETTINGS.DAYS_CERT_IS_GOOD - timePassed / msInOneDay);
}

// Renewing is the same as fetching a new cert because we are
// generating a new hash each time.

export function setRenewalJob(args) {
    const callback = args.server ? args.server.restart : () => {};
    const timeout = args.timeout || Math.max(toMilliseconds(calculateDaysToRenewal()), 0);
    return setTimeout(() => {
        Logger.log('Renewing certificates.');
        timeoutFetchAndSaveCerts(callback);
    }, timeout);
}
