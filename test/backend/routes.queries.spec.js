import {assert} from 'chai';
import {merge, omit} from 'ramda';
import uuid from 'uuid';

import {saveConnection} from '../../backend/persistent/Connections.js';
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
    validFid,
    validUids
} from './utils.js';


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
            uids: validUids.slice(0, 2), // since this particular query only has 2 columns
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
                refreshInterval: 60,
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
                    assert.deepEqual(json, [queryObject]);

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
                    const uids = json.file.cols.map(col => col.uid);

                    queryObject = {
                        fid,
                        requestor: fid.split(':')[0],
                        uids,
                        refreshInterval: 60,
                        cronInterval: null,
                        connectionId,
                        query: 'SELECT * from ebola_2014 LIMIT 2'
                    };

                    return POST('queries', queryObject);
                })
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, queryObject);

                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, [queryObject]);

                    return deleteGrid(fid, username);
                });
        });

        it('can register queries if the user is a collaborator', function() {
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
            const uids = ['d8ba6c', 'dfa411'];

            queryObject = {
                fid,
                requestor: collaborator,
                uids,
                refreshInterval: 60,
                cronInterval: null,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };

            return POST('queries', queryObject)
                .then(assertResponseStatus(201))
                .then(getResponseJson).then((json) => {
                    assert.deepEqual(omit('uids', json), omit('uids', queryObject));
                    assert.equal(json.uids.length, 6);
                    return GET('queries').then(getResponseJson)
                      .then((getResponse) => {
                        assert.deepEqual(getResponse, [json]);
                      });
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
            const uids = ['d8ba6c', 'dfa411'];

            queryObject = {
                fid,
                requestor: viewer,
                uids,
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
            const uids = ['3a6df9', 'b95e9d'];

            queryObject = {
                fid,
                requestor: viewer,
                uids,
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
                    assert.deepEqual(omit('uids', json), omit('uids', queryObject));
                    return GET(`queries/${queryObject.fid}`);
                })
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(omit('uids', json), omit('uids', queryObject));
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
