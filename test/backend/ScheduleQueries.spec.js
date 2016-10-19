import {expect, assert} from 'chai';
import chai from 'chai';
import spies from 'chai-spies';
chai.use(spies);

import fs from 'fs';
import {merge, dissoc} from 'ramda';

import QueryScheduler, {
    QUERY_FILE
} from '../../backend/persistent/QueryScheduler.js';

import {
    CREDENTIALS_FILE,
    lookUpCredentials
} from '../../backend/persistent/Credentials.js';

import {
    PlotlyAPIRequest,
    updateGrid
} from '../../backend/persistent/PlotlyAPI.js';

import {
    queryDatabase
} from '../../backend/persistent/Query.js';


const configuration = {
    'username': 'masteruser',
    'password': 'connecttoplotly',
    'database': 'plotly_datasets',
    'port': 5432,
    'host': 'readonly-test-postgres.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
    'dialect': 'postgres'
};

const names = [
    'country', 'month', 'year', 'lat', 'lon', 'value'
];
function createGrid(filename) {
    const columns = [
        ['a', 'b', 'c'],    // 'country'
        [1, 2, 3],          // 'month'
        [4, 5, 6],          // 'year'
        [7, 8, 9],           // 'lat'
        [10, 11, 12],       // 'lon'
        [13, 14, 15]        // 'value'

    ];
    const cols = {};
    names.forEach((name, i) => {
        cols[name] = {'data': columns[i], order: i};
    });
    const grid = {cols};
    return PlotlyAPIRequest('grids', {
        data: grid,
        world_readable: true,
        parent: -1,
        filename: `${filename} - ${Math.random().toString(36).substr(2, 5)}`
    });

}


describe('queryDatabase', function () {
    it('queries a database', function(done) {
        this.timeout(4 * 1000);
        queryDatabase(
            'SELECT * from ebola_2014 LIMIT 2',
            configuration
        ).then(results => {
            assert.deepEqual(results.rows, [
                ['Guinea', 3, 14, '9.95', '-9.7', '122'],
                ['Guinea', 4, 14, '9.95', '-9.7', '224']
            ]);
            assert.deepEqual(results.columnnames, [
                'country', 'month', 'year', 'lat', 'lon', 'value'
            ]);
            assert.deepEqual(results.ncols, 6);
            assert.deepEqual(results.nrows, 2);
            done();
        }).catch(done);
    });
});


describe('Grid API Functions', function () {
    it ('updateGrid overwrites a grid with new data', function (done) {
        this.timeout(15 * 1000);
        // First, create a new grid.
        // Note that the app never actually does this,
        // it works off of the assumption that a grid exists

        let fid;
        createGrid('Test updateGrid').then(json => {
            // Update the grid's data
            fid = json.file.fid;
            const uids = json.file.cols.map(col => col.uid);

            return updateGrid(
                [
                    ['x', 10, 40, 70, 100, 130],
                    ['y', 20, 50, 80, 110, 140],
                    ['z', 30, 60, 90, 120, 150]
                ],
                fid,
                uids
            );
        }).then(json => {
            const url = `grids/${fid}/content`;
            // Retrieve the contents from the grid
            return PlotlyAPIRequest(url, {}, 'GET');
        }).then(json => {
            // Test that the update worked
            assert.deepEqual(
                json.cols[names[0]].data,
                ['x', 'y', 'z']
            );
            assert.deepEqual(
                json.cols[names[1]].data,
                [10, 20, 30]
            );
            assert.deepEqual(
                json.cols[names[2]].data,
                [40, 50, 60]
            );
            assert.deepEqual(
                json.cols[names[3]].data,
                [70, 80, 90]
            );
            assert.deepEqual(
                json.cols[names[4]].data,
                [100, 110, 120]
            );
            assert.deepEqual(
                json.cols[names[5]].data,
                [130, 140, 150]
            );
            done();
        }).catch(done);

    });
});

describe('lookUpCredentials', function() {
    let mockCredentials;
    beforeEach(() => {
        try {
            fs.unlinkSync(CREDENTIALS_FILE);
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

        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(mockCredentials));

        // We index conections with just a JSON serialized version of the
        // credentials but *without* the password.
        // We assume that the rest of settings are safe enough to be passed
        // around the app.
        const serializedConfiguration = JSON.stringify(
            dissoc('password', mockCredentials[0])
        );

        // lookUpCredentials gets a credentials object based off of
        // serializedConfiguration string.
        // The credentials object is just the unserialized configuration string
        // but with the "unsafe" keys like password. These object is never
        // shared outside of this app or machine.
        const requestedCredentials = lookUpCredentials(serializedConfiguration);
        assert.deepEqual(requestedCredentials, mockCredentials[0]);
    });

    it('returns null if credentials weren\'t found', function() {
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(mockCredentials));
        const serializedConfiguration = JSON.stringify(
            merge(mockCredentials, {dialect: 'mariahdb'})
        );
        const requestedCredentials = lookUpCredentials(serializedConfiguration);
        assert.equal(null, requestedCredentials);
    });
});

describe('QueryScheduler', () => {
    let serializedConfiguration;

    beforeEach(() => {
        try {
            fs.unlinkSync(QUERY_FILE);
        } catch (e) {
        }
        serializedConfiguration = JSON.stringify({
            host: 'localhost',
            dialect: 'postgres',
            database: 'plotly_datasets'
        });
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
            serializedConfiguration
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
            serializedConfiguration
        };
        queryScheduler.scheduleQuery(queryObject);
        let queriesFromFile = queryScheduler._readQueries();
        assert.deepEqual(queriesFromFile, {
            [serializedConfiguration]: [queryObject]
        });

        const anotherQuery = merge(queryObject, {fid: 'new-fid'});
        queryScheduler.scheduleQuery(anotherQuery);
        queriesFromFile = queryScheduler._readQueries();
        assert.deepEqual(queriesFromFile, {[serializedConfiguration]:
            [queryObject, anotherQuery]
        });
    });

    it('queries a database and updates a plotly grid on an interval', function(done) {
        const refreshRate = 15 * 1000;
        this.timeout(120 * 1000);
        /*
         * Save the credentials to a file.
         * This is done by the UI or by the user.
        */
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify([configuration]));
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
                 query: 'SELECT * from ebola_2014 LIMIT 2',
                 serializedConfiguration: JSON.stringify(
                     dissoc('password', configuration)
                 )
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
