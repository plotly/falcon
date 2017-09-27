var fetch = require('fetch-cookie')(require('node-fetch'))

import {assert} from 'chai';
import {assoc, concat, contains, dissoc, isEmpty, keys, merge, sort, without} from 'ramda';
import Servers from '../../backend/routes.js';
import {
    getConnections,
    getSanitizedConnections,
    saveConnection
} from '../../backend/persistent/Connections.js';
import {getSetting, saveSetting} from '../../backend/settings.js';
import {setCertificatesSettings} from '../../backend/certificates';
import fs from 'fs';
import {
    accessToken,
    apacheDrillConnections,
    apacheDrillStorage,
    apiKey,
    configuration,
    createGrid,
    elasticsearchConnections,
    fakeCerts,
    mysqlConnection,
    publicReadableS3Connections,
    sqlConnections,
    testCA,
    testConnections,
    testSqlConnections,
    username,
    validFid,
    validUids
} from './utils.js';


// Shortcuts
function GET(path) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function PATCH(path, body = {}) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

function POST(path, body = {}) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

function PUT(path, body = {}) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

function DELETE(path) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function setCookies() {

  // Sets cookies using `oauth` route, so that other requests can be authenticated:
  return POST('oauth2', {access_token: accessToken})
  .then(res => res.json().then(json => {
      assert.deepEqual(json, {});
      assert.equal(res.status, 200);
  }));

}

let queryObject;
let servers;
let connectionId;


describe('Servers - ', () => {
    beforeEach(() => {
        ['KEY_FILE', 'CERT_FILE', 'SETTINGS_PATH'].forEach(fileName => {
            try {
                fs.unlinkSync(getSetting(fileName));
            } catch (e) {}
        });
    });

    afterEach(() => {
        ['KEY_FILE', 'CERT_FILE', 'SETTINGS_PATH'].forEach(fileName => {
            try {
                fs.unlinkSync(getSetting(fileName));
            } catch (e) {}
        });
    });

    it('Https server is up and running after an http server was started and certs were created.', (done) => {
        servers = new Servers({createCerts: false, startHttps: true});

        servers.httpServer.start();
        saveSetting('USERS', [{username, accessToken}]);
        saveSetting('CONNECTOR_HTTPS_DOMAIN', `${fakeCerts.subdomain}.${testCA}`);
        saveSetting('AUTH_ENABLED', false);
        assert.isNull(servers.httpsServer.certs, 'Has no certs in the beginning.');
        assert.isNull(servers.httpsServer.server, 'Https server does not exists initially');
        fs.writeFileSync(getSetting('CERT_FILE'), fakeCerts.cert);
        fs.writeFileSync(getSetting('KEY_FILE'), fakeCerts.key);

        setTimeout(() => {
            assert.isFalse(isEmpty(servers.httpsServer.certs), 'Has certs.');
            assert.equal(servers.httpsServer.protocol, 'https', 'Correct protocol.');
            assert.equal(servers.httpsServer.domain, `${fakeCerts.subdomain}.${testCA}`, 'Correct domain');
            assert.isNotNull(servers.httpsServer.server, 'Https server is non null');
            // Can't fetch directly for now the https server because mocked certs
            // were generated from staging LE server - not real certs.

            GET('settings/urls')
            .then(res => res.json().then(json => {
                assert.equal(json.http, 'http://localhost:9494');
                assert.isNotNull(json.https, `${fakeCerts.subdomain}.${testCA}`);
                servers.httpServer.close();
                servers.httpsServer.close();
                done();
            }))
            .catch(done);
        }, 5000);
    }).timeout(10000);

    it('No certs are created after an http server was started in onprem.', (done) => {
        setCertificatesSettings('USE_MOCK_CERTS', true);
        saveSetting('USERS', [{username, accessToken}]);
        saveSetting('IS_RUNNING_INSIDE_ON_PREM', true);

        setTimeout(() => {
            servers = new Servers({createCerts: true, startHttps: true});
            assert.isNull(servers.httpsServer.certs, 'Has no certs in the beginning.');
            assert.isNull(servers.httpsServer.server, 'Https server does not exists initially');
        }, 100);

        setTimeout(() => {
            assert.isNull(servers.httpsServer.certs, 'Still has no certs.');
            assert.isNull(servers.httpsServer.server, 'Https server does not exists either.');
            servers.httpServer.close();
            done();
        }, 2000);
    }).timeout(10000);

});

describe('Authentication - ', () => {
    beforeEach(() => {
        servers = new Servers({createCerts: false, startHttps: false});
        servers.httpServer.start();

        // cleanup
        ['CONNECTIONS_PATH', 'QUERIES_PATH', 'SETTINGS_PATH'].forEach(file => {
            try {
                fs.unlinkSync(getSetting(file));
            } catch (e) {
            }
        });

        // enable authentication:
        saveSetting('AUTH_ENABLED', 'true');

        // Save some connections to the user's disk
        saveSetting('USERS', [{
            username, apiKey
        }]);

        connectionId = saveConnection(sqlConnections);
        queryObject = {
            fid: validFid,
            uids: validUids.slice(0, 2), // since this particular query only has 2 columns
            refreshInterval: 60, // every minute
            query: 'SELECT * FROM ebola_2014 LIMIT 1',
            connectionId: connectionId,
            requestor: validFid.split(':')[0]
        };

    });

    afterEach(() => {
        servers.httpServer.close();
        servers.queryScheduler.clearQueries();
    });

    it('ping - responds', function(done) {
        GET('ping')
        .then(() => done())
        .catch(done);
    });

    it('allows access to login page without logging in', function(done) {
        GET('login')
        .then(() => done())
        .catch(done);
    });

    it('allows access to connections page without logging in', function(done) {
        GET('')
        .then(() => done())
        .catch(done);
    });

    it('does not allow access to settings when not logged in', function(done) {
        GET('settings')
        .then(res => res.json().then(json => {
            assert.equal(res.status, 401);
            assert.deepEqual(json, {
                'code': 'InvalidCredentials',
                'message': 'Please login to access this page.'
            });
            done();
        })).catch(done);
    });

    it('allows access to settings when logged in', function(done) {

        setCookies().then(res => {

            GET('settings')
            .then(res => {
                assert.equal(res.status, 200);
                done();
            }).catch(done);
        });

    });
});


describe('Routes - ', () => {
    beforeEach(() => {
        servers = new Servers({createCerts: false, startHttps: false});
        servers.httpServer.start();

        // cleanup
        ['CONNECTIONS_PATH', 'QUERIES_PATH', 'SETTINGS_PATH'].forEach(file => {
            try {
                fs.unlinkSync(getSetting(file));
            } catch (e) {
            }
        });

        // Save some connections to the user's disk
        saveSetting('USERS', [{
            username, apiKey
        }]);

        connectionId = saveConnection(sqlConnections);
        queryObject = {
            fid: validFid,
            uids: validUids.slice(0, 2), // since this particular query only has 2 columns
            refreshInterval: 60, // every minute
            query: 'SELECT * FROM ebola_2014 LIMIT 1',
            connectionId: connectionId,
            requestor: validFid.split(':')[0]
        };

    });

    afterEach(() => {
        servers.httpServer.close();
        servers.queryScheduler.clearQueries();
    });

    it('ping - responds', function(done) {
        GET('ping')
        .then(() => done())
        .catch(done);
    });

    it('index page - returns 200', function(done) {
        GET('')
        .then(res => {
            assert.equal(res.status, 200);
            done();
        })
        .catch(done);
    });

    // OAuth
    it('oauth - returns 200 on loading the oauth page', function(done) {
        GET('oauth2')
        .then(res => {
            assert.equal(res.status, 200);
            done();
        })
        .catch(done);
    });

    // This tests sets the cookies required for user authentication, so
    // all the tests requiring user authentication should be put placed
    // after this one.
    it('oauth - saves oauth access token with a username if valid', function(done) {
        this.timeout(10 * 1000);
        saveSetting('USERS', []);

        assert.deepEqual(
            getSetting('USERS'),
            []
        );

        POST('oauth2', {
            access_token: accessToken
        })
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {});
            assert.equal(res.status, 201);
            assert.deepEqual(
                getSetting('USERS'),
                [{username, accessToken}]
            );

            // We can save it again and we'll get a 200 instead of a 201
            POST('oauth2', {access_token: accessToken})
            .then(res => res.json().then(json => {
                assert.deepEqual(json, {});
                assert.equal(res.status, 200);
                done();
            })).catch(done);
        }))
        .catch(done);
    });

    xit('oauth - saving an access token that is not associated with a user account will fail with a 500 level error', function(done) {
        saveSetting('USERS', []);
        const access_token = 'lah lah lemons';
        POST('oauth2', {access_token})
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {
                error: {
                    message: 'User was not found at https://api.plot.ly'
                }
            });
            assert.equal(res.status, 500);
            assert.deepEqual(
                getSetting('USERS'),
                []
            );
            done();
        })).catch(done);
    });

    // Settings
    it('settings/urls - returns 200 and the urls', function(done) {
        GET('settings/urls')
        .then(res => res.json().then(json => {
            assert.equal(res.status, 200);
            assert.equal(json.http, 'http://localhost:9494');
            assert.equal(json.https, '');
            done();
        }))
        .catch(done);
    });

    it('GET /settings returns some of the settings', function(done) {
        saveSetting(
            'USERS',
            [{'username': 'chris', 'accessToken': 'lahlahlemons'}]
        );
        GET('settings')
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {
                'PLOTLY_URL': 'https://plot.ly',
                'USERS': ['chris']
            });
            done();
        })).catch(done);
    });

    it('PATCH /settings sets some settings', function(done) {
        const newSettings = {
            'PLOTLY_API_DOMAIN': 'acme.plot.ly',
            'PLOTLY_API_SSL_ENABLED': false
        };
        PATCH('settings', newSettings).then(res => res.json().then(json => {
            assert.equal(
                getSetting('PLOTLY_API_SSL_ENABLED'),
                newSettings.PLOTLY_API_SSL_ENABLED
            );
            assert.equal(
                getSetting('PLOTLY_API_DOMAIN'),
                newSettings.PLOTLY_API_DOMAIN
            );
            done();
        })).catch(done);
    });

    // One Time SQL Queries
    testSqlConnections.forEach(function createTest(connection) {

        // TODO - Open up redshift to CI
        if (connection.dialect === 'redshift') {
            return;
        }

        it(`${connection.dialect} - query - runs a SQL query`, function(done) {
            this.timeout(5000);
            connectionId = saveConnection(connection);
            let sampleQuery = 'SELECT * FROM ebola_2014 LIMIT 1';
            if (connection.dialect === 'mssql') {
                sampleQuery = (
                    'SELECT TOP 1 * FROM ' +
                    `${connection.database}.dbo.ebola_2014`
                );
            }
            POST(`connections/${connectionId}/query`, {
                query: sampleQuery
            })
            .then(res => res.json())
            .then(response => {
                let expectedColumnNames;
                if (contains(connection.dialect, ['mariadb', 'mysql', 'mssql'])) {
                    expectedColumnNames = ['Country', 'Month', 'Year', 'Lat', 'Lon', 'Value'];
                } else if (connection.dialect === 'sqlite') {
                    expectedColumnNames = ['index', 'Country', 'Month', 'Year', 'Lat', 'Lon', 'Value'];
                } else {
                    expectedColumnNames = ['country', 'month', 'year', 'lat', 'lon', 'value'];
                }

                assert.deepEqual(
                    response,
                    {
                        rows: [
                            ({
                                'postgres': ['Guinea', 3, 14, '9.95', '-9.7', '122'],
                                'redshift': ['Guinea', 3, 14, '10', '-10', 122],
                                'mysql': ['Guinea', 3, 14, 10, -10, '122'],
                                'mariadb': ['Guinea', 3, 14, 10, -10, '122'],
                                'mssql': ['Guinea', 3, 14, 10, -10, '122'],
                                'sqlite': [0, 'Guinea', 3, 14, 9.95, -9.7, 122]
                            })[connection.dialect]
                        ],
                        columnnames: expectedColumnNames
                    }
                );

                done();
            }).catch(done);
        });

        it(`${connection.dialect} - query - fails when the SQL query contains a syntax error`, function(done) {
            this.timeout(5 * 1000);
            connectionId = saveConnection(connection);
            POST(`connections/${connectionId}/query`, {
                query: 'SELECZ'
            })
            .then(res => res.json().then(json => {
                assert.equal(res.status, 400);
                assert.deepEqual(
                    json,
                    {error: {message:
                        ({
                            postgres: 'syntax error at or near "SELECZ"',
                            redshift: 'syntax error at or near "SELECZ"',
                            mysql: 'ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that corresponds to your MySQL server version for the right syntax to use near \'SELECZ\' at line 1',
                            mariadb: "ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that corresponds to your MariaDB server version for the right syntax to use near 'SELECZ' at line 1",
                            mssql: "Could not find stored procedure 'SELECZ'.",
                            sqlite: 'SQLITE_ERROR: near "SELECZ": syntax error'
                        })[connection.dialect]
                    }}
                );
                done();
            }))
            .catch(done);
        });

        it(`${connection.dialect} - query - succeeds when SQL query returns no data`, function(done) {
            this.timeout(60 * 1000);
            connectionId = saveConnection(connection);
            let query = 'SELECT * FROM ebola_2014 LIMIT 0';
            if (connection.dialect === 'mssql') {
                query = (
                    'SELECT TOP 0 * FROM ' +
                    `${connection.database}.dbo.ebola_2014`
                );
            }
            POST(`connections/${connectionId}/query`, {query})
            .then(res => res.json().then(json => {
                assert.equal(res.status, 200);
                assert.deepEqual(
                    json,
                    {
                        columnnames: [],
                        rows: [[]]
                    }
                );
                done();
            }))
            .catch(done);
        });

        // Meta info about the tables
        it(`${connection.dialect} - tables - returns a list of tables`, function(done) {
            this.timeout(5000);
            connectionId = saveConnection(connection);
            POST(`connections/${connectionId}/sql-tables`)
            .then(res => res.json())
            .then(json => {
                let tables = [
                    'alcohol_consumption_by_country_2010',
                    'apple_stock_2014',
                    'ebola_2014',
                    'february_aa_flight_paths_2011',
                    'february_us_airport_traffic_2011',
                    'precipitation_2015_06_30',
                    'us_ag_exports_2011',
                    'us_cities_2014',
                    'usa_states_2014',
                    'walmart_store_openings_1962_2006',
                    'weather_data_seattle_2016',
                    'world_gdp_with_codes_2014'
                ];
                if (connection.dialect === 'postgres') {
                    tables = concat(tables, [
                        'geography_columns',
                        'geometry_columns',
                        'raster_columns',
                        'raster_overviews',
                        'spatial_ref_sys'
                    ]).sort();
                }
                assert.deepEqual(
                    json, tables
                );
                done();
            }).catch(done);
        });

        // Meta info about the schemas of all the tables
        it(`${connection.dialect} - schemas - returns a list of table schemas`, function() {
            this.timeout(5000);

            connectionId = saveConnection(connection);

            return POST(`connections/${connectionId}/sql-schemas`)
                .then(res => res.json())
                .then(json => {
                    let rows;
                    if (connection.dialect === 'postgres') {
                        rows = [
                            [ 'alcohol_consumption_by_country_2010', 'location', 'character varying' ],
                            [ 'alcohol_consumption_by_country_2010', 'alcohol', 'character varying' ],
                            [ 'apple_stock_2014', 'aapl_y', 'numeric' ],
                            [ 'apple_stock_2014', 'aapl_x', 'date' ],
                            [ 'ebola_2014', 'lon', 'numeric' ],
                            [ 'ebola_2014', 'value', 'character varying' ],
                            [ 'ebola_2014', 'lat', 'numeric' ],
                            [ 'ebola_2014', 'year', 'integer' ],
                            [ 'ebola_2014', 'month', 'integer' ],
                            [ 'ebola_2014', 'country', 'character varying' ],
                            [ 'february_aa_flight_paths_2011', 'end_lat', 'numeric' ],
                            [ 'february_aa_flight_paths_2011', 'start_lat', 'numeric' ],
                            [ 'february_aa_flight_paths_2011', 'start_lon', 'numeric' ],
                            [ 'february_aa_flight_paths_2011', 'end_lon', 'numeric' ],
                            [ 'february_aa_flight_paths_2011', 'airline', 'character varying' ],
                            [ 'february_aa_flight_paths_2011', 'airport1', 'character varying' ],
                            [ 'february_aa_flight_paths_2011', 'airport2', 'character varying' ],
                            [ 'february_aa_flight_paths_2011', 'cnt', 'integer' ],
                            [ 'february_us_airport_traffic_2011', 'iata', 'character varying' ],
                            [ 'february_us_airport_traffic_2011', 'airport', 'character varying' ],
                            [ 'february_us_airport_traffic_2011', 'city', 'character varying' ],
                            [ 'february_us_airport_traffic_2011', 'state', 'character varying' ],
                            [ 'february_us_airport_traffic_2011', 'country', 'character varying' ],
                            [ 'february_us_airport_traffic_2011', 'lat', 'numeric' ],
                            [ 'february_us_airport_traffic_2011', 'long', 'numeric' ],
                            [ 'february_us_airport_traffic_2011', 'cnt', 'integer' ],
                            [ 'geography_columns', 'type', 'text' ],
                            [ 'geography_columns', 'srid', 'integer' ],
                            [ 'geography_columns', 'coord_dimension', 'integer' ],
                            [ 'geography_columns', 'f_geography_column', 'name' ],
                            [ 'geography_columns', 'f_table_name', 'name' ],
                            [ 'geography_columns', 'f_table_schema', 'name' ],
                            [ 'geography_columns', 'f_table_catalog', 'name' ],
                            [ 'geometry_columns', 'f_table_catalog', 'character varying' ],
                            [ 'geometry_columns', 'srid', 'integer' ],
                            [ 'geometry_columns', 'coord_dimension', 'integer' ],
                            [ 'geometry_columns', 'f_geometry_column', 'character varying' ],
                            [ 'geometry_columns', 'f_table_name', 'character varying' ],
                            [ 'geometry_columns', 'f_table_schema', 'character varying' ],
                            [ 'geometry_columns', 'type', 'character varying' ],
                            [ 'precipitation_2015_06_30', 'lon', 'numeric' ],
                            [ 'precipitation_2015_06_30', 'lat', 'numeric' ],
                            [ 'precipitation_2015_06_30', 'hrapy', 'character varying' ],
                            [ 'precipitation_2015_06_30', 'hrapx', 'character varying' ],
                            [ 'precipitation_2015_06_30', 'globvalue', 'numeric' ],
                            [ 'raster_columns', 'same_alignment', 'boolean' ],
                            [ 'raster_columns', 'r_table_catalog', 'name' ],
                            [ 'raster_columns', 'r_table_schema', 'name' ],
                            [ 'raster_columns', 'r_table_name', 'name' ],
                            [ 'raster_columns', 'r_raster_column', 'name' ],
                            [ 'raster_columns', 'srid', 'integer' ],
                            [ 'raster_columns', 'scale_x', 'double precision' ],
                            [ 'raster_columns', 'scale_y', 'double precision' ],
                            [ 'raster_columns', 'blocksize_x', 'integer' ],
                            [ 'raster_columns', 'blocksize_y', 'integer' ],
                            [ 'raster_columns', 'regular_blocking', 'boolean' ],
                            [ 'raster_columns', 'num_bands', 'integer' ],
                            [ 'raster_columns', 'pixel_types', 'ARRAY' ],
                            [ 'raster_columns', 'nodata_values', 'ARRAY' ],
                            [ 'raster_columns', 'out_db', 'ARRAY' ],
                            [ 'raster_columns', 'extent', 'USER-DEFINED' ],
                            [ 'raster_overviews', 'r_table_schema', 'name' ],
                            [ 'raster_overviews', 'r_table_name', 'name' ],
                            [ 'raster_overviews', 'r_raster_column', 'name' ],
                            [ 'raster_overviews', 'overview_factor', 'integer' ],
                            [ 'raster_overviews', 'o_table_catalog', 'name' ],
                            [ 'raster_overviews', 'o_table_schema', 'name' ],
                            [ 'raster_overviews', 'o_table_name', 'name' ],
                            [ 'raster_overviews', 'o_raster_column', 'name' ],
                            [ 'raster_overviews', 'r_table_catalog', 'name' ],
                            [ 'spatial_ref_sys', 'proj4text', 'character varying' ],
                            [ 'spatial_ref_sys', 'srtext', 'character varying' ],
                            [ 'spatial_ref_sys', 'auth_srid', 'integer' ],
                            [ 'spatial_ref_sys', 'auth_name', 'character varying' ],
                            [ 'spatial_ref_sys', 'srid', 'integer' ],
                            [ 'us_ag_exports_2011', 'total fruits', 'numeric' ],
                            [ 'us_ag_exports_2011', 'veggies proc', 'numeric' ],
                            [ 'us_ag_exports_2011', 'corn', 'numeric' ],
                            [ 'us_ag_exports_2011', 'wheat', 'numeric' ],
                            [ 'us_ag_exports_2011', 'cotton', 'numeric' ],
                            [ 'us_ag_exports_2011', 'veggies fresh', 'numeric' ],
                            [ 'us_ag_exports_2011', 'total exports', 'numeric' ],
                            [ 'us_ag_exports_2011', 'category', 'character varying' ],
                            [ 'us_ag_exports_2011', 'state', 'character varying' ],
                            [ 'us_ag_exports_2011', 'code', 'character varying' ],
                            [ 'us_ag_exports_2011', 'beef', 'numeric' ],
                            [ 'us_ag_exports_2011', 'fruits proc', 'numeric' ],
                            [ 'us_ag_exports_2011', 'pork', 'numeric' ],
                            [ 'us_ag_exports_2011', 'total veggies', 'numeric' ],
                            [ 'us_ag_exports_2011', 'poultry', 'numeric' ],
                            [ 'us_ag_exports_2011', 'dairy', 'numeric' ],
                            [ 'us_ag_exports_2011', 'fruits fresh', 'numeric' ],
                            [ 'usa_states_2014', 'rank', 'integer' ],
                            [ 'usa_states_2014', 'pop', 'numeric' ],
                            [ 'usa_states_2014', 'state', 'character varying' ],
                            [ 'usa_states_2014', 'postal', 'character varying' ],
                            [ 'us_cities_2014', 'name', 'character varying' ],
                            [ 'us_cities_2014', 'lon', 'numeric' ],
                            [ 'us_cities_2014', 'pop', 'integer' ],
                            [ 'us_cities_2014', 'lat', 'numeric' ],
                            [ 'walmart_store_openings_1962_2006', 'opendate', 'character varying' ],
                            [ 'walmart_store_openings_1962_2006', 'year', 'integer' ],
                            [ 'walmart_store_openings_1962_2006', 'day', 'integer' ],
                            [ 'walmart_store_openings_1962_2006', 'month', 'integer' ],
                            [ 'walmart_store_openings_1962_2006', 'lon', 'numeric' ],
                            [ 'walmart_store_openings_1962_2006', 'lat', 'numeric' ],
                            [ 'walmart_store_openings_1962_2006', 'type_store', 'character varying' ],
                            [ 'walmart_store_openings_1962_2006', 'zipcode', 'integer' ],
                            [ 'walmart_store_openings_1962_2006', 'strstate', 'character varying' ],
                            [ 'walmart_store_openings_1962_2006', 'strcity', 'character varying' ],
                            [ 'walmart_store_openings_1962_2006', 'streetaddr', 'character varying' ],
                            [ 'walmart_store_openings_1962_2006', 'county', 'integer' ],
                            [ 'walmart_store_openings_1962_2006', 'st', 'integer' ],
                            [ 'walmart_store_openings_1962_2006', 'conversion', 'character varying' ],
                            [ 'walmart_store_openings_1962_2006', 'date_super', 'character varying' ],
                            [ 'walmart_store_openings_1962_2006', '1', 'integer' ],
                            [ 'weather_data_seattle_2016', 'min_temperaturec', 'character varying' ],
                            [ 'weather_data_seattle_2016', 'mean_temperaturec', 'character varying' ],
                            [ 'weather_data_seattle_2016', 'max_temperaturec', 'character varying' ],
                            [ 'weather_data_seattle_2016', 'date', 'character varying' ],
                            [ 'world_gdp_with_codes_2014', 'code', 'character varying' ],
                            [ 'world_gdp_with_codes_2014', 'gdp (billions)', 'numeric' ],
                            [ 'world_gdp_with_codes_2014', 'country', 'character varying' ],
                        ];
                    } else if (connection.dialect === 'mssql') {
                        rows = [
                            [ 'walmart_store_openings_1962_2006', 'storenum', 'int', 4, '10/0' ],
                            [ 'walmart_store_openings_1962_2006', 'OPENDATE', 'varchar', 8000, '0/0' ],
                            [ 'walmart_store_openings_1962_2006', 'date_super', 'varchar', 8000, '0/0' ],
                            [ 'walmart_store_openings_1962_2006', 'conversion', 'varchar', 8000, '0/0' ],
                            [ 'walmart_store_openings_1962_2006', 'st', 'int', 4, '10/0' ],
                            [ 'walmart_store_openings_1962_2006', 'county', 'int', 4, '10/0' ],
                            [ 'walmart_store_openings_1962_2006', 'STREETADDR', 'varchar', 8000, '0/0' ],
                            [ 'walmart_store_openings_1962_2006', 'STRCITY', 'varchar', 8000, '0/0' ],
                            [ 'walmart_store_openings_1962_2006', 'STRSTATE', 'varchar', 8000, '0/0' ],
                            [ 'walmart_store_openings_1962_2006', 'ZIPCODE', 'int', 4, '10/0' ],
                            [ 'walmart_store_openings_1962_2006', 'type_store', 'varchar', 8000, '0/0' ],
                            [ 'walmart_store_openings_1962_2006', 'LAT', 'decimal', 17, '38/38' ],
                            [ 'walmart_store_openings_1962_2006', 'LON', 'decimal', 17, '38/38' ],
                            [ 'walmart_store_openings_1962_2006', 'MONTH', 'int', 4, '10/0' ],
                            [ 'walmart_store_openings_1962_2006', 'DAY', 'int', 4, '10/0' ],
                            [ 'walmart_store_openings_1962_2006', 'YEAR', 'int', 4, '10/0' ],
                            [ 'alcohol_consumption_by_country_2010', 'location', 'varchar', 8000, '0/0' ],
                            [ 'alcohol_consumption_by_country_2010', 'alcohol', 'varchar', 8000, '0/0' ],
                            [ 'february_aa_flight_paths_2011', 'start_lat', 'decimal', 17, '38/38' ],
                            [ 'february_aa_flight_paths_2011', 'start_lon', 'decimal', 17, '38/38' ],
                            [ 'february_aa_flight_paths_2011', 'end_lat', 'decimal', 17, '38/38' ],
                            [ 'february_aa_flight_paths_2011', 'end_lon', 'decimal', 17, '38/38' ],
                            [ 'february_aa_flight_paths_2011', 'airline', 'varchar', 8000, '0/0' ],
                            [ 'february_aa_flight_paths_2011', 'airport1', 'varchar', 8000, '0/0' ],
                            [ 'february_aa_flight_paths_2011', 'airport2', 'varchar', 8000, '0/0' ],
                            [ 'february_aa_flight_paths_2011', 'cnt', 'int', 4, '10/0' ],
                            [ 'february_us_airport_traffic_2011', 'iata', 'varchar', 8000, '0/0' ],
                            [ 'february_us_airport_traffic_2011', 'airport', 'varchar', 8000, '0/0' ],
                            [ 'february_us_airport_traffic_2011', 'city', 'varchar', 8000, '0/0' ],
                            [ 'february_us_airport_traffic_2011', 'state', 'varchar', 8000, '0/0' ],
                            [ 'february_us_airport_traffic_2011', 'country', 'varchar', 8000, '0/0' ],
                            [ 'february_us_airport_traffic_2011', 'lat', 'decimal', 17, '38/38' ],
                            [ 'february_us_airport_traffic_2011', 'long', 'decimal', 17, '38/38' ],
                            [ 'february_us_airport_traffic_2011', 'cnt', 'int', 4, '10/0' ],
                            [ 'us_ag_exports_2011', 'code', 'varchar', 8000, '0/0' ],
                            [ 'us_ag_exports_2011', 'state', 'varchar', 8000, '0/0' ],
                            [ 'us_ag_exports_2011', 'category', 'varchar', 8000, '0/0' ],
                            [ 'us_ag_exports_2011', 'total exports', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'beef', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'pork', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'poultry', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'dairy', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'fruits fresh', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'fruits proc', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'total fruits', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'veggies fresh', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'veggies proc', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'total veggies', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'corn', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'wheat', 'decimal', 17, '38/38' ],
                            [ 'us_ag_exports_2011', 'cotton', 'decimal', 17, '38/38' ],
                            [ 'apple_stock_2014', 'AAPL_x', 'datetime', 8, '23/3' ],
                            [ 'apple_stock_2014', 'AAPL_y', 'decimal', 17, '38/38' ],
                            [ 'ebola_2014', 'Country', 'varchar', 8000, '0/0' ],
                            [ 'ebola_2014', 'Month', 'int', 4, '10/0' ],
                            [ 'ebola_2014', 'Year', 'int', 4, '10/0' ],
                            [ 'ebola_2014', 'Lat', 'decimal', 17, '38/38' ],
                            [ 'ebola_2014', 'Lon', 'decimal', 17, '38/38' ],
                            [ 'ebola_2014', 'Value', 'varchar', 8000, '0/0' ],
                            [ 'us_cities_2014', 'name', 'varchar', 8000, '0/0' ],
                            [ 'us_cities_2014', 'pop', 'int', 4, '10/0' ],
                            [ 'us_cities_2014', 'lat', 'decimal', 17, '38/38' ],
                            [ 'us_cities_2014', 'lon', 'decimal', 17, '38/38' ],
                            [ 'usa_states_2014', 'rank', 'int', 4, '10/0' ],
                            [ 'usa_states_2014', 'state', 'varchar', 8000, '0/0' ],
                            [ 'usa_states_2014', 'postal', 'varchar', 8000, '0/0' ],
                            [ 'usa_states_2014', 'pop', 'decimal', 17, '38/38' ],
                            [ 'world_gdp_with_codes_2014', 'COUNTRY', 'varchar', 8000, '0/0' ],
                            [ 'world_gdp_with_codes_2014', 'GDP (BILLIONS)', 'decimal', 17, '38/38' ],
                            [ 'world_gdp_with_codes_2014', 'CODE', 'varchar', 8000, '0/0' ],
                            [ 'precipitation_2015_06_30', 'Hrapx', 'varchar', 8000, '0/0' ],
                            [ 'precipitation_2015_06_30', 'Hrapy', 'varchar', 8000, '0/0' ],
                            [ 'precipitation_2015_06_30', 'Lat', 'decimal', 17, '38/38' ],
                            [ 'precipitation_2015_06_30', 'Lon', 'decimal', 17, '38/38' ],
                            [ 'precipitation_2015_06_30', 'Globvalue', 'decimal', 17, '38/38' ],
                            [ 'weather_data_seattle_2016', 'Date', 'varchar', 8000, '0/0' ],
                            [ 'weather_data_seattle_2016', 'Max_TemperatureC', 'varchar', 8000, '0/0' ],
                            [ 'weather_data_seattle_2016', 'Mean_TemperatureC', 'varchar', 8000, '0/0' ],
                            [ 'weather_data_seattle_2016', 'Min_TemperatureC', 'varchar', 8000, '0/0' ],
                            [ 'apple_stock_2014', 'AAPL_x', 'datetime', 8, '23/3' ],
                            [ 'apple_stock_2014', 'AAPL_y', 'decimal', 17, '38/38' ],
                        ];
                    } else {
                        rows = [
                            [ 'alcohol_consumption_by_country_2010', 'location', 'varchar' ],
                            [ 'alcohol_consumption_by_country_2010', 'alcohol', 'varchar' ],
                            [ 'apple_stock_2014', 'AAPL_x', 'date' ],
                            [ 'apple_stock_2014', 'AAPL_y', 'decimal' ],
                            [ 'ebola_2014', 'Value', 'varchar' ],
                            [ 'ebola_2014', 'Lon', 'decimal' ],
                            [ 'ebola_2014', 'Lat', 'decimal' ],
                            [ 'ebola_2014', 'Year', 'int' ],
                            [ 'ebola_2014', 'Month', 'int' ],
                            [ 'ebola_2014', 'Country', 'varchar' ],
                            [ 'february_aa_flight_paths_2011', 'cnt', 'int' ],
                            [ 'february_aa_flight_paths_2011', 'airport2', 'varchar' ],
                            [ 'february_aa_flight_paths_2011', 'airport1', 'varchar' ],
                            [ 'february_aa_flight_paths_2011', 'airline', 'varchar' ],
                            [ 'february_aa_flight_paths_2011', 'end_lon', 'decimal' ],
                            [ 'february_aa_flight_paths_2011', 'end_lat', 'decimal' ],
                            [ 'february_aa_flight_paths_2011', 'start_lon', 'decimal' ],
                            [ 'february_aa_flight_paths_2011', 'start_lat', 'decimal' ],
                            [ 'february_us_airport_traffic_2011', 'cnt', 'int' ],
                            [ 'february_us_airport_traffic_2011', 'long', 'decimal' ],
                            [ 'february_us_airport_traffic_2011', 'lat', 'decimal' ],
                            [ 'february_us_airport_traffic_2011', 'country', 'varchar' ],
                            [ 'february_us_airport_traffic_2011', 'state', 'varchar' ],
                            [ 'february_us_airport_traffic_2011', 'city', 'varchar' ],
                            [ 'february_us_airport_traffic_2011', 'airport', 'varchar' ],
                            [ 'february_us_airport_traffic_2011', 'iata', 'varchar' ],
                            [ 'precipitation_2015_06_30', 'Globvalue', 'decimal' ],
                            [ 'precipitation_2015_06_30', 'Lon', 'decimal' ],
                            [ 'precipitation_2015_06_30', 'Lat', 'decimal' ],
                            [ 'precipitation_2015_06_30', 'Hrapy', 'varchar' ],
                            [ 'precipitation_2015_06_30', 'Hrapx', 'varchar' ],
                            [ 'usa_states_2014', 'rank', 'int' ],
                            [ 'usa_states_2014', 'state', 'varchar' ],
                            [ 'usa_states_2014', 'postal', 'varchar' ],
                            [ 'usa_states_2014', 'pop', 'decimal' ],
                            [ 'us_ag_exports_2011', 'cotton', 'decimal' ],
                            [ 'us_ag_exports_2011', 'wheat', 'decimal' ],
                            [ 'us_ag_exports_2011', 'corn', 'decimal' ],
                            [ 'us_ag_exports_2011', 'total veggies', 'decimal' ],
                            [ 'us_ag_exports_2011', 'veggies proc', 'decimal' ],
                            [ 'us_ag_exports_2011', 'veggies fresh', 'decimal' ],
                            [ 'us_ag_exports_2011', 'total fruits', 'decimal' ],
                            [ 'us_ag_exports_2011', 'fruits proc', 'decimal' ],
                            [ 'us_ag_exports_2011', 'code', 'varchar' ],
                            [ 'us_ag_exports_2011', 'state', 'varchar' ],
                            [ 'us_ag_exports_2011', 'category', 'varchar' ],
                            [ 'us_ag_exports_2011', 'total exports', 'decimal' ],
                            [ 'us_ag_exports_2011', 'beef', 'decimal' ],
                            [ 'us_ag_exports_2011', 'poultry', 'decimal' ],
                            [ 'us_ag_exports_2011', 'fruits fresh', 'decimal' ],
                            [ 'us_ag_exports_2011', 'dairy', 'decimal' ],
                            [ 'us_ag_exports_2011', 'pork', 'decimal' ],
                            [ 'us_cities_2014', 'name', 'varchar' ],
                            [ 'us_cities_2014', 'lon', 'decimal' ],
                            [ 'us_cities_2014', 'lat', 'decimal' ],
                            [ 'us_cities_2014', 'pop', 'int' ],
                            [ 'walmart_store_openings_1962_2006', 'ZIPCODE', 'int' ],
                            [ 'walmart_store_openings_1962_2006', 'type_store', 'varchar' ],
                            [ 'walmart_store_openings_1962_2006', 'LAT', 'decimal' ],
                            [ 'walmart_store_openings_1962_2006', 'LON', 'decimal' ],
                            [ 'walmart_store_openings_1962_2006', 'MONTH', 'int' ],
                            [ 'walmart_store_openings_1962_2006', 'DAY', 'int' ],
                            [ 'walmart_store_openings_1962_2006', 'YEAR', 'int' ],
                            [ 'walmart_store_openings_1962_2006', 'STRSTATE', 'varchar' ],
                            [ 'walmart_store_openings_1962_2006', 'STRCITY', 'varchar' ],
                            [ 'walmart_store_openings_1962_2006', 'storenum', 'int' ],
                            [ 'walmart_store_openings_1962_2006', 'OPENDATE', 'varchar' ],
                            [ 'walmart_store_openings_1962_2006', 'date_super', 'varchar' ],
                            [ 'walmart_store_openings_1962_2006', 'conversion', 'varchar' ],
                            [ 'walmart_store_openings_1962_2006', 'st', 'int' ],
                            [ 'walmart_store_openings_1962_2006', 'county', 'int' ],
                            [ 'walmart_store_openings_1962_2006', 'STREETADDR', 'varchar' ],
                            [ 'weather_data_seattle_2016', 'Min_TemperatureC', 'varchar' ],
                            [ 'weather_data_seattle_2016', 'Mean_TemperatureC', 'varchar' ],
                            [ 'weather_data_seattle_2016', 'Max_TemperatureC', 'varchar' ],
                            [ 'weather_data_seattle_2016', 'Date', 'varchar' ],
                            [ 'world_gdp_with_codes_2014', 'COUNTRY', 'varchar' ],
                            [ 'world_gdp_with_codes_2014', 'GDP (BILLIONS)', 'decimal' ],
                            [ 'world_gdp_with_codes_2014', 'CODE', 'varchar' ],
                        ];
                    }
                    assert.deepEqual(json.rows, rows);
                });
        });
    });

    // S3
    it('s3 - s3-keys returns a list of keys', function(done) {
        this.timeout(10000);
        const s3CredId = saveConnection(publicReadableS3Connections);
        POST(`connections/${s3CredId}/s3-keys`)
        .then(res => res.json())
        .then(files => {
            assert.deepEqual(
                JSON.stringify(files[0]),
                JSON.stringify({
                    'Key': '311.parquet/._SUCCESS.crc',
                    'LastModified': '2016-10-26T03:27:31.000Z',
                    'ETag': '"9dfecc15c928c9274ad273719aa7a3c0"',
                    'Size': 8,
                    'StorageClass': 'STANDARD',
                    'Owner': {
                        'DisplayName': 'chris',
                        'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                    }
                })
            );
            done();
        }).catch(done);
    });

    it('s3 - s3-keys fails with the wrong connection credentials', function(done) {
        this.timeout(10000);
        const s3CredId = saveConnection({
            dialect: 's3',
            accessKeyId: 'asdf',
            secretAccessKey: 'fdsa',
            bucket: 'plotly-s3-connector-test'
        });
        POST(`connections/${s3CredId}/s3-keys`)
        .then(res => res.json().then(json => {
            assert.equal(res.status, 500);
            assert.deepEqual(json, {
                error: {message: 'The AWS Access Key Id you provided does not exist in our records.'}
            });
            done();
        }))
        .catch(done);
    });

    it('s3 - query returns data', function(done) {
        const s3CredId = saveConnection(publicReadableS3Connections);
        this.timeout(5000);
        POST(`connections/${s3CredId}/query`, {query: '5k-scatter.csv'})
        .then(res => res.json().then(json => {
            assert.equal(res.status, 200),
            assert.deepEqual(
                keys(json),
                ['columnnames', 'rows']
            );
            assert.deepEqual(
                json.rows.slice(0, 2),
                [
                    ['-0.790276857291', '-1.32900495883'],
                    ['0.931947948358', '0.266354435153']
                ]
            );
            done();
        })).catch(done);
    });

    // Apache Drill
    it('apache-drill - apache-drill-storage returns a list of storage items', function(done) {
        const s3CredId = saveConnection(apacheDrillConnections);

        this.timeout(5000);
        POST(`connections/${s3CredId}/apache-drill-storage`)
        .then(res => res.json())
        .then(storage => {
            assert.deepEqual(
                storage,
                apacheDrillStorage
            );
            done();
        }).catch(done);
    });

    it('apache-drill - apache-drill-s3-keys returns a list of s3 files', function(done) {
        const s3CredId = saveConnection(apacheDrillConnections);
        this.timeout(5000);
        POST(`connections/${s3CredId}/apache-drill-s3-keys`)
        .then(res => res.json())
        .then(files => {
            assert.deepEqual(
                JSON.stringify(files[0]),
                JSON.stringify({
                    'Key': '311.parquet/._SUCCESS.crc',
                    'LastModified': '2016-10-26T03:27:31.000Z',
                    'ETag': '"9dfecc15c928c9274ad273719aa7a3c0"',
                    'Size': 8,
                    'StorageClass': 'STANDARD',
                    'Owner': {
                        'DisplayName': 'chris',
                        'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                    }
                })
            );
            done();
        }).catch(done);
    });

    [
        {
            name: 'non existant parquet file',
            query: 'SELECT * FROM `s3`.root.`non-existant-file.parquet`',
            error: (
                'VALIDATION ERROR: From line 1, column 15 to line 1, ' +
                'column 18: Table \'s3.root.non-existant-file.parquet\' ' +
                'not found\n\nSQL Query null\n\n'
            )
        },
        {
            name: 'semi colon at the end',
            query: 'SELECT * FROM `s3`.root.`311.parquet`;',
            error: (
                'PARSE ERROR: Encountered ";" at line 1, column 38.\n' +
                'Was expecting one of:\n    <EOF> \n    "ORDER" ...\n'
            )
        },
        {
            name: 'unaccepted workspace',
            query: 'SELECT * FROM `s3`.rootz.`311.parquet` LIMIT 10',
            error: (
                'VALIDATION ERROR: From line 1, column 15 to line 1, column 18: ' +
                'Table \'s3.rootz.311.parquet\' not found\n\nSQL Query null\n\n'
            )
        },
        {
            name: 'unconfigured plugin',
            query: 'SELECT * FROM `s3z`.root.`311.parquet` LIMIT 10',
            error: (
                'VALIDATION ERROR: From line 1, column 15 to line 1, column 19: ' +
                'Table \'s3z.root.311.parquet\' not found\n\nSQL Query null\n\n'
            )
        }
    ].forEach(function(testCase) {
        it(`apache-drill - error message validation - ${testCase.name}`, function(done) {
            this.timeout(20 * 1000);
            const drillCredId = saveConnection(apacheDrillConnections);
            const query = testCase.query;
            POST(`connections/${drillCredId}/query`, {query})
            .then(res => res.json())
            .then(json => {
                console.warn(json.error.message);
                assert(
                    json.error.message.startsWith(testCase.error)
                );
                done();
            }).catch(done);
        });
    });

    /*
     * TODO - Missing elasticsearch and postgis tests from these routes.
     * (the tests for elasticsearch exist in Connections.spec.js)
     */

    // Connections
    testConnections.forEach(function(connection) {

        // TODO - Open up Redshift to CI
        if (connection.dialect === 'redshift') {
            return;
        }

        it(`connections - ${connection.dialect} - saves connections to a file if they are valid and if they do not exist`, function(done) {
            this.timeout(5 * 1000);
            try {
                fs.unlinkSync(getSetting('CONNECTIONS_PATH'));
            } catch (e) {}

            assert.deepEqual(getConnections(), []);
            POST('connections', connection)
            .then(res => res.json().then(json => {
                assert.deepEqual(
                    json,
                    {connectionId: getConnections()[0].id}
                );
                assert.equal(res.status, 200);
                assert.deepEqual(
                    [connection],
                    getConnections().map(dissoc('id'))
                );
                done();
            })).catch(done);
        });

        it(`connections - ${connection.dialect} - fails if the connections are not valid`, function(done) {
            this.timeout(5 * 1000);

            try {
                fs.unlinkSync(getSetting('CONNECTIONS_PATH'));
            } catch (e) {}

            assert.deepEqual(getConnections(), [], 'connections are empty at start');

            let connectionTypo;
            if (contains(connection.dialect, ['postgres', 'mysql', 'mariadb', 'redshift', 'mssql'])) {
                connectionTypo = merge(connection, {username: 'typo'});
            } else if (connection.dialect === 's3') {
                connectionTypo = merge(connection, {secretAccessKey: 'typo'});
            } else if (connection.dialect === 'elasticsearch') {
                connectionTypo = merge(connection, {host: 'https://lahlahlemons.com'});
            } else if (connection.dialect === 'apache drill') {
                connectionTypo = merge(connection, {host: 'https://lahlahlemons.com'});
            } else if (connection.dialect === 'sqlite') {
                connectionTypo = merge(connection, {storage: 'typo'});
            } else {
                throw new Error('Woops - missing an option in this test');
            }

            POST('connections', connectionTypo)
            .then(res => res.json().then(json => {
                if (contains(connection.dialect, ['mysql', 'mariadb'])) {
                    assert.include(
                        json.error.message,
                        "ER_ACCESS_DENIED_ERROR: Access denied for user 'typo'@"
                    );
                } else {
                    assert.deepEqual(json, {
                        error: {
                            message: ({
                                postgres: 'password authentication failed for user "typo"',
                                redshift: 'password authentication failed for user "typo"',
                                mssql: "Login failed for user 'typo'.",
                                s3: 'The request signature we calculated does not match the signature you provided. Check your key and signing method.',
                                elasticsearch: 'request to https://lahlahlemons.com:9243/_cat/indices/?format=json failed, reason: getaddrinfo ENOTFOUND lahlahlemons.com lahlahlemons.com:9243',
                                ['apache drill']: 'request to https://lahlahlemons.com:8047/query.json failed, reason: getaddrinfo ENOTFOUND lahlahlemons.com lahlahlemons.com:8047',
                                sqlite: 'SQLite file at path "typo" does not exist.'
                            })[connection.dialect]
                        }
                    });
                }
                assert.equal(res.status, 400);
                assert.deepEqual(
                    [],
                    getConnections(),
                    'connections weren\'t saved'
                );
                done();
            })).catch(done);

        });
    });

    it("connections - doesn't save connections if they already exist", function(done) {
        POST('connections', sqlConnections)
        .then(res => res.json().then(json => {
            assert.equal(res.status, 409);
            assert.deepEqual(json.connectionId, connectionId);
            done();
        })).catch(done);
    });

    it('connections - returns sanitized connections', function(done) {
        POST('connections', publicReadableS3Connections)
        .then(function(res) {
            assert.equal(res.status, 200);
            return GET('connections');
        })
        .then(res => {
            assert.equal(res.status, 200);
            return res.json();
        })
        .then(json => {
            assert.deepEqual(
                json.map(dissoc('id')),
                [
                    // The SQL connection we save in beforeEach
                    dissoc('password', sqlConnections),
                    // The S3 connection we save above
                    dissoc('secretAccessKey', publicReadableS3Connections)
                ]
            );
            done();
        }).catch(done);
    });

    it('connection/:id - returns sanitized connections', function(done) {
        let connections;
        POST('connections', publicReadableS3Connections)
        .then(res => res.json().then(json => {
            assert.equal(res.status, 200);
            return GET('connections');
        }))
        .then(res => res.json().then(connections => {
            return GET(`connections/${connections[0].id}`)
            .then(res => res.json().then(function(connection) {

                assert.deepEqual(
                    dissoc('id', connection),
                    dissoc('password', sqlConnections)
                );

                return GET(`connections/${connections[1].id}`);

            }));

        }))
        .then(res => res.json().then(function(connection) {

            assert.deepEqual(
                dissoc('id', connection),
                dissoc('secretAccessKey', publicReadableS3Connections)
            );

            done();

        })).catch(done);
    });

    it('connections - does not update connection if bad connection object', (done) => {
        PUT(`connections/${connectionId}`, assoc('username', 'banana', sqlConnections))
        .then(res => {
            assert.equal(res.status, 400);
            return res.json();
        })
        .then(json => {
            assert.deepEqual(
                json,
                {error: 'password authentication failed for user \"banana\"'}
            );
            assert.deepEqual(
                getConnections(),
                [merge(sqlConnections, {id: connectionId})]
            );
            done();
        }).catch(done);
    });

    it('connections - does not update connection if connectionId does not exist yet', (done) => {
        PUT('connections/wrong-connection-id-123', sqlConnections)
        .then(res => {

            assert.equal(res.status, 404);
            return res.json();
        })
        .then(json => {
            assert.deepEqual(
                json,
                {}
            );
            assert.deepEqual(
                getConnections(),
                [merge(sqlConnections, {id: connectionId})]
            );
            done();
        }).catch(done);
    });

    it('connections - updates connection if correct connection object', (done) => {
        PUT(`connections/${connectionId}`, mysqlConnection)
        .then(res => {
            assert.equal(res.status, 200);
            return res.json();
        })
        .then(json => {
            assert.deepEqual(
                json,
                {}
            );
            assert.deepEqual(
                getConnections(),
                [merge(mysqlConnection, {id: connectionId})]
            );
            done();
        }).catch(done);
    });

    it('connections - deletes connections', function(done) {
        assert.deepEqual(getConnections().map(dissoc('id')), [sqlConnections]);
        DELETE(`connections/${connectionId}`)
        .then(res => {
            assert.equal(res.status, 200);
            assert.deepEqual(getConnections(), []);
            done();
        }).catch(done);
    });

    it('connections - returns an empty array of connections', function(done) {
        try {
            fs.unlinkSync(getSetting('CONNECTIONS_PATH'));
        } catch (e) {}

        GET('connections')
        .then(res => {
            assert.equal(res.status, 200);
            return res.json();
        })
        .then(json => {
            assert.deepEqual(json, []);
            done();
        }).catch(done);
    });

    // Persistent Queries
    it('queries - registers a query and returns saved queries', function(done) {
        this.timeout(10 * 1000);
        // Verify that there are no queries saved
        GET('queries')
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, []);

            // Save a grid that we can update
            return createGrid('test interval');

        })
        .then(res => {
            assert.equal(res.status, 201, 'Grid was created');
            return res.json();
        })
        .then(json => {
            const fid = json.file.fid;
            const uids = json.file.cols.map(col => col.uid);

            queryObject = {
                fid,
                requestor: fid.split(':')[0],
                uids,
                refreshInterval: 60,
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };
            return POST('queries', queryObject);
        })
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {});
            assert.equal(res.status, 201, 'Query was saved');
            return GET('queries');
        }))
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, [queryObject]);
        })
        .then(() => done())
        .catch(done);
    });

    it('queries - can register queries if the user is a collaborator', function(done) {
        this.timeout(20 * 1000);
        // Verify that there are no queries saved
        GET('queries')
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, []);

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
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };
            return POST('queries', queryObject);
        })
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {});
            assert.equal(res.status, 201, 'Query was saved');
            return GET('queries');
        }))
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, [queryObject]);
        })
        .then(() => done())
        .catch(done);
    });

    it("queries - can't register queries if the user can't view it", function(done) {
        this.timeout(20 * 1000);
        // Verify that there are no queries saved
        GET('queries')
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, [], 'there are no queries saved');

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
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };
            return POST('queries', queryObject);
        })
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {error: {message: 'Not found'}});
            assert.equal(res.status, 400);
            return GET('queries');
        }))
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, [], 'No queries were saved');
        })
        .then(() => done())
        .catch(done);
    });

    it("queries - can't register queries if the user isn't a collaborator", function(done) {
        this.timeout(20 * 1000);
        // Verify that there are no queries saved
        GET('queries')
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, [], 'no queries saved at start');

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
                connectionId,
                query: 'SELECT * from ebola_2014 LIMIT 2'
            };
            return POST('queries', queryObject);
        })
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {error: {message: 'Permission denied'}});
            assert.equal(res.status, 400);
            return GET('queries');
        }))
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, [], 'still no queries saved');
        })
        .then(() => done())
        .catch(done);
    });

    it('queries - gets individual queries', function(done) {
        this.timeout(10 * 1000);
        GET(`queries/${queryObject.fid}`)
        .then(res => res.json().then(json => {
            assert.equal(res.status, 404);
            return POST('queries', queryObject);
        }))
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {});
            assert.equal(res.status, 201);
            return GET(`queries/${queryObject.fid}`);
        }))
        .then(res => res.json().then(json => {
            assert.equal(res.status, 200);
            assert.deepEqual(json, queryObject);
            done();
        })).catch(done);
    });

    it('queries - deletes queries', function(done) {
        this.timeout(10 * 1000);
        POST('queries', queryObject)
        .then(() => DELETE(`queries/${queryObject.fid}`))
        .then(res => res.json().then(json => {
            assert.deepEqual(json, {});
            assert.equal(res.status, 200);
            return GET(`queries/${queryObject.fid}`);
        }))
        .then(res => {
            assert.equal(res.status, 404);
            done();
        }).catch(done);
    });

    it('queries - returns 404s when getting queries that don\'t exist', function(done) {
        this.timeout(10 * 1000);
        GET('queries/asdfasdf')
        .then(res => {
            assert.equal(res.status, 404);
            done();
        })
        .catch(done);
    });

    it('queries - returns 404s when deleting queries that don\'t exist', function(done) {
        DELETE('queries/asdfasdf')
        .then(res => {
            assert.equal(res.status, 404);
            done();
        })
        .catch(done);
    });

    it("queries - POST /queries fails when the user's API keys or oauth creds aren't saved", function(done) {
        this.timeout(10 * 1000);
        saveSetting('USERS', []);
        assert.deepEqual(getSetting('USERS'), []);
        POST('queries', queryObject)
        .then(res => res.json().then(json => {
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
            assert.equal(res.status, 500);
            done();
        })).catch(done);
    });

    it("queries - POST /queries fails when the user's API keys aren't correct", function(done) {
        this.timeout(10 * 1000);
        const creds = [{username: 'plotly-database-connector', apiKey: 'lah lah lemons'}];
        saveSetting('USERS', creds);
        assert.deepEqual(getSetting('USERS'), creds);
        POST('queries', queryObject)
        .then(res => res.json().then(json => {
            assert.deepEqual(
                json,
                {error: {
                    message: (
                        'Unauthenticated'
                    )
                }}
            );
            assert.equal(res.status, 400);
            done();
        })).catch(done);
    });

    // TODO - Getting intermittent FetchError: request to http://localhost:9494/queries failed, reason: socket hang up
    it("queries - POST /queries fails when it can't connect to the plotly server", function(done) {
        this.timeout(70 * 1000);
        const nonExistantServer = 'plotly.lah-lah-lemons.com';
        saveSetting('PLOTLY_API_DOMAIN', nonExistantServer);
        assert.deepEqual(getSetting('PLOTLY_API_URL'), `https://${nonExistantServer}`);
        POST('queries', queryObject)
        .then(res => res.json().then(json => {
            assert.deepEqual(
                json,
                {
                    error: {
                        message: (
                            'request to ' +
                            'https://plotly.lah-lah-lemons.com/v2/grids/plotly-database-connector:197 ' +
                            'failed, reason: getaddrinfo ENOTFOUND plotly.lah-lah-lemons.com plotly.lah-lah-lemons.com:443'
                        )
                    }
                }
            );
            assert.equal(res.status, 400);
            done();
        })).catch(done);
    });

    it('queries - POST /queries fails when there is a syntax error in the query', function(done) {
        this.timeout(10 * 1000);
        const invalidQueryObject = merge(
            queryObject,
            {query: 'SELECZ'}
        );
        POST('queries', invalidQueryObject)
        .then(res => res.json().then(json => {
            assert.deepEqual(
                json,
                {error: {message: 'syntax error at or near "SELECZ"'}}
            );
            assert.equal(res.status, 400);
            done();
        })).catch(done);
    });

    it('uncaught-exceptions - uncaught exceptions get thrown OK ', function(done) {
        this.timeout(3 * 1000);
        POST('_throw')
        .then(res => res.json().then(json => {
            assert.equal(res.status, 500);
            assert.deepEqual(json, {error: {message: 'Yikes - uncaught error'}});
            done();
        })).catch(done);
    });

});
