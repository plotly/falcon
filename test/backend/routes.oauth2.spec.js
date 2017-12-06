import {assert} from 'chai';

import {getSetting, saveSetting} from '../../backend/settings.js';
import {
    accessToken,
    assertResponseStatus,
    closeTestServers,
    createTestServers,
    GET,
    getResponseJson,
    POST,
    username,
    wait
} from './utils.js';


// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('Authentication:', () => {
    let servers;

    beforeEach(() => {
        servers = createTestServers();
    });

    afterEach(() => {
        return closeTestServers(servers);
    });

    it('backend responds to ping', function() {
        return GET('ping').then(getResponseJson).then(json => {
            assert.equal(json.message, 'pong');
        });
    });

    it('backend allows access to login page without logging in', function() {
        return GET('login').then(assertResponseStatus(200));
    });

    it('backend allows access to connections page without logging in', function() {
        return GET('').then(assertResponseStatus(200));
    });

    it('backend does not allow access to settings when not logged in', function() {
        return GET('settings')
        .then(assertResponseStatus(401))
        .then(getResponseJson).then(json => {
            assert.deepEqual(json, {
                error: {message: 'Please login to access this page.'}
            });
        });
    });

    it('oauth fails when user not present in ALLOWED_USERS', function() {
        saveSetting('ALLOWED_USERS', []);

        return POST('oauth2', {access_token: accessToken})
        .then(assertResponseStatus(403))
        .then(getResponseJson).then(json => {
            assert.deepEqual(json, {
                error: {message: `User ${username} is not allowed to view this app`}
            });
        });
    });

    it('backend allows access to settings when logged in and present in ALLOWED_USERS', function() {
        saveSetting('ALLOWED_USERS', [username]);

        return POST('oauth2', {access_token: accessToken}).then(assertResponseStatus(200))
        .then(() => {
            return GET('settings').then(assertResponseStatus(200));
        });
    });

    it('backend does not make request to plotly if accessToken is valid', function() {
        saveSetting('ALLOWED_USERS', [username]);

        return POST('oauth2', {access_token: accessToken})
        .then(assertResponseStatus(200)).then(() => {
            /*
             * This ensures that any requests to plotly fail so that we
             * can catch them. Since the requests to plotly are not made
             * when accessToken is valid, test-request should return 200
             * irrespective of bad plotly-domain.
             */
            saveSetting('PLOTLY_API_DOMAIN', 'bad-domain.plot.ly');

            return GET('settings').then(assertResponseStatus(200));
        });
    });

    it('backend makes request to plotly if accessToken expired', function() {
        saveSetting('ALLOWED_USERS', [username]);

        // set access-token expiry of 1 sec:
        saveSetting('ACCESS_TOKEN_AGE', 1);

        return POST('oauth2', {access_token: accessToken})
        .then(assertResponseStatus(200))
        .then(() => {
            // This ensures that any requests to plotly fail so that we can catch them
            saveSetting('PLOTLY_API_DOMAIN', 'bad-domain.plot.ly');

            return wait(1000).then(() => {
                return GET('settings')
                .then(assertResponseStatus(500))
                .then(getResponseJson).then(json => {
                    assert.equal(json.error.message,
                         'request to https://bad-domain.plot.ly/v2/users/current failed, ' +
                         'reason: getaddrinfo ENOTFOUND bad-domain.plot.ly bad-domain.plot.ly:443'
                    );
                });
            });
        });
    });

    it('backend renews access-token if expired', function() {
        saveSetting('ALLOWED_USERS', [username]);

        // set access-token expiry of 1 sec:
        saveSetting('ACCESS_TOKEN_AGE', 1);

        function assertAccessToken() {
            return GET('settings')
            .then(assertResponseStatus(200))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json, {
                    'PLOTLY_URL': 'https://plot.ly',
                    'USERS': ['plotly-database-connector']
                });
            });
        }

        return POST('oauth2', {access_token: accessToken}).then(() => {
            return assertAccessToken();
        })
        .then(() => {
            return wait(1000);
        })
        .then(() => {
            return assertAccessToken();
        });
    });

    it('backend prevents user from accessing urls when revoked from ALLOWED_USERS', function() {
        saveSetting('ALLOWED_USERS', [username]);

        // set access-token expiry of 1 sec:
        saveSetting('ACCESS_TOKEN_AGE', 1);

        return POST('oauth2', {access_token: accessToken})
        .then(assertResponseStatus(200))
        .then(() => {
            return GET('settings')
            .then(assertResponseStatus(200));
        })
        .then(() => {
            saveSetting('ALLOWED_USERS', []);
            return wait(3000);
        })
        .then(() => {
            return GET('settings')
            .then(assertResponseStatus(403))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json, {
                    'error': {
                        'message': `User ${username} is not allowed to view this app`
                    }
                });
            });
        });
    });

    describe('onprem:', function() {
        it('unauthorized user is not allowed access', function() {
            saveSetting('IS_RUNNING_INSIDE_ON_PREM', true);

            return GET('settings').then(assertResponseStatus(401));
        });

        it('user after failed login is not allowed acccess', function() {
            saveSetting('IS_RUNNING_INSIDE_ON_PREM', true);

            return POST('oauth2', {access_token: 'invalid access token'})
            .then(assertResponseStatus(500))
            .then(() => {
                return GET('settings');
            })
            .then(assertResponseStatus(401));
        });

        it('logged-in user is allowed access', function() {
            saveSetting('IS_RUNNING_INSIDE_ON_PREM', true);

            // Set Allowed users to empty:
            saveSetting('USERS', []);
            saveSetting('ALLOWED_USERS', []);

            return POST('oauth2', {access_token: accessToken})
            .then(assertResponseStatus(201))
            .then(() => {
                return GET('settings')
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {
                        USERS: ['plotly-database-connector'],
                        PLOTLY_URL: 'https://plot.ly'
                    });

                    // user should be added in ALLOWED_USERS:
                    assert.deepEqual(getSetting('ALLOWED_USERS'), [username]);
                });
            });
        });
    });
});
/* eslint-enable no-invalid-this */
