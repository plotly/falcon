import errors from 'restify-errors';
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
              return (next(new errors.InvalidCredentialsError('Please login to access this page.')));
            }

            const plotlyAuthToken = req.cookies['plotly-auth-token'];

            fetch(`${getSetting('PLOTLY_API_URL')}/v2/users/current`, {
                headers: {'Authorization': `Bearer ${plotlyAuthToken}`}
            })
            .then(userRes => userRes.json().then(userMeta => {

              if (userRes.status !== 200) {
                return (next(new errors.InvalidCredentialsError('Please login to access this page.')));
              }
              else {
                  const dbConnectorAccessToken = generateAndSaveAccessToken();
                  res.setCookie('db-connector-auth-token', dbConnectorAccessToken, {'maxAge': 300, 'path': '/'});
                  return (next());
              }

            }));

        } else {
          return (next());
        }
    }

    return (isAuthorized);
}
