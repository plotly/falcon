import {contains} from 'ramda';

export function isElectron() {
    // the electron's main process preloads a script that sets up `window.$falcon`
    return Boolean(window.$falcon);
}

export function setUsernameListener(callback) {
    if (isElectron()) {
        window.$falcon.setUsernameListener(callback);
    }
}

export function showOpenDialog(options, callback) {
    if (isElectron()) {
        return window.$falcon.showOpenDialog(options, callback);
    }
}

export function baseUrl() {
     /*
     * Return the base URL of the app.
     * If the user is running this app locally and is configuring their database,
     * then they will be at https://their-subdomain.plot.ly/database-connector
     * and this function will return https://their-subdomain.plot.ly
     * If the user is on on-prem, then the connector is prefixed behind
     * /external-data-connector, so they will be configuring their connections at
     * https://plotly.acme.com/external-data-connector/database-connector and this function
     * will return https://plotly.acme.com/external-data-connector/
      */
    let url = window.location.href;
    if (url.endsWith('/')) {
        url = url.slice(0, url.length - 1);
    }
    if (url.endsWith('database-connector')) {
        url = url.slice(0, url.length - 'database-connector'.length);
    }
    return url;
}

export function usesHttpsProtocol() {
    return contains('https://', baseUrl());
}

export function isOnPrem() {
    return (contains('external-data-connector', baseUrl()));
}

export function plotlyUrl() {
    if (isOnPrem()) {
        return window.location.origin;
    }
    return 'https://plot.ly';
}

export function homeUrl() {
    return (isOnPrem()) ?
        '/external-data-connector' :
        '';
}

export function datasetUrl(fid) {
  const [account, gridId] = fid.split(':');
  return `${plotlyUrl()}/~${account}/${gridId}`;
}

export function getPathNames(url) {
    const parser = document.createElement('a');
    parser.href = url;
    const pathNames = parser.pathname.split('/');

    return pathNames;
}
