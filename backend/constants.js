import {assoc} from 'ramda';

import {getSetting} from './settings';

export function getCookieOptions() {
    return {
        secure: getSetting('SSL_ENABLED'),
        path: getSetting('WEB_BASE_PATHNAME')
    }
}

export function getAccessTokenCookieOptions() {
    return {
        secure: getSetting('SSL_ENABLED'),
        path: getSetting('WEB_BASE_PATHNAME'),
        maxAge: getSetting('ACCESS_TOKEN_AGE')
    }
}
