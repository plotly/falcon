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
        clearSettings('QUERIES_PATH', 'TAGS_PATH', 'SETTINGS_PATH', 'CONNECTIONS_PATH');
        saveSetting('USERS', [{username, apiKey}]);

        queryScheduler = new QueryScheduler();
        queryScheduler.minimumRefreshInterval = 1;
    });

    afterEach(function () {
        queryScheduler.clearQueries();
        queryScheduler = null;
    });

    xit('LEGACY: executes a function on an interval', function () {
        const spy = sinon.spy();
        const refreshInterval = 1; // second

        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            refreshInterval,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy.notCalled, 'job should not have been called yet');

        return wait(1.5 * refreshInterval * 1000)
            .then(() => assert(spy.called, 'job should have been called'))
            .then(() => wait(refreshInterval * 1000))
            .then(() => assert(spy.calledTwice, 'job should have been called twice'));
    });

    xit('LEGACY: overwrites interval functions', function () {
        const spy1 = sinon.spy();
        const spy2 = sinon.spy();
        const refreshInterval = 1; // second

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

        return wait(3.25 * refreshInterval * 1000)
        .then(() => {
            assert(spy1.calledThrice, 'job1 should have been called three times');

            queryScheduler.job = spy2;
            queryScheduler.scheduleQuery(merge(query, {query: 'query-2'}));
        })
        .then(() => wait(3.25 * refreshInterval * 1000))
        .then(() => {
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
        });
    });

    it('executes a function on a refresh interval', function () {
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

    it('executes a function on a cron interval', function () {
        const clock = sinon.useFakeTimers();
        const spy = sinon.spy();
        const ONE_WEEK = 604800;
        const cronInterval = '26 43 14 * * 5'; // arbitrary day and time of week

        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            cronInterval,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy.notCalled, 'job should not have been called yet');

        clock.tick(ONE_WEEK * 1000);
        assert(spy.called, 'job should have been called');
        clock.tick(ONE_WEEK * 1000);
        assert(spy.calledTwice, 'job should have been called twice');

        clock.restore();
    });

    it('correctly schedules every minute cron interval', function () {
        const clock = sinon.useFakeTimers();
        const spy = sinon.spy();
        const ONE_MINUTE = 60;
        const cronInterval = '* * * * *'; // every minute

        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            cronInterval,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(0.5 * ONE_MINUTE * 1000);
        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(ONE_MINUTE * 1000);
        assert(spy.called, 'job should have been called');
        clock.tick(ONE_MINUTE * 1000);
        assert(spy.calledTwice, 'job should have been called twice');

        clock.restore();
    });

    it('correctly schedules every five minutes cron interval', function () {
        const clock = sinon.useFakeTimers();
        const spy = sinon.spy();
        const ONE_MINUTE = 60;
        const cronInterval = '*/5 * * * *'; // every 5 minutes

        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            cronInterval,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(4 * ONE_MINUTE * 1000);
        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(2 * ONE_MINUTE * 1000);
        assert(spy.called, 'job should have been called');
        clock.tick(5 * ONE_MINUTE * 1000);
        assert(spy.calledTwice, 'job should have been called twice');

        clock.restore();
    });

    it('correctly schedules every hour cron interval', function () {
        let clock = sinon.useFakeTimers();
        const ONE_HOUR = 3600;

        const spy1 = sinon.spy();
        queryScheduler.job = spy1;
        queryScheduler.scheduleQuery({
            cronInterval: '31 * * * *', // every hour at minute 31
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy1.notCalled, 'job should not have been called yet');
        clock.tick(0.5 * ONE_HOUR * 1000);
        assert(spy1.notCalled, 'job should not have been called yet');
        clock.tick(ONE_HOUR * 1000);
        assert(spy1.called, 'job should have been called');
        clock.tick(ONE_HOUR * 1000);
        assert(spy1.calledTwice, 'job should have been called twice');

        clock.restore();
        clock = sinon.useFakeTimers();

        const spy2 = sinon.spy();
        queryScheduler.job = spy2;
        queryScheduler.scheduleQuery({
            cronInterval: '29 * * * *', // every hour at minute 29
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy2.notCalled, 'job should not have been called yet');
        clock.tick(0.5 * ONE_HOUR * 1000);
        assert(spy2.called, 'job should have been called');
        clock.tick(ONE_HOUR * 1000);
        assert(spy2.calledTwice, 'job should have been called twice');

        clock.restore();
    });

    it('correctly schedules every day cron interval', function () {
        const clock = sinon.useFakeTimers();
        const currentHour = (new Date()).getHours();

        const ONE_MINUTE = 60;
        const ONE_DAY = 86400;

        const spy = sinon.spy();
        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            // every day at 15 minutes past the current hour
            cronInterval: `15 ${currentHour} * * *`,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(14 * ONE_MINUTE * 1000);
        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(2 * ONE_MINUTE * 1000);
        assert(spy.called, 'job should have been called');
        clock.tick(ONE_DAY * 1000);
        assert(spy.calledTwice, 'job should have been called twice');
        clock.tick(8 * ONE_DAY * 1000);
        assert.equal(spy.callCount, 10, 'job should have been called twice');

        clock.restore();
    });

    it('correctly schedules weekly cron interval', function () {
        const clock = sinon.useFakeTimers();
        const currentHour = (new Date()).getHours();
        const currentDay = (new Date()).getDay();

        const ONE_MINUTE = 60;
        const ONE_DAY = 86400;
        const ONE_WEEK = ONE_DAY * 7;

        if (currentDay !== 3) {
            // timezone is UTC or later, go back
            // to Wednesday
            clock.tick(-1 * ONE_DAY * 1000);
        }

        const spy = sinon.spy();
        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            // minute 15 of current hour on Monday, Wednesday, and Thursday
            cronInterval: `15 ${currentHour} * * MON,WED,THU`,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(14 * ONE_MINUTE * 1000);
        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(2 * ONE_MINUTE * 1000);
        assert(spy.called, 'job should have been called');
        clock.tick(ONE_DAY * 1000); // now Thursday
        assert(spy.calledTwice, 'job should have been called twice');
        clock.tick(ONE_DAY * 1000); // now Friday
        assert(spy.calledTwice, 'job still should have been called twice on Friday');
        clock.tick(ONE_DAY * 1000); // now Saturday
        assert(spy.calledTwice, 'job still should have been called twice on Saturday');
        clock.tick(ONE_DAY * 1000); // now Sunday
        assert(spy.calledTwice, 'job still should have been called twice on Sunday');
        clock.tick(ONE_DAY * 1000); // now Monday
        assert(spy.calledThrice, 'job should have been called three times on Monday');
        clock.tick(ONE_WEEK * 1000); // now Monday
        assert.equal(spy.callCount, 6, 'job should have been called three more times one week later');

        clock.restore();
    });

    it('correctly schedules every month cron interval', function () {
        const clock = sinon.useFakeTimers();
        const currentHour = (new Date()).getHours();
        const currentMonth = (new Date()).getMonth();

        const ONE_MINUTE = 60;
        const ONE_DAY = 86400;

        const spy = sinon.spy();
        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            // 15 minutes past the current hour
            // every second day of the month
            cronInterval: `15 ${currentHour} 2 * *`,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        if (currentMonth !== 0) {
            // timezone is before UTC, fastforward to January 1
            clock.tick(ONE_DAY * 1000);
        }
        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(14 * ONE_MINUTE * 1000);
        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(ONE_DAY * 1000); // Jan 2
        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(2 * ONE_MINUTE * 1000);
        assert(spy.called, 'job should have been called');
        clock.tick(30 * ONE_DAY * 1000); // Feb 1
        assert(spy.calledOnce, 'job still should have been called once');
        clock.tick(ONE_DAY * 1000); // Feb 2
        assert(spy.calledTwice, 'job should have been called twice');

        clock.restore();
    });

    it('cronInteval overrules refreshInterval', function () {
        const clock = sinon.useFakeTimers();
        const spy = sinon.spy();

        const refreshInterval = 60; // one minute

        const date = new Date();
        date.setMinutes(date.getMinutes() + 5);
        const fiveMinutesFromNow = date.getMinutes();
        const cronInterval = `${fiveMinutesFromNow} * * * *`;

        queryScheduler.job = spy;
        queryScheduler.scheduleQuery({
            cronInterval,
            refreshInterval,
            fid: '...',
            uids: '...',
            query: '...',
            connectionId: '...'
        });

        clock.tick(1.5 * refreshInterval * 1000);
        assert(spy.notCalled, 'job should not have been called yet');
        clock.tick(4 * refreshInterval * 1000);
        assert(spy.calledOnce, 'job should have been called once');

        clock.restore();
    });

    it('correctly maps refreshIntervals to cronIntervals', function () {
        const clock = sinon.useFakeTimers();
        let testCount = 0;

        function checkCase (refreshInterval, message) {
            const date = new Date();
            date.setSeconds(date.getSeconds() + refreshInterval);
            const futureTimeTarget = date.toISOString();

            queryScheduler.scheduleQuery({
                refreshInterval: refreshInterval,
                fid: `test:${++testCount}`,
                uids: '...',
                query: '...',
                connectionId: '...'
            });
            const scheduledRuntime = queryScheduler.queryJobs[`test:${testCount}`].nextInvocation().toISOString();
            assert.equal(scheduledRuntime, futureTimeTarget, message);
        }

        // test against each UI possibilty
        checkCase(60, 'refreshInterval of 60 should run one minute later');
        checkCase(300, 'refreshInterval of 300 should run five minutes later');
        checkCase(3600, 'refreshInterval of 3600 should run one hour later');
        checkCase(86400, 'refreshInterval of 86400 should run one day later');
        checkCase(604800, 'refreshInterval of 604800 should run one week later');

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
            query.fid, query.query,
            query.connectionId, query.requestor
        ), `job1 was called with unexpected args: ${spy1.args}`);
        assert(spy2.calledThrice, 'job2 should have been called three times');
        assert(spy2.alwaysCalledWith(
            query.fid, 'query-2',
            query.connectionId, query.requestor,
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
        const cronInterval = `*/${refreshInterval} * * * * *`; // every 5 seconds

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
                refreshInterval,
                cronInterval,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2',
                requestor: fid.split(':')[0]
            };

            assert.deepEqual(getQueries(), [], 'Should have no saved queries initially');
            assert(!queryScheduler.queryJobs[fid], 'Should have no scheduled queries initially');

            queryScheduler.scheduleQuery(queryObject);

            assert.deepEqual(
                getQueries(),
                [queryObject],
                'Query has not been saved'
            );
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

        function resetAndVerifyGridContents(fid) {
            return updateGrid([[1, 2, 3, 4, 5, 6]], names, fid, username, apiKey)
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
        .then(() => resetAndVerifyGridContents(fid))
        .then(() => wait(1.5 * refreshInterval * 1000))
        .then(() => checkGridAgainstQuery(fid, 'Second check'))
        .then(() => deleteGrid(fid, username));
    });

});
/* eslint-enable no-invalid-this */
