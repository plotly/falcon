import {assert} from 'chai';

import {saveSetting} from '../../backend/settings.js';

import {
    assertResponseStatus,
    closeTestServers,
    createTestServers,
    getResponseJson,
    POST
} from './utils.js';


let servers;
let storagePath;

const connectionId = 'postgres-189ebfb4-e1b4-446c-9b83-b326875fa2d8';

describe('Datastore Mock:', function () {
    beforeEach(() => {
        servers = createTestServers();
        storagePath = process.env.PLOTLY_CONNECTOR_STORAGE_PATH;
        process.env.PLOTLY_CONNECTOR_STORAGE_PATH = 'mock-storage';
        saveSetting('AUTH_ENABLED', false);
    });

    afterEach(() => {
        return closeTestServers(servers).then(() => {
            process.env.PLOTLY_CONNECTOR_STORAGE_PATH = storagePath;
        });
    });

    it('tables returns list of hardcoded tables', function() {
        return POST(`connections/${connectionId}/sql-tables`)
        .then(assertResponseStatus(200)).then(getResponseJson)
        .then(json => {
            assert.deepEqual(json, ['TABLE_A', 'TABLE_B', 'TABLE_C', 'TABLE_D']);
        });
    });

    it('query returns hardcoded results', function() {
        return POST(`connections/${connectionId}/query`, {query: ''})
        .then(assertResponseStatus(200)).then(getResponseJson)
        .then(json => {
            assert.deepEqual(json.rows, [
                ['ROW_1', '1.112', '12'],
                ['ROW_2', '2.2', '98'],
                ['ROW_3', '3.12', '62']
            ]);
            assert.deepEqual(json.columnnames, ['COLUMN_A', 'COLUMN_B', 'COLUMN_C']);
        });
    });

    it('query returns error when required', function() {
        return POST(`connections/${connectionId}/query`, {query: 'ERROR'})
        .then(assertResponseStatus(400)).then(getResponseJson)
        .then(err => {
            assert.deepEqual(err, {
              error: {message: 'Syntax Error in Query'}
            });
        });
    });

    it('S3 files endpoint returns hardcoded filenames', function() {
        return POST(`connections/${connectionId}/s3-keys`)
        .then(assertResponseStatus(200)).then(getResponseJson)
        .then(json => {
            assert.deepEqual(json, [
                {
                    'Key': 'A.csv',
                    'LastModified': '2016-10-09T17:29:49.000Z',
                    'ETag': '\'635633cb59c369da25fdf7bd6cc8de62\'',
                    'Size': 151650,
                    'StorageClass': 'STANDARD',
                    'Owner': {
                        'DisplayName': 'chris',
                        'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                    }
                 },
                 {
                     'Key': 'B.csv',
                     'LastModified': '2016-10-09T17:29:49.000Z',
                     'ETag': '\'635633cb59c369da25fdf7bd6cc8de62\'',
                     'Size': 151650,
                     'StorageClass': 'STANDARD',
                     'Owner': {
                         'DisplayName': 'chris',
                         'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                     }
                 }
            ]);
        });
    });

    it('Elasticsearch mock mappings are returned', function() {
        return POST(`connections/${connectionId}/elasticsearch-mappings`)
        .then(assertResponseStatus(200)).then(getResponseJson)
        .then(json => {
            assert.deepEqual(json, {
                'test-mappings': {
                    'mappings': {
                        'TABLE_A': {
                            'properties': {
                                'COLUMN_A': {'type': 'string'},
                                'COLUMN_B': {'type': 'float'},
                                'COLUMN_C': {'type': 'integer'}
                            }
                        },
                        'TABLE_B': {
                            'properties': {
                                'COLUMN_M': {'type': 'string'},
                                'COLUMN_N': {'type': 'float'},
                                'COLUMN_O': {'type': 'integer'}
                            }
                        }
                    }
                }
            });
        });
    });

    it('Apache Drill mock config is returned', function() {
        return POST(`connections/${connectionId}/apache-drill-storage`)
        .then(assertResponseStatus(200)).then(getResponseJson)
        .then(json => {
            assert.deepEqual(json, [
                {
                    'name': 's3',
                    'config': {
                        'type': 'file',
                        'enabled': true,
                        'connection': 's3a://plotly-s3-connector-test',
                        'config': {
                            'fs.s3a.access.key': 'ABCD',
                            'fs.s3a.secret.key': 'MNOP'
                        },
                        'workspaces': {
                            'root': {
                                'location': '/',
                                'writable': true,
                                'defaultInputFormat': null
                            }
                        },
                        'formats': {'parquet': {'type': 'parquet'}}
                    }
                }
            ]);
        });
    });

    it('Apache Drill mock parquet files are returned', function() {
        return POST(`connections/${connectionId}/apache-drill-s3-keys`)
        .then(assertResponseStatus(200)).then(getResponseJson)
        .then(json => {
            assert.deepEqual(json, [
                {
                    'Key': 'A.parquet',
                    'LastModified': '2016-10-09T17:29:49.000Z',
                    'ETag': '\'635633cb59c369da25fdf7bd6cc8de62\'',
                    'Size': 151650,
                    'StorageClass': 'STANDARD',
                    'Owner': {
                        'DisplayName': 'chris',
                        'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                    }
                 },
                 {
                     'Key': 'B.parquet',
                     'LastModified': '2016-10-09T17:29:49.000Z',
                     'ETag': '\'635633cb59c369da25fdf7bd6cc8de62\'',
                     'Size': 151650,
                     'StorageClass': 'STANDARD',
                     'Owner': {
                         'DisplayName': 'chris',
                         'ID': '655b5b49d59fe8784105e397058bf0f410579195145a701c03b55f10920bc67a'
                     }
                 }
            ]);
        });
    });
});
