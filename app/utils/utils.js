import {contains} from 'ramda';
import queryString from 'query-string';

const platform = process.platform;

export const canConfigureHTTPS = platform === 'darwin' || platform === 'linux';

export function baseUrl() {
     if (contains(window.location.protocol, ['http:', 'https:'])) {
         /*
          * Use the full URL of the page if the app is running headlessly
          * with a web front-end served by the app.
          *
          * Note that href includes the pathname - this is intentional:
          * in on-prem instances this app will be served behind some relative
          * url like https://plotly.acme.com/connector and all subsequent
          * requests need to be made against that full path, e.g.
          * https://plotly.acme.com/connector/queries
          */
         let url = window.location.href;
         if (url.endsWith('/')) {
             url = url.slice(0, url.length - 1);
         }
         return url;
      } else {
         /*
          * Use the server location if the app is running in electron
          * with electron serving the app file. The electron backend
          * provides the port env variable as a query string param.
          */
        const URL = queryString.parse(location.search).url;
        const PORT = queryString.parse(location.search).port;
        console.log('baseUrl', `${URL}:${PORT}`);
        return `${URL}:${PORT}`;
     }
}

export function usesHttpsProtocol() {
    return contains('https://', baseUrl());
}
