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

describe('Grid API Functions', function () {
    before(() => {
        saveSetting('USERS', [{username, apiKey}]);
        saveSetting('PLOTLY_API_DOMAIN', 'api.plot.ly');
        saveSetting('PLOTLY_API_SSL_ENABLED', true);
    });

    it('updateGrid overwrites a grid with new data', function () {
        // First, create a new grid.
        // Note that the app never actually does this,
        // it works off of the assumption that a grid exists

        let fid;
        const newColumnNames = Array(6).fill('_').map((v, i) => String(i)); // placeholder column names
        return initGrid('Test updateGrid')
        .then(assertResponseStatus(201))
        .then(getResponseJson).then(json => {
            fid = json.file.fid;
            return updateGrid(
                [
                    ['x', 10, 40, 70, 100, 130],
                    ['y', 20, 50, 80, 110, 140],
                    ['z', 30, 60, 90, 120, 150]
                ],
                newColumnNames, // placeholder column names
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
                json.cols[newColumnNames[0]].data,
                ['x', 'y', 'z']
            );
            assert.deepEqual(
                json.cols[newColumnNames[1]].data,
                [10, 20, 30]
            );
            assert.deepEqual(
                json.cols[newColumnNames[2]].data,
                [40, 50, 60]
            );
            assert.deepEqual(
                json.cols[newColumnNames[3]].data,
                [70, 80, 90]
            );
            assert.deepEqual(
                json.cols[newColumnNames[4]].data,
                [100, 110, 120]
            );
            assert.deepEqual(
                json.cols[newColumnNames[5]].data,
                [130, 140, 150]
            );
        })
        .then(() => deleteGrid(fid, username));
    });
});
