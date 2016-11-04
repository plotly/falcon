import chai, {expect, assert} from 'chai';
import spies from 'chai-spies';
chai.use(spies);

import fs from 'fs';
import {merge, dissoc, has} from 'ramda';

import QueryScheduler from '../../../backend/persistent/QueryScheduler.js';
import {
    QUERIES_PATH,
    CREDENTIALS_PATH
} from '../../../backend/utils/homeFiles.js';
import {saveCredential} from '../../../backend/persistent/Credentials.js';
import {getQuery, getQueries} from '../../../backend/persistent/Queries.js';
import { PlotlyAPIRequest,
    updateGrid
} from '../../../backend/persistent/PlotlyAPI.js';
import {getSetting, saveSetting} from '../../../backend/settings.js';
import {createGrid, names, sqlCredentials, username, apiKey} from '../utils.js';

let queryScheduler;
let savedUrl;
let savedUsers;
describe('QueryScheduler', () => {
    beforeEach(() => {
        try {
            fs.unlinkSync(QUERIES_PATH);
        } catch (e) {}
        // try {
        //     fs.unlinkSync(CREDENTIALS_PATH);
        // } catch (e) {}
        queryScheduler = new QueryScheduler();
        queryScheduler.minimumRefreshRate = 1;
        savedUrl = getSetting('PLOTLY_API_DOMAIN');
        savedUsers = getSetting('USERS');
        saveSetting('PLOTLY_API_DOMAIN', 'https://api.plot.ly');
        saveSetting('PLOTLY_API_DOMAIN', 'https://api.plot.ly');
        saveSetting('USERS', [{username, apikey: apiKey}]);
    });

    afterEach(() => {
        queryScheduler.clearQueries();
        queryScheduler = null;
        saveSetting('PLOTLY_API_DOMAIN', savedUrl);
        saveSetting('USERS', savedUsers);
    });

    it('executes a function on an interval', (done) => {
        const spy = chai.spy(() => {});
        queryScheduler.job = spy;

        const delay = 100;
        queryScheduler.scheduleQuery({
            refreshRate: delay,
            fid: '...',
            uids: '...',
            query: '...',
            credentialId: '...',
            username,
            apiKey
        });
        setTimeout(function() {
            expect(spy).to.have.been.called();
        }, delay + 1);
        setTimeout(function() {
            expect(spy).to.have.been.called.twice();
            done();
        }, delay * 3);
    });

    it('saves queries to file', () => {
        queryScheduler.job = () => {};

        const queryObject = {
            refreshRate: 1,
            fid: 'test-fid',
            uids: '',
            query: '',
            credentialId: 'unique-id'
        };
        queryScheduler.scheduleQuery(queryObject);
        let queriesFromFile = getQueries();
        assert.deepEqual(queriesFromFile, [queryObject]);

        const anotherQuery = merge(queryObject, {fid: 'new-fid'});
        queryScheduler.scheduleQuery(anotherQuery);
        queriesFromFile = getQueries();
        assert.deepEqual(queriesFromFile,
            [queryObject, anotherQuery]
        );
    });

    it('saving a query that already exists updates the query', () => {
        queryScheduler.job = () => {};

        const queryObject = {
            refreshRate: 1,
            fid: 'test-fid',
            uids: '',
            query: 'my query',
            credentialId: 'unique-id'
        };

        assert.deepEqual([], getQueries());
        queryScheduler.scheduleQuery(queryObject);
        assert.deepEqual([queryObject], getQueries());
        const updatedQuery = merge(
            queryObject,
            {refreshRate: 10, 'query': 'new query'}
        );
        queryScheduler.scheduleQuery(updatedQuery);
        assert.deepEqual([updatedQuery], getQueries());
    });

    it.only('clears and deletes the query if its associated grid was deleted', function(done) {
        const refreshRate = 1 * 1000;
        this.timeout(refreshRate * 20);

        /*
         * Save the sqlCredentials to a file.
         * This is done by the UI or by the user.
        */
        const credentialId = saveCredential(sqlCredentials);

        /*
         * Create a grid that we want to update with new data
         * Note that the scheduler doesn't ever actually create grids,
         * it only updates them
         */
         createGrid('test delete').then(res => res.json().then(json => {
             assert.equal(res.status, 201);
             const fid = json.file.fid;
             const uids = json.file.cols.map(col => col.uid);
             const queryObject = {
                 fid,
                 uids,
                 refreshRate,
                 credentialId,
                 query: 'SELECT * from ebola_2014 LIMIT 2'
             };
             assert.deepEqual(getQueries(), [], 'No queries existed');
             assert(!Boolean(queryScheduler.queryJobs[fid]), 'No queries were scheduled');
             queryScheduler.scheduleQuery(queryObject);
             assert.deepEqual(getQueries(), [queryObject], 'A query has been saved');

             assert(Boolean(queryScheduler.queryJobs[fid]), 'A query has been scheduled');

             PlotlyAPIRequest(`grids/${fid}`, null, username, apiKey, 'DELETE').then(res => {
                assert.equal(res.status, 204, 'Grid was successfully deleted');

                setTimeout(function() {
                    /*
                     * By now, QueryScheduler should've attempted to update
                     * the grid and failed and then detected that it was deleted
                     * and removed the query and the timeout handler
                     */
                    assert(!Boolean(queryScheduler.queryJobs[fid]), 'Queries were removed');
                    assert.deepEqual(getQueries(), [], 'Queries were deleted');
                    done();
                }, refreshRate * 3);

            }).catch(done);

        })).catch(done);

    });

    it('queries a database and updates a plotly grid on an interval', function(done) {
        function checkGridAgainstQuery(fid) {
            return PlotlyAPIRequest(`grids/${fid}/content`, {}, username, apiKey, 'GET')
            .then(res => res.json().then(json => {
                assert.equal(res.status, 200);
                assert.deepEqual(
                    json.cols[names[0]].data,
                    ['Guinea', 'Guinea']
                );
                assert.deepEqual(
                    json.cols[names[1]].data,
                    [3, 4]
                );
                assert.deepEqual(
                    json.cols[names[2]].data,
                    [14, 14]
                );
                assert.deepEqual(
                    json.cols[names[3]].data,
                    ['9.95', '9.95']
                );
                assert.deepEqual(
                    json.cols[names[4]].data,
                    ['-9.7', '-9.7']
                );
                assert.deepEqual(
                    json.cols[names[5]].data,
                    ['122', '224']
                );
            }));
        }

        function resetAndVerifyGridContents(fid, uids) {
            return updateGrid([[1, 2, 3, 4, 5, 6]], fid, uids, username, apiKey)

            // Verify that the grid was updated
            .then(res => {
                assert(res.status, 200);
                return PlotlyAPIRequest(`grids/${fid}/content`, {}, username, apiKey, 'GET');
            })
            .then(res => res.json().then(json => {
                assert(res.status, 200);
                assert.deepEqual(json.cols[names[0]].data, [1]);
                assert.deepEqual(json.cols[names[1]].data, [2]);
                assert.deepEqual(json.cols[names[2]].data, [3]);
                assert.deepEqual(json.cols[names[3]].data, [4]);
                assert.deepEqual(json.cols[names[4]].data, [5]);
                assert.deepEqual(json.cols[names[5]].data, [6]);
            }));
        }

        const refreshRate = 30 * 1000;
        this.timeout(refreshRate * 10);

        /*
         * Save the sqlCredentials to a file.
         * This is done by the UI or by the user.
        */
        const credentialId = saveCredential(sqlCredentials);

        /*
         * Create a grid that we want to update with new data
         * Note that the scheduler doesn't ever actually create grids,
         * it only updates them
         */
         createGrid('test interval').then(res => res.json().then(json => {
             assert.equal(res.status, 201);
             const fid = json.file.fid;
             const uids = json.file.cols.map(col => col.uid);

             const queryObject = {
                 fid,
                 uids,
                 refreshRate,
                 credentialId,
                 username,
                 apiKey,
                 query: 'SELECT * from ebola_2014 LIMIT 2'
             };
             queryScheduler.scheduleQuery(queryObject);


             /*
              * After refreshRate seconds, the scheduler will update the grid's contents.
              * Download the grid's contents and check.
              */
             setTimeout(() => {
                 checkGridAgainstQuery(fid)
                 .then(() => {
                    /*
                     * Now check that _another_ update happens.
                     * Update the grids contents and then wait for
                     * the scheduler to update the contents.
                     */
                     return resetAndVerifyGridContents(fid, uids);
                 })
                 .then(() => {
                     setTimeout(() => {
                         checkGridAgainstQuery(fid)
                         .then(() => {
                             /*
                              * Now update the contents again
                              * and delete the grid and verify
                              * that the grid doesn't get updated
                              * and that the query gets deleted
                              * from memory and from the disk
                              */
                             assert(has(fid, queryScheduler.queryJobs));
                             assert.deepEqual(getQuery(fid), queryObject);
                             assert.deepEqual(queryScheduler[fid], queryObject);
                             return PlotlyAPIRequest(`grids/${fid}`, {}, username, apiKey, 'DELETE');
                         })
                         .then(res => {
                             assert(res.status, 200);
                             setTimeout(() => {
                                 assert(!has(fid, queryScheduler.queryJobs));
                                 assert.isNull(getQuery(fid));
                                 done();
                             }, refreshRate);
                         })
                         .catch(done);
                     }, refreshRate);
                 })
                 .catch(done);
            }, refreshRate + (5 * 1000)); // Give scheduleQuery an extra 5 seconds.
        })).catch(done);
    });

});
