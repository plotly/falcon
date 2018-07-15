import {assert} from 'chai';
import sinon from 'sinon';

import {merge} from 'ramda';

import {saveConnection} from '../../backend/persistent/Connections.js';
import {
    deleteGrid,
    getGrid,
    updateGrid
} from '../../backend/persistent/plotly-api.js';
import {getQueries} from '../../backend/persistent/Queries.js';
import QueryScheduler from '../../backend/persistent/QueryScheduler.js';
import {getSetting, saveSetting} from '../../backend/settings.js';
import {
    apiKey,
    assertResponseStatus,
    clearSettings,
    getResponseJson,
    initGrid,
    names,
    sqlConnections,
    username,
    wait
} from './utils.js';

let queryScheduler;
let savedUsers;

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('QueryScheduler', function() {
    before(function() {
        savedUsers = getSetting('USERS');
    });

    after(function() {
        saveSetting('USERS', savedUsers);
    });

    beforeEach(function () {
        clearSettings('QUERIES_PATH', 'SETTINGS_PATH', 'CONNECTIONS_PATH');
        saveSetting('USERS', [{username, apiKey}]);

        queryScheduler = new QueryScheduler();
        queryScheduler.minimumRefreshInterval = 1;
    });

    afterEach(function () {
        queryScheduler.clearQueries();
        queryScheduler = null;
    });

    it('executes a function on an interval', function () {
        const clock = sinon.useFakeTimers();
        const spy = sinon.spy();
        const refreshInterval = 86400; // one day

        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            refreshInterval,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy.notCalled, 'job should not have been called yet');

        clock.tick(1.5 * refreshInterval * 1000);
        assert(spy.called, 'job should have been called');
        clock.tick(refreshInterval * 1000);
        assert(spy.calledTwice, 'job should have been called twice');

        clock.restore();
    });

    it('overwrites interval functions', function () {
        const clock = sinon.useFakeTimers();
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const refreshInterval = 86400; // one day

        const query = {
            requestor: 'requestor',
            fid: 'fid',
            uids: 'uids',
            refreshInterval,
            query: 'query-1',
            connectionId: '1'
        };

        queryScheduler.job = spy1;
        queryScheduler.scheduleQuery(query);

        assert(spy1.notCalled, 'job1 should not have been called yet');

        clock.tick(3.25 * refreshInterval * 1000);
        assert(spy1.calledThrice, 'job1 should have been called three times');

        queryScheduler.job = spy2;
        queryScheduler.scheduleQuery(merge(query, {query: 'query-2'}));

        clock.tick(3.25 * refreshInterval * 1000);
        assert(spy1.calledThrice, 'job1 should have been called three times');
        assert(spy1.alwaysCalledWith(
            query.fid, query.uids, query.query,
            query.connectionId, query.requestor
        ), `job1 was called with unexpected args: ${spy1.args}`);
        assert(spy2.calledThrice, 'job2 should have been called three times');
        assert(spy2.alwaysCalledWith(
            query.fid, query.uids, 'query-2',
            query.connectionId, query.requestor
        ), `job2 was called with unexpected args: ${spy2.args}`);

        clock.restore();
    });

    it('saves queries to file', function() {
        queryScheduler.job = () => {};

        const queryObject = {
            refreshInterval: 1,
            cronInterval: null,
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
        assert.deepEqual(queriesFromFile, [queryObject, anotherQuery]);
    });

    it('saving a query that already exists updates the query', function() {
        queryScheduler.job = () => {};

        const queryObject = {
            refreshInterval: 1,
            cronInterval: null,
            fid: 'test-fid:10',
            uids: '',
            query: 'my query',
            connectionId: 'unique-id',
            requestor: 'test-fid'
        };

        assert.deepEqual([], getQueries());

        queryScheduler.scheduleQuery(queryObject);
        assert.deepEqual(getQueries(), [queryObject]);

        const updatedQuery = merge(
            queryObject,
            {refreshInterval: 10, 'query': 'new query'}
        );
        queryScheduler.scheduleQuery(updatedQuery);
        assert.deepEqual(getQueries(), [updatedQuery]);
    });

    it('clears and deletes the query if its associated grid was deleted', function() {
        const refreshInterval = 5;
        const cronInterval = `*/${refreshInterval} * * * * *`;

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
        let fid, uids, queryObject;
        return initGrid('test delete')
        .then(assertResponseStatus(201))
        .then(getResponseJson).then(json => {
            fid = json.file.fid;
            uids = json.file.cols.map(col => col.uid);
            queryObject = {
                fid,
                uids,
                refreshInterval: null,
                cronInterval,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2',
                requestor: fid.split(':')[0]
            };

            assert.deepEqual(getQueries(), [], 'Should have no saved queries initially');
            assert(!queryScheduler.queryJobs[fid], 'Should have no scheduled queries initially');

            queryScheduler.scheduleQuery(queryObject);

            assert.deepEqual(getQueries(), [queryObject], 'Query has not been saved');
            assert(Boolean(queryScheduler.queryJobs[fid]), 'Query has not been scheduled');

            return deleteGrid(fid, username);
        })
        .then(assertResponseStatus(204))
        .then(() => {
            return waitAndAssertRemoval();

            function waitAndAssertRemoval() {
                return wait(refreshInterval * 1000).then(() => {
                    const removedSavedQuery = !queryScheduler.queryJobs[fid];
                    const removedScheduledQuery = (getQueries().length === 0);
                    if (!removedSavedQuery || !removedScheduledQuery) {
                        return waitAndAssertRemoval();
                    }
                });
            }
        });
    });

    it('queries a database and updates a plotly grid on an interval', function() {
        function checkGridAgainstQuery(fid, name) {
            return getGrid(fid, username)
            .then(assertResponseStatus(200))
            .then(getResponseJson).then(json => {
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
            });
        }

        function resetAndVerifyGridContents(fid, uids) {
            return updateGrid([[1, 2, 3, 4, 5, 6]], fid, uids, username, apiKey)
            .then(assertResponseStatus(200)).then(() => {
                return getGrid(fid, username);
            })
            .then(assertResponseStatus(200))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json.cols[names[0]].data, [1]);
                assert.deepEqual(json.cols[names[1]].data, [2]);
                assert.deepEqual(json.cols[names[2]].data, [3]);
                assert.deepEqual(json.cols[names[3]].data, [4]);
                assert.deepEqual(json.cols[names[4]].data, [5]);
                assert.deepEqual(json.cols[names[5]].data, [6]);
            });
        }

        const refreshInterval = 60; // seconds
        this.timeout(10 * refreshInterval * 1000);

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
        let fid, uids, queryObject;
        return initGrid('test interval')
        .then(assertResponseStatus(201))
        .then(getResponseJson).then(json => {
            fid = json.file.fid;
            uids = json.file.cols.map(col => col.uid);
            queryObject = {
                fid,
                uids,
                refreshInterval,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2',
                requestor: fid.split(':')[0]
            };

            queryScheduler.scheduleQuery(queryObject);
        })
        .then(() => wait(1.5 * refreshInterval * 1000))
        .then(() => checkGridAgainstQuery(fid, 'First check'))
        .then(() => resetAndVerifyGridContents(fid, uids))
        .then(() => wait(1.5 * refreshInterval * 1000))
        .then(() => checkGridAgainstQuery(fid, 'Second check'))
        .then(() => deleteGrid(fid, username));
    });

});
/* eslint-enable no-invalid-this */
