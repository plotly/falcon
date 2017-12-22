/*
 * Mock functions return the hardcoded values without hitting any DB
 */

export function connect() {
  return new Promise();
}

export function tables() {
    return new Promise((resolve) => {
        resolve(['TABLE_A', 'TABLE_B', 'TABLE_C', 'TABLE_D']);
    });

}

export function query(queryString) {

    return new Promise((resolve, reject) => {

        if (queryString === 'ERROR') {
            reject(new Error('Syntax Error in Query'));
        } else {
            resolve({
                'columnnames': ['COLUMN_A', 'COLUMN_B', 'COLUMN_C'],
                'rows': [
                    ['ROW_1', '1.112', '12'],
                    ['ROW_2', '2.2', '98'],
                    ['ROW_3', '3.12', '62']
                ]
            });
        }

    });
}

export function files() {
    return new Promise((resolve) => {
        resolve([
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
}

export function elasticsearchMappings() {
    return new Promise((resolve) => {
          resolve({
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
}

export function storage() {

    return new Promise((resolve) => {
        resolve([
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

}

// This is for Apache Drill:
export function listS3Files() {
  return new Promise((resolve) => {
      resolve([
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
}
