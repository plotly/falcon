const fs = require('fs');

const fetchCookie = require('fetch-cookie');

const nodeFetch = require('node-fetch');
let fetch = fetchCookie(nodeFetch);

const restify = require('restify');

import {dissoc, merge} from 'ramda';

import {newGrid} from '../../backend/persistent/plotly-api.js';
import Servers from '../../backend/routes.js';
import {getSetting, saveSetting} from '../../backend/settings.js';

// Helper functions
export function clearCookies() {
    fetch = fetchCookie(nodeFetch);
}

export function GET(path) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

export function PATCH(path, body = {}) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'PATCH',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

export function POST(path, body = {}) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

export function PUT(path, body = {}) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    });
}

export function DELETE(path) {
    return fetch(`http://localhost:9494/${path}`, {
        method: 'DELETE',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    });
}

// Returns a function to be used in a Promise chain that asserts a response status
export function assertResponseStatus(expectedStatus) {
    // create error here to preserve caller stack trace
    const statusError = new Error();

    return function(response) {
        if (response.status !== expectedStatus) {
            return response.text().then(body => {
                statusError.message = `Expected status: ${expectedStatus}. Status: ${response.status}. Body: ${body}.`;
                throw statusError;
            });
        }

        return response;
    };
}

// Parse a fetch response as JSON; in case of failure include status and body in the error message
export function getResponseJson(response) {
    // create error here to preserve caller stack trace
    const jsonError = new Error();

    return response.text().then(text => {
        try {
            return JSON.parse(text);
        } catch (err) {
            jsonError.message = `${err.message}. Status: ${response.status}. Body: ${text}.`;
            throw jsonError;
        }
    });
}

// Returns a Promise that resolves after a timeout
export function wait(milliseconds) {
    return new Promise(function(resolve) {
        setTimeout(resolve, milliseconds);
    });
}

// Helper functions for settings
export function clearSettings(...settingKeys) {
    settingKeys.forEach(key => {
        const settingPath = getSetting(key);
        try {
            fs.unlinkSync(settingPath);
        } catch (e) {
            // empty intentionally
        }
    });
}

// test account on prod
export const username = 'plotly-database-connector';
export const apiKey = 'ccJMY9txxWhRRMWNLgOT';
/*
 * This is a real live access token associated with
 * the user account plotly-database-connector on
 * https://plot.ly.
 *
 * Follow the below steps, if you ever need to regenerate the access token:
 * - rm -rf ~/.plotly/connector
 * - yarn run start
 * - Add a connector (e.g. DB2)
 * - Click on the tab Plot.ly
 * - Click on Login into Plot.ly
 * - Login as username 'plotly-database-connector`
 * - Once authorized, the access token can be found in the file ~/.plotly/connector/settings.yaml
 */
export const accessToken = 'JxQPZSVFLVjEn93dOCgmYikDGS2FKc';

// This fid with these UIDs actually exist on prod
export const validFid = 'plotly-database-connector:197';
export const validUids = ['d5d91e', '89d77e', '45b645', 'a7011b', '7cf34b', '881702', '442fd5', 'f5993c', '6d6a67',
    'c3246c', 'eac785', '3c3ca8', '7ce7d7', 'f8cd7a', 'e52820', '0a91cc', 'c7dd62', 'b84d17', 'a6c128', 'ae9094'];


// Helper function to initialise a grid for testing
export const names = [
    'country', 'month', 'year', 'lat', 'lon', 'value'
];

export const columns = [
    ['a', 'b', 'c'], // 'country'
    [1, 2, 3], // 'month'
    [4, 5, 6], // 'year'
    [7, 8, 9], // 'lat'
    [10, 11, 12], // 'lon'
    [13, 14, 15] // 'value'
];

export const rows = [
    ['a', 1, 4, 7, 10, 13],
    ['b', 2, 5, 8, 11, 14],
    ['c', 3, 6, 9, 12, 15]
];

export function initGrid(filename) {
    const uniqueFilename = `${filename} - ${Math.random().toString(36).substr(2, 5)}`;

    return newGrid(uniqueFilename, names, rows, username);
}


// Helper functions for Servers
export function createTestServers() {
    const servers = new Servers({createCerts: false, startHttps: false, isElectron: false});
    servers.httpServer.start();

    // cleanup
    clearSettings('CONNECTIONS_PATH', 'QUERIES_PATH', 'TAGS_PATH', 'SETTINGS_PATH');

    // enable authentication:
    saveSetting('AUTH_ENABLED', true);
    saveSetting('USERS', [{
        username, apiKey
    }]);
    saveSetting('ALLOWED_USERS', [username]);
    saveSetting('SSL_ENABLED', false);

    // ensure fetch starts with no cookies
    clearCookies();

    return servers;
}

export function closeTestServers(servers) {
    // await for HTTP and HTTPS to close
    return new Promise(function(resolve) {
        if (!servers) {
            resolve();
            return;
        }

        servers.httpServer.close(function() {
            if (servers.httpsServer.server) servers.httpsServer.close(resolve);
            else resolve();
        });
    })
    // and clear all queries
    .then(() => {
        servers.queryScheduler.clearQueries();
    });
}

export const sqlConnections = {
    username: 'masteruser',
    password: 'connecttoplotly',
    database: 'plotly_datasets',
    port: 5432,
    host: 'falcon-test-postgres.c52asitjzpsx.us-east-1.rds.amazonaws.com',
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
    host: 'falcon-test-mysql.c52asitjzpsx.us-east-1.rds.amazonaws.com',
    port: 3306,
    database: 'plotly_datasets'
};
export const mariadbConnection = {
    dialect: 'mariadb',
    username: 'masteruser',
    password: 'connecttoplotly',
    host: 'mariadb-test-mysql.c52asitjzpsx.us-east-1.rds.amazonaws.com',
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
    host: 'falcon-test-mssql.c52asitjzpsx.us-east-1.rds.amazonaws.com',
    instanceName: '',
    port: 1433,
    database: 'plotly_datasets',
    encrypt: true
};
export const elasticsearchConnections = {
    dialect: 'elasticsearch',
    host: 'https://67a7441549120daa2dbeef8ac4f5bb2e.us-east-1.aws.found.io',
    port: '9243'
};
export const publicReadableS3Connections = {
    dialect: 's3',
    bucket: 'falcon-s3-connector-test',
    accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
    secretAccessKey: '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'
};
export const apacheDrillConnections = {
    dialect: 'apache drill',
    host: 'http://ec2-35-164-71-216.us-west-2.compute.amazonaws.com',
    port: 8047,

    bucket: 'falcon-s3-connector-test',
    accessKeyId: 'AKIAIMHMSHTGARJYSKMQ',
    secretAccessKey: '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'
};
export const sqliteConnection = {
    dialect: 'sqlite',
    storage: `${__dirname}/plotly_datasets.db`
};
export const apacheImpalaConnection = {
    dialect: 'apache impala',
    host: 'impala.test.plotly.host',
    port: 21000,
    database: 'plotly'
};
export const dataWorldConnection = {
    url: 'https://data.world/falcon/test-dataset',
    token: 'token'
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
//    publicReadableS3Connections,
//    apacheDrillConnections,
    apacheImpalaConnection
];

export const testSqlConnections = [
    postgresConnection,
    mysqlConnection,
    mariadbConnection,
    redshiftConnection,
    mssqlConnection,
    apacheImpalaConnection
];

export const configuration = dissoc('password', sqlConnections);

export const testCA = 'plotly-connector.com';

/* eslint-disable max-len */
export const fakeCerts = {
    cert: '-----BEGIN CERTIFICATE-----\nMIIFRTCCBC2gAwIBAgITAPpCGyiQ154TUPvOCsyTixXOszANBgkqhkiG9w0BAQsF\nADAiMSAwHgYDVQQDDBdGYWtlIExFIEludGVybWVkaWF0ZSBYMTAeFw0xNzAyMDQx\nOTU2MDBaFw0xNzA1MDUxOTU2MDBaMEsxSTBHBgNVBAMTQHBsb3RseS0tMzNmZmJh\nMGYtZmMwMi00ZjQxLWEzMzgtZDVmNWZmLnBsb3RseS1jb25uZWN0b3ItdGVzdC5j\nb20wggEiMA0GCSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDVDFclzHcfmuT9kemG\neYIpOXyljlMZWDRexHDffLeQb4BR5lUPUOnRhcV8fOmdRu1lEXeS0oA8FOh9vOVW\nbPBS/02gO4bto8xMGJgRlbwK37P/OW5+FiU6wnaJyowz1o8J8jMnb0GvO5YEIp0b\nAIIEsko/iaBWwmo2H0a3OZulu/4Pg7NaceI7SPw5e+YyJFfX7/xY5ASSHQ8CHGa4\nBmQ1HBB3Xk3DCWNeWezt2ZZmI9wwjIPiolVZfbu6KbklNUbkHBHcNYLV0yDCKmB4\nTU/hVEHLkLffhGGX+QCWh+LJpv+uir7+Wu7+kUwt43CBlKb7chbtLgxE/O69HuU8\nRmmXAgMBAAGjggJJMIICRTAOBgNVHQ8BAf8EBAMCBaAwHQYDVR0lBBYwFAYIKwYB\nBQUHAwEGCCsGAQUFBwMCMAwGA1UdEwEB/wQCMAAwHQYDVR0OBBYEFNjRpoJmFtY+\ntvTER2ioiqq8TdLXMB8GA1UdIwQYMBaAFMDMA0a5WCDMXHJw8+EuyyCm9Wg6MHgG\nCCsGAQUFBwEBBGwwajAzBggrBgEFBQcwAYYnaHR0cDovL29jc3Auc3RnLWludC14\nMS5sZXRzZW5jcnlwdC5vcmcvMDMGCCsGAQUFBzAChidodHRwOi8vY2VydC5zdGct\naW50LXgxLmxldHNlbmNyeXB0Lm9yZy8wSwYDVR0RBEQwQoJAcGxvdGx5LS0zM2Zm\nYmEwZi1mYzAyLTRmNDEtYTMzOC1kNWY1ZmYucGxvdGx5LWNvbm5lY3Rvci10ZXN0\nLmNvbTCB/gYDVR0gBIH2MIHzMAgGBmeBDAECATCB5gYLKwYBBAGC3xMBAQEwgdYw\nJgYIKwYBBQUHAgEWGmh0dHA6Ly9jcHMubGV0c2VuY3J5cHQub3JnMIGrBggrBgEF\nBQcCAjCBngyBm1RoaXMgQ2VydGlmaWNhdGUgbWF5IG9ubHkgYmUgcmVsaWVkIHVw\nb24gYnkgUmVseWluZyBQYXJ0aWVzIGFuZCBvbmx5IGluIGFjY29yZGFuY2Ugd2l0\naCB0aGUgQ2VydGlmaWNhdGUgUG9saWN5IGZvdW5kIGF0IGh0dHBzOi8vbGV0c2Vu\nY3J5cHQub3JnL3JlcG9zaXRvcnkvMA0GCSqGSIb3DQEBCwUAA4IBAQB/Jg0z8US8\nd6mC0mNTFgb0mf4Am1ERTWccj3/gpnFijoI2bl184v8+WbqVnOO19JSdDqMU9I0q\nES6rG9k6RYwo/nnifrBbJRo6xhE6s8TXzGMX8a0548CGi/FJiNQOs1aOxT9IVnOh\nK1fCEzxP7JpTO55z1FPmAat3tBJbNi7x6NsbQgA1TSmmwsrZ94tvO6hxMP3VFCxv\nOaI2dWa/YnB5F4sMyd9iwWPp4ZAoHr0e6jx0Mpi6ylTV1ifgThe1RN4YB/pQIsFO\nlgx8/Ca6Lqb9PDuLv0y9OEacYJGogW+79unKVoayjLtwTEWGW3s4ShqvApzgK8TZ\nL165U7oJJyBL\n-----END CERTIFICATE-----\n',
    key: '-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEA1QxXJcx3H5rk/ZHphnmCKTl8pY5TGVg0XsRw33y3kG+AUeZV\nD1Dp0YXFfHzpnUbtZRF3ktKAPBTofbzlVmzwUv9NoDuG7aPMTBiYEZW8Ct+z/zlu\nfhYlOsJ2icqMM9aPCfIzJ29BrzuWBCKdGwCCBLJKP4mgVsJqNh9Gtzmbpbv+D4Oz\nWnHiO0j8OXvmMiRX1+/8WOQEkh0PAhxmuAZkNRwQd15NwwljXlns7dmWZiPcMIyD\n4qJVWX27uim5JTVG5BwR3DWC1dMgwipgeE1P4VRBy5C334Rhl/kAlofiyab/roq+\n/lru/pFMLeNwgZSm+3IW7S4MRPzuvR7lPEZplwIDAQABAoIBAQDPJreZ5iwxy985\n+uUwvvbjdKURKMj+DLinKKSDeXXW98OyXp54TPl8o3B5cc+JAI0VR52XYhwTz1Sb\n5c6scTJf0SO+WAMDD9A2cXdzKb90Zz1SPZqE+K1sa+bsZchbIxVj218HyfL5Gpvs\nG2fc+GpzfJQbIYuIsHKre0+8GkSQKOtbg/V/19QkgIxNGtvtTfeYreo9E8s+7U7p\n1PSKe1aXuFEI0XgBBIGZLj8B7hm7bOH291eaBZ0xoiJCWadFw2SAQVoCiE7+aJQD\ny/ui7aDfBQHO+8xvlYNVa8SngScQyWB4OwsMI3vz12eRuH+AZS0Ys0emU92iOA6/\nTcboXF95AoGBAOut68Eacl+pu9I5p0ENwAP6AjtXOE76WAJ4Zh8MoE/6DfG4EQwX\nmyEf2vAjQgXDLWbdflmVcF6A68guwA4AXtrF9FSjymwYj53uEdkphON349v0ruyW\n3KSPoaIJ8Gl10wDL+zdXJ/blwvKVa0Y0aloBOo48rNOPOg2lXGulEpyLAoGBAOdq\n43UBNHq2lsZBzK2wxJSh9IHq4UWZ67qhgOdIWLV34wXGT2LugcjpiG58nC+z8yV6\nvetuljq18WSSZC2jl27CNboD1VzZDsbxGfLvFWnbtMMr3xWtH0za9uhUE2uMTYIv\n1kqB++DZ2ibDWMGkEAh1FEWc25CP2Kx5wwEg8wylAoGABshEhpQaQoKB8zTRiV+5\n7ONe+RIzfqJZsgiA99fHLUYG7LPdWbm8LyHZjRuWpM/PGKy7HBze1Plkz6f4wu5j\nzGvx8hWcl6vFRkg5n0RAnMMwfX33IrvcsaeogR9EGeTYI6e7HQaXEdXe3FhMdALC\nJMDwTHOWjagLhaUCmd5wQK0CgYEA4Yf8UMVx3b4gxurNjODfVHNaFVtRXEGbyPEo\n7T5GpeRG7hPMvn/vIFzoR7VNiff4GSi7+rx10JYMwZUh6JCsPpcrQTQHNkub6SqD\nvYxf9CDY0/TnnvpvrLkhNF7r5j6AM0Zns4lmbkYiIvDyiRVZQsTHkuhB22s1ITIx\nZ+IyvLkCgYEAtj45fqxTpLp0fa2M6+sO5olZz44Vjo8kFVqVsLkDiJKVj+dm3wGc\nIzkhL4Uh9Fw/OFgAj13qyD4xrKczO/tbyqS6/nBTya+9jM46MzJ8qAGBDPXHKqOt\nvL/55yfNkKvUSSAJux15rBvSUgb/vtz/raKwdNNNxdB3gaITUKQeeGM=\n-----END RSA PRIVATE KEY-----\n',
    subdomain: 'plotly--33ffba0f-fc02-4f41-a338-d5f5ff'
};
/* eslint-enable max-len */

export class MockedServerCA {

    constructor() {
        this.port = 9494;
        this.count = 0;
        this.server = restify.createServer({});

        this.countUp = this.countUp.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
    }

    countUp() {
        this.count += 1;
    }

    start(returnStatus, returnContent) {
        const that = this;
        const server = this.server;
        server.use(restify.queryParser());
        server.use(restify.bodyParser({mapParams: true}));

        /*
         * CORS doesn't quite work by default in restify,
         * see https://github.com/restify/node-restify/issues/664
         */
        const headers = [
            'authorization',
            'withcredentials',
            'x-requested-with',
            'x-forwarded-for',
            'x-real-ip',
            'x-customheader',
            'user-agent',
            'keep-alive',
            'host',
            'accept',
            'connection',
            'upgrade',
            'content-type',
            'dnt',
            'if-modified-since',
            'cache-control'
        ];
        server.use(restify.CORS({
            origins: ['*'],
            headers: headers
        }));
        headers.forEach(header => restify.CORS.ALLOW_HEADERS.push(header));
        server.opts(/.*/, function (req, res) {
            res.header(
                'Access-Control-Allow-Headers',
                restify.CORS.ALLOW_HEADERS.join(', ')
            );
            res.header(
                'Access-Control-Allow-Methods',
                'POST, GET, DELETE, OPTIONS'
            );
            res.send(204);
        });

        server.listen(this.port);

        server.post('/certificate', function pingHandler(req, res) {
            that.countUp();
            res.json(returnStatus, returnContent);
        });
    }

    stop() {
        const server = this.server;
        server.close();
    }
}


export const apacheDrillStorage = [
  {
    'name': 'cp',
    'config': {
      'type': 'file',
      'enabled': false,
      'connection': 'classpath:///',
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
      'connection': 'file:///',
      'config': null,
      'workspaces': {
        'root': {
          'location': '/',
          'writable': false,
          'defaultInputFormat': null
        },
        'tmp': {
          'location': '/tmp',
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
        'javax.jdo.option.ConnectionURL': 'jdbc:derby:;databaseName=../sample-data/drill_hive_db;create=true',
        'hive.metastore.warehouse.dir': '/tmp/drill_hive_wh',
        'fs.default.name': 'file:///',
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
      'connection': 'mongodb://localhost:27017/',
      'enabled': false
    }
  },
  {
    'name': 's3',
    'config': {
      'type': 'file',
      'enabled': true,
      'connection': 's3a://plotly-s3-connector-test',
      'config': {
          'fs.s3a.access.key': 'AKIAIMHMSHTGARJYSKMQ',
          'fs.s3a.secret.key': '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'
      },
      'workspaces': {
        'root': {
          'location': '/',
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

export const dataWorldTablesResponse = [
    {
        'fields': [
            {
                'name': 'tableId',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'tableName',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'tableTitle',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'tableDescription',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'owner',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'dataset',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            }
        ]
    },
    {
        'tableId': 'sampletable',
        'tableName': 'sampletable',
        'tableTitle': 'sampletable',
        'tableDescription': null,
        'owner': 'falcon',
        'dataset': 'sample-dataset'
    }
];

export const dataWorldQueryResponse = [
    {
        'fields': [
            {
                'name': 'stringcolumn',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'datecolumn',
                'type': 'date',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#date'
            },
            {
                'name': 'decimalcolumn',
                'type': 'decimal',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#decimal'
            }
        ]
    },
    {
        'stringcolumn': 'First column',
        'datecolumn': '2017-05-24',
        'decimalcolumn': 1
    },
    {
        'stringcolumn': 'Second column',
        'datecolumn': '2017-05-25',
        'decimalcolumn': 2
    },
    {
        'stringcolumn': 'Third column',
        'datecolumn': '2017-05-26',
        'decimalcolumn': 3
    },
    {
        'stringcolumn': 'Fourth column',
        'datecolumn': '2017-05-27',
        'decimalcolumn': 4
    },
    {
        'stringcolumn': 'Fifth column',
        'datecolumn': '2017-05-28',
        'decimalcolumn': 5
    }
];

export const dataWorldColumnsResponse = [
    {
        'fields': [
            {
                'name': 'tableId',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'tableName',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'columnIndex',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'columnName',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'columnTitle',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'columnDescription',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'columnDatatype',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'columnNullable',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'owner',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            },
            {
                'name': 'dataset',
                'type': 'string',
                'rdfType': 'http://www.w3.org/2001/XMLSchema#string'
            }
        ]
    },
    {
        'tableId': 'sampletable',
        'tableName': 'sampletable',
        'columnIndex': 1,
        'columnName': 'stringcolumn',
        'columnTitle': 'stringcolumn',
        'columnDescription': null,
        'columnDatatype': 'http://www.w3.org/2001/XMLSchema#string',
        'columnNullable': false,
        'owner': 'falcon',
        'dataset': 'test-dataset'
    },
    {
        'tableId': 'sampletable',
        'tableName': 'sampletable',
        'columnIndex': 2,
        'columnName': 'datecolumn',
        'columnTitle': 'datecolumn',
        'columnDescription': null,
        'columnDatatype': 'http://www.w3.org/2001/XMLSchema#date',
        'columnNullable': false,
        'owner': 'falcon',
        'dataset': 'test-dataset'
    },
    {
        'tableId': 'sampletable',
        'tableName': 'sampletable',
        'columnIndex': 3,
        'columnName': 'decimalcolumn',
        'columnTitle': 'decimalcolumn',
        'columnDescription': null,
        'columnDatatype': 'http://www.w3.org/2001/XMLSchema#decimal',
        'columnNullable': false,
        'owner': 'falcon',
        'dataset': 'test-dataset'
    }
];
