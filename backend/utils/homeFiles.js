import {getSetting} from '../settings';
import mkdirp from 'mkdirp';

export function createStoragePath () {
    mkdirp(getSetting('STORAGE_PATH'));
}
