import {contains} from 'ramda';
import {getSetting} from '../settings.js';
import {generateAndSaveAccessToken} from '../utils/authUtils';
import fetch from 'node-fetch';

const ESCAPED_ROUTES = [
  new RegExp('^/$'),
  new RegExp('^/login$'),
  new RegExp('^/static/'),
  new RegExp('^/oauth2$')
]

function accessTokenIsValid(access_token) {
    return getSetting('ACCESS_TOKEN') === access_token;
}

export function PlotlyOAuth(electronWindow) {

    function isAuthorized(req, res, next) {
        const path = req.href();

        if (!getSetting('AUTH_ENABLED')) {
          return (next());
        }
        // Auth is disabled for certain urls:
        if (ESCAPED_ROUTES.some(path.match.bind(path))) {
          return (next());
        }

        // No Auth for electron apps:
        if (electronWindow) {
          return (next());
        }
        if (!accessTokenIsValid(req.cookies['db-connector-auth-token'])) {

            if (!req.cookies['plotly-auth-token']) {
              res.json(401, {error: {message: 'Please login to access this page.'}});
              return;
            }

            const plotlyAuthToken = req.cookies['plotly-auth-token'];

            fetch(`${getSetting('PLOTLY_API_URL')}/v2/users/current`, {
                headers: {'Authorization': `Bearer ${plotlyAuthToken}`}
            })
            .then(userRes => userRes.json().then(userMeta => {

              if (userRes.status !== 200) {
                res.json(401, {error: {message: 'Please login to access this page.'}});
                return;
              }
              else {
                  if (!contains(userRes.username, getSetting('ALLOWED_USERS'))) {

                      // Remove any existing credentials and return error
                      res.clearCookie('db-connector-auth-token');
                      res.clearCookie('plotly-auth-token');
                      res.json(403, {error: {message: `User ${userMeta.username} is not allowed to view this app`}})
                      return;

                  } else {

                      const dbConnectorAccessToken = generateAndSaveAccessToken();
                      res.setCookie('db-connector-auth-token', dbConnectorAccessToken, {'maxAge': 300, 'path': '/'});
                      return (next());
                  }
              }

            }));

        } else {
          return (next());
        }
    }

    return (isAuthorized);
}
