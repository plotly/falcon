import fs from 'fs';
import shortid from 'shortid';
import {findIndex, propEq} from 'ramda';
import YAML from 'yamljs';

import {getSetting} from '../settings.js';
import {
    createStoragePath
} from '../utils/homeFiles';
import {stripUndefinedKeys} from '../utils/persistenceUtils.js';

export const HEX_CODE_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
export const MAX_TAG_LENGTH = 30;

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

export function saveTag(newTag) {
    if (!newTag.id) {
        newTag.id = shortid.generate();
    }

    const tags = getTags();
    tags.push(newTag);

    if (!fs.existsSync(getSetting('STORAGE_PATH'))) {
        createStoragePath();
    }
    fs.writeFileSync(getSetting('TAGS_PATH'), YAML.stringify(tags, 4));

    return newTag;
}

export function updateTag(id, updatedTagData) {
    const existingTag = getTag(id);
    if (!existingTag) {
        // don't allow appending data to query that doesn't exist
        return;
    }

    const updatedTag = stripUndefinedKeys({
        ...existingTag,
        ...updatedTagData
    });

    deleteTag(id);
    return saveTag(updatedTag);
}

export function deleteTag(id) {
    const tags = getTags();
    const index = findIndex(propEq('id', id), tags);

    if (index > -1) {
        tags.splice(index, 1);
        fs.writeFileSync(getSetting('TAGS_PATH'), YAML.stringify(tags, 4));
    }
}