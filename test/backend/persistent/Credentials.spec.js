import {expect, assert} from 'chai';
import fs from 'fs';
import {merge, dissoc} from 'ramda';

import {CREDENTIALS_PATH} from '../../../backend/utils/homeFiles.js';
import {
    saveCredential
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
});
