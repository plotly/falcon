import {assert, expect} from 'chai';
import fs from 'fs';
import {contains, dissoc, merge} from 'ramda';

import {getSetting, saveSetting} from '../../backend/settings.js';

describe('Settings', function() {
    beforeEach(() => {
        try {
            fs.unlinkSync(getSetting('SETTINGS_PATH'));
        } catch (e) {}

        delete process.env.PLOTLY_CONNECTOR_STORAGE_PATH;

    });

    afterEach(() => {
        delete process.env.PLOTLY_CONNECTOR_STORAGE_PATH;
    });

    it('Loads default settings OK', function() {
        const storagePath = getSetting('STORAGE_PATH');
        assert(contains('.plotly/connector', getSetting('STORAGE_PATH')));
        assert(getSetting('PLOTLY_API_DOMAIN'), 'api.plot.ly');
        assert.equal(getSetting('LOG_PATH'), `${storagePath}/log.log`);
    });

    it('Setting the STORAGE_PATH as an ENV variable updates a few other variables', function() {
        process.env.PLOTLY_CONNECTOR_STORAGE_PATH = __dirname;
        const storagePath = getSetting('STORAGE_PATH');
        assert.equal(storagePath, __dirname);
        assert.equal(getSetting('LOG_PATH'), `${__dirname}/log.log`);
    });

    it('Can save settings to local settings file.', () => {
        expect(getSetting('USERS')).to.deep.equal([]);
        saveSetting('USERS', [{username: 'username', apiKey: 'apiKey'}]);
        expect(getSetting('USERS')).to.deep.equal([{username: 'username', apiKey: 'apiKey'}]);
    });

    it('PLOTLY_URL is derived from PLOTLY_API_DOMAIN', () => {
        expect(getSetting('PLOTLY_URL'), 'https://plot.ly');
        expect(getSetting('PLOTLY_API_URL'), 'https://api.plot.ly');

        saveSetting('PLOTLY_API_DOMAIN', 'plotly.acme.com');
        expect(getSetting('PLOTLY_URL'), 'https://plotly.acme.com');
        expect(getSetting('PLOTLY_API_URL'), 'https://plotly.acme.com');

        saveSetting('PLOTLY_API_SSL_ENABLED', false);
        expect(getSetting('PLOTLY_URL'), 'http://plotly.acme.com');
        expect(getSetting('PLOTLY_API_URL'), 'http://plotly.acme.com');
    });

    it('Parses default number settings as numbers', ()  => {
        // check default
        const numberSetting = getSetting('ACCESS_TOKEN_AGE');
        expect(typeof numberSetting, 'number');
        expect(numberSetting, 300);
    });

    it('Parses saved number settings as numbers', ()  => {
        const now = Date.now();
        saveSetting('ACCESS_TOKEN_EXPIRY', now);
        const nowSetting = getSetting('ACCESS_TOKEN_EXPIRY');
        expect(typeof nowSetting, 'number');
        expect(nowSetting, now);
    });

    it('Parses environment number settings as numbers', ()  => {
        const now = Date.now();
        process.env.PLOTLY_CONNECTOR_ACCESS_TOKEN_EXPIRY = String(now);
        const nowSetting = getSetting('ACCESS_TOKEN_EXPIRY');
        expect(typeof nowSetting, 'number');
        expect(nowSetting, now);
    });
});
