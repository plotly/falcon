import {contains, has, head, replace} from 'ramda';
import queryString from 'query-string';

const platform = process.platform;
const webPlotlyDomain = 'plot.ly';

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
        const URL = queryString.parse(location.search).URL;
        const PORT = queryString.parse(location.search).PORT;
        return `${URL}:${PORT}`;
     }
}

export function usesHttpsProtocol() {
    return contains('https://', baseUrl());
}

export function getQuerystringParam(PARAM) {
    return queryString.parse(location.search)[PARAM];
}

export function isOnPrem(domain) {
    return !has(webPlotlyDomain);
}

export function plotlyUrl() {
    const plotlyApiDomain = getQuerystringParam('PLOTLY_API_DOMAIN');
    /*
     * This connector's settings necesserily contain a plotly api domain which has either
     * 'plotly.company-name' substring or 'plot.ly'. The latter can specifically only exist for
     * non on-prem users. Find out if the domain is not on-prem first and replace the 'api-'
     * substring accordingly to obtain the plotly domain.
     */
    if (isOnPrem(plotlyApiDomain)) {
        return replace('api-plotly', 'plotly', plotlyApiDomain);
    }
    return replace('api.plot.ly', 'plot.ly', plotlyApiDomain);
}
