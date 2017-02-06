import {assert, expect} from 'chai';
import fs from 'fs';
import {contains, dissoc, merge} from 'ramda';

import {getSetting, saveSetting} from '../../backend/settings.js';
import {
    getCerts,
    CA_HOST_URL,
    calculateDaysToRenewal,
    fetchCertsFromCA,
    saveCertsLocally,
    setRenewalJob,
    renewCertificate
} from '../../backend/certificates';
import {username, accessToken} from './utils';

const cleanUp = () => {
    ['KEY_FILE', 'CERT_FILE'].forEach(fileName => {
        try {
            fs.unlinkSync(getSetting(fileName));
        } catch (e) {}
    });
    try {
        fs.unlinkSync(getSetting('SETTINGS_PATH'));
    } catch (e) {}
};

describe('Certificates', function() {
    beforeEach(() => {
        cleanUp();
    });

    afterEach(() => {
        cleanUp();
    });

    it('The CA URL is correctly defined.', () => {
        assert.equal(CA_HOST_URL, 'http://plotly-connector-test.com/certificate');
    });

    it('Can populate relevant certs files to local storage path.', () => {
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

        const response = saveCertsLocally(json);

        assert.isNotOk(response.error);
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
    });

    it('Can retrieve certifications from local files.', () => {
        // beforeEach() should delete all relevant files, make sure that's true.
        expect(getCerts()).to.deep.equal({});

        const json = {key: 'key', cert: 'cert', subdomain: 'subdomain'};
        const savingResponse = saveCertsLocally(json);
        assert.deepEqual(savingResponse, {}, 'Saving resopnse has no error.');
        assert.deepEqual(getCerts(), {key: 'key', certificate: 'cert'}, 'Certs returned.');
    });
});
