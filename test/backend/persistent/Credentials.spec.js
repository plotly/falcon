import {expect, assert} from 'chai';
import fs from 'fs';
import {merge, dissoc} from 'ramda';

import {CREDENTIALS_PATH} from '../../../backend/utils/homeFiles.js';
import {
    saveConnection
} from '../../../backend/persistent/Connections.js';

describe('lookUpConnections', function() {
    let mockConnections;
    beforeEach(() => {
        try {
            fs.unlinkSync(CREDENTIALS_PATH);
        } catch (e) {}

        mockConnections = [
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
