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

var MOCK_CERTS = true;

export function setMockCerts(boolean) {
    MOCK_CERTS = boolean;
}

const daysCertificateIsGoodFor = 24;

export const CA_HOST_URL = `${CA_HOST.PROTOCOL}://${CA_HOST.DOMAIN}/${CA_HOST.ROUTE}`;

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
    // const saveCert = fs.writeFile(getSetting('CERT_FILE'), cert);
    // const saveKey = fs.writeFile(getSetting('KEY_FILE'), key);
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
        `${CA_HOST_URL}`, {
            method: 'POST',
            body: JSON.stringify({
                credentials: {
                    username,
                    access_token: accessToken,
                    plotly_api_domain: getSetting('PLOTLY_API_URL')
                }
            })
        }
    ).then(res => res.json()).then(json => {
        return json;
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
     * When developing and debugging, you may want to skip this part as it
     * takes around 1 minute of your time and use the
     * mocked certs (MOCK_CERTS=true).
     */
    let fetchCerts;
    if (MOCK_CERTS) {
        fetchCerts = mockFetchCertsFromCA;
    } else {
        fetchCerts = fetchCertsFromCA;
    }
    return fetchCerts().then(response => {
        return saveCertsLocally(response);
    })
    .catch((e) => {
        Logger.log('An error returned from the CA.' + JSON.stringify(e));
    });
}

// Wrapper around fetchAndSaveCerts to try again with a sleep period specified.
export function timeoutFetchAndSaveCerts(seconds = 0) {
    var triesCounter = 0;
    setTimeout(() => fetchAndSaveCerts()
    .then (() => {
        Logger.log('Successfully received certs from CA.');
    }).catch(() => {
        triesCounter += 1;
        // Retry in five seconds
        timeoutFetchAndSaveCerts(5);
    }), seconds * 1000);
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
