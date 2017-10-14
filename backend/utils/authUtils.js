import uuidv4 from 'uuid/v4';
import {getSetting, saveSetting} from '../settings';

export function generateAndSaveAccessToken() {
    const currentTime = Date.now();

    if (getSetting('ACCESS_TOKEN_EXPIRY') < currentTime) {
        const accessToken = uuidv4();
        saveSetting('ACCESS_TOKEN', accessToken);

        // ACCESS_TOKEN_AGE is expressed in seconds, so we convert it to milliseconds:
        saveSetting('ACCESS_TOKEN_EXPIRY', currentTime + (getSetting('ACCESS_TOKEN_AGE') * 1000));
        return accessToken;
    }

    return getSetting('ACCESS_TOKEN');
}
