import fetch from 'node-fetch';
import assert from 'assert';
import Server from '../../../backend/persistent/routes.js';
import {
    getCredentials,
    getSanitizedCredentials,
    saveCredential
} from '../../../backend/persistent/Credentials.js';
import {
    CREDENTIALS_PATH,
    QUERIES_PATH
} from '../../../backend/utils/homeFiles.js';
import fs from 'fs';
import {
    configuration,
    sqlCredentials,
    elasticsearchCredentials,
    publicReadableS3Credentials,
    apacheDrillCredentials,
    apacheDrillStorage
} from '../utils.js';

import {dissoc} from 'ramda';

// Shortcuts
function GET(path) {

    return fetch(`http://localhost:9000/${path}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

function POST(path, body = {}) {
    return fetch(`http://localhost:9000/${path}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

function DELETE(path) {

    return fetch(`http://localhost:9000/${path}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}


let queryObject;
let server;
let credentialId;
describe('Server', function () {
    beforeEach(() => {
        server = new Server();
        server.start();

        // Save some credentials to the user's disk
        try {
            fs.unlinkSync(CREDENTIALS_PATH);
        } catch (e) {}
        try {
            fs.unlinkSync(QUERIES_PATH);
        } catch (e) {}

        credentialId = saveCredential(sqlCredentials);
        queryObject = {
            fid: 'chris:10',
            uids: ['asd', 'xyz'],
            refreshRate: 5 * 1000,
            query: 'SELECT * FROM ebola_2014 LIMIT 1',
            credentialId: credentialId
        };

    });

    afterEach(() => {
        server.close();
        server.queryScheduler.clearQueries();
    });


    it ('responds on a ping', function(done) {
        GET('ping')
        .then(() => done())
        .catch(done);
    });


    // One Time Queries
    it('runs a query', function(done) {
        this.timeout(5000);
        POST(`query/${credentialId}`, {
            query: 'SELECT * FROM ebola_2014 LIMIT 1'
        })
        .then(res => res.json())
        .then(response => {
            assert.deepEqual(
                response.rows,
                [['Guinea', 3, 14, '9.95', '-9.7', '122']]
            );
            assert.deepEqual(
                response.columnnames,
                ['country', 'month', 'year', 'lat', 'lon', 'value']
            );
            done();
        }).catch(done);
    });

    // Meta info about the tables
    it('/tables returns a list of tables', function(done) {
        this.timeout(5000);
        POST(`tables/${credentialId}`)
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(
                json,
                [
                    'alcohol_consumption_by_country_2010',
                    'february_aa_flight_paths_2011',
                    'walmart_store_openings_1962_2006',
                    'february_us_airport_traffic_2011',
                    'us_ag_exports_2011',
                    'apple_stock_2014',
                    'usa_states_2014',
                    'ebola_2014',
                    'us_cities_2014',
                    'world_gdp_with_codes_2014',
                    'precipitation_2015_06_30',
                    'weather_data_seattle_2016'
                ]
            );
            done();
        }).catch(done);
    });

    // S3
    it('/s3-keys returns a list of keys', function(done) {
        const s3CredId = saveCredential(publicReadableS3Credentials);

        this.timeout(5000);
        POST(`s3-keys/${s3CredId}`)
        .then(res => res.json())
        .then(files => {
            assert.deepEqual(
                JSON.stringify(files[0]),
                JSON.stringify({
                    "Key":"311.parquet/._SUCCESS.crc",
                    "LastModified":"2016-10-26T03:27:31.000Z",
                    "ETag":'"9dfecc15c928c9274ad273719aa7a3c0"',
                    "Size":8,
                    "StorageClass":"STANDARD",
                    "Owner": {
                        "DisplayName":"chris",
                        "ID":"655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a"
                    }
                })
            );
            done()
        }).catch(done);
    });

    // Apache Drill
    it('/apache-drill-storage returns a list of storage items', function(done) {
        const s3CredId = saveCredential(apacheDrillCredentials);

        this.timeout(5000);
        POST(`apache-drill-storage/${s3CredId}`)
        .then(res => res.json())
        .then(storage => {
            assert.deepEqual(
                storage,
                apacheDrillStorage
            );
            done()
        }).catch(done);
    });

    it.only('/apache-drill-s3-keys returns a list of s3 files', function(done) {
        const s3CredId = saveCredential(apacheDrillCredentials);
        this.timeout(5000);
        POST(`apache-drill-s3-keys/${s3CredId}`)
        .then(res => res.json())
        .then(files => {
            assert.deepEqual(
                JSON.stringify(files[0]),
                JSON.stringify({
                    "Key":"311.parquet/._SUCCESS.crc",
                    "LastModified":"2016-10-26T03:27:31.000Z",
                    "ETag":'"9dfecc15c928c9274ad273719aa7a3c0"',
                    "Size":8,
                    "StorageClass":"STANDARD",
                    "Owner": {
                        "DisplayName":"chris",
                        "ID":"655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a"
                    }
                })
            );
            done()
        }).catch(done);
    });

    // Credentials
    it('saves credentials to a file if they do not exist', function(done) {
        fs.unlinkSync(CREDENTIALS_PATH);
        assert.deepEqual(getCredentials(), []);
        POST('credentials', sqlCredentials)
        .then(res => {
            assert.equal(res.status, 200);
            assert.deepEqual(
                [sqlCredentials],
                getCredentials().map(dissoc('id'))
            );
            done();
        }).catch(done);
    });

    it("doesn't save credentials if they already exist", function(done) {
        POST('credentials', sqlCredentials)
        .then(res => {
            assert.equal(res.status, 409);
            assert.deepEqual(res.credentialId, credentialId);
        });
    });

    it('returns sanitized credentials', function(done) {
        GET('credentials')
        .then(res => {
            assert.equal(res.status, 200);
            return res.json();
        })
        .then(json => {
            assert.deepEqual(
                json.map(dissoc('id')),
                [dissoc('password', sqlCredentials)]
            );
            done();
        }).catch(done);
    });

    it('deletes credentials', function(done) {
        assert.deepEqual(getCredentials().map(dissoc('id')), [sqlCredentials]);
         DELETE(`credentials/${credentialId}`)
        .then(res => {
            assert.equal(res.status, 204);
            assert.deepEqual(getCredentials(), []);
            done();
        }).catch(done);
    });

    it('returns an empty array of credentials', function(done) {
        fs.unlinkSync(CREDENTIALS_PATH);
        GET('credentials')
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
    it('registers a query and returns saved queries', function(done) {
        GET('queries')
        .then(res => res.json())
        .then(json => {
            // Verify that there are no queries saved
            assert.deepEqual(json, []);
            return POST('queries', queryObject);
        })
        .then(() => GET('queries'))
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, [queryObject]);
        })
        .then(() => done())
        .catch(done);
    });

    it('gets individual queries', function(done) {
        POST('queries', queryObject)
        .then(() => GET(`queries/${queryObject.fid}`))
        .then(res => res.json())
        .then(json => {
            assert.deepEqual(json, queryObject);
            done();
        }).catch(done);
    });

    it('deletes queries', function(done) {
        POST('queries', queryObject)
        .then(() => DELETE(`queries/${queryObject.fid}`))
        .then(res => {
            assert.equal(res.status, 204);
            return GET(`queries/${queryObject.fid}`);
        })
        .then(res => {
            assert.equal(res.status, 404);
            done();
        }).catch(done);
    });

    it('returns 404s when getting queries that don\'t exist', function(done) {
        GET('queries/asdfasdf')
        .then(res => {
            assert.equal(res.status, 404);
            done();
        })
        .catch(done);
    });

    it('returns 404s when deleting queries that don\'t exist', function(done) {
        DELETE('queries/asdfasdf')
        .then(res => {
            assert.equal(res.status, 404);
            done();
        })
        .catch(done);
    });

});
