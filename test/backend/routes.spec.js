const fs = require('fs');

import {assert} from 'chai';
import {assoc, contains, dissoc, isEmpty, keys, merge} from 'ramda';

import Servers from '../../backend/routes.js';
import {getConnections, saveConnection} from '../../backend/persistent/Connections.js';
import {getSetting, saveSetting} from '../../backend/settings.js';
import {setCertificatesSettings} from '../../backend/certificates';
import {
    accessToken,
    apacheDrillConnections,
    apacheDrillStorage,
    assertResponseStatus,
    clearSettings,
    closeTestServers,
    createGrid,
    createTestServers,
    DELETE,
    fakeCerts,
    GET,
    getResponseJson,
    mysqlConnection,
    PATCH,
    POST,
    publicReadableS3Connections,
    PUT,
    sqlConnections,
    testCA,
    testConnections,
    testSqlConnections,
    username,
    validFid,
    validUids,
    wait
} from './utils.js';



let queryObject;
let servers;
let connectionId;

function waitForHttpsServer() {
    return new Promise(function(resolve) {
        const resolveIfStarted = function() {
            if (servers.httpsServer.server) resolve();
            else setTimeout(resolveIfStarted, 1000);
        };
        setTimeout(resolveIfStarted);
    });
}

function closeServers() {
    return new Promise(function(resolve) {
        if (!servers) {
            resolve();
            return;
        }

        servers.httpServer.close(function() {
            if (servers.httpsServer.server) servers.httpsServer.close(resolve);
            else resolve();
        });
    });
}

// Suppressing ESLint cause Mocha ensures `this` is bound in test functions
/* eslint-disable no-invalid-this */
describe('Servers:', () => {
    beforeEach(() => {
        clearSettings('KEY_FILE', 'CERT_FILE', 'SETTINGS_PATH');
    });

    after(() => {
        clearSettings('KEY_FILE', 'CERT_FILE', 'SETTINGS_PATH');
    });

    it('Https server is up and running after an http server was started and certs were created', () => {
        servers = new Servers({createCerts: false, startHttps: true, isElectron: true});

        servers.httpServer.start();

        saveSetting('USERS', [{username, accessToken}]);
        saveSetting('CONNECTOR_HTTPS_DOMAIN', `${fakeCerts.subdomain}.${testCA}`);
        saveSetting('AUTH_ENABLED', false);

        assert.isNull(servers.httpsServer.certs, 'httpsServer should have no certs initially');
        assert.isNull(servers.httpsServer.server, 'httpsServer should not exist initially');

        fs.writeFileSync(getSetting('CERT_FILE'), fakeCerts.cert);
        fs.writeFileSync(getSetting('KEY_FILE'), fakeCerts.key);

        return waitForHttpsServer().then(function() {
            assert.isFalse(isEmpty(servers.httpsServer.certs), 'httpsServer should have certs.');
            assert.equal(servers.httpsServer.protocol, 'https', 'httpsServer has wrong protocol');
            assert.equal(servers.httpsServer.domain, `${fakeCerts.subdomain}.${testCA}`,
                'httpsServer has wrong domain');

            // Can't fetch directly for now the https server because mocked certs
            // were generated from staging LE server - not real certs.
            return GET('settings/urls').then(getResponseJson).then(json => {
                assert.equal(json.http, 'http://localhost:9494');
                assert.isNotNull(json.https, `${fakeCerts.subdomain}.${testCA}`);

                return closeServers();
            });
        });
    });

    it('No certs are created if the http server was started in onprem', () => {
        setCertificatesSettings('USE_MOCK_CERTS', true);
        saveSetting('USERS', [{username, accessToken}]);
        saveSetting('IS_RUNNING_INSIDE_ON_PREM', true);

        servers = new Servers({createCerts: true, startHttps: true});
        assert.isNull(servers.httpsServer.certs, 'httpsServer should have no certs if onprem');
        assert.isNull(servers.httpsServer.server, 'httpsServer should not exist if onprem');

        return wait(2000).then(function() {
            assert.isNull(servers.httpsServer.certs, 'httpsServer should have no certs if onprem');
            assert.isNull(servers.httpsServer.server, 'httpsServer should not exist if onprem');

            return closeServers();
        });
    });

});

describe('Routes:', () => {
    beforeEach(() => {
        servers = createTestServers();

        // Initialize query object
        connectionId = saveConnection(sqlConnections);
        queryObject = {
            fid: validFid,
            uids: validUids.slice(0, 2), // since this particular query only has 2 columns
            refreshInterval: 60, // every minute
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

    describe('backend:', function() {
        it('responds to ping', function() {
            return GET('ping').then(getResponseJson).then(json => {
                assert.equal(json.message, 'pong');
            });
        });

        it('allows access to connections page', function() {
            return GET('').then(assertResponseStatus(200));
        });

        it('reports uncaught exceptions', function() {
            return POST('_throw')
            .then(assertResponseStatus(500))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json, {error: {message: 'Yikes - uncaught error'}});
            });
        });
    });

    describe('oauth:', function() {
        it('returns 200 on loading the oauth page', function() {
            return GET('oauth2/callback').then(assertResponseStatus(200));
        });

        it('saves oauth access token with a username if valid', function() {
            saveSetting('USERS', []);

            assert.deepEqual(getSetting('USERS'), []);

            return POST('oauth2', {access_token: accessToken})
            .then(assertResponseStatus(201))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json, {});
                assert.deepEqual(getSetting('USERS'), [{username, accessToken}]);
            }).then(() => {
                // We can save it again and we'll get a 200 instead of a 201
                return POST('oauth2', {access_token: accessToken})
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {});
                });
            });
        });

        it('saving an access token that is not associated with a user account will return status 500', function() {
            saveSetting('USERS', []);
            const access_token = 'lah lah lemons';

            return POST('oauth2', {access_token})
            .then(assertResponseStatus(500))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json, {
                    error: {
                        message: 'User was not found at https://api.plot.ly'
                    }
                });
                assert.deepEqual(getSetting('USERS'), []);
            });
        });
    });

    describe('settings:', function() {
        it('GET settings/urls returns 200 and the urls', function() {
            return GET('settings/urls')
            .then(assertResponseStatus(200))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json, {
                    http: 'http://localhost:9494',
                    https: ''
                });
            });
        });

        it('GET /settings returns some of the settings', function() {
            return GET('settings')
            .then(assertResponseStatus(200))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json, {
                    'PLOTLY_URL': 'https://plot.ly',
                    'USERS': ['plotly-database-connector']
                });
            });
        });

        it('PATCH /settings sets some settings', function() {
            const newSettings = {
                'PLOTLY_API_DOMAIN': 'acme.plot.ly',
                'PLOTLY_API_SSL_ENABLED': false
            };
            return PATCH('settings', newSettings)
            .then(assertResponseStatus(200)).then(() => {
                assert.equal(
                    getSetting('PLOTLY_API_SSL_ENABLED'),
                    newSettings.PLOTLY_API_SSL_ENABLED
                );
                assert.equal(
                    getSetting('PLOTLY_API_DOMAIN'),
                    newSettings.PLOTLY_API_DOMAIN
                );
            });
        });
    });

    function createSqlQueryTest(connection) {
        it('runs a SQL query', function() {
            connectionId = saveConnection(connection);

            let sampleQuery = 'SELECT * FROM ebola_2014 LIMIT 1';
            if (connection.dialect === 'mssql') {
                sampleQuery = (
                    'SELECT TOP 1 * FROM ' +
                    `${connection.database}.dbo.ebola_2014`
                );
            } else if (connection.dialect === 'redshift') {
                sampleQuery = 'SELECT * FROM ebola_2014 WHERE month=3';
            } else if (connection.dialect === 'apache impala') {
                sampleQuery = 'SELECT * FROM PLOTLY.ALCOHOL_CONSUMPTION_BY_COUNTRY_2010 LIMIT 1';
            }

            return POST(`connections/${connectionId}/query`, {query: sampleQuery}).then(getResponseJson).then(json => {
                    let expectedColumnNames;
                    if (contains(connection.dialect, ['mariadb', 'mysql', 'mssql'])) {
                        expectedColumnNames = ['Country', 'Month', 'Year', 'Lat', 'Lon', 'Value'];
                    } else if (connection.dialect === 'sqlite') {
                        expectedColumnNames = ['index', 'Country', 'Month', 'Year', 'Lat', 'Lon', 'Value'];
                    } else if (connection.dialect === 'apache impala') {
                        expectedColumnNames = ['loc', 'alcohol'];
                    } else {
                        expectedColumnNames = ['country', 'month', 'year', 'lat', 'lon', 'value'];
                    }

                    assert.deepEqual(
                        json,
                        {
                            rows: [
                                ({
                                    'postgres': ['Guinea', 3, 14, '9.95', '-9.7', '122'],
                                    'redshift': ['Guinea', 3, 14, '10', '-10', 122],
                                    'mysql': ['Guinea', 3, 14, 10, -10, '122'],
                                    'mariadb': ['Guinea', 3, 14, 10, -10, '122'],
                                    'mssql': ['Guinea', 3, 14, 10, -10, '122'],
                                    'sqlite': [0, 'Guinea', 3, 14, 9.95, -9.7, 122],
                                    'apache impala': ['Belarus', '17.5']
                                })[connection.dialect]
                            ],
                            columnnames: expectedColumnNames
                        }
                    );
                });
        });

        it('fails when the SQL query contains a syntax error', function() {
            connectionId = saveConnection(connection);
            return POST(`connections/${connectionId}/query`, {query: 'SELECZ'})
            .then(assertResponseStatus(400))
            .then(getResponseJson).then(json => {
                assert.deepEqual(
                    json,
                    {error: {message:
                        ({
                            postgres: 'syntax error at or near "SELECZ"',
                            redshift: 'syntax error at or near "SELECZ"',
                            mysql: 'ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that ' +
                                'corresponds to your MySQL server version for the right syntax to use near ' +
                                '\'SELECZ\' at line 1',
                            mariadb: 'ER_PARSE_ERROR: You have an error in your SQL syntax; check the manual that ' +
                                'corresponds to your MariaDB server version for the right syntax to use near ' +
                                '\'SELECZ\' at line 1',
                            mssql: "Could not find stored procedure 'SELECZ'.",
                            sqlite: 'SQLITE_ERROR: near "SELECZ": syntax error',
                            'apache impala': 'BeeswaxException: AnalysisException: Syntax error in line 1:\nSELECZ\n' +
                                '^\nEncountered: IDENTIFIER\nExpected: ALTER, COMPUTE, CREATE, DESCRIBE, DROP, ' +
                                'EXPLAIN, INSERT, INVALIDATE, LOAD, REFRESH, SELECT, SHOW, USE, VALUES, WITH\n\n' +
                                'CAUSED BY: Exception: Syntax error'
                        })[connection.dialect]
                    }}
                );
            });
        });

        it('succeeds when SQL query returns no data', function() {
            connectionId = saveConnection(connection);

            let query = 'SELECT * FROM ebola_2014 LIMIT 0';
            if (connection.dialect === 'mssql') {
                query = (
                    'SELECT TOP 0 * FROM ' +
                    `${connection.database}.dbo.ebola_2014`
                );
            } else if (connection.dialect === 'apache impala') {
                query = 'SELECT * FROM PLOTLY.ALCOHOL_CONSUMPTION_BY_COUNTRY_2010 LIMIT 0';
            }

            return POST(`connections/${connectionId}/query`, {query})
            .then(assertResponseStatus(200))
            .then(getResponseJson).then(json => {
                assert.deepEqual(
                    json,
                    {
                        columnnames: [],
                        rows: [[]]
                    }
                );
            });
        });
    }

    function createSqlTablesTest(connection) {
        it('returns a list of tables', function() {
            connectionId = saveConnection(connection);

            return POST(`connections/${connectionId}/sql-tables`).then(getResponseJson).then(json => {
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
                    tables = [
                        'alcohol_consumption_by_country_2010',
                        'apple_stock_2014',
                        'ebola_2014',
                        'february_aa_flight_paths_2011',
                        'february_us_airport_traffic_2011',
                        'my_new_topo."edge_data"',
                        'my_new_topo."face"',
                        'my_new_topo."node"',
                        'my_new_topo."relation"',
                        'precipitation_2015_06_30',
                        'spatial_ref_sys',
                        'tiger."addr"',
                        'tiger."addrfeat"',
                        'tiger."bg"',
                        'tiger."county"',
                        'tiger."county_lookup"',
                        'tiger."countysub_lookup"',
                        'tiger."cousub"',
                        'tiger."direction_lookup"',
                        'tiger."edges"',
                        'tiger."faces"',
                        'tiger."featnames"',
                        'tiger."geocode_settings"',
                        'tiger."loader_lookuptables"',
                        'tiger."loader_platform"',
                        'tiger."loader_variables"',
                        'tiger."pagc_gaz"',
                        'tiger."pagc_lex"',
                        'tiger."pagc_rules"',
                        'tiger."place"',
                        'tiger."place_lookup"',
                        'tiger."secondary_unit_lookup"',
                        'tiger."state"',
                        'tiger."state_lookup"',
                        'tiger."street_type_lookup"',
                        'tiger."tabblock"',
                        'tiger."tract"',
                        'tiger."zcta5"',
                        'tiger."zip_lookup"',
                        'tiger."zip_lookup_all"',
                        'tiger."zip_lookup_base"',
                        'tiger."zip_state"',
                        'tiger."zip_state_loc"',
                        'topology."layer"',
                        'topology."topology"',
                        'us_ag_exports_2011',
                        'us_cities_2014',
                        'usa_states_2014',
                        'walmart_store_openings_1962_2006',
                        'weather_data_seattle_2016',
                        'world_gdp_with_codes_2014'

                    ];
                } else if (connection.dialect === 'apache impala') {
                    tables = ['PLOTLY.ALCOHOL_CONSUMPTION_BY_COUNTRY_2010'];
                }
                assert.deepEqual(json, tables);
            });
        });
    }

    function createSqlSchemasTest(connection) {
        it('returns a list of table schemas', function() {
            connectionId = saveConnection(connection);

            return POST(`connections/${connectionId}/sql-schemas`).then(getResponseJson).then(json => {
                    let rows;
                    if (connection.dialect === 'postgres') {
                        rows = [
                            [ 'my_new_topo."edge"', 'edge_id', 'integer' ],
                            [ 'my_new_topo."edge"', 'end_node', 'integer' ],
                            [ 'my_new_topo."edge"', 'geom', 'USER-DEFINED' ],
                            [ 'my_new_topo."edge"', 'left_face', 'integer' ],
                            [ 'my_new_topo."edge"', 'next_left_edge', 'integer' ],
                            [ 'my_new_topo."edge"', 'next_right_edge', 'integer' ],
                            [ 'my_new_topo."edge"', 'right_face', 'integer' ],
                            [ 'my_new_topo."edge"', 'start_node', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'abs_next_left_edge', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'abs_next_right_edge', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'edge_id', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'end_node', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'geom', 'USER-DEFINED' ],
                            [ 'my_new_topo."edge_data"', 'left_face', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'next_left_edge', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'next_right_edge', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'right_face', 'integer' ],
                            [ 'my_new_topo."edge_data"', 'start_node', 'integer' ],
                            [ 'my_new_topo."face"', 'face_id', 'integer' ],
                            [ 'my_new_topo."face"', 'mbr', 'USER-DEFINED' ],
                            [ 'my_new_topo."node"', 'containing_face', 'integer' ],
                            [ 'my_new_topo."node"', 'geom', 'USER-DEFINED' ],
                            [ 'my_new_topo."node"', 'node_id', 'integer' ],
                            [ 'my_new_topo."relation"', 'element_id', 'integer' ],
                            [ 'my_new_topo."relation"', 'element_type', 'integer' ],
                            [ 'my_new_topo."relation"', 'layer_id', 'integer' ],
                            [ 'my_new_topo."relation"', 'topogeo_id', 'integer' ],
                            [ 'public."alcohol_consumption_by_country_2010"', 'alcohol', 'character varying' ],
                            [ 'public."alcohol_consumption_by_country_2010"', 'location', 'character varying' ],
                            [ 'public."apple_stock_2014"', 'aapl_x', 'date' ],
                            [ 'public."apple_stock_2014"', 'aapl_y', 'numeric' ],
                            [ 'public."ebola_2014"', 'country', 'character varying' ],
                            [ 'public."ebola_2014"', 'lat', 'numeric' ],
                            [ 'public."ebola_2014"', 'lon', 'numeric' ],
                            [ 'public."ebola_2014"', 'month', 'integer' ],
                            [ 'public."ebola_2014"', 'value', 'character varying' ],
                            [ 'public."ebola_2014"', 'year', 'integer' ],
                            [ 'public."february_aa_flight_paths_2011"', 'airline', 'character varying' ],
                            [ 'public."february_aa_flight_paths_2011"', 'airport1', 'character varying' ],
                            [ 'public."february_aa_flight_paths_2011"', 'airport2', 'character varying' ],
                            [ 'public."february_aa_flight_paths_2011"', 'cnt', 'integer' ],
                            [ 'public."february_aa_flight_paths_2011"', 'end_lat', 'numeric' ],
                            [ 'public."february_aa_flight_paths_2011"', 'end_lon', 'numeric' ],
                            [ 'public."february_aa_flight_paths_2011"', 'start_lat', 'numeric' ],
                            [ 'public."february_aa_flight_paths_2011"', 'start_lon', 'numeric' ],
                            [ 'public."february_us_airport_traffic_2011"', 'airport', 'character varying' ],
                            [ 'public."february_us_airport_traffic_2011"', 'city', 'character varying' ],
                            [ 'public."february_us_airport_traffic_2011"', 'cnt', 'integer' ],
                            [ 'public."february_us_airport_traffic_2011"', 'country', 'character varying' ],
                            [ 'public."february_us_airport_traffic_2011"', 'iata', 'character varying' ],
                            [ 'public."february_us_airport_traffic_2011"', 'lat', 'numeric' ],
                            [ 'public."february_us_airport_traffic_2011"', 'long', 'numeric' ],
                            [ 'public."february_us_airport_traffic_2011"', 'state', 'character varying' ],
                            [ 'public."geography_columns"', 'coord_dimension', 'integer' ],
                            [ 'public."geography_columns"', 'f_geography_column', 'name' ],
                            [ 'public."geography_columns"', 'f_table_catalog', 'name' ],
                            [ 'public."geography_columns"', 'f_table_name', 'name' ],
                            [ 'public."geography_columns"', 'f_table_schema', 'name' ],
                            [ 'public."geography_columns"', 'srid', 'integer' ],
                            [ 'public."geography_columns"', 'type', 'text' ],
                            [ 'public."geometry_columns"', 'coord_dimension', 'integer' ],
                            [ 'public."geometry_columns"', 'f_geometry_column', 'character varying' ],
                            [ 'public."geometry_columns"', 'f_table_catalog', 'character varying' ],
                            [ 'public."geometry_columns"', 'f_table_name', 'character varying' ],
                            [ 'public."geometry_columns"', 'f_table_schema', 'character varying' ],
                            [ 'public."geometry_columns"', 'srid', 'integer' ],
                            [ 'public."geometry_columns"', 'type', 'character varying' ],
                            [ 'public."precipitation_2015_06_30"', 'globvalue', 'numeric' ],
                            [ 'public."precipitation_2015_06_30"', 'hrapx', 'character varying' ],
                            [ 'public."precipitation_2015_06_30"', 'hrapy', 'character varying' ],
                            [ 'public."precipitation_2015_06_30"', 'lat', 'numeric' ],
                            [ 'public."precipitation_2015_06_30"', 'lon', 'numeric' ],
                            [ 'public."raster_columns"', 'blocksize_x', 'integer' ],
                            [ 'public."raster_columns"', 'blocksize_y', 'integer' ],
                            [ 'public."raster_columns"', 'extent', 'USER-DEFINED' ],
                            [ 'public."raster_columns"', 'nodata_values', 'ARRAY' ],
                            [ 'public."raster_columns"', 'num_bands', 'integer' ],
                            [ 'public."raster_columns"', 'out_db', 'ARRAY' ],
                            [ 'public."raster_columns"', 'pixel_types', 'ARRAY' ],
                            [ 'public."raster_columns"', 'regular_blocking', 'boolean' ],
                            [ 'public."raster_columns"', 'r_raster_column', 'name' ],
                            [ 'public."raster_columns"', 'r_table_catalog', 'name' ],
                            [ 'public."raster_columns"', 'r_table_name', 'name' ],
                            [ 'public."raster_columns"', 'r_table_schema', 'name' ],
                            [ 'public."raster_columns"', 'same_alignment', 'boolean' ],
                            [ 'public."raster_columns"', 'scale_x', 'double precision' ],
                            [ 'public."raster_columns"', 'scale_y', 'double precision' ],
                            [ 'public."raster_columns"', 'srid', 'integer' ],
                            [ 'public."raster_overviews"', 'o_raster_column', 'name' ],
                            [ 'public."raster_overviews"', 'o_table_catalog', 'name' ],
                            [ 'public."raster_overviews"', 'o_table_name', 'name' ],
                            [ 'public."raster_overviews"', 'o_table_schema', 'name' ],
                            [ 'public."raster_overviews"', 'overview_factor', 'integer' ],
                            [ 'public."raster_overviews"', 'r_raster_column', 'name' ],
                            [ 'public."raster_overviews"', 'r_table_catalog', 'name' ],
                            [ 'public."raster_overviews"', 'r_table_name', 'name' ],
                            [ 'public."raster_overviews"', 'r_table_schema', 'name' ],
                            [ 'public."spatial_ref_sys"', 'auth_name', 'character varying' ],
                            [ 'public."spatial_ref_sys"', 'auth_srid', 'integer' ],
                            [ 'public."spatial_ref_sys"', 'proj4text', 'character varying' ],
                            [ 'public."spatial_ref_sys"', 'srid', 'integer' ],
                            [ 'public."spatial_ref_sys"', 'srtext', 'character varying' ],
                            [ 'public."us_ag_exports_2011"', 'beef', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'category', 'character varying' ],
                            [ 'public."us_ag_exports_2011"', 'code', 'character varying' ],
                            [ 'public."us_ag_exports_2011"', 'corn', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'cotton', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'dairy', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'fruits fresh', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'fruits proc', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'pork', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'poultry', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'state', 'character varying' ],
                            [ 'public."us_ag_exports_2011"', 'total exports', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'total fruits', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'total veggies', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'veggies fresh', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'veggies proc', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'wheat', 'numeric' ],
                            [ 'public."usa_states_2014"', 'pop', 'numeric' ],
                            [ 'public."usa_states_2014"', 'postal', 'character varying' ],
                            [ 'public."usa_states_2014"', 'rank', 'integer' ],
                            [ 'public."usa_states_2014"', 'state', 'character varying' ],
                            [ 'public."us_cities_2014"', 'lat', 'numeric' ],
                            [ 'public."us_cities_2014"', 'lon', 'numeric' ],
                            [ 'public."us_cities_2014"', 'name', 'character varying' ],
                            [ 'public."us_cities_2014"', 'pop', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', '1', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'conversion', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'county', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'date_super', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'day', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'lat', 'numeric' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'lon', 'numeric' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'month', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'opendate', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'st', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'strcity', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'streetaddr', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'strstate', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'type_store', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'year', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'zipcode', 'integer' ],
                            [ 'public."weather_data_seattle_2016"', 'date', 'character varying' ],
                            [ 'public."weather_data_seattle_2016"', 'max_temperaturec', 'character varying' ],
                            [ 'public."weather_data_seattle_2016"', 'mean_temperaturec', 'character varying' ],
                            [ 'public."weather_data_seattle_2016"', 'min_temperaturec', 'character varying' ],
                            [ 'public."world_gdp_with_codes_2014"', 'code', 'character varying' ],
                            [ 'public."world_gdp_with_codes_2014"', 'country', 'character varying' ],
                            [ 'public."world_gdp_with_codes_2014"', 'gdp (billions)', 'numeric' ],
                            [ 'tiger."addr"', 'arid', 'character varying' ],
                            [ 'tiger."addr"', 'fromarmid', 'integer' ],
                            [ 'tiger."addr"', 'fromhn', 'character varying' ],
                            [ 'tiger."addr"', 'fromtyp', 'character varying' ],
                            [ 'tiger."addr"', 'gid', 'integer' ],
                            [ 'tiger."addr"', 'mtfcc', 'character varying' ],
                            [ 'tiger."addr"', 'plus4', 'character varying' ],
                            [ 'tiger."addr"', 'side', 'character varying' ],
                            [ 'tiger."addr"', 'statefp', 'character varying' ],
                            [ 'tiger."addr"', 'tlid', 'bigint' ],
                            [ 'tiger."addr"', 'toarmid', 'integer' ],
                            [ 'tiger."addr"', 'tohn', 'character varying' ],
                            [ 'tiger."addr"', 'totyp', 'character varying' ],
                            [ 'tiger."addr"', 'zip', 'character varying' ],
                            [ 'tiger."addrfeat"', 'aridl', 'character varying' ],
                            [ 'tiger."addrfeat"', 'aridr', 'character varying' ],
                            [ 'tiger."addrfeat"', 'edge_mtfcc', 'character varying' ],
                            [ 'tiger."addrfeat"', 'fullname', 'character varying' ],
                            [ 'tiger."addrfeat"', 'gid', 'integer' ],
                            [ 'tiger."addrfeat"', 'lfromhn', 'character varying' ],
                            [ 'tiger."addrfeat"', 'lfromtyp', 'character varying' ],
                            [ 'tiger."addrfeat"', 'linearid', 'character varying' ],
                            [ 'tiger."addrfeat"', 'ltohn', 'character varying' ],
                            [ 'tiger."addrfeat"', 'ltotyp', 'character varying' ],
                            [ 'tiger."addrfeat"', 'offsetl', 'character varying' ],
                            [ 'tiger."addrfeat"', 'offsetr', 'character varying' ],
                            [ 'tiger."addrfeat"', 'parityl', 'character varying' ],
                            [ 'tiger."addrfeat"', 'parityr', 'character varying' ],
                            [ 'tiger."addrfeat"', 'plus4l', 'character varying' ],
                            [ 'tiger."addrfeat"', 'plus4r', 'character varying' ],
                            [ 'tiger."addrfeat"', 'rfromhn', 'character varying' ],
                            [ 'tiger."addrfeat"', 'rfromtyp', 'character varying' ],
                            [ 'tiger."addrfeat"', 'rtohn', 'character varying' ],
                            [ 'tiger."addrfeat"', 'rtotyp', 'character varying' ],
                            [ 'tiger."addrfeat"', 'statefp', 'character varying' ],
                            [ 'tiger."addrfeat"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."addrfeat"', 'tlid', 'bigint' ],
                            [ 'tiger."addrfeat"', 'zipl', 'character varying' ],
                            [ 'tiger."addrfeat"', 'zipr', 'character varying' ],
                            [ 'tiger."bg"', 'aland', 'double precision' ],
                            [ 'tiger."bg"', 'awater', 'double precision' ],
                            [ 'tiger."bg"', 'bg_id', 'character varying' ],
                            [ 'tiger."bg"', 'blkgrpce', 'character varying' ],
                            [ 'tiger."bg"', 'countyfp', 'character varying' ],
                            [ 'tiger."bg"', 'funcstat', 'character varying' ],
                            [ 'tiger."bg"', 'gid', 'integer' ],
                            [ 'tiger."bg"', 'intptlat', 'character varying' ],
                            [ 'tiger."bg"', 'intptlon', 'character varying' ],
                            [ 'tiger."bg"', 'mtfcc', 'character varying' ],
                            [ 'tiger."bg"', 'namelsad', 'character varying' ],
                            [ 'tiger."bg"', 'statefp', 'character varying' ],
                            [ 'tiger."bg"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."bg"', 'tractce', 'character varying' ],
                            [ 'tiger."county"', 'aland', 'bigint' ],
                            [ 'tiger."county"', 'awater', 'double precision' ],
                            [ 'tiger."county"', 'cbsafp', 'character varying' ],
                            [ 'tiger."county"', 'classfp', 'character varying' ],
                            [ 'tiger."county"', 'cntyidfp', 'character varying' ],
                            [ 'tiger."county"', 'countyfp', 'character varying' ],
                            [ 'tiger."county"', 'countyns', 'character varying' ],
                            [ 'tiger."county"', 'csafp', 'character varying' ],
                            [ 'tiger."county"', 'funcstat', 'character varying' ],
                            [ 'tiger."county"', 'gid', 'integer' ],
                            [ 'tiger."county"', 'intptlat', 'character varying' ],
                            [ 'tiger."county"', 'intptlon', 'character varying' ],
                            [ 'tiger."county"', 'lsad', 'character varying' ],
                            [ 'tiger."county"', 'metdivfp', 'character varying' ],
                            [ 'tiger."county"', 'mtfcc', 'character varying' ],
                            [ 'tiger."county"', 'name', 'character varying' ],
                            [ 'tiger."county"', 'namelsad', 'character varying' ],
                            [ 'tiger."county"', 'statefp', 'character varying' ],
                            [ 'tiger."county"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."county_lookup"', 'co_code', 'integer' ],
                            [ 'tiger."county_lookup"', 'name', 'character varying' ],
                            [ 'tiger."county_lookup"', 'state', 'character varying' ],
                            [ 'tiger."county_lookup"', 'st_code', 'integer' ],
                            [ 'tiger."countysub_lookup"', 'co_code', 'integer' ],
                            [ 'tiger."countysub_lookup"', 'county', 'character varying' ],
                            [ 'tiger."countysub_lookup"', 'cs_code', 'integer' ],
                            [ 'tiger."countysub_lookup"', 'name', 'character varying' ],
                            [ 'tiger."countysub_lookup"', 'state', 'character varying' ],
                            [ 'tiger."countysub_lookup"', 'st_code', 'integer' ],
                            [ 'tiger."cousub"', 'aland', 'numeric' ],
                            [ 'tiger."cousub"', 'awater', 'numeric' ],
                            [ 'tiger."cousub"', 'classfp', 'character varying' ],
                            [ 'tiger."cousub"', 'cnectafp', 'character varying' ],
                            [ 'tiger."cousub"', 'cosbidfp', 'character varying' ],
                            [ 'tiger."cousub"', 'countyfp', 'character varying' ],
                            [ 'tiger."cousub"', 'cousubfp', 'character varying' ],
                            [ 'tiger."cousub"', 'cousubns', 'character varying' ],
                            [ 'tiger."cousub"', 'funcstat', 'character varying' ],
                            [ 'tiger."cousub"', 'gid', 'integer' ],
                            [ 'tiger."cousub"', 'intptlat', 'character varying' ],
                            [ 'tiger."cousub"', 'intptlon', 'character varying' ],
                            [ 'tiger."cousub"', 'lsad', 'character varying' ],
                            [ 'tiger."cousub"', 'mtfcc', 'character varying' ],
                            [ 'tiger."cousub"', 'name', 'character varying' ],
                            [ 'tiger."cousub"', 'namelsad', 'character varying' ],
                            [ 'tiger."cousub"', 'nctadvfp', 'character varying' ],
                            [ 'tiger."cousub"', 'nectafp', 'character varying' ],
                            [ 'tiger."cousub"', 'statefp', 'character varying' ],
                            [ 'tiger."cousub"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."direction_lookup"', 'abbrev', 'character varying' ],
                            [ 'tiger."direction_lookup"', 'name', 'character varying' ],
                            [ 'tiger."edges"', 'artpath', 'character varying' ],
                            [ 'tiger."edges"', 'countyfp', 'character varying' ],
                            [ 'tiger."edges"', 'deckedroad', 'character varying' ],
                            [ 'tiger."edges"', 'divroad', 'character varying' ],
                            [ 'tiger."edges"', 'exttyp', 'character varying' ],
                            [ 'tiger."edges"', 'featcat', 'character varying' ],
                            [ 'tiger."edges"', 'fullname', 'character varying' ],
                            [ 'tiger."edges"', 'gcseflg', 'character varying' ],
                            [ 'tiger."edges"', 'gid', 'integer' ],
                            [ 'tiger."edges"', 'hydroflg', 'character varying' ],
                            [ 'tiger."edges"', 'lfromadd', 'character varying' ],
                            [ 'tiger."edges"', 'ltoadd', 'character varying' ],
                            [ 'tiger."edges"', 'mtfcc', 'character varying' ],
                            [ 'tiger."edges"', 'offsetl', 'character varying' ],
                            [ 'tiger."edges"', 'offsetr', 'character varying' ],
                            [ 'tiger."edges"', 'olfflg', 'character varying' ],
                            [ 'tiger."edges"', 'passflg', 'character varying' ],
                            [ 'tiger."edges"', 'persist', 'character varying' ],
                            [ 'tiger."edges"', 'railflg', 'character varying' ],
                            [ 'tiger."edges"', 'rfromadd', 'character varying' ],
                            [ 'tiger."edges"', 'roadflg', 'character varying' ],
                            [ 'tiger."edges"', 'rtoadd', 'character varying' ],
                            [ 'tiger."edges"', 'smid', 'character varying' ],
                            [ 'tiger."edges"', 'statefp', 'character varying' ],
                            [ 'tiger."edges"', 'tfidl', 'numeric' ],
                            [ 'tiger."edges"', 'tfidr', 'numeric' ],
                            [ 'tiger."edges"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."edges"', 'tlid', 'bigint' ],
                            [ 'tiger."edges"', 'tnidf', 'numeric' ],
                            [ 'tiger."edges"', 'tnidt', 'numeric' ],
                            [ 'tiger."edges"', 'ttyp', 'character varying' ],
                            [ 'tiger."edges"', 'zipl', 'character varying' ],
                            [ 'tiger."edges"', 'zipr', 'character varying' ],
                            [ 'tiger."faces"', 'aiannhce', 'character varying' ],
                            [ 'tiger."faces"', 'aiannhce00', 'character varying' ],
                            [ 'tiger."faces"', 'aiannhfp', 'character varying' ],
                            [ 'tiger."faces"', 'aiannhfp00', 'character varying' ],
                            [ 'tiger."faces"', 'anrcfp', 'character varying' ],
                            [ 'tiger."faces"', 'anrcfp00', 'character varying' ],
                            [ 'tiger."faces"', 'atotal', 'double precision' ],
                            [ 'tiger."faces"', 'blkgrpce', 'character varying' ],
                            [ 'tiger."faces"', 'blkgrpce00', 'character varying' ],
                            [ 'tiger."faces"', 'blockce', 'character varying' ],
                            [ 'tiger."faces"', 'blockce00', 'character varying' ],
                            [ 'tiger."faces"', 'cbsafp', 'character varying' ],
                            [ 'tiger."faces"', 'cd108fp', 'character varying' ],
                            [ 'tiger."faces"', 'cd111fp', 'character varying' ],
                            [ 'tiger."faces"', 'cnectafp', 'character varying' ],
                            [ 'tiger."faces"', 'comptyp', 'character varying' ],
                            [ 'tiger."faces"', 'comptyp00', 'character varying' ],
                            [ 'tiger."faces"', 'conctyfp', 'character varying' ],
                            [ 'tiger."faces"', 'conctyfp00', 'character varying' ],
                            [ 'tiger."faces"', 'countyfp', 'character varying' ],
                            [ 'tiger."faces"', 'countyfp00', 'character varying' ],
                            [ 'tiger."faces"', 'cousubfp', 'character varying' ],
                            [ 'tiger."faces"', 'cousubfp00', 'character varying' ],
                            [ 'tiger."faces"', 'csafp', 'character varying' ],
                            [ 'tiger."faces"', 'elsdlea', 'character varying' ],
                            [ 'tiger."faces"', 'elsdlea00', 'character varying' ],
                            [ 'tiger."faces"', 'gid', 'integer' ],
                            [ 'tiger."faces"', 'intptlat', 'character varying' ],
                            [ 'tiger."faces"', 'intptlon', 'character varying' ],
                            [ 'tiger."faces"', 'lwflag', 'character varying' ],
                            [ 'tiger."faces"', 'metdivfp', 'character varying' ],
                            [ 'tiger."faces"', 'nctadvfp', 'character varying' ],
                            [ 'tiger."faces"', 'nectafp', 'character varying' ],
                            [ 'tiger."faces"', 'offset', 'character varying' ],
                            [ 'tiger."faces"', 'placefp', 'character varying' ],
                            [ 'tiger."faces"', 'placefp00', 'character varying' ],
                            [ 'tiger."faces"', 'puma5ce', 'character varying' ],
                            [ 'tiger."faces"', 'puma5ce00', 'character varying' ],
                            [ 'tiger."faces"', 'scsdlea', 'character varying' ],
                            [ 'tiger."faces"', 'scsdlea00', 'character varying' ],
                            [ 'tiger."faces"', 'sldlst', 'character varying' ],
                            [ 'tiger."faces"', 'sldlst00', 'character varying' ],
                            [ 'tiger."faces"', 'sldust', 'character varying' ],
                            [ 'tiger."faces"', 'sldust00', 'character varying' ],
                            [ 'tiger."faces"', 'statefp', 'character varying' ],
                            [ 'tiger."faces"', 'statefp00', 'character varying' ],
                            [ 'tiger."faces"', 'submcdfp', 'character varying' ],
                            [ 'tiger."faces"', 'submcdfp00', 'character varying' ],
                            [ 'tiger."faces"', 'tazce', 'character varying' ],
                            [ 'tiger."faces"', 'tazce00', 'character varying' ],
                            [ 'tiger."faces"', 'tblkgpce', 'character varying' ],
                            [ 'tiger."faces"', 'tfid', 'numeric' ],
                            [ 'tiger."faces"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."faces"', 'tractce', 'character varying' ],
                            [ 'tiger."faces"', 'tractce00', 'character varying' ],
                            [ 'tiger."faces"', 'trsubce', 'character varying' ],
                            [ 'tiger."faces"', 'trsubce00', 'character varying' ],
                            [ 'tiger."faces"', 'trsubfp', 'character varying' ],
                            [ 'tiger."faces"', 'trsubfp00', 'character varying' ],
                            [ 'tiger."faces"', 'ttractce', 'character varying' ],
                            [ 'tiger."faces"', 'uace', 'character varying' ],
                            [ 'tiger."faces"', 'uace00', 'character varying' ],
                            [ 'tiger."faces"', 'ugace', 'character varying' ],
                            [ 'tiger."faces"', 'ugace00', 'character varying' ],
                            [ 'tiger."faces"', 'unsdlea', 'character varying' ],
                            [ 'tiger."faces"', 'unsdlea00', 'character varying' ],
                            [ 'tiger."faces"', 'vtdst', 'character varying' ],
                            [ 'tiger."faces"', 'vtdst00', 'character varying' ],
                            [ 'tiger."faces"', 'zcta5ce', 'character varying' ],
                            [ 'tiger."faces"', 'zcta5ce00', 'character varying' ],
                            [ 'tiger."featnames"', 'fullname', 'character varying' ],
                            [ 'tiger."featnames"', 'gid', 'integer' ],
                            [ 'tiger."featnames"', 'linearid', 'character varying' ],
                            [ 'tiger."featnames"', 'mtfcc', 'character varying' ],
                            [ 'tiger."featnames"', 'name', 'character varying' ],
                            [ 'tiger."featnames"', 'paflag', 'character varying' ],
                            [ 'tiger."featnames"', 'predir', 'character varying' ],
                            [ 'tiger."featnames"', 'predirabrv', 'character varying' ],
                            [ 'tiger."featnames"', 'prequal', 'character varying' ],
                            [ 'tiger."featnames"', 'prequalabr', 'character varying' ],
                            [ 'tiger."featnames"', 'pretyp', 'character varying' ],
                            [ 'tiger."featnames"', 'pretypabrv', 'character varying' ],
                            [ 'tiger."featnames"', 'statefp', 'character varying' ],
                            [ 'tiger."featnames"', 'sufdir', 'character varying' ],
                            [ 'tiger."featnames"', 'sufdirabrv', 'character varying' ],
                            [ 'tiger."featnames"', 'sufqual', 'character varying' ],
                            [ 'tiger."featnames"', 'sufqualabr', 'character varying' ],
                            [ 'tiger."featnames"', 'suftyp', 'character varying' ],
                            [ 'tiger."featnames"', 'suftypabrv', 'character varying' ],
                            [ 'tiger."featnames"', 'tlid', 'bigint' ],
                            [ 'tiger."geocode_settings"', 'category', 'text' ],
                            [ 'tiger."geocode_settings"', 'name', 'text' ],
                            [ 'tiger."geocode_settings"', 'setting', 'text' ],
                            [ 'tiger."geocode_settings"', 'short_desc', 'text' ],
                            [ 'tiger."geocode_settings"', 'unit', 'text' ],
                            [ 'tiger."loader_lookuptables"', 'columns_exclude', 'ARRAY' ],
                            [ 'tiger."loader_lookuptables"', 'insert_mode', 'character' ],
                            [ 'tiger."loader_lookuptables"', 'level_county', 'boolean' ],
                            [ 'tiger."loader_lookuptables"', 'level_nation', 'boolean' ],
                            [ 'tiger."loader_lookuptables"', 'level_state', 'boolean' ],
                            [ 'tiger."loader_lookuptables"', 'load', 'boolean' ],
                            [ 'tiger."loader_lookuptables"', 'lookup_name', 'text' ],
                            [ 'tiger."loader_lookuptables"', 'post_load_process', 'text' ],
                            [ 'tiger."loader_lookuptables"', 'pre_load_process', 'text' ],
                            [ 'tiger."loader_lookuptables"', 'process_order', 'integer' ],
                            [ 'tiger."loader_lookuptables"', 'single_geom_mode', 'boolean' ],
                            [ 'tiger."loader_lookuptables"', 'single_mode', 'boolean' ],
                            [ 'tiger."loader_lookuptables"', 'table_name', 'text' ],
                            [ 'tiger."loader_lookuptables"', 'website_root_override', 'text' ],
                            [ 'tiger."loader_platform"', 'county_process_command', 'text' ],
                            [ 'tiger."loader_platform"', 'declare_sect', 'text' ],
                            [ 'tiger."loader_platform"', 'environ_set_command', 'text' ],
                            [ 'tiger."loader_platform"', 'loader', 'text' ],
                            [ 'tiger."loader_platform"', 'os', 'character varying' ],
                            [ 'tiger."loader_platform"', 'path_sep', 'text' ],
                            [ 'tiger."loader_platform"', 'pgbin', 'text' ],
                            [ 'tiger."loader_platform"', 'psql', 'text' ],
                            [ 'tiger."loader_platform"', 'unzip_command', 'text' ],
                            [ 'tiger."loader_platform"', 'wget', 'text' ],
                            [ 'tiger."loader_variables"', 'data_schema', 'text' ],
                            [ 'tiger."loader_variables"', 'staging_fold', 'text' ],
                            [ 'tiger."loader_variables"', 'staging_schema', 'text' ],
                            [ 'tiger."loader_variables"', 'tiger_year', 'character varying' ],
                            [ 'tiger."loader_variables"', 'website_root', 'text' ],
                            [ 'tiger."pagc_gaz"', 'id', 'integer' ],
                            [ 'tiger."pagc_gaz"', 'is_custom', 'boolean' ],
                            [ 'tiger."pagc_gaz"', 'seq', 'integer' ],
                            [ 'tiger."pagc_gaz"', 'stdword', 'text' ],
                            [ 'tiger."pagc_gaz"', 'token', 'integer' ],
                            [ 'tiger."pagc_gaz"', 'word', 'text' ],
                            [ 'tiger."pagc_lex"', 'id', 'integer' ],
                            [ 'tiger."pagc_lex"', 'is_custom', 'boolean' ],
                            [ 'tiger."pagc_lex"', 'seq', 'integer' ],
                            [ 'tiger."pagc_lex"', 'stdword', 'text' ],
                            [ 'tiger."pagc_lex"', 'token', 'integer' ],
                            [ 'tiger."pagc_lex"', 'word', 'text' ],
                            [ 'tiger."pagc_rules"', 'id', 'integer' ],
                            [ 'tiger."pagc_rules"', 'is_custom', 'boolean' ],
                            [ 'tiger."pagc_rules"', 'rule', 'text' ],
                            [ 'tiger."place"', 'aland', 'bigint' ],
                            [ 'tiger."place"', 'awater', 'bigint' ],
                            [ 'tiger."place"', 'classfp', 'character varying' ],
                            [ 'tiger."place"', 'cpi', 'character varying' ],
                            [ 'tiger."place"', 'funcstat', 'character varying' ],
                            [ 'tiger."place"', 'gid', 'integer' ],
                            [ 'tiger."place"', 'intptlat', 'character varying' ],
                            [ 'tiger."place"', 'intptlon', 'character varying' ],
                            [ 'tiger."place"', 'lsad', 'character varying' ],
                            [ 'tiger."place"', 'mtfcc', 'character varying' ],
                            [ 'tiger."place"', 'name', 'character varying' ],
                            [ 'tiger."place"', 'namelsad', 'character varying' ],
                            [ 'tiger."place"', 'pcicbsa', 'character varying' ],
                            [ 'tiger."place"', 'pcinecta', 'character varying' ],
                            [ 'tiger."place"', 'placefp', 'character varying' ],
                            [ 'tiger."place"', 'placens', 'character varying' ],
                            [ 'tiger."place"', 'plcidfp', 'character varying' ],
                            [ 'tiger."place"', 'statefp', 'character varying' ],
                            [ 'tiger."place"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."place_lookup"', 'name', 'character varying' ],
                            [ 'tiger."place_lookup"', 'pl_code', 'integer' ],
                            [ 'tiger."place_lookup"', 'state', 'character varying' ],
                            [ 'tiger."place_lookup"', 'st_code', 'integer' ],
                            [ 'tiger."secondary_unit_lookup"', 'abbrev', 'character varying' ],
                            [ 'tiger."secondary_unit_lookup"', 'name', 'character varying' ],
                            [ 'tiger."state"', 'aland', 'bigint' ],
                            [ 'tiger."state"', 'awater', 'bigint' ],
                            [ 'tiger."state"', 'division', 'character varying' ],
                            [ 'tiger."state"', 'funcstat', 'character varying' ],
                            [ 'tiger."state"', 'gid', 'integer' ],
                            [ 'tiger."state"', 'intptlat', 'character varying' ],
                            [ 'tiger."state"', 'intptlon', 'character varying' ],
                            [ 'tiger."state"', 'lsad', 'character varying' ],
                            [ 'tiger."state"', 'mtfcc', 'character varying' ],
                            [ 'tiger."state"', 'name', 'character varying' ],
                            [ 'tiger."state"', 'region', 'character varying' ],
                            [ 'tiger."state"', 'statefp', 'character varying' ],
                            [ 'tiger."state"', 'statens', 'character varying' ],
                            [ 'tiger."state"', 'stusps', 'character varying' ],
                            [ 'tiger."state"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."state_lookup"', 'abbrev', 'character varying' ],
                            [ 'tiger."state_lookup"', 'name', 'character varying' ],
                            [ 'tiger."state_lookup"', 'statefp', 'character' ],
                            [ 'tiger."state_lookup"', 'st_code', 'integer' ],
                            [ 'tiger."street_type_lookup"', 'abbrev', 'character varying' ],
                            [ 'tiger."street_type_lookup"', 'is_hw', 'boolean' ],
                            [ 'tiger."street_type_lookup"', 'name', 'character varying' ],
                            [ 'tiger."tabblock"', 'aland', 'double precision' ],
                            [ 'tiger."tabblock"', 'awater', 'double precision' ],
                            [ 'tiger."tabblock"', 'blockce', 'character varying' ],
                            [ 'tiger."tabblock"', 'countyfp', 'character varying' ],
                            [ 'tiger."tabblock"', 'funcstat', 'character varying' ],
                            [ 'tiger."tabblock"', 'gid', 'integer' ],
                            [ 'tiger."tabblock"', 'intptlat', 'character varying' ],
                            [ 'tiger."tabblock"', 'intptlon', 'character varying' ],
                            [ 'tiger."tabblock"', 'mtfcc', 'character varying' ],
                            [ 'tiger."tabblock"', 'name', 'character varying' ],
                            [ 'tiger."tabblock"', 'statefp', 'character varying' ],
                            [ 'tiger."tabblock"', 'tabblock_id', 'character varying' ],
                            [ 'tiger."tabblock"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."tabblock"', 'tractce', 'character varying' ],
                            [ 'tiger."tabblock"', 'uace', 'character varying' ],
                            [ 'tiger."tabblock"', 'ur', 'character varying' ],
                            [ 'tiger."tract"', 'aland', 'double precision' ],
                            [ 'tiger."tract"', 'awater', 'double precision' ],
                            [ 'tiger."tract"', 'countyfp', 'character varying' ],
                            [ 'tiger."tract"', 'funcstat', 'character varying' ],
                            [ 'tiger."tract"', 'gid', 'integer' ],
                            [ 'tiger."tract"', 'intptlat', 'character varying' ],
                            [ 'tiger."tract"', 'intptlon', 'character varying' ],
                            [ 'tiger."tract"', 'mtfcc', 'character varying' ],
                            [ 'tiger."tract"', 'name', 'character varying' ],
                            [ 'tiger."tract"', 'namelsad', 'character varying' ],
                            [ 'tiger."tract"', 'statefp', 'character varying' ],
                            [ 'tiger."tract"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."tract"', 'tractce', 'character varying' ],
                            [ 'tiger."tract"', 'tract_id', 'character varying' ],
                            [ 'tiger."zcta5"', 'aland', 'double precision' ],
                            [ 'tiger."zcta5"', 'awater', 'double precision' ],
                            [ 'tiger."zcta5"', 'classfp', 'character varying' ],
                            [ 'tiger."zcta5"', 'funcstat', 'character varying' ],
                            [ 'tiger."zcta5"', 'gid', 'integer' ],
                            [ 'tiger."zcta5"', 'intptlat', 'character varying' ],
                            [ 'tiger."zcta5"', 'intptlon', 'character varying' ],
                            [ 'tiger."zcta5"', 'mtfcc', 'character varying' ],
                            [ 'tiger."zcta5"', 'partflg', 'character varying' ],
                            [ 'tiger."zcta5"', 'statefp', 'character varying' ],
                            [ 'tiger."zcta5"', 'the_geom', 'USER-DEFINED' ],
                            [ 'tiger."zcta5"', 'zcta5ce', 'character varying' ],
                            [ 'tiger."zip_lookup"', 'cnt', 'integer' ],
                            [ 'tiger."zip_lookup"', 'co_code', 'integer' ],
                            [ 'tiger."zip_lookup"', 'county', 'character varying' ],
                            [ 'tiger."zip_lookup"', 'cousub', 'character varying' ],
                            [ 'tiger."zip_lookup"', 'cs_code', 'integer' ],
                            [ 'tiger."zip_lookup"', 'place', 'character varying' ],
                            [ 'tiger."zip_lookup"', 'pl_code', 'integer' ],
                            [ 'tiger."zip_lookup"', 'state', 'character varying' ],
                            [ 'tiger."zip_lookup"', 'st_code', 'integer' ],
                            [ 'tiger."zip_lookup"', 'zip', 'integer' ],
                            [ 'tiger."zip_lookup_all"', 'cnt', 'integer' ],
                            [ 'tiger."zip_lookup_all"', 'co_code', 'integer' ],
                            [ 'tiger."zip_lookup_all"', 'county', 'character varying' ],
                            [ 'tiger."zip_lookup_all"', 'cousub', 'character varying' ],
                            [ 'tiger."zip_lookup_all"', 'cs_code', 'integer' ],
                            [ 'tiger."zip_lookup_all"', 'place', 'character varying' ],
                            [ 'tiger."zip_lookup_all"', 'pl_code', 'integer' ],
                            [ 'tiger."zip_lookup_all"', 'state', 'character varying' ],
                            [ 'tiger."zip_lookup_all"', 'st_code', 'integer' ],
                            [ 'tiger."zip_lookup_all"', 'zip', 'integer' ],
                            [ 'tiger."zip_lookup_base"', 'city', 'character varying' ],
                            [ 'tiger."zip_lookup_base"', 'county', 'character varying' ],
                            [ 'tiger."zip_lookup_base"', 'state', 'character varying' ],
                            [ 'tiger."zip_lookup_base"', 'statefp', 'character varying' ],
                            [ 'tiger."zip_lookup_base"', 'zip', 'character varying' ],
                            [ 'tiger."zip_state"', 'statefp', 'character varying' ],
                            [ 'tiger."zip_state"', 'stusps', 'character varying' ],
                            [ 'tiger."zip_state"', 'zip', 'character varying' ],
                            [ 'tiger."zip_state_loc"', 'place', 'character varying' ],
                            [ 'tiger."zip_state_loc"', 'statefp', 'character varying' ],
                            [ 'tiger."zip_state_loc"', 'stusps', 'character varying' ],
                            [ 'tiger."zip_state_loc"', 'zip', 'character varying' ],
                            [ 'topology."layer"', 'child_id', 'integer' ],
                            [ 'topology."layer"', 'feature_column', 'character varying' ],
                            [ 'topology."layer"', 'feature_type', 'integer' ],
                            [ 'topology."layer"', 'layer_id', 'integer' ],
                            [ 'topology."layer"', 'level', 'integer' ],
                            [ 'topology."layer"', 'schema_name', 'character varying' ],
                            [ 'topology."layer"', 'table_name', 'character varying' ],
                            [ 'topology."layer"', 'topology_id', 'integer' ],
                            [ 'topology."topology"', 'hasz', 'boolean' ],
                            [ 'topology."topology"', 'id', 'integer' ],
                            [ 'topology."topology"', 'name', 'character varying' ],
                            [ 'topology."topology"', 'precision', 'double precision' ],
                            [ 'topology."topology"', 'srid', 'integer' ]
                        ];
                    } else if (connection.dialect === 'redshift') {
                        rows = [
                            [ 'public."alcohol_consumption_by_country_2010"', 'alcohol', 'character varying' ],
                            [ 'public."alcohol_consumption_by_country_2010"', 'location', 'character varying' ],
                            [ 'public."apple_stock_2014"', 'aapl_x', 'date' ],
                            [ 'public."apple_stock_2014"', 'aapl_y', 'numeric' ],
                            [ 'public."ebola_2014"', 'country', 'character varying' ],
                            [ 'public."ebola_2014"', 'lat', 'numeric' ],
                            [ 'public."ebola_2014"', 'lon', 'numeric' ],
                            [ 'public."ebola_2014"', 'month', 'integer' ],
                            [ 'public."ebola_2014"', 'value', 'integer' ],
                            [ 'public."ebola_2014"', 'year', 'integer' ],
                            [ 'public."february_aa_flight_paths_2011"', 'airline', 'character varying' ],
                            [ 'public."february_aa_flight_paths_2011"', 'airport1', 'character varying' ],
                            [ 'public."february_aa_flight_paths_2011"', 'airport2', 'character varying' ],
                            [ 'public."february_aa_flight_paths_2011"', 'cnt', 'integer' ],
                            [ 'public."february_aa_flight_paths_2011"', 'end_lat', 'numeric' ],
                            [ 'public."february_aa_flight_paths_2011"', 'end_lon', 'numeric' ],
                            [ 'public."february_aa_flight_paths_2011"', 'start_lat', 'numeric' ],
                            [ 'public."february_aa_flight_paths_2011"', 'start_lon', 'numeric' ],
                            [ 'public."february_us_airport_traffic_2011"', 'airport', 'character varying' ],
                            [ 'public."february_us_airport_traffic_2011"', 'city', 'character varying' ],
                            [ 'public."february_us_airport_traffic_2011"', 'cnt', 'integer' ],
                            [ 'public."february_us_airport_traffic_2011"', 'country', 'character varying' ],
                            [ 'public."february_us_airport_traffic_2011"', 'iata', 'character varying' ],
                            [ 'public."february_us_airport_traffic_2011"', 'lat', 'numeric' ],
                            [ 'public."february_us_airport_traffic_2011"', 'long', 'numeric' ],
                            [ 'public."february_us_airport_traffic_2011"', 'state', 'character varying' ],
                            [ 'public."precipitation_2015_06_30"', 'globvalue', 'numeric' ],
                            [ 'public."precipitation_2015_06_30"', 'hrapx', 'character varying' ],
                            [ 'public."precipitation_2015_06_30"', 'hrapy', 'character varying' ],
                            [ 'public."precipitation_2015_06_30"', 'lat', 'numeric' ],
                            [ 'public."precipitation_2015_06_30"', 'lon', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'beef', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'category', 'character varying' ],
                            [ 'public."us_ag_exports_2011"', 'code', 'character varying' ],
                            [ 'public."us_ag_exports_2011"', 'corn', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'cotton', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'dairy', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'fruits fresh', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'fruits proc', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'pork', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'poultry', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'state', 'character varying' ],
                            [ 'public."us_ag_exports_2011"', 'total exports', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'total fruits', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'total veggies', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'veggies fresh', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'veggies proc', 'numeric' ],
                            [ 'public."us_ag_exports_2011"', 'wheat', 'numeric' ],
                            [ 'public."us_cities_2014"', 'lat', 'numeric' ],
                            [ 'public."us_cities_2014"', 'lon', 'numeric' ],
                            [ 'public."us_cities_2014"', 'name', 'character varying' ],
                            [ 'public."us_cities_2014"', 'pop', 'integer' ],
                            [ 'public."usa_states_2014"', 'pop', 'numeric' ],
                            [ 'public."usa_states_2014"', 'postal', 'character varying' ],
                            [ 'public."usa_states_2014"', 'rank', 'integer' ],
                            [ 'public."usa_states_2014"', 'state', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'conversion', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'county', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'date_super', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'day', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'lat', 'numeric' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'lon', 'numeric' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'month', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'opendate', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'st', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'storenum', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'strcity', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'streetaddr', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'strstate', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'type_store', 'character varying' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'year', 'integer' ],
                            [ 'public."walmart_store_openings_1962_2006"', 'zipcode', 'integer' ],
                            [ 'public."weather_data_seattle_2016"', 'date', 'character varying' ],
                            [ 'public."weather_data_seattle_2016"', 'max_temperaturec', 'character varying' ],
                            [ 'public."weather_data_seattle_2016"', 'mean_temperaturec', 'character varying' ],
                            [ 'public."weather_data_seattle_2016"', 'min_temperaturec', 'character varying' ],
                            [ 'public."world_gdp_with_codes_2014"', 'code', 'character varying' ],
                            [ 'public."world_gdp_with_codes_2014"', 'country', 'character varying' ],
                            [ 'public."world_gdp_with_codes_2014"', 'gdp (billions)', 'numeric' ]
                        ];
                    } else if (connection.dialect === 'mssql') {
                        rows = [
                            [ 'walmart_store_openings_1962_2006', 'storenum', 'int'],
                            [ 'walmart_store_openings_1962_2006', 'OPENDATE', 'varchar'],
                            [ 'walmart_store_openings_1962_2006', 'date_super', 'varchar'],
                            [ 'walmart_store_openings_1962_2006', 'conversion', 'varchar'],
                            [ 'walmart_store_openings_1962_2006', 'st', 'int'],
                            [ 'walmart_store_openings_1962_2006', 'county', 'int'],
                            [ 'walmart_store_openings_1962_2006', 'STREETADDR', 'varchar'],
                            [ 'walmart_store_openings_1962_2006', 'STRCITY', 'varchar'],
                            [ 'walmart_store_openings_1962_2006', 'STRSTATE', 'varchar'],
                            [ 'walmart_store_openings_1962_2006', 'ZIPCODE', 'int'],
                            [ 'walmart_store_openings_1962_2006', 'type_store', 'varchar'],
                            [ 'walmart_store_openings_1962_2006', 'LAT', 'decimal'],
                            [ 'walmart_store_openings_1962_2006', 'LON', 'decimal'],
                            [ 'walmart_store_openings_1962_2006', 'MONTH', 'int'],
                            [ 'walmart_store_openings_1962_2006', 'DAY', 'int'],
                            [ 'walmart_store_openings_1962_2006', 'YEAR', 'int'],
                            [ 'alcohol_consumption_by_country_2010', 'location', 'varchar'],
                            [ 'alcohol_consumption_by_country_2010', 'alcohol', 'varchar'],
                            [ 'february_aa_flight_paths_2011', 'start_lat', 'decimal'],
                            [ 'february_aa_flight_paths_2011', 'start_lon', 'decimal'],
                            [ 'february_aa_flight_paths_2011', 'end_lat', 'decimal'],
                            [ 'february_aa_flight_paths_2011', 'end_lon', 'decimal'],
                            [ 'february_aa_flight_paths_2011', 'airline', 'varchar'],
                            [ 'february_aa_flight_paths_2011', 'airport1', 'varchar'],
                            [ 'february_aa_flight_paths_2011', 'airport2', 'varchar'],
                            [ 'february_aa_flight_paths_2011', 'cnt', 'int'],
                            [ 'february_us_airport_traffic_2011', 'iata', 'varchar'],
                            [ 'february_us_airport_traffic_2011', 'airport', 'varchar'],
                            [ 'february_us_airport_traffic_2011', 'city', 'varchar'],
                            [ 'february_us_airport_traffic_2011', 'state', 'varchar'],
                            [ 'february_us_airport_traffic_2011', 'country', 'varchar'],
                            [ 'february_us_airport_traffic_2011', 'lat', 'decimal'],
                            [ 'february_us_airport_traffic_2011', 'long', 'decimal'],
                            [ 'february_us_airport_traffic_2011', 'cnt', 'int'],
                            [ 'us_ag_exports_2011', 'code', 'varchar'],
                            [ 'us_ag_exports_2011', 'state', 'varchar'],
                            [ 'us_ag_exports_2011', 'category', 'varchar'],
                            [ 'us_ag_exports_2011', 'total exports', 'decimal'],
                            [ 'us_ag_exports_2011', 'beef', 'decimal'],
                            [ 'us_ag_exports_2011', 'pork', 'decimal'],
                            [ 'us_ag_exports_2011', 'poultry', 'decimal'],
                            [ 'us_ag_exports_2011', 'dairy', 'decimal'],
                            [ 'us_ag_exports_2011', 'fruits fresh', 'decimal'],
                            [ 'us_ag_exports_2011', 'fruits proc', 'decimal'],
                            [ 'us_ag_exports_2011', 'total fruits', 'decimal'],
                            [ 'us_ag_exports_2011', 'veggies fresh', 'decimal'],
                            [ 'us_ag_exports_2011', 'veggies proc', 'decimal'],
                            [ 'us_ag_exports_2011', 'total veggies', 'decimal'],
                            [ 'us_ag_exports_2011', 'corn', 'decimal'],
                            [ 'us_ag_exports_2011', 'wheat', 'decimal'],
                            [ 'us_ag_exports_2011', 'cotton', 'decimal'],
                            [ 'apple_stock_2014', 'AAPL_x', 'datetime'],
                            [ 'apple_stock_2014', 'AAPL_y', 'decimal'],
                            [ 'ebola_2014', 'Country', 'varchar'],
                            [ 'ebola_2014', 'Month', 'int'],
                            [ 'ebola_2014', 'Year', 'int'],
                            [ 'ebola_2014', 'Lat', 'decimal'],
                            [ 'ebola_2014', 'Lon', 'decimal'],
                            [ 'ebola_2014', 'Value', 'varchar'],
                            [ 'us_cities_2014', 'name', 'varchar'],
                            [ 'us_cities_2014', 'pop', 'int'],
                            [ 'us_cities_2014', 'lat', 'decimal'],
                            [ 'us_cities_2014', 'lon', 'decimal'],
                            [ 'usa_states_2014', 'rank', 'int'],
                            [ 'usa_states_2014', 'state', 'varchar'],
                            [ 'usa_states_2014', 'postal', 'varchar'],
                            [ 'usa_states_2014', 'pop', 'decimal'],
                            [ 'world_gdp_with_codes_2014', 'COUNTRY', 'varchar'],
                            [ 'world_gdp_with_codes_2014', 'GDP (BILLIONS)', 'decimal'],
                            [ 'world_gdp_with_codes_2014', 'CODE', 'varchar'],
                            [ 'precipitation_2015_06_30', 'Hrapx', 'varchar'],
                            [ 'precipitation_2015_06_30', 'Hrapy', 'varchar'],
                            [ 'precipitation_2015_06_30', 'Lat', 'decimal'],
                            [ 'precipitation_2015_06_30', 'Lon', 'decimal'],
                            [ 'precipitation_2015_06_30', 'Globvalue', 'decimal'],
                            [ 'weather_data_seattle_2016', 'Date', 'varchar'],
                            [ 'weather_data_seattle_2016', 'Max_TemperatureC', 'varchar'],
                            [ 'weather_data_seattle_2016', 'Mean_TemperatureC', 'varchar'],
                            [ 'weather_data_seattle_2016', 'Min_TemperatureC', 'varchar'],
                            [ 'apple_stock_2014', 'AAPL_x', 'datetime'],
                            [ 'apple_stock_2014', 'AAPL_y', 'decimal']
                        ];
                    } else if (connection.dialect === 'apache impala') {
                        rows = [
                            [ 'plotly.alcohol_consumption_by_country_2010', 'loc', 'string' ],
                            [ 'plotly.alcohol_consumption_by_country_2010', 'alcohol', 'double' ]
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
                            [ 'world_gdp_with_codes_2014', 'CODE', 'varchar' ]
                        ];
                    }
                    assert.deepEqual(json.rows, rows);
                });
        });
    }

    testSqlConnections.forEach(function(connection) {
        if (connection.dialect === 'apache impala') {
            return;
        }

        describe(`connections: sql connectors: ${connection.dialect}: query:`, function() {
            createSqlQueryTest(connection);
        });

        describe(`connections: sql connectors: ${connection.dialect}: tables:`, function() {
            createSqlTablesTest(connection);
        });

        describe(`connections: sql connectors: ${connection.dialect}: schemas:`, function() {
            createSqlSchemasTest(connection);
        });
    });

    describe('connections: nosql connectors: s3:', function() {
        it('s3-keys returns a list of keys', function() {
            const s3CredId = saveConnection(publicReadableS3Connections);
            return POST(`connections/${s3CredId}/s3-keys`).then(getResponseJson).then(files => {
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
            });
        });

        it('s3-keys fails with the wrong connection credentials', function() {
            const s3CredId = saveConnection({
                dialect: 's3',
                accessKeyId: 'asdf',
                secretAccessKey: 'fdsa',
                bucket: 'plotly-s3-connector-test'
            });
            return POST(`connections/${s3CredId}/s3-keys`)
            .then(assertResponseStatus(500))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json, {
                    error: {message: 'The AWS Access Key Id you provided does not exist in our records.'}
                });
            });
        });

        it('query returns data', function() {
            const s3CredId = saveConnection(publicReadableS3Connections);
            return POST(`connections/${s3CredId}/query`, {query: '5k-scatter.csv'})
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
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
                });
        });
    });

    describe('connections: nosql connectors: apache-drill:', function() {
        it('apache-drill-storage returns a list of storage items', function() {
            const s3CredId = saveConnection(apacheDrillConnections);

            return POST(`connections/${s3CredId}/apache-drill-storage`).then(getResponseJson).then(storage => {
                assert.deepEqual(
                    storage,
                    apacheDrillStorage
                );
            });
        });

        it('apache-drill-s3-keys returns a list of s3 files', function() {
            const s3CredId = saveConnection(apacheDrillConnections);

            return POST(`connections/${s3CredId}/apache-drill-s3-keys`).then(getResponseJson).then(files => {
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
            });
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
            it(`error message validation - ${testCase.name}`, function() {
                const drillCredId = saveConnection(apacheDrillConnections);
                const query = testCase.query;

                return POST(`connections/${drillCredId}/query`, {query}).then(getResponseJson).then(json => {
                    assert(json.error.message.startsWith(testCase.error));
                });
            });
        });
    });

    /*
     * TODO - Missing elasticsearch and postgis tests from these routes.
     * (the tests for elasticsearch exist in Connections.spec.js)
     */

    // Connections
    function createConnectionTest(connection) {
        it('saves connections to a file if they are valid and if they do not exist', function() {
            clearSettings('CONNECTIONS_PATH');

            assert.deepEqual(getConnections(), []);

            return POST('connections', connection)
            .then(assertResponseStatus(200))
            .then(getResponseJson).then(json => {
                assert.deepEqual(
                    json,
                    {connectionId: getConnections()[0].id}
                );
                assert.deepEqual(
                    [connection],
                    getConnections().map(dissoc('id'))
                );
            });
        });

        it('fails if the connections are not valid', function() {
            clearSettings('CONNECTIONS_PATH');

            assert.deepEqual(getConnections(), [], 'connections are empty at start');

            let connectionTypo;
            if (contains(connection.dialect, ['postgres', 'mysql', 'mariadb', 'redshift', 'mssql'])) {
                connectionTypo = merge(connection, {username: 'typo'});
            } else if (connection.dialect === 's3') {
                connectionTypo = merge(connection, {secretAccessKey: 'typo'});
            } else if (contains(connection.dialect, ['elasticsearch', 'apache drill', 'apache impala'])) {
                connectionTypo = merge(connection, {host: 'https://lahlahlemons.com'});
            } else if (connection.dialect === 'sqlite') {
                connectionTypo = merge(connection, {storage: 'typo'});
            } else {
                throw new Error('Woops - missing an option in this test');
            }

            return POST('connections', connectionTypo)
            .then(assertResponseStatus(400))
            .then(getResponseJson).then(json => {
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
                                s3: 'The request signature we calculated does not match the signature you provided. ' +
                                    'Check your key and signing method.',
                                elasticsearch: 'request to https://lahlahlemons.com:9243/_cat/indices/?format=json ' +
                                    'failed, reason: getaddrinfo ENOTFOUND lahlahlemons.com lahlahlemons.com:9243',
                                ['apache drill']: 'request to https://lahlahlemons.com:8047/query.json failed, ' +
                                    'reason: getaddrinfo ENOTFOUND lahlahlemons.com lahlahlemons.com:8047',
                                sqlite: 'SQLite file at path "typo" does not exist.',
                                ['apache impala']: 'Error: getaddrinfo ENOTFOUND https://lahlahlemons.com https://lahlahlemons.com:21000'
                            })[connection.dialect]
                        }
                    });
                }
                assert.deepEqual(
                    [],
                    getConnections(),
                    'connections weren\'t saved'
                );
            });
        });
    }

    testConnections.forEach(function(connection) {
        if (connection.dialect === 'apache impala') {
            return;
        }

        describe(`connections: all connectors: ${connection.dialect}:`, function() {
            createConnectionTest(connection);
        });
    });

    describe('connections:', function() {
        it("doesn't save connections if they already exist", function() {
            return POST('connections', sqlConnections)
            .then(assertResponseStatus(409))
            .then(getResponseJson).then(json => {
                assert.deepEqual(json.connectionId, connectionId);
            });
        });

        it('returns sanitized connections', function() {
            return POST('connections', publicReadableS3Connections)
                .then(assertResponseStatus(200))
                .then(function() {
                    return GET('connections');
                })
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(
                        json.map(dissoc('id')),
                        [
                            // The SQL connection we save in beforeEach
                            dissoc('password', sqlConnections),
                            // The S3 connection we save above
                            dissoc('secretAccessKey', publicReadableS3Connections)
                        ]
                    );
                });
        });

        it('connection/:id returns sanitized connections', function() {
            return POST('connections', publicReadableS3Connections).then(assertResponseStatus(200))
                .then(() => {
                    return GET('connections').then(getResponseJson);
                })
                .then(connections => {
                    return GET(`connections/${connections[0].id}`).then(getResponseJson)
                    .then(connection => {
                        assert.deepEqual(
                            dissoc('id', connection),
                            dissoc('password', sqlConnections)
                        );

                        return connections;
                    });
                })
                .then(connections => {
                    return GET(`connections/${connections[1].id}`).then(getResponseJson)
                    .then((connection) => {
                        assert.deepEqual(
                            dissoc('id', connection),
                            dissoc('secretAccessKey', publicReadableS3Connections)
                        );
                    });
                });
        });

        it('does not update connection if bad connection object', function() {
            return PUT(`connections/${connectionId}`, assoc('username', 'banana', sqlConnections))
                .then(assertResponseStatus(400))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(
                        json,
                        {error: {message: 'password authentication failed for user "banana"'}}
                    );
                    assert.deepEqual(
                        getConnections(),
                        [merge(sqlConnections, {id: connectionId})]
                    );
                });
        });

        it('does not update connection if connectionId does not exist yet', function() {
            return PUT('connections/wrong-connection-id-123', sqlConnections)
                .then(assertResponseStatus(404))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {});
                    assert.deepEqual(
                        getConnections(),
                        [merge(sqlConnections, {id: connectionId})]
                    );
                });
        });

        it('updates connection if correct connection object', function() {
            return PUT(`connections/${connectionId}`, mysqlConnection)
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {});
                    assert.deepEqual(
                        getConnections(),
                        [merge(mysqlConnection, {id: connectionId})]
                    );
                });
        });

        it('deletes connections', function() {
            assert.deepEqual(getConnections().map(dissoc('id')), [sqlConnections]);

            return DELETE(`connections/${connectionId}`)
                .then(assertResponseStatus(200)).then(() => {
                    assert.deepEqual(getConnections(), []);
                });
        });

        it('returns an empty array of connections', function() {
            clearSettings('CONNECTIONS_PATH');

            return GET('connections')
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, []);
                });
        });
    });

    describe('persistent queries:', function() {
        beforeEach(function() {
            // Verify that there are no queries saved
            return GET('queries')
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, []);
                });
        });

        it('queries registers a query and returns saved queries', function() {
            // Save a grid that we can update
            return createGrid('test interval')
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
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
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {});

                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, [queryObject]);
                });
        });

        it('queries can register queries if the user is a collaborator', function() {
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

            return POST('queries', queryObject)
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {});
                    return GET('queries');
                })
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, [queryObject]);
                });
        });

        it("queries can't register queries if the user can't view it", function() {
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

        it("queries can't register queries if the user isn't a collaborator", function() {
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

        it('queries gets individual queries', function() {
            return GET(`queries/${queryObject.fid}`)
                .then(assertResponseStatus(404)).then(() => {
                    return POST('queries', queryObject);
                })
                .then(assertResponseStatus(201))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, {});
                    return GET(`queries/${queryObject.fid}`);
                })
                .then(assertResponseStatus(200))
                .then(getResponseJson).then(json => {
                    assert.deepEqual(json, queryObject);
                });
        });

        it('queries deletes queries', function() {
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

        it('queries returns 404s when getting queries that don\'t exist', function() {
            return GET('queries/asdfasdf').then(assertResponseStatus(404));
        });

        it('queries returns 404s when deleting queries that don\'t exist', function() {
            return DELETE('queries/asdfasdf').then(assertResponseStatus(404));
        });

        it("queries POST /queries fails when the user's API keys or oauth creds aren't saved", function() {
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

        it("queries POST /queries fails when the user's API keys aren't correct", function() {
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

        it("queries POST /queries fails when it can't connect to the plotly server", function() {
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

        it('queries POST /queries fails when there is a syntax error in the query', function() {
            const invalidQueryObject = merge(
                queryObject,
                {query: 'SELECZ'}
            );

            return POST('queries', invalidQueryObject)
            .then(assertResponseStatus(400))
            .then(getResponseJson).then(json => {
                assert.deepEqual(
                    json,
                    {error: {message: 'syntax error at or near "SELECZ"'}}
                );
            });
        });
    });
});
/* eslint-enable no-invalid-this */
