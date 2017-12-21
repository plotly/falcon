/*
 * Mock functions return the hardcoded values without hitting any DB
 */

export function connect() {
  return new Promise();
}

export function tables(connection) {
    return new Promise((resolve, reject) => {
        resolve(['TABLE_A', 'TABLE_B', 'TABLE_C', 'TABLE_D']);
    });

}

export function query(queryString, connection) {

    return new Promise((resolve, reject) => {

        if (queryString === 'ERROR') {
            reject('Syntax Error in Query');
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

export function files(connection) {
    return new Promise((resolve, reject) => {
        resolve(['FILE_1', 'FILE_2', 'FILE_3']);
    });
}

export function elasticsearchMappings(connection) {
    return new Promise((resolve, reject) => {
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
