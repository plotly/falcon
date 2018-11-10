import chai from 'chai';
import chaiSubset from 'chai-subset';
import {merge, omit} from 'ramda';
import uuid from 'uuid';

import {saveConnection} from '../../backend/persistent/Connections.js';
import {saveTag} from '../../backend/persistent/Tags.js';
import {deleteGrid} from '../../backend/persistent/plotly-api.js';
import {getSetting, saveSetting} from '../../backend/settings.js';
import {
    accessToken,
    assertResponseStatus,
    closeTestServers,
    createTestServers,
    DELETE,
    GET,
    getResponseJson,
    initGrid,
    POST,
    sqlConnections,
    username,
    wait,
    validFid
} from './utils.js';
import { EXE_STATUS } from '../../shared/constants.js';

chai.use(chaiSubset);
const { assert } = chai;

describe('Routes:', () => {
    let queryObject;
    let servers;
    let connectionId;

    beforeEach(() => {
        servers = createTestServers();

        // Initialize query object
        connectionId = saveConnection(sqlConnections);
        queryObject = {
            fid: validFid,
            refreshInterval: 60, // every minute
            cronInterval: null,
            query: 'SELECT * FROM ebola_2014 LIMIT 1',
            connectionId: connectionId,
            requestor: validFid.split(':')[0]
        };

        // Sets cookies using `oauth` route, so that following requests will be authenticated
        return POST('oauth2', {access_token: accessToken})
        .then(assertResponseStatus(200))
        .then(getResponseJson).then(json => {
            assert.deepEqual(json, {});
        });
    });

    afterEach(() => {
        return closeTestServers(servers);
    });

    describe('queries:', function() {
        beforeEach(function() {
            // Verify that there are no queries saved
            return GET('queries')
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, []);
                });
        });

        it('can create a grid when it registers a query', function() {
            let fid;

            queryObject = {
                requestor: username,
                refreshInterval: 3600,
                cronInterval: null,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };

            return POST('queries', {...queryObject, filename: `test queries ${uuid.v4()}`})
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    fid = json.fid;

                    assert(json.fid, 'undefined fid');
                    assert(json.uids, 'undefined uids');

                    queryObject.fid = json.fid;
                    queryObject.uids = json.uids;

                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    assert.containSubset(json, [queryObject]);

                    return deleteGrid(fid, username);
                });
        });

        it('stores accurate query schema and nothing more', function() {
            let fid;

            const QUERY_KEYS = [
                'fid',
                'uids',
                'requestor',
                'refreshInterval',
                'cronInterval',
                'connectionId',
                'query',
                'tags',
                'name',
                'lastExecution',
                'nextScheduledAt'
            ];

            const EXECUTION_KEYS = [
                'status',
                'duration',
                'rowCount',
                'startedAt',
                'completedAt'
            ];

            const INVALID_PROPS = {
                abc: 'xyz',
                foo: 'bar'
            };

            const TAG_1 = saveTag({ name: '_' });
            const TAG_2 = saveTag({ name: '__' });

            queryObject = {
                requestor: username,
                cronInterval: '*/5 * * * *',
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2',
                tags: [TAG_1.id, TAG_2.id],
                name: '_',
                ...INVALID_PROPS
            };

            return POST('queries', {...queryObject, filename: `test queries ${uuid.v4()}`})
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    fid = json.fid;

                    assert(json.fid, 'undefined fid');
                    assert(json.uids, 'undefined uids');

                    queryObject.fid = json.fid;
                    queryObject.uids = json.uids;

                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    const NOW = Date.now();
                    const FIVE_SECONDS_AGO = NOW - 5000;
                    const TEN_SECONDS_AGO = NOW - 10000;
                    const FIVE_MINUTES_FROM_NOW = NOW + (5 * 60 * 1000);
                    const MIN_DURATION = 0;
                    const MAX_DURATION = 10;
                    const CORRECT_ROW_COUNT = 2;

                    assert.equal(json.length, 1, 'more than one query was created');

                    const receivedQuery = json[0];
                    assert.hasAllKeys(receivedQuery, QUERY_KEYS, 'query had incorrect keys');

                    const receivedExecution = receivedQuery.lastExecution;
                    assert.hasAllKeys(receivedExecution, EXECUTION_KEYS, 'execution had incorrect keys');

                    assert.equal(receivedExecution.status, EXE_STATUS.ok, 'query status was not "ok"');
                    assert.equal(receivedExecution.rowCount, CORRECT_ROW_COUNT, 'row count was not equal to two');
                    assert(receivedExecution.duration >= MIN_DURATION, 'execution duration was less than zero seconds');
                    assert(receivedExecution.duration < MAX_DURATION, 'execution duration was more than ten seconds');
                    assert(receivedExecution.startedAt < NOW, 'execution began in the future');
                    assert(receivedExecution.completedAt < NOW, 'execution completed in the future');
                    // use arbitrary cutoffs to check timestamps are reasonable
                    assert(receivedExecution.startedAt > TEN_SECONDS_AGO, 'execution began too far in the past');
                    assert(receivedExecution.completedAt > FIVE_SECONDS_AGO, 'execution completed too far in the past');
                    assert(receivedQuery.nextScheduledAt > NOW, 'query scheduled to be run in the past');
                    assert(
                        receivedQuery.nextScheduledAt < FIVE_MINUTES_FROM_NOW,
                        'query scheduled to be run more than five minutes from now'
                    );
                    assert.deepEqual(receivedQuery.tags, [TAG_1.id, TAG_2.id]);


                    return deleteGrid(fid, username);
                });
        });

        /*it('sets status to "running" correctly', function() {
            let fid;
            let orphanedPromise;
            return initGrid('test interval')
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    fid = json.file.fid;

                    queryObject = {
                        fid,
                        requestor: fid.split(':')[0],
                        refreshInterval: 60,
                        cronInterval: null,
                        connectionId,
                        // this query purposely takes 30 seconds to run so we
                        // have time to check its status
                        query: 'SELECT pg_sleep(30);'
                    };

                    return POST('queries', queryObject);
                })
                .then(assertResponseStatus(201))
                .then(() => {
                    orphanedPromise = POST('queries', queryObject);
                    return wait(4000);
                })
                .then(() => {
                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    assert.equal(
                        json[0].lastExecution.status, EXE_STATUS.running,
                        'status was not "running"'
                    );

                    return orphanedPromise;
                })
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.equal(
                        json.lastExecution.status, EXE_STATUS.ok,
                        'status was not "ok"'
                    );
                    return deleteGrid(fid, username);
                });
        });*/

        it('sets status to "failed" correctly', function() {
            let fid;
            return initGrid('test interval')
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    fid = json.file.fid;

                    queryObject = {
                        fid,
                        requestor: fid.split(':')[0],
                        refreshInterval: 60,
                        cronInterval: null,
                        connectionId,
                        query: 'SELECT * from ebola_2014 LIMIT 2'
                    };

                    return POST('queries', queryObject);
                })
                .then(assertResponseStatus(201))
                .then(() => {
                    return POST('queries', {
                        ...queryObject,
                        query: 'invalid query'
                    });
                })
                .then(assertResponseStatus(400))
                .then(() => GET('queries'))
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.equal(
                        json[0].lastExecution.status, EXE_STATUS.failed,
                        'status was not "failed"'
                    );

                    return deleteGrid(fid, username);
                });
        });

        it('registers a query and returns saved queries', function() {
            // Save a grid that we can update
            let fid;
            return initGrid('test interval')
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    fid = json.file.fid;

                    queryObject = {
                        fid,
                        requestor: fid.split(':')[0],
                        refreshInterval: 60,
                        cronInterval: null,
                        connectionId,
                        query: 'SELECT * from ebola_2014 LIMIT 2'
                    };

                    return POST('queries', queryObject);
                })
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    assert.containSubset(omit(json, 'uids'), omit(queryObject, 'uids'));
                    assert.equal(json.uids.length, 6);

                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    assert.equal(json.length, 1);
                    assert.containSubset(omit(json[0], 'uids'), omit(queryObject, 'uids'));
                    assert.equal(json[0].uids.length, 6);

                    return deleteGrid(fid, username);
                });
        });

        // disabled because collaborators cannot register queries since
        // they lack permission to update metadata
        xit('can register queries if the user is a collaborator', function() {
            /*
             * Plotly doesn't have a v2 endpoint for creating
             * collaborators, so we'll just use these hardcoded
             * fids and uids that already have a collaborator
             * assigned to them.
             * This test won't work against any plotly server
             * except https://plot.ly
             */
            const collaborator = 'plotly-connector-collaborator';
            saveSetting('USERS', [{
                username: collaborator,
                apiKey: 'I6j80cqCVaBAnvH9ESD2'
            }]);
            const fid = 'plotly-database-connector:718';

            queryObject = {
                fid,
                requestor: collaborator,
                refreshInterval: 60,
                cronInterval: null,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };

            return POST('queries', queryObject)
                .then(assertResponseStatus(201))
                .then(getResponseJson).then((json) => {
                    queryObject = {
                      ...queryObject,
                      uids: [
                        '08bd63',
                        '3430b2',
                        '618517',
                        '812006',
                        '3c7496',
                        'b6b0bb'
                      ]
                    };
                    assert.containSubset(json, queryObject);
                    return GET('queries');
                })
                .then(getResponseJson).then((json) => {
                    assert.containSubset(json, [queryObject]);
                });
        });

        it("can't register queries if the user can't view it", function() {
            // The grid is not shared with this user
            const viewer = 'plotly-connector-viewer';
            saveSetting('USERS', [{
                username: viewer,
                apiKey: 'mUSjMmwa55d6hjvwvgI4'
            }]);
            const fid = 'plotly-database-connector:718';

            queryObject = {
                fid,
                requestor: viewer,
                refreshInterval: 60,
                cronInterval: null,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };

            return POST('queries', queryObject)
                .then(assertResponseStatus(400))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {error: {message: 'Not found'}});
                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, [], 'No queries were saved');
                });
        });

        it("can't register queries if the user isn't a collaborator", function() {
            // The grid is not shared with this user
            const viewer = 'plotly-connector-viewer';
            saveSetting('USERS', [{
                username: viewer,
                apiKey: 'mUSjMmwa55d6hjvwvgI4'
            }]);
            /*
             * Unlike plotly-database-connector:718, this grid is public
             * so requests won't fail because of a 404. They should, however,
             * fail because there are no collaborators associated with this
             * plot
             */
            const fid = 'plotly-database-connector:719';

            queryObject = {
                fid,
                requestor: viewer,
                refreshInterval: 60,
                cronInterval: null,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };

            return POST('queries', queryObject)
                .then(assertResponseStatus(400))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {error: {message: 'Permission denied'}});
                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, [], 'still no queries saved');
                });
        });

        it('gets individual queries', function() {
            return GET(`queries/${queryObject.fid}`)
                .then(assertResponseStatus(404)).then(() => {
                    return POST('queries', queryObject);
                })
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    assert.containSubset(json, {
                      ...queryObject,
                      uids: [
                        '9bbb87',
                        '8d4dd0',
                        '3e40ef',
                        'b169c0',
                        '55e326',
                        'e69f70'
                      ]
                    });
                    return GET(`queries/${queryObject.fid}`);
                })
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.containSubset(json, {
                      ...queryObject,
                      uids: [
                        '9bbb87',
                        '8d4dd0',
                        '3e40ef',
                        'b169c0',
                        '55e326',
                        'e69f70'
                      ]
                    });
                });
        });

        it('deletes queries', function() {
            return POST('queries', queryObject)
                .then(assertResponseStatus(201))
                .then(() => DELETE(`queries/${queryObject.fid}`))
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {});
                    return GET(`queries/${queryObject.fid}`);
                })
                .then(assertResponseStatus(404));
        });

        it('returns 404s when getting queries that don\'t exist', function() {
            return GET('queries/asdfasdf').then(assertResponseStatus(404));
        });

        it('returns 404s when deleting queries that don\'t exist', function() {
            return DELETE('queries/asdfasdf').then(assertResponseStatus(404));
        });

        it("fails when the user's API keys or oauth creds aren't saved", function() {
            saveSetting('USERS', []);
            assert.deepEqual(getSetting('USERS'), []);

            return POST('queries', queryObject)
            .then(assertResponseStatus(500))
            .then(getResponseJson).then(json => {
                assert.deepEqual(
                    json,
                    {error: {
                        message: (
                            'Unauthenticated: Attempting to update grid ' +
                            'plotly-database-connector:197 ' +
                            'but the authentication credentials ' +
                            'for the user "plotly-database-connector" ' +
                            'do not exist.'
                        )
                    }}
                );
            });
        });

        it("fails when the user's API keys aren't correct", function() {
            const creds = [{username: 'plotly-database-connector', apiKey: 'lah lah lemons'}];
            saveSetting('USERS', creds);
            assert.deepEqual(getSetting('USERS'), creds);

            return POST('queries', queryObject)
            .then(assertResponseStatus(400))
            .then(getResponseJson).then(json => {
                assert.deepEqual(
                    json,
                    {error: {
                        message: (
                            'Unauthenticated'
                        )
                    }}
                );
            });
        });

        it("fails when it can't connect to the plotly server", function() {
            const nonExistantServer = 'plotly.lah-lah-lemons.com';
            saveSetting('PLOTLY_API_DOMAIN', nonExistantServer);
            assert.deepEqual(getSetting('PLOTLY_API_URL'), `https://${nonExistantServer}`);

            return POST('queries', queryObject)
            .then(assertResponseStatus(400))
            .then(getResponseJson).then(json => {
                assert.deepEqual(
                    json,
                    {
                        error: {
                            message: (
                                'request to ' +
                                'https://plotly.lah-lah-lemons.com/v2/grids/plotly-database-connector:197 ' +
                                'failed, reason: getaddrinfo ENOTFOUND plotly.lah-lah-lemons.com ' +
                                'plotly.lah-lah-lemons.com:443'
                            )
                        }
                    }
                );
            });
        });

        it('fails when there is a syntax error in the query', function() {
            const invalidQueryObject = merge(
                queryObject,
                {query: 'SELECZ'}
            );

            return POST('queries', invalidQueryObject)
            .then(assertResponseStatus(400))
            .then(getResponseJson).then(json => {
                assert.deepEqual(
                    json,
                    {error: {message: 'QueryExecutionError: syntax error at or near "SELECZ"'}}
                );
            });
        });
    });
});
