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

});
