import {assert, expect} from 'chai';
import fs from 'fs';
import {contains, dissoc, merge} from 'ramda';

import {fakeCerts} from './utils';
import {getSetting, saveSetting} from '../../backend/settings.js';
import {
    getCerts,
    CA_HOST_URL,
    calculateDaysToRenewal,
    fetchAndSaveCerts,
    saveCertsLocally,
    setMockCerts,
    setRenewalJob,
    renewCertificate
} from '../../backend/certificates';

const cleanUp = () => {
    ['KEY_FILE', 'CERT_FILE', 'SETTINGS_PATH'].forEach(fileName => {
        try {
            fs.unlinkSync(getSetting(fileName));
        } catch (e) {}
    });
};

describe('Certificates', function() {
    beforeEach(() => {
        setMockCerts(true);
        cleanUp();
    });

    afterEach(() => {
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
        const {cert, key} = fakeCerts;
        fetchAndSaveCerts().then(() => {
            expect(getCerts()).to.deep.equal({cert, key});
            done();
        });
    });

    it('Can retrieve certifications from local files.', (done) => {
        // beforeEach() should delete all relevant files, make sure that's true.
        expect(getCerts()).to.deep.equal({});
        const json = {key: 'key', cert: 'cert', subdomain: 'subdomain'};
        saveCertsLocally(json).then(() => {
            assert.deepEqual(getCerts(), {key: 'key', cert: 'cert'}, 'Certs returned.');
            done();
        });
    });

    it('Can calculate the amount of days left before certificate renewal.', () => {
        // Created just now shows 0 days.
        saveSetting('CONNECTOR_HOST_INFO', {lastUpdated: new Date()});
        const daysToRenewal = calculateDaysToRenewal();
        assert.equal(daysToRenewal, 24, 'If last update is today, 24 days left.');
        // Created 30 days ago shows 0 days.
        const now = new Date();
        const oneMonthOldTimestamp = now.setDate(now.getDate() - 24);
        saveSetting('CONNECTOR_HOST_INFO', {lastUpdated: oneMonthOldTimestamp});
        const noDaysLeft = calculateDaysToRenewal();
        assert.equal(noDaysLeft, 0, 'If last update was 30 days ago, 0 days left.');
    });

    it('Can set a timeout for renewal of certificate.', () => {
        saveSetting('CONNECTOR_HOST_INFO', {lastUpdated: new Date()});
        const renewalJob = setRenewalJob();
        assert.equal(renewalJob._idleTimeout, 2073600000); // 24 days.
        // No good way to compare functions.
        assert.isNotNull(renewalJob._onTimeout);
    });
});
