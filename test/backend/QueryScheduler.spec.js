import chai, {expect, assert} from 'chai';
import spies from 'chai-spies';
chai.use(spies);

import fs from 'fs';
import {merge, dissoc, has} from 'ramda';

import QueryScheduler from '../../backend/persistent/QueryScheduler.js';
import {saveConnection} from '../../backend/persistent/Connections.js';
import {getQuery, getQueries} from '../../backend/persistent/Queries.js';
import { PlotlyAPIRequest,
    updateGrid
} from '../../backend/persistent/PlotlyAPI.js';
import {getSetting, saveSetting} from '../../backend/settings.js';
import {createGrid, names, sqlConnections, username, apiKey} from './utils.js';

let queryScheduler;
let savedUsers;
describe('QueryScheduler', () => {
    beforeEach(() => {
        try {
            fs.unlinkSync(getSetting('QUERIES_PATH'));
        } catch (e) {}
        try {
            fs.unlinkSync(getSetting('SETTINGS_PATH'));
        } catch (e) {}
        try {
            fs.unlinkSync(getSetting('CONNECTIONS_PATH'));
        } catch (e) {}
        queryScheduler = new QueryScheduler();
        queryScheduler.minimumRefreshInterval = 1;
        savedUsers = getSetting('USERS');
        saveSetting('USERS', [{username, apiKey}]);
    });

    afterEach(() => {
        queryScheduler.clearQueries();
        queryScheduler = null;
        saveSetting('USERS', savedUsers);
    });

    it('executes a function on an interval', function (done) {
        const spy = chai.spy(() => {});
        queryScheduler.job = spy;

        const delay = 1;
        this.timeout(delay * 10 * 1000);

        queryScheduler.scheduleQuery({
            refreshInterval: delay,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });
        setTimeout(function() {
            expect(spy).to.have.been.called();
        }, (delay + 1) * 1000);
        setTimeout(function() {
            expect(spy).to.have.been.called.twice();
            done();
        }, (delay * 3) * 1000);
    });

    it('overwrites interval functions', function (done) {
        const spy1 = chai.spy(() => {});
        queryScheduler.job = spy1;

        const delay = 2;
        this.timeout(delay * 20 * 1000);

        const query = {
            requestor: 'requestor',
            fid: 'fid',
            uids: 'uids',
            refreshInterval: delay,
            query: 'query-1',
            connectionId: '1'
        };

        queryScheduler.scheduleQuery(query);

        setTimeout(function() {
            expect(spy1).to.have.been.called.exactly(5);

            const spy2 = chai.spy(() => {});
            queryScheduler.job = spy2;
            queryScheduler.scheduleQuery(merge(query, {query: 'query-2'}));
            setTimeout(function() {
                expect(spy1).to.have.been.called.exactly(5);
                expect(spy1).to.have.been.called.always.with.exactly(
                    query.fid, query.uids, query.query,
                    query.connectionId, query.requestor
                );
                expect(spy2).to.have.been.called.exactly(5);
                expect(spy2).to.have.been.called.always.with.exactly(
                    query.fid, query.uids, 'query-2',
                    query.connectionId, query.requestor
                );
                done();
            }, (delay + 1) * 1000 + delay * 4 * 1000);

        }, (delay + 1) * 1000 + delay * 4 * 1000);


    });

    it('saves queries to file', () => {
        queryScheduler.job = () => {};

        const queryObject = {
            refreshInterval: 1,
            fid: 'test-fid:10',
            uids: '',
            query: '',
            connectionId: 'unique-id',
            requestor: 'test-fid'
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
            refreshInterval: 1,
            fid: 'test-fid:10',
            uids: '',
            query: 'my query',
            connectionId: 'unique-id',
            requestor: 'test-fid'
        };

        assert.deepEqual([], getQueries());
        queryScheduler.scheduleQuery(queryObject);
        assert.deepEqual([queryObject], getQueries());
        const updatedQuery = merge(
            queryObject,
            {refreshInterval: 10, 'query': 'new query'}
        );
        queryScheduler.scheduleQuery(updatedQuery);
        assert.deepEqual([updatedQuery], getQueries());
    });

    it('clears and deletes the query if its associated grid was deleted', function(done) {
        const refreshInterval = 1;
        this.timeout(refreshInterval * 20 * 1000);

        /*
         * Save the sqlConnections to a file.
         * This is done by the UI or by the user.
        */
        const connectionId = saveConnection(sqlConnections);

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
                 refreshInterval,
                 connectionId,
                 query: 'SELECT * from ebola_2014 LIMIT 2',
                 requestor: fid.split(':')[0]
             };
             assert.deepEqual(getQueries(), [], 'No queries existed');
             assert(!Boolean(queryScheduler.queryJobs[fid]), 'No queries were scheduled');
             queryScheduler.scheduleQuery(queryObject);
             assert.deepEqual(getQueries(), [queryObject], 'A query has been saved');

             assert(Boolean(queryScheduler.queryJobs[fid]), 'A query has been scheduled');

             PlotlyAPIRequest(`grids/${fid}`, {username, apiKey, method: 'DELETE'}).then(res => {
                 if (res.status !== 204) {
                     res.json().then(json => {
                         assert.equal(res.status, 204, 'Grid was successfully deleted: ' + JSON.stringify(json, null, 2));
                     });
                 }


                setTimeout(function() {
                    /*
                     * By now, QueryScheduler should've attempted to update
                     * the grid and failed and then detected that it was deleted
                     * and removed the query and the timeout handler.
                     * 10 seconds may be excessive but there are a lot of
                     * network delays that happen when updating a grid
                     * that are hard to account for precisely.
                     */
                    assert(!Boolean(queryScheduler.queryJobs[fid]), 'Queries were removed');
                    assert.deepEqual(getQueries(), [], 'Queries were deleted');
                    done();
                }, refreshInterval * 10 * 1000);

            }).catch(done);

        })).catch(done);

    });

    it('queries a database and updates a plotly grid on an interval', function(done) {
        function checkGridAgainstQuery(fid, name) {
            return PlotlyAPIRequest(`grids/${fid}/content`, {username, apiKey, method: 'GET'})
            .then(res => res.json().then(json => {
                assert.equal(res.status, 200);
                assert.deepEqual(
                    json.cols[names[0]].data,
                    ['Guinea', 'Guinea'],
                    name
                );
                assert.deepEqual(
                    json.cols[names[1]].data,
                    [3, 4],
                    name
                );
                assert.deepEqual(
                    json.cols[names[2]].data,
                    [14, 14],
                    name
                );
                assert.deepEqual(
                    json.cols[names[3]].data,
                    ['9.95', '9.95'],
                    name
                );
                assert.deepEqual(
                    json.cols[names[4]].data,
                    ['-9.7', '-9.7'],
                    name
                );
                assert.deepEqual(
                    json.cols[names[5]].data,
                    ['122', '224'],
                    name
                );
            }));
        }

        function resetAndVerifyGridContents(fid, uids) {
            return updateGrid([[1, 2, 3, 4, 5, 6]], fid, uids, username, apiKey)

            // Verify that the grid was updated
            .then(res => {
                assert.equal(res.status, 200, 'grid was updated');
                return PlotlyAPIRequest(`grids/${fid}/content`, {username, apiKey, method: 'GET'});
            })
            .then(res => res.json().then(json => {
                assert.equal(res.status, 200, 'data was retrieved');
                assert.deepEqual(json.cols[names[0]].data, [1]);
                assert.deepEqual(json.cols[names[1]].data, [2]);
                assert.deepEqual(json.cols[names[2]].data, [3]);
                assert.deepEqual(json.cols[names[3]].data, [4]);
                assert.deepEqual(json.cols[names[4]].data, [5]);
                assert.deepEqual(json.cols[names[5]].data, [6]);
            }));
        }

        const refreshInterval = 30;
        this.timeout(refreshInterval * 10 * 1000);

        /*
         * Save the sqlConnections to a file.
         * This is done by the UI or by the user.
        */
        const connectionId = saveConnection(sqlConnections);

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
                 refreshInterval,
                 connectionId,
                 query: 'SELECT * from ebola_2014 LIMIT 2',
                 requestor: fid.split(':')[0]
             };
             queryScheduler.scheduleQuery(queryObject);

             /*
              * After refreshInterval seconds, the scheduler will update the grid's contents.
              * Download the grid's contents and check.
              */
             setTimeout(() => {
                 checkGridAgainstQuery(fid, 'First check')
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
                         checkGridAgainstQuery(fid, 'Second check')
                         .then(() => done())
                         .catch(done);
                     }, (refreshInterval + 10) * 1000);
                 })
                 .catch(done);
            }, (refreshInterval + 10) * 1000); // Give scheduleQuery an extra 10 seconds.
        })).catch(done);
    });

});
