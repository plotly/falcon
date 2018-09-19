import {assert} from 'chai';

import {getTags, getTag, saveTag, deleteTag, updateTag} from '../../backend/persistent/Tags';
import {
    clearSettings
} from './utils.js';

const TAG = {name: 'name', color: 'color'};
const TAG_2 = {name: 'name2', color: 'color2'};

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('Tags', function() {
  beforeEach(function () {
      clearSettings('TAGS_PATH');
  });

  it('saves and retrieves individual tags', function () {
    const savedTag = saveTag(TAG);
    assert.deepEqual({ ...TAG, id: savedTag.id }, savedTag);

    const retrievedTag = getTag(savedTag.id);
    assert.deepEqual(savedTag, retrievedTag);

    const savedTag2 = saveTag(TAG_2);
    assert.deepEqual({ ...TAG_2, id: savedTag2.id }, savedTag2);

    const retrievedTag2 = getTag(savedTag2.id);
    assert.deepEqual(savedTag2, retrievedTag2);
  });

  it('updates tags', function () {
    const savedTag = saveTag(TAG);
    assert.deepEqual({ ...TAG, id: savedTag.id }, savedTag);

    const UPDATED_COLOR = 'updatedColor';
    updateTag(savedTag.id, { color: UPDATED_COLOR });

    const updatedTag = getTag(savedTag.id);
    assert.deepEqual(updatedTag, { ...TAG, id: savedTag.id, color: UPDATED_COLOR });
  });

  it('gets all tags', function () {
    const savedTag = saveTag(TAG);
    const savedTag2 = saveTag(TAG_2);
    const savedTags = [savedTag, savedTag2];

    const retrievedTags = getTags();
    assert.deepEqual(savedTags, retrievedTags);
  });

  it('deletes tags', function () {
    const savedTag = saveTag(TAG);
    const savedTag2 = saveTag(TAG_2);

    assert.equal(getTags().length, 2);

    deleteTag(savedTag.id);
    const remainingTags = getTags();
    assert.equal(remainingTags.length, 1);
    assert.deepEqual(remainingTags[0], savedTag2);

    deleteTag(savedTag2.id);
    assert.equal(getTags().length, 0);
  });
});