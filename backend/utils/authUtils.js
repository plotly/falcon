import uuidv4 from 'uuid/v4';
import {getSetting, saveSetting} from '../settings';
import {ACCESS_TOKEN_EXPIRY} from '../constants';

export function generateAndSaveAccessToken(){
    const currentTime = Date.now();

    if (getSetting('ACCESS_TOKEN_EXPIRY') < currentTime) {
        const accessToken = uuidv4();
        saveSetting('ACCESS_TOKEN', accessToken);
        saveSetting('ACCESS_TOKEN_EXPIRY', currentTime + getAccessTokenExpiry());
        return accessToken;
    } else {
        return getSetting('ACCESS_TOKEN');
    }


}

// Needed for mocking during tests.
export function getAccessTokenExpiry() {

    // ACCESS_TOKEN_EXPIRY is expressed in seconds.
    return ACCESS_TOKEN_EXPIRY * 1000;
}
