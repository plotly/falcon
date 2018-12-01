import {assert} from 'chai';

import {
    deleteGrid,
    getGrid,
    updateGrid
} from '../../backend/persistent/plotly-api.js';
import {saveSetting} from '../../backend/settings.js';
import {
    apiKey,
    assertResponseStatus,
    getResponseJson,
    initGrid,
    username
} from './utils.js';
import {extractOrderedUids} from '../../backend/utils/gridUtils.js';

function genPlaceholderColumnNames (numColumns) {
    return Array(numColumns).fill('_').map((_, index) => `placeholder-${index}`);
}

// Note: in the following tests grids are created to begin with, but
// the actual backend never does this — it assumes a grid already exists.
describe('Grid API Functions', function () {
    before(() => {
        saveSetting('USERS', [{username, apiKey}]);
        saveSetting('PLOTLY_API_DOMAIN', 'api.plot.ly');
        saveSetting('PLOTLY_API_SSL_ENABLED', true);
    });

    it('updateGrid updates a grid but keeps the same uids', function () {
        let fid, originalUids;
        return initGrid('test grid')
            .then(assertResponseStatus(201))
            .then(getResponseJson)
            .then(json => {
                originalUids = json.file.cols.map(col => col.uid);
                fid = json.file.fid;

                return updateGrid(
                    [
                        ['x', 10, 40, 70, 100, 130],
                        ['y', 20, 50, 80, 110, 140],
                        ['z', 30, 60, 90, 120, 150]
                    ],
                    genPlaceholderColumnNames(6),
                    fid,
                    username
                );
            })
            .then(assertResponseStatus(200))
            .then(() => {
                return getGrid(fid, username);
            })
            .then(assertResponseStatus(200))
            .then(getResponseJson)
            .then(json => {
                const finalUids = extractOrderedUids(json);
                assert.equal(finalUids.length, 6);
                assert.deepEqual(originalUids, finalUids, 'original and final uids differ');
            })
            .then(() => deleteGrid(fid, username));
    });

    it('updateGrid keeps all original uids when appending additional columns', function () {
        let fid, originalUids;
        return initGrid('test grid')
            .then(assertResponseStatus(201))
            .then(getResponseJson)
            .then(json => {
                originalUids = json.file.cols.map(col => col.uid);
                fid = json.file.fid;

                return updateGrid(
                    [
                        ['x', 10, 40, 70, 100, 130, 160, 190],
                        ['y', 20, 50, 80, 110, 140, 170, 200],
                        ['z', 30, 60, 90, 120, 150, 180, 210]
                    ],
                    genPlaceholderColumnNames(8),
                    fid,
                    username
                );
            })
            .then(assertResponseStatus(201))
            .then(() => {
                return getGrid(fid, username);
            })
            .then(assertResponseStatus(200))
            .then(getResponseJson)
            .then(json => {
                const finalUids = extractOrderedUids(json);
                assert.equal(finalUids.length, 8);
                assert.deepEqual(originalUids, finalUids.slice(0, 6), 'original and final uids differ');
            })
            .then(() => deleteGrid(fid, username));
    });

    it('updateGrid keeps subset of original uids when deleting columns', function () {
        let fid, originalUids;
        return initGrid('test grid')
            .then(assertResponseStatus(201))
            .then(getResponseJson)
            .then(json => {
                originalUids = json.file.cols.map(col => col.uid);
                fid = json.file.fid;

                return updateGrid(
                    [
                        ['x', 10, 40, 70],
                        ['y', 20, 50, 80],
                        ['z', 30, 60, 90]
                    ],
                    genPlaceholderColumnNames(4),
                    fid,
                    username
                );
            })
            .then(assertResponseStatus(200))
            .then(() => {
                return getGrid(fid, username);
            })
            .then(assertResponseStatus(200))
            .then(getResponseJson)
            .then(json => {
                const finalUids = extractOrderedUids(json);
                assert.equal(finalUids.length, 4);
                assert.deepEqual(originalUids.slice(0, 4), finalUids, 'original and final uids differ');
            })
            .then(() => deleteGrid(fid, username));
    });

    it('updateGrid overwrites a grid with correct data and column names', function () {
        let fid;
        const placeholderColumnNames = genPlaceholderColumnNames(6);
        return initGrid('test grid')
        .then(assertResponseStatus(201))
        .then(getResponseJson).then(json => {
            fid = json.file.fid;
            return updateGrid(
                [
                    ['x', 10, 40, 70, 100, 130],
                    ['y', 20, 50, 80, 110, 140],
                    ['z', 30, 60, 90, 120, 150]
                ],
                placeholderColumnNames,
                fid,
                username
            );
        })
        .then(assertResponseStatus(200))
        .then(() => {
            return getGrid(fid, username);
        })
        .then(assertResponseStatus(200))
        .then(getResponseJson).then(json => {
            assert.deepEqual(
                json.cols[placeholderColumnNames[0]].data,
                ['x', 'y', 'z']
            );
            assert.deepEqual(
                json.cols[placeholderColumnNames[1]].data,
                [10, 20, 30]
            );
            assert.deepEqual(
                json.cols[placeholderColumnNames[2]].data,
                [40, 50, 60]
            );
            assert.deepEqual(
                json.cols[placeholderColumnNames[3]].data,
                [70, 80, 90]
            );
            assert.deepEqual(
                json.cols[placeholderColumnNames[4]].data,
                [100, 110, 120]
            );
            assert.deepEqual(
                json.cols[placeholderColumnNames[5]].data,
                [130, 140, 150]
            );
        })
        .then(() => deleteGrid(fid, username));
    });
});
