import {assert} from 'chai';
import {assoc} from 'ramda';
import fs from 'fs';

import * as Connections from '../../backend/persistent/Connections.js';
import {getSetting} from '../../backend/settings.js';

describe('Connections', function () {

    beforeEach(function() {
        const connectionsPath = getSetting('CONNECTIONS_PATH');
        try {
            fs.unlinkSync(connectionsPath);
        } catch (e) {}
    });

    it('saveConnection saves a connection', function() {
        assert.deepEqual(
            Connections.getConnections(),
            [],
            'connections are empty'
        );
        const connectionObject = {
            dialect: 'postgres'
        };
        const connectionId = Connections.saveConnection(connectionObject);
        assert.deepEqual(
            Connections.getConnections(),
            [assoc('id', connectionId, connectionObject)],
            'connection was saved'
        );
    });
});
