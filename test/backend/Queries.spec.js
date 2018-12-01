import {assert} from 'chai';

import { getQuery, saveQuery, updateQuery } from '../../backend/persistent/Queries';
import {
    clearSettings
} from './utils.js';

const QUERY = {
  fid: 'fid'
};

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this*/
describe('Queries', function() {
  beforeEach(function () {
      clearSettings('QUERIES_PATH');
  });

  it('updating subset of query data does not remove existing data', function () {
    const QUERY_WITH_SOME_DATA = {
      ...QUERY,
      initialData: '_'
    };

    saveQuery(QUERY_WITH_SOME_DATA);

    const newQueryData = { newData: '__' };
    updateQuery(QUERY_WITH_SOME_DATA.fid, newQueryData);

    const updatedQuery = getQuery(QUERY_WITH_SOME_DATA.fid);
    assert.equal(updatedQuery.initialData, '_');
    assert.equal(updatedQuery.newData, '__');
  });

  it('does not store undefined keys', function () {
    const QUERY_WITH_UNDEFINED_KEYS = {
      ...QUERY,
      /* eslint-disable no-undefined */
      undefinedKey: undefined,
      secondUndefinedKey: undefined
    };

    const initialQueryKeys = Object.keys(QUERY_WITH_UNDEFINED_KEYS);
    assert.equal(initialQueryKeys.includes('undefinedKey'), true);
    assert.equal(initialQueryKeys.includes('secondUndefinedKey'), true);

    saveQuery(QUERY_WITH_UNDEFINED_KEYS);

    const retrievedQueryKeys = Object.keys(getQuery(QUERY_WITH_UNDEFINED_KEYS.fid));
    assert.equal(retrievedQueryKeys.includes('undefinedKey'), false);
    assert.equal(retrievedQueryKeys.includes('secondUndefinedKey'), false);
  });
});