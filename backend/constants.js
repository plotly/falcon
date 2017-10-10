import {assoc} from 'ramda';

import {getSetting} from './settings';
import {getAccessTokenExpiry} from './utils/authUtils'

export const ACCESS_TOKEN_EXPIRY = 300;

export const COOKIE_OPTIONS = {
    secure: getSetting('SSL_ENABLED'),
    path: getSetting('WEB_BASE_PATHNAME'),
}

export const ACCESS_TOKEN_COOKIE_OPTIONS = assoc(
   'maxAge', getAccessTokenExpiry(), COOKIE_OPTIONS);
