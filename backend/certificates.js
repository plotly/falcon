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

const daysCertificateIsGoodFor = 24;

const LOCAL_SETTINGS = {
    CA_HOST_URL: `${CA_HOST.PROTOCOL}://${CA_HOST.DOMAIN}/${CA_HOST.ROUTE}`,
    MAX_TRIES_COUNT: 5,
    ONGOING_COUNT: 0,
    TIMEOUT_BETWEEN_TRIES: 5,  // seconds
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
    const hostInfo = {
        host: `${subdomain}.${CA_HOST.DOMAIN}`,
        lastUpdated: new Date()
    };

    return Promise.all([saveCert, saveKey])
    .then(() => {
        saveSetting('CONNECTOR_HOST_INFO', hostInfo);
        return;
    });
}

export function fetchCertsFromCA() {
    const {username, accessToken} = getSetting('USERS')[0];
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
        return res.json().then(json => {
            return json;
        });
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
        return saveCertsLocally(response);
    });
}

// Wrapper around fetchAndSaveCerts to try again with a sleep period specified.

export function timeoutFetchAndSaveCerts() {
    // Call CA right away if it's the first try.
    const timeout = LOCAL_SETTINGS.ONGOING_COUNT === 0
        ? 0
        : LOCAL_SETTINGS.TIMEOUT_BETWEEN_TRIES;
    // Increment tries.
    setCertificatesSettings('ONGOING_COUNT', LOCAL_SETTINGS.ONGOING_COUNT + 1);

    setTimeout(() => fetchAndSaveCerts()
    .then (() => {
        Logger.log('Successfully received certs from CA.');
    }).catch((e) => {
        Logger.log(`Failed to receive certs from CA. ${e}`);
        // Retry calling CA if less than max count of tries.
        if (LOCAL_SETTINGS.ONGOING_COUNT < LOCAL_SETTINGS.MAX_TRIES_COUNT) {
            timeoutFetchAndSaveCerts();
        }
    }), timeout * 1000);
}

export const msInOneDay = 1000 * 3600 * 24;

export function calculateDaysToRenewal() {
    // setInterval is using a 32 bit int to store the delay so the max value allowed
    // would be 2147483647 => 24.8 days.
    const {lastUpdated} = getSetting('CONNECTOR_HOST_INFO');
    const timePassed = new Date().getTime() - new Date(lastUpdated).getTime();
    return Math.ceil(daysCertificateIsGoodFor - timePassed / msInOneDay);
}

export function toMilliseconds(days) {
    return days * msInOneDay;
}

// Renewing for now is the same as fetching a new cert because we are
// generating a new hash each time.
export const renewCertificate = () => {
    fetchAndSaveCerts().then(() => {
        setRenewalJob();
    })
    .catch((e) => {
        Logger.log('Error occured during rewnewal of the certificate' + JSON.stringify(e));
        Logger.log('Trying again.');
        setTimeout(renewCertificate, 5000);
    });
};

export function setRenewalJob() {
    return setTimeout(() => {
        renewCertificate();
    }, toMilliseconds(calculateDaysToRenewal()));
}
