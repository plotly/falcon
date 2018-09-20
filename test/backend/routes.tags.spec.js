import {assert} from 'chai';
import uuid from 'uuid';

import {saveConnection} from '../../backend/persistent/Connections.js';
import {deleteGrid} from '../../backend/persistent/plotly-api.js';
import {
    accessToken,
    assertResponseStatus,
    clearSettings,
    closeTestServers,
    createTestServers,
    DELETE,
    GET,
    PUT,
    getResponseJson,
    POST,
    sqlConnections,
    username,
    validFid
} from './utils.js';

describe('Routes:', () => {
    let queryObject;
    let servers;
    let connectionId;

    beforeEach(() => {
        clearSettings('TAGS_PATH', 'QUERIES_PATH');

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
            .then(getResponseJson)
            .then(json => {
                assert.deepEqual(json, {});
            });
    });

    afterEach(() => {
        return closeTestServers(servers);
    });

    describe('tags:', function() {
        const TAG = {name: 'name', color: '#ffffff'};
        const TAG_2 = {name: 'name2', color: '#000000'};

        it('creates a tag', function() {
            return POST('tags', TAG)
                .then(assertResponseStatus(201))
                .then(getResponseJson)
                .then(json => {
                    const {id} = json;
                    assert.deepEqual(json, {...TAG, id});
                });
        });

        it('fails to create a tag with duplicate name', () => {
            return POST('tags', TAG)
                .then(assertResponseStatus(201))
                .then(() => POST('tags', TAG))
                .then(assertResponseStatus(400));
        });

        it('updates a tag', () => {
            let createdTag;
            const UPDATED_COLOR = '#cccccc';

            return POST('tags', TAG)
                .then(assertResponseStatus(201))
                .then(getResponseJson)
                .then(json => {
                    createdTag = json;
                })
                .then(() => PUT(`tags/${createdTag.id}`, {color: UPDATED_COLOR}))
                .then(assertResponseStatus(200))
                .then(getResponseJson)
                .then(json => {
                    assert.deepEqual(json, {...createdTag, color: UPDATED_COLOR});
                });
        });

        it('fails to create a tag with invalid name or color parameters', () => {
            const EMPTY_TAG = {};
            const TAG_WITH_INVALID_NAME = {name: '_'.repeat(31), color: '#ffffff'};
            const TAG_WITH_INVALID_COLOR = {name: 'name', color: '_'};

            return POST('tags', EMPTY_TAG)
                .then(assertResponseStatus(400))
                .then(() => POST('tags', TAG_WITH_INVALID_NAME))
                .then(assertResponseStatus(400))
                .then(() => POST('tags', TAG_WITH_INVALID_COLOR))
                .then(assertResponseStatus(400));
        });

        it('gets all tags', function() {
            return POST('tags', TAG)
                .then(assertResponseStatus(201))
                .then(() => POST('tags', TAG_2))
                .then(assertResponseStatus(201))
                .then(() => GET('/tags'))
                .then(assertResponseStatus(200))
                .then(getResponseJson)
                .then(json => {
                    assert.equal(json.length, 2);
                    assert.equal(json[0].name, TAG.name);
                    assert.equal(json[1].name, TAG_2.name);
                });
        });

        // TODO: run this test once tags are persisted on queries
        it('deletes a tag and removes it from existing queries', () => {
            let createdTagId, createdQueryFid;

            return (
                POST('tags', TAG)
                    .then(assertResponseStatus(201))
                    .then(getResponseJson)
                    .then(json => {
                        createdTagId = json.id;
                    })
                    // create query with new tag
                    .then(() =>
                        POST('queries', {
                            ...queryObject,
                            filename: `test queries ${uuid.v4()}`,
                            tags: [createdTagId]
                        })
                    )
                    .then(assertResponseStatus(201))
                    .then(getResponseJson)
                    .then(json => {
                        assert.deepEqual([createdTagId], json.tags);
                        createdQueryFid = json.fid;
                    })
                    // delete new tag
                    .then(() => DELETE(`tags/${createdTagId}`))
                    .then(assertResponseStatus(200))
                    // verify tag deleted
                    .then(() => GET('tags'))
                    .then(assertResponseStatus(200))
                    .then(getResponseJson)
                    .then(json => {
                        assert.equal(json.length, 0);
                    })
                    // verify deleted tag removed from query
                    .then(() => GET(`queries/${createdQueryFid}`))
                    .then(assertResponseStatus(200))
                    .then(getResponseJson)
                    .then(json => {
                        assert.equal(json.tags.length, 0);
                        return deleteGrid(createdQueryFid, username);
                    })
            );
        });
    });
});
