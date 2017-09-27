var errors = require('restify-errors');

import {getSetting} from '../settings.js';
import {generateAndSaveAccessToken} from '../utils/authUtils';
import fetch from 'node-fetch';

const ESCAPED_ROUTES = [
  new RegExp('^/$'),
  new RegExp('^/login$'),
  new RegExp('^/static/'),
  new RegExp('^/oauth2')
]

function accessTokenIsValid(access_token) {
    return getSetting('ACCESS_TOKEN') === access_token;
}

let win = '';

export function PlotlyOAuth(electronWindow) {
    win = electronWindow;

    function isAuthorized(req, res, next) {
        let path = req.href();

        if (!getSetting('AUTH_ENABLED')) {
          return (next());
        }
        // Auth is disabled for certain urls:
        if ( ESCAPED_ROUTES.some(path.match.bind(path)) ) {
          return (next());
        }

        // No Auth for electron apps:
        if (win) {
          return (next());
        }
        if (!accessTokenIsValid(req.cookies['db-connector-auth-token'])) {

            if (!req.cookies['plotly-auth-token']) {
              return (next(new errors.InvalidCredentialsError('Please login to access this page.')));
            }

            const plotly_access_token = req.cookies['plotly-auth-token'];

            fetch(`${getSetting('PLOTLY_API_URL')}/v2/users/current`, {
                headers: {'Authorization': `Bearer ${plotly_access_token}`}
            })
            .then(userRes => userRes.json().then(userMeta => {

              if ( userRes.status !== 200 ) {
                return (next(new errors.InvalidCredentialsError('Please login to access this page.')));
              }
              else {
                  const db_connector_access_token = generateAndSaveAccessToken();
                  res.setCookie('db-connector-auth-token', db_connector_access_token, {'maxAge': 300, 'path': '/'});
                  return (next());
              }

            }));

        }

        return (next());
    }

    return (isAuthorized);
}
