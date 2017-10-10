import {assoc} from 'ramda';

import {getSetting} from './settings';

export const COOKIE_OPTIONS = {
    secure: getSetting('SSL_ENABLED'),
    path: getSetting('WEB_BASE_PATHNAME'),
}

export const ACCESS_TOKEN_COOKIE_OPTIONS = assoc(
   'maxAge', getSetting('ACCESS_TOKEN_AGE'), COOKIE_OPTIONS);
