import {getSetting} from '../settings';
import mkdirp from 'mkdirp';

export function createStoragePath () {
    mkdirp.sync(getSetting('STORAGE_PATH'));
}
