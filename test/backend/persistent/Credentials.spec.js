import {expect, assert} from 'chai';
import fs from 'fs';
import {merge, dissoc} from 'ramda';

import {CREDENTIALS_PATH} from '../../../backend/utils/homeFiles.js';
import {
    saveCredential,
    lookUpCredentials
} from '../../../backend/persistent/Credentials.js';

describe('lookUpCredentials', function() {
    let mockCredentials;
    beforeEach(() => {
        try {
            fs.unlinkSync(CREDENTIALS_PATH);
        } catch (e) {}

        mockCredentials = [
            {
                host: 'localhost',
                port: 5000,
                password: 'yoda',
                dialect: 'elasticsearch'
            },
            {
                host: 'localhost',
                port: 4894,
                password: 'tintin',
                dialect: 'postgres'
            }
        ];
    });

    it('returns the full credentials given a serializedConfiguration', function() {
        // First, save some credentials to the disk.
        // Credentials are an array of key-value pairs

        saveCredential(mockCredentials[0]);
        saveCredential(mockCredentials[1]);

        // We index conections with just a JSON serialized version of the
        // credentials but *without* the password.
        // We assume that the rest of settings are safe enough to be passed
        // around the app.
        const configuration = dissoc('password', mockCredentials[0]);

        // lookUpCredentials gets a credentials object based off of
        // serializedConfiguration string.
        // The credentials object is just the unserialized configuration string
        // but with the "unsafe" keys like password. These object is never
        // shared outside of this app or machine.
        const requestedCredentials = lookUpCredentials(configuration);
        assert.deepEqual(requestedCredentials, mockCredentials[0]);
    });

    it('returns null if credentials weren\'t found', function() {
        saveCredential(mockCredentials[0]);

        const configuration = merge(mockCredentials[0], {dialect: 'mariahdb'});

        const requestedCredentials = lookUpCredentials(configuration);
        assert.equal(null, requestedCredentials);
    });
});
