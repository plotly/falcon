import {getSetting, saveSetting} from './settings.js';
import * as fs from 'fs';
import fetch from 'node-fetch';
import Logger from './logger';

// TODO: Move these constants to settings?
const CA_HOST = {
    DOMAIN: 'plotly-connector-test.com',
    PROTOCOL: 'http',
    ROUTE: 'certificate'
};

export const CA_HOST_URL = `${CA_HOST.PROTOCOL}://${CA_HOST.DOMAIN}/${CA_HOST.ROUTE}`;

// return HTTPS certs if they exist for a server to use kwhen created or null
export function getCerts() {
    try {
        return {
            key: fs.readFileSync(getSetting('KEY_FILE'), 'utf-8'),
            certificate: fs.readFileSync(getSetting('CERT_FILE'), 'utf-8')
        };
    } catch (e) {
        return {};
    }
}

export function saveCertsLocally(json) {
    fs.writeFileSync(getSetting('CERT_FILE'), json.cert);
    fs.writeFileSync(getSetting('KEY_FILE'), json.key);
    const hostInfo = {
        host: `${json.subdomain}.${CA_HOST.DOMAIN}`,
        lastUpdated: new Date()
    };
    saveSetting('CONNECTOR_HOST_INFO', hostInfo);
    return {};
}
export const msInOneDay = 1000 * 3600 * 24;

export function calculateDaysToRenewal() {
    const daysCertificateIsGoodFor = 24; // Because max setTimout value is 24 days.
    const {lastUpdated} = getSetting('CONNECTOR_HOST_INFO');
    const timePassed = Math.abs(new Date().getTime() - new Date(lastUpdated).getTime());
    return Math.ceil(daysCertificateIsGoodFor - timePassed / msInOneDay);
}

export function toMilliseconds(days) {
    return days * msInOneDay;
}

export const renewCertificate = () => {
    // TODO: Not sure what CA endpoint to use at the moment for a renewal.
    return console.log(`Renewal of ${getSetting('CONNECTOR_HOST_INFO').host}`);
};

export function setRenewalJob() {
    // setInterval is using a 32 bit int to store the delay so the max value allowed
    // would be 2147483647 => 24.8 days.
    return setInterval(() => {
        renewCertificate();
    }, toMilliseconds(calculateDaysToRenewal()));
}
