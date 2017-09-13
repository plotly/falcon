const uuidv4 = require('uuid/v4');
import {saveSetting} from '../settings.js';

export function generateAndSaveAccessToken(){
    const access_token = uuidv4();
    saveSetting('ACCESS_TOKEN', access_token);
    return access_token;
}
