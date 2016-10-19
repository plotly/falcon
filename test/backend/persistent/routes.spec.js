import fetch from 'node-fetch';
import assert from 'assert';
import Server from '../../../backend/persistent/routes.js';
import {saveCredential} from '../../../backend/persistent/Credentials.js';
import {
    CREDENTIALS_PATH
} from '../../../backend/utils/homeFiles.js';
import fs from 'fs';
import {credentials, configuration} from '../utils.js';

let server;
describe('Server', function () {
    beforeEach(() => {
        server = new Server();
        server.start();

        // Save some credentials to the user's disk
        try {
            fs.unlinkSync(CREDENTIALS_PATH);
        } catch (e) {}
        saveCredential(credentials);
    });

    afterEach(() => {
        server.close();
    });

    it ('responds on a ping', function(done) {
        fetch('http://localhost:9000/ping')
        .then(() => done())
        .catch(done);
    });

    it('runs a query', function(done) {
        fetch('http://localhost:9000/query', {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                configuration,
                query: 'SELECT * FROM ebola_2014 LIMIT 1'
            })
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


});
