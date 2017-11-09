import {contains} from 'ramda';
import {getSetting} from '../settings.js';
import {getAccessTokenCookieOptions} from '../constants.js';
import {generateAndSaveAccessToken} from '../utils/authUtils';
import Logger from '../logger';
import fetch from 'node-fetch';

const ESCAPED_ROUTES = [
  new RegExp('^/$'),
  new RegExp('^/ping$'),
  new RegExp('^/login$'),
  new RegExp('^/static/'),
  new RegExp('^/oauth2$')
];

function accessTokenIsValid(access_token) {
    const currentTime = Date.now();
    return (getSetting('ACCESS_TOKEN') === access_token &&
            getSetting('ACCESS_TOKEN_EXPIRY') > currentTime);
}

export function PlotlyOAuth(electron) {

    return function isAuthorized(req, res, next) {
        const path = req.href();

        if (!getSetting('AUTH_ENABLED')) {
            return next();
        }

        // Auth is disabled for certain urls:
        if (ESCAPED_ROUTES.some(path.match.bind(path))) {
            return next();
        }

        // No Auth for electron apps:
        if (electron) {
            return next();
        }

        if (accessTokenIsValid(req.cookies['db-connector-auth-token'])) {
            return next();
        }

        if (!req.cookies['plotly-auth-token']) {
            res.json(401, {error: {message: 'Please login to access this page.'}});
            return next(false);
        }

        const plotlyAuthToken = req.cookies['plotly-auth-token'];

        fetch(`${getSetting('PLOTLY_API_URL')}/v2/users/current`, {
            headers: {'Authorization': `Bearer ${plotlyAuthToken}`}
        })
        .then(userRes => userRes.json().then(userMeta => {
            if (userRes.status !== 200) {
                res.json(401, {error: {message: 'Please login to access this page.'}});
                return next(false);
            }

            if (!contains(userMeta.username, getSetting('ALLOWED_USERS'))) {
                // Remove any existing credentials and return error
                res.clearCookie('db-connector-auth-token');
                res.clearCookie('plotly-auth-token');
                res.clearCookie('db-connector-user');
                res.json(403, {error: {message: `User ${userMeta.username} is not allowed to view this app`}});
                return next(false);
            }

            const dbConnectorAccessToken = generateAndSaveAccessToken();
            res.setCookie('db-connector-auth-token', dbConnectorAccessToken, getAccessTokenCookieOptions());

            return next();
        }))
        .catch(err => {
            Logger.log(err, 0);
            res.json(500, {error: {message: err.message}});
            return next(false);
        });
    };
}
