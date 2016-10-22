import chai, {expect, assert} from 'chai';
import spies from 'chai-spies';
chai.use(spies);

import fs from 'fs';
import {merge, dissoc} from 'ramda';

import QueryScheduler from '../../../backend/persistent/QueryScheduler.js';
import {
    QUERIES_PATH,
    CREDENTIALS_PATH
} from '../../../backend/utils/homeFiles.js';
import {saveCredential} from '../../../backend/persistent/Credentials.js';
import {getQueries} from '../../../backend/persistent/Queries.js';
import {
    PlotlyAPIRequest
} from '../../../backend/persistent/PlotlyAPI.js';
import {createGrid, names, credentials} from '../utils.js';

describe('QueryScheduler', () => {
    beforeEach(() => {
        try {
            fs.unlinkSync(QUERIES_PATH);
        } catch (e) {}
        try {
            fs.unlinkSync(CREDENTIALS_PATH);
        } catch (e) {}
    });

    it('executes a function on an interval', (done) => {
        const spy = chai.spy(() => {});
        const queryScheduler = new QueryScheduler(spy);

        const delay = 100;
        queryScheduler.scheduleQuery({
            refreshRate: delay,
            fid: '...',
            uids: '...',
            query: '...',
            credentialId: '...'
        });
        setTimeout(function() {
            expect(spy).to.have.been.called();
        }, delay + 1);
        setTimeout(function() {
            expect(spy).to.have.been.called.twice();
            done();
        }, delay * 3);
    });

    it('saves queries to file', () => {
        const queryScheduler = new QueryScheduler(() => {});

        const queryObject = {
            refreshRate: 1,
            fid: 'test-fid',
            uids: '',
            query: '',
            credentialId: 'unique-id'
        };
        queryScheduler.scheduleQuery(queryObject);
        let queriesFromFile = getQueries();
        assert.deepEqual(queriesFromFile, [queryObject]);

        const anotherQuery = merge(queryObject, {fid: 'new-fid'});
        queryScheduler.scheduleQuery(anotherQuery);
        queriesFromFile = getQueries();
        assert.deepEqual(queriesFromFile,
            [queryObject, anotherQuery]
        );
    });

    it('queries a database and updates a plotly grid on an interval', function(done) {
        const refreshRate = 15 * 1000;
        this.timeout(120 * 1000);

        /*
         * Save the credentials to a file.
         * This is done by the UI or by the user.
        */
        const credentialId = saveCredential(credentials);
        console.warn('getCredentials(): ', getCredentials());
        /*
         * Create a grid that we want to update with new data
         * Note that the scheduler doesn't ever actually create grids,
         * it only updates them
         */
         createGrid('test interval').then(json => {
             const fid = json.file.fid;
             const uids = json.file.cols.map(col => col.uid);

             const queryScheduler = new QueryScheduler();
             queryScheduler.scheduleQuery({
                 fid,
                 uids,
                 refreshRate,
                 credentialId,
                 query: 'SELECT * from ebola_2014 LIMIT 2'
             });

             /*
              * After 15 seconds, the scheduler will update the grid's contents.
              * Download the grid's contents and check.
              */
             setTimeout(() => {
                 PlotlyAPIRequest(`grids/${fid}/content`, {}, 'GET').then(json => {
                    assert.deepEqual(
                        json.cols[names[0]].data,
                        ['Guinea', 'Guinea']
                    );
                    assert.deepEqual(
                        json.cols[names[1]].data,
                        [3, 4]
                    );
                    assert.deepEqual(
                        json.cols[names[2]].data,
                        [14, 14]
                    );
                    assert.deepEqual(
                        json.cols[names[3]].data,
                        ['9.95', '9.95']
                    );
                    assert.deepEqual(
                        json.cols[names[4]].data,
                        ['-9.7', '-9.7']
                    );
                    assert.deepEqual(
                        json.cols[names[5]].data,
                        ['122', '224']
                    );
                    done();
                }).catch(done);
            }, 25 * 1000); // Give scheduleQuery an extra 10 seconds.

         }).catch(done);


    });

});
