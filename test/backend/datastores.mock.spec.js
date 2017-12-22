import {assert} from 'chai';

import {sqlConnections as connection} from './utils.js';
import {
    query, tables, files, elasticsearchMappings, storage, listS3Files
} from '../../backend/persistent/datastores/Datastores.js';
import {saveSetting} from '../../backend/settings.js';

describe('Datastore Mock:', function () {
    before(() => {
        saveSetting('TEST_MODE', true);
    });

    it('tables returns list of hardcoded tables', function() {
        return tables(connection).then(result => {
            assert.deepEqual(result, ['TABLE_A', 'TABLE_B', 'TABLE_C', 'TABLE_D']);
        });
    });

    it('query returns hardcoded results', function() {
        return query('SELECT * FROM  TABLE_A LIMIT 5', connection).then(results => {
            assert.deepEqual(results.rows, [
                ['ROW_1', '1.112', '12'],
                ['ROW_2', '2.2', '98'],
                ['ROW_3', '3.12', '62']
            ]);
            assert.deepEqual(results.columnnames, ['COLUMN_A', 'COLUMN_B', 'COLUMN_C']);
        });
    });

    it('query returns error when required', function() {
        return query('ERROR', connection).catch(err => {
            assert.equal(err, 'Error: Syntax Error in Query');
        });
    });

    it('S3 files endpoint returns hardcoded filenames', function() {
        return files(connection).then(result => {
            assert.deepEqual(result, [
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
        return elasticsearchMappings(connection).then(result => {
            assert.deepEqual(result, {
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
        return storage(connection).then(result => {
            assert.deepEqual(result, [
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
        return listS3Files(connection).then(result => {
            assert.deepEqual(result, [
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
