import {assert, expect, spy} from 'chai';
import fs from 'fs';
import {contains, dissoc, merge, isEmpty} from 'ramda';
import fetch from 'node-fetch';


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
        try {
            fs.unlinkSync(getSetting(fileName));
        } catch (e) {}
    });
};

const mockedCaServerURL = 'http://localhost:9494/certificate';

let ServerCA;

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

    it('Can populate relevant certs files to local storage path.', (done) => {
        ['KEY_FILE', 'CERT_FILE'].forEach(fileName => {
            assert.isFalse(
                fs.existsSync(getSetting(fileName)),
                `${fileName} did not exist at first`
            );
        });

        const json = {key: 'key', cert: 'cert', subdomain: 'subdomain'};
        const expectedKey = 'key';
        const expectedCert = 'cert';
        const expectedHost = 'subdomain.plotly-connector-test.com';

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
            const hostInfo = getSetting('CONNECTOR_HOST_INFO');
            assert.equal(hostInfo.host, expectedHost, 'HOST name is correct.');
            assert(
                (new Date().getTime() - Date.parse(hostInfo.lastUpdated)) / 1000 < 1,
                'HOST lastUpdated is recent.'
            );
            done();
        });
    });

    it('Can fetch certificates and save them', (done) => {
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
        saveSetting('CONNECTOR_HOST_INFO', {lastUpdated: new Date()});
        const daysToRenewal = calculateDaysToRenewal();
        assert.equal(daysToRenewal, 24, 'If last update is today, 24 days left.');
        // Created 30 days ago shows 0 days.
        const now = new Date();
        const oneMonthOldTimestamp = now.setDate(now.getDate() - 24);
        saveSetting('CONNECTOR_HOST_INFO', {lastUpdated: oneMonthOldTimestamp});
        const noDaysLeft = calculateDaysToRenewal();
        assert.equal(noDaysLeft, 0, 'If last update was 24 days ago, 0 days left.');
    });

    it('Can set a timeout for renewal of certificate.', () => {
        saveSetting('CONNECTOR_HOST_INFO', {lastUpdated: new Date()});
        const renewalJob = setRenewalJob();
        assert.equal(renewalJob._idleTimeout, 2073600000); // 24 days.
        // No good way to compare functions.
        assert.isNotNull(renewalJob._onTimeout);
    });

    it('Mocks CA server properly. Changed CA url, can take a status, object and return it when endpoint is hit.', (done) => {
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
        const {cert, key} = fakeCerts;
        setTimeout(() => {
            // Check that timout was increased
            assert.equal(certificateSettings.TIMEOUT_BETWEEN_TRIES, 60);
            assert.equal(certificateSettings.ONGOING_COUNT, 1);
            expect(getCerts()).to.deep.equal({});
            done();
        }, 3000);
    }).timeout(5000);

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
        const {cert, key} = fakeCerts;
        setTimeout(() => {
            assert.isTrue(isEmpty(getCerts()));
            assert.equal(ServerCA.count, 2);
            done();
        }, 6000);
    }).timeout(10000);

});
