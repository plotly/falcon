import uuidv4 from 'uuid/v4';
import {saveSetting} from '../settings.js';

const ACCESS_TOKEN_EXPIRY = 300;

export function generateAndSaveAccessToken(){
    const access_token = uuidv4();
    saveSetting('ACCESS_TOKEN', access_token);
    return access_token;
}


export function isElectron() {

    if (process.versions && !!process.versions.electron) {
        return true;
    } else {
        return false;
    }
}



// Needed for mocking during tests.
export function getAccessTokenExpiry() {

    return ACCESS_TOKEN_EXPIRY;
}
