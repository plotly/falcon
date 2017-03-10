import {
    PlotlyAPIRequest
} from '../../backend/persistent/PlotlyAPI.js';
import {dissoc, merge} from 'ramda';

export const names = [
    'country', 'month', 'year', 'lat', 'lon', 'value'
];
export const columns = [
    ['a', 'b', 'c'],    // 'country'
    [1, 2, 3],          // 'month'
    [4, 5, 6],          // 'year'
    [7, 8, 9],           // 'lat'
    [10, 11, 12],       // 'lon'
    [13, 14, 15]        // 'value'
];

// test account on prod
export const username = 'plotly-database-connector';
export const apiKey = 'reiptow6gu';

// This fid with these UIDs actually exist on prod
export const validFid = 'plotly-database-connector:197';
export const validUids = ['d5d91e', '89d77e', '45b645', 'a7011b', '7cf34b', '881702', '442fd5', 'f5993c', '6d6a67', 'c3246c', 'eac785', '3c3ca8', '7ce7d7', 'f8cd7a', 'e52820', '0a91cc', 'c7dd62', 'b84d17', 'a6c128', 'ae9094'];

export function createGrid(filename) {
    const cols = {};
    names.forEach((name, i) => {
        cols[name] = {'data': columns[i], order: i};
    });
    const grid = {cols};
    return PlotlyAPIRequest('grids', {
        method: 'POST',
        username,
        apiKey,
        body: {
            data: grid,
            world_readable: true,
            parent: -1,
            filename: `${filename} - ${Math.random().toString(36).substr(2, 5)}`
        }
    });
}

export const sqlConnections = {
    username: 'masteruser',
    password: 'connecttoplotly',
    database: 'plotly_datasets',
    port: 5432,
    host: 'readonly-test-postgres.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
    dialect: 'postgres'
};

export const postgresConnection = sqlConnections;
export const postgisConnection = merge(
    postgresConnection, {database: 'postgis'}
);
export const mysqlConnection = {
    dialect: 'mysql',
    username: 'masteruser',
    password: 'connecttoplotly',
    host: 'readonly-test-mysql.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
    port: 3306,
    database: 'plotly_datasets'
};
export const mariadbConnection = {
    dialect: 'mariadb',
    username: 'masteruser',
    password: 'connecttoplotly',
    host: 'readonly-test-mariadb.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
    port: 3306,
    database: 'plotly_datasets'
};
export const redshiftConnection = {
    dialect: 'redshift',
    username: 'plotly',
    password: 'Qmbdf#3DU]pP8a=CKTK}',
    host: 'sql-connector-test.cfiaqtidutxu.us-east-1.redshift.amazonaws.com',
    port: 5439,
    database: 'plotly_datasets'
};
export const mssqlConnection = {
    dialect: 'mssql',
    username: 'masteruser',
    password: 'connecttoplotly',
    host: 'test-mssql.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
    port: 1433,
    database: 'plotly_datasets'
};
export const elasticsearchConnections = {
    dialect: 'elasticsearch',
    host: 'https://67a7441549120daa2dbeef8ac4f5bb2e.us-east-1.aws.found.io',
    port: '9243'
};
export const publicReadableS3Connections = {
    dialect: 's3',
    bucket: 'plotly-s3-connector-test',
    accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
    secretAccessKey: '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'
};
export const apacheDrillConnections = {
    dialect: 'apache drill',
    host: 'http://ec2-35-164-71-216.us-west-2.compute.amazonaws.com',
    port: 8047,

    bucket: 'plotly-s3-connector-test',
    accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
    secretAccessKey: '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'
};
export const sqliteConnection = {
    dialect: 'sqlite',
    storage: `${__dirname}/plotly_datasets.db`
};

// TODO - Add sqlite here
// TODO - Add postgis in here

export const testConnections = [
    postgresConnection,
    mysqlConnection,
    mariadbConnection,
    redshiftConnection,
    mssqlConnection,
    sqliteConnection,
    elasticsearchConnections,
    publicReadableS3Connections,
    apacheDrillConnections
];

export const testSqlConnections = [
    postgresConnection,
    mysqlConnection,
    mariadbConnection,
    redshiftConnection,
    mssqlConnection
];

export const configuration = dissoc('password', sqlConnections);

export const apacheDrillStorage = [
  {
    'name': 'cp',
    'config': {
      'type': 'file',
      'enabled': false,
      'connection': 'classpath:\/\/\/',
      'config': null,
      'workspaces': null,
      'formats': {
        'csv': {
          'type': 'text',
          'extensions': [
            'csv'
          ],
          'delimiter': ','
        },
        'tsv': {
          'type': 'text',
          'extensions': [
            'tsv'
          ],
          'delimiter': '\t'
        },
        'json': {
          'type': 'json',
          'extensions': [
            'json'
          ]
        },
        'parquet': {
          'type': 'parquet'
        },
        'avro': {
          'type': 'avro'
        },
        'csvh': {
          'type': 'text',
          'extensions': [
            'csvh'
          ],
          'extractHeader': true,
          'delimiter': ','
        }
      }
    }
  },
  {
    'name': 'dfs',
    'config': {
      'type': 'file',
      'enabled': false,
      'connection': 'file:\/\/\/',
      'config': null,
      'workspaces': {
        'root': {
          'location': '\/',
          'writable': false,
          'defaultInputFormat': null
        },
        'tmp': {
          'location': '\/tmp',
          'writable': true,
          'defaultInputFormat': null
        }
      },
      'formats': {
        'psv': {
          'type': 'text',
          'extensions': [
            'tbl'
          ],
          'delimiter': '|'
        },
        'csv': {
          'type': 'text',
          'extensions': [
            'csv'
          ],
          'delimiter': ','
        },
        'tsv': {
          'type': 'text',
          'extensions': [
            'tsv'
          ],
          'delimiter': '\t'
        },
        'parquet': {
          'type': 'parquet'
        },
        'json': {
          'type': 'json',
          'extensions': [
            'json'
          ]
        },
        'avro': {
          'type': 'avro'
        },
        'sequencefile': {
          'type': 'sequencefile',
          'extensions': [
            'seq'
          ]
        },
        'csvh': {
          'type': 'text',
          'extensions': [
            'csvh'
          ],
          'extractHeader': true,
          'delimiter': ','
        }
      }
    }
  },
  {
    'name': 'hbase',
    'config': {
      'type': 'hbase',
      'config': {
        'hbase.zookeeper.quorum': 'localhost',
        'hbase.zookeeper.property.clientPort': '2181'
      },
      'size.calculator.enabled': false,
      'enabled': false
    }
  },
  {
    'name': 'hive',
    'config': {
      'type': 'hive',
      'enabled': false,
      'configProps': {
        'hive.metastore.uris': '',
        'javax.jdo.option.ConnectionURL': 'jdbc:derby:;databaseName=..\/sample-data\/drill_hive_db;create=true',
        'hive.metastore.warehouse.dir': '\/tmp\/drill_hive_wh',
        'fs.default.name': 'file:\/\/\/',
        'hive.metastore.sasl.enabled': 'false'
      }
    }
  },
  {
    'name': 'kudu',
    'config': {
      'type': 'kudu',
      'masterAddresses': '1.2.3.4',
      'enabled': false
    }
  },
  {
    'name': 'mongo',
    'config': {
      'type': 'mongo',
      'connection': 'mongodb:\/\/localhost:27017\/',
      'enabled': false
    }
  },
  {
    'name': 's3',
    'config': {
      'type': 'file',
      'enabled': true,
      'connection': 's3a:\/\/plotly-s3-connector-test',
      'config': {
          'fs.s3a.access.key': 'AKIAIMHMSHTGARJYSKMQ',
          'fs.s3a.secret.key': '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'
      },
      'workspaces': {
        'root': {
          'location': '\/',
          'writable': true,
          'defaultInputFormat': null
        }
      },
      'formats': {
        'csv': {
          'type': 'text',
          'extensions': [
            'csv'
          ],
          'delimiter': ',',
          'extractHeader': true
        },
        'parquet': {
          'type': 'parquet'
        }
      }
    }
  }
];
