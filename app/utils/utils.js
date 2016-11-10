import {contains} from 'ramda';
import queryString from 'query-string';

export function baseUrl() {
     if (contains(window.location.protocol, ['http:', 'https:'])) {
         /*
          * Use relative domain if the app is running headlessly
          * with a web front-end served by the app
          */
         /*
          * NOTE - not using window.location.origin because it's undefined
          * for some versions of IE - http://tosbourn.com/a-fix-for-window-location-origin-in-internet-explorer/
          */
         return window.location.protocol + "//" + window.location.hostname + (window.location.port ? ':' + window.location.port: '');
      } else {
         /*
          * Use the server location if the app is running in electron
          * with electron serving the app file. The electron backend
          * provides the port env variable as a query string param.
          */
          const PORT = queryString.parse(location.search).port;
         return `http://localhost:${PORT}`;
     }
}
