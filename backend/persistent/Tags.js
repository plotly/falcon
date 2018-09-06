import fs from 'fs';
import shortid from 'shortid';
import {findIndex, propEq} from 'ramda';
import YAML from 'yamljs';

import {getSetting} from '../settings.js';
import {
    createStoragePath
} from '../utils/homeFiles';


export function getTag(id) {
    const tags = getTags();
    return tags.find(tag => tag.id === id);
}

export function getTags() {
    if (fs.existsSync(getSetting('TAGS_PATH'))) {
        return YAML.load(getSetting('TAGS_PATH').toString());
    }
    return [];
}

export function saveTag(tagInput) {
    const tags = getTags();
    const newTag = {...tagInput, id: shortid.generate()};
    tags.push(newTag);
    if (!fs.existsSync(getSetting('STORAGE_PATH'))) {
        createStoragePath();
    }
    fs.writeFileSync(getSetting('TAGS_PATH'), YAML.stringify(tags, 4));

    return newTag;
}

export function deleteTag(id) {
    const tags = getTags();
    const index = findIndex(propEq('id', id), tags);

    if (index > -1) {
        tags.splice(index, 1);
        fs.writeFileSync(getSetting('TAGS_PATH'), YAML.stringify(tags, 4));
    }
}