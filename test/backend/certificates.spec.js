import {assert, expect} from 'chai';
import sinon from 'sinon';

import fs from 'fs';
import {isEmpty} from 'ramda';
import fetch from 'node-fetch';
import Servers from '../../backend/routes.js';

import {fakeCerts, MockedServerCA, username, accessToken} from './utils';
import {getSetting, saveSetting} from '../../backend/settings.js';
import {
    getCerts,
    calculateDaysToRenewal,
    fetchAndSaveCerts,
    saveCertsLocally,
    setCertificatesSettings,
    setRenewalJob,
    timeoutFetchAndSaveCerts,
    LOCAL_SETTINGS as certificateSettings
} from '../../backend/certificates';

const cleanUp = () => {
    ['KEY_FILE', 'CERT_FILE', 'SETTINGS_PATH'].forEach(fileName => {
        const settingPath = getSetting(fileName);
        try {
            fs.unlinkSync(settingPath);
        } catch (e) {
            // empty intentionally
        }
    });
};

const mockedCaServerURL = 'http://localhost:9494/certificate';

let ServerCA;
let ServerUnderTest;

describe('Certificates', function() {
    beforeEach(() => {
        setCertificatesSettings('CA_HOST_URL', mockedCaServerURL);
        setCertificatesSettings('MAX_TRIES_COUNT', 2);
        ServerCA = new MockedServerCA();
        cleanUp();
    });

    afterEach(() => {
        setCertificatesSettings('ONGOING_COUNT', 0);
        ServerCA.stop();
        cleanUp();
    });

    it('saveCertsLocally - populates relevant cert files to local storage.', (done) => {
        ['KEY_FILE', 'CERT_FILE'].forEach(fileName => {
            assert.isFalse(
                fs.existsSync(getSetting(fileName)),
                `${fileName} did not exist at first`
            );
        });

        const json = {key: 'key', cert: 'cert', subdomain: 'subdomain'};
        const expectedKey = 'key';
        const expectedCert = 'cert';
        const expectedHost = 'subdomain.plotly-connector.com';

        saveCertsLocally(json).then(() => {
            assert.equal(
                fs.readFileSync(getSetting('KEY_FILE'), 'utf-8', (err, data) => {
                    return data;
                }),
                expectedKey,
                'KEY_FILE populated fine.'
            );
            assert.equal(
                fs.readFileSync(getSetting('CERT_FILE'), 'utf-8', (err, data) => {
                    return data;
                }),
                expectedCert,
                'CERT_FILE populated fine.'
            );
            saveSetting('PLOTLY_API_DOMAIN', 'https://buildly.plot.ly');
            saveSetting('PLOTLY_API_SSL_ENABLED', true);
            const lastUpdated = getSetting('CERTIFICATE_LAST_UPDATED');
            const host = getSetting('CONNECTOR_HTTPS_DOMAIN');
            assert.equal(host, expectedHost, 'HOST name is correct.');
            assert(
                (new Date().getTime() - Date.parse(lastUpdated)) / 1000 < 1,
                'HOST lastUpdated is recent.'
            );
            assert.equal(
                getSetting('PLOTLY_API_DOMAIN'),
                'https://buildly.plot.ly'
            );
            assert.equal(
                getSetting('PLOTLY_API_SSL_ENABLED'),
                true
            );
            done();
        });
    });

    it('fetchAndSaveCerts - fetches certificates and saves to local storage', (done) => {
        // Start server that returns a server side error.
        ServerCA.start(201, fakeCerts);
        // Oauth flow will create a username and an accessToken.
        saveSetting('USERS', [{username, accessToken}]);

        const {cert, key} = fakeCerts;
        fetchAndSaveCerts().then(() => {
            setTimeout(() => {
                expect(getCerts()).to.deep.equal({cert, key});
                done();
            }, 1500);
        });
    });

    it('Can retrieve certifications from local files.', (done) => {
        expect(getCerts()).to.deep.equal({});
        const json = {key: 'key', cert: 'cert', subdomain: 'subdomain'};
        saveCertsLocally(json).then(() => {
            assert.deepEqual(getCerts(), {key: 'key', cert: 'cert'}, 'Certs returned.');
            done();
        });
    });

    it('Can calculate the amount of days left before certificate renewal.', () => {
        // Created just now shows 24 days.
        saveSetting('CERTIFICATE_LAST_UPDATED', new Date());
        const daysToRenewal = calculateDaysToRenewal();
        assert.equal(daysToRenewal, 24, 'If last update is today, 24 days left.');
        // Created 30 days ago shows 0 days.
        const now = new Date();
        const oneMonthOldTimestamp = now.setDate(now.getDate() - 24);
        saveSetting('CERTIFICATE_LAST_UPDATED', oneMonthOldTimestamp);
        const noDaysLeft = calculateDaysToRenewal();
        assert.equal(noDaysLeft, 0, 'If last update was 24 days ago, 0 days left.');
    });

    it('Mocks CA server properly. Changed CA url, can take a status, ' +
        'object and return it when endpoint is hit.', (done) => {
        ServerCA.start(201, {});
        setTimeout(() => {
            return fetch(mockedCaServerURL, {method: 'POST'})
                .then(res => res.json().then(json => {
                    assert.deepEqual(json, {});
                    assert.equal(res.status, 201);
                    done();
                })).catch(done);
        }, 500);
    });

    it('timeoutFetchAndSaveCerts - Can handle an unreachable CA server.', (done) => {
        // Start server that returns the correct response.
        // ServerCA.start(201, fakeCerts); We're not starting the mocked CA server as if its down.
        // Oauth flow will create a username and an accessToken.
        saveSetting('USERS', [{username, accessToken}]);
        assert.equal(certificateSettings.TIMEOUT_BETWEEN_TRIES, 1);

        timeoutFetchAndSaveCerts();
        setTimeout(() => {
            // Check that timout was increased
            assert.equal(certificateSettings.TIMEOUT_BETWEEN_TRIES, 60);
            assert.equal(certificateSettings.ONGOING_COUNT, 1);
            expect(getCerts()).to.deep.equal({});
            done();
        }, 3000);
    });

    it('timeoutFetchAndSaveCerts - Will create certs if returned status 201 with certificates.', (done) => {
        // Start server that returns the correct response.
        ServerCA.start(201, fakeCerts);
        // Oauth flow will create a username and an accessToken.
        saveSetting('USERS', [{username, accessToken}]);

        timeoutFetchAndSaveCerts();
        const {cert, key} = fakeCerts;
        setTimeout(() => {
            expect(getCerts()).to.deep.equal({cert, key});
            done();
        }, 500);
    });

    it('timeoutFetchAndSaveCerts - Will try again if receives a 500 error.', (done) => {
        // Start server that returns a server side error.
        ServerCA.start(500, {error: 'An error occurred.'});
        // Oauth flow will create a username and an accessToken.
        saveSetting('USERS', [{username, accessToken}]);

        // Set max calls to CA to 2.
        // Default is 5 times.
        setCertificatesSettings('MAX_TRIES_COUNT', 2);
        // Set timeout to just 1s to see within 6 secodns that it was only called twice.
        // Default is 5s.
        setCertificatesSettings('TIMEOUT_BETWEEN_TRIES', 1);

        timeoutFetchAndSaveCerts();
        setTimeout(() => {
            assert.isTrue(isEmpty(getCerts()));
            assert.equal(ServerCA.count, 2);
            done();
        }, 6000);
    });

    it('setRenewalJob - renews certificate after a given time if receives 201 from CA', (done) => {
        ServerCA.start(201, fakeCerts);
        saveSetting('USERS', [{username, accessToken}]);
        const {cert, key} = fakeCerts;

        // Check that certs were created by timeoutFetchAndSaveCerts.
        timeoutFetchAndSaveCerts();
        setTimeout(() => {
            assert.deepEqual(getCerts(), {cert, key});
            assert.equal(ServerCA.count, 1, 'Took one hit to get certificates.');
            assert.equal(getSetting('CONNECTOR_HTTPS_DOMAIN'),
                'plotly--33ffba0f-fc02-4f41-a338-d5f5ff.plotly-connector.com');
            assert.isTrue(
                (new Date().getTime() - Date.parse(getSetting('CERTIFICATE_LAST_UPDATED'))) / 1000 < 2,
                'Certificate\'s last update is recent.'
            );
        }, 1000);

        // Set a renewal job.
        setRenewalJob({timeout: 5000}); // Renew the certificates in 5s.

        // Check that certificates were renewed.
        setTimeout(() => {
            assert.equal(ServerCA.count, 2, 'Made a second hit to renew.');
            assert.isTrue(
                (new Date().getTime() - Date.parse(getSetting('CERTIFICATE_LAST_UPDATED'))) / 1000 < 2,
                'Certificate\'s last update is again recent.'
            );
            done();
        }, 6000);
    });

    it('setRenewalJob - tries again if received a 500 status from CA', (done) => {
        ServerCA.start(500, {error: 'An error occurred.'});
        saveSetting('USERS', [{username, accessToken}]);
        saveSetting('CERTIFICATE_LAST_UPDATED', new Date());

        // Set max tries to 2.
        setCertificatesSettings('MAX_TRIES_COUNT', 2);
        assert.equal(ServerCA.count, 0, 'Make sure initially count is zero.');

        // Check that certs were created by timeoutFetchAndSaveCerts.
        setRenewalJob({timeout: 5000}); // Renew the certificates in 5s.

        setTimeout(() => {
            assert.equal(ServerCA.count, 2, 'Made two tries to renew.');
            assert.deepEqual(getCerts(), {});
            done();
        }, 7000);
    });

    it('setRenewalJob - Restarts the https server.', (done) => { ServerCA.start(201, fakeCerts);
        const {cert, key} = fakeCerts;
        // Save bogus certs.
        saveCertsLocally({cert: 'cert', key: 'key'});
        setTimeout(() => {
            assert.deepEqual(getCerts(), {cert: 'cert', key: 'key'});
        }, 200);
        // Don't create certs because we want to see if renewing replaces the
        // above bogus certs.
        ServerUnderTest = new Servers({startHTTPS: true, createCerts: false});
        // Set a spy on ServerUnderTest.httpsServer.restart
        saveSetting('USERS', [{username, accessToken}]);
        ServerUnderTest.httpsServer.restart = sinon.spy();
        // Make sure restart has not been called yet.
        const {restart} = ServerUnderTest.httpsServer;
        // Renew the certificates in 1s.
        assert(restart.notCalled, 'restart should not have been called yet');
        setRenewalJob({server: ServerUnderTest.httpsServer, timeout: 1000});
        setTimeout(() => {
            assert.equal(ServerCA.count, 1, 'Made a call to renew.');
            assert.deepEqual(getCerts(), {cert, key}, 'Real certificates appeared.');
            assert(restart.called, 'restart should have been called');
            done();
        }, 5000);
    });

});
