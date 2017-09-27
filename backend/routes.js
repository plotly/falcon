var restify = require('restify');
var CookieParser = require('restify-cookies');
import * as Datastores from './persistent/datastores/Datastores.js';
import * as fs from 'fs';
import os from 'os';
import path from 'path';
import webContents from 'electron';

import {PlotlyOAuth} from './plugins/authorization.js'
import {getQueries, getQuery, deleteQuery} from './persistent/Queries';
import {
    deleteConnectionById,
    editConnectionById,
    getConnectionById,
    getSanitizedConnections,
    getSanitizedConnectionById,
    lookUpConnections,
    saveConnection,
    validateConnection,
    sanitize
} from './persistent/Connections.js';
import QueryScheduler from './persistent/QueryScheduler.js';
import {getSetting, saveSetting} from './settings.js';
import {generateAndSaveAccessToken} from './utils/authUtils';
import {checkWritePermissions, newDatacache} from './persistent/PlotlyAPI.js';
import {contains, has, keys, isEmpty, merge, pluck} from 'ramda';
import {getCerts, timeoutFetchAndSaveCerts, setRenewalJob} from './certificates';
import Logger from './logger';
import fetch from 'node-fetch';

export default class Servers {
    /*
     * Returns an object {httpServer, httpsServer}
     * The httpServer is always open for oauth.
     * The httpsServer starts when certificates have been created.
     */
    constructor(args = {createCerts: true, startHttps: true}) {
        this.httpServer = {
            port: null,
            server: null,
            protocol: null,
            domain: null
        };
        this.httpsServer = {
            certs: null,
            port: null,
            server: null,
            protocol: null,
            domain: null
        };

        /*
         * `args` is of form {protocol: 'HTTP', createCerts: true}
         * `args` is used to control whether we want to start the server initiall as http or
         * https and whether we want to create certs if none found if started as http.
         * It's main use is to control the flow during tests.
         */
        this.apiVersion = '1.0.0';

        // Always start the HTTP server and keep it running.
        this.httpServer.port = parseInt(getSetting('PORT'), 10);
        this.httpServer.server = restify.createServer({version: this.apiVersion});
        this.httpServer.protocol = 'http';
        this.httpServer.domain = 'localhost';

        if (args.startHttps && !getSetting('IS_RUNNING_INSIDE_ON_PREM')) {
            // Create certs if necessary when we have an approved user.
            if (args.createCerts && isEmpty(getCerts())) {
                const createCertificates = setInterval(() => {
                    /*
                     * Can't create until user was authenticated.
                     * We wait until the user was authenticated in case
                     * the user is logging in to their on-prem server.
                     * In that case, we need to make sure that we have the
                     * appropriate CORS domain of the on-prem server before
                     * we start up the HTTPS server.
                     *
                     */
                    if (!isEmpty(getSetting('USERS'))) {
                        clearInterval(createCertificates);
                        timeoutFetchAndSaveCerts();
                    }
                }, 500);
            }
            const startHTTPS = setInterval(() => {
                if (!isEmpty(getCerts())) {
                    clearInterval(startHTTPS);
                    this.httpsServer.start();
                }
            }, 500);
        }

        this.queryScheduler = new QueryScheduler();

        this.httpServer.start = this.start.bind(this);
        this.httpsServer.start = this.startHttpsServer.bind(this);
        this.httpsServer.restart = this.restartHttpsServer.bind(this);

        this.httpServer.close = this.close.bind(this);
        this.httpsServer.close = this.closeHttpsServer.bind(this);
    }

    startHttpsServer() {
        Logger.log('Starting HTTPS server');
        // Reference the new certs into the instance.
        this.httpsServer.certs = getCerts();
        this.httpsServer.port = parseInt(getSetting('PORT_HTTPS'), 10);
        setRenewalJob({server: this.httpsServer});
        this.httpsServer.protocol = 'https';
        // Create a new server and attach it to the class instance.
        this.httpsServer.server = restify.createServer(merge(
            {version: this.httpsServer.apiVersion}, this.httpsServer.certs)
        );
        this.httpsServer.domain = getSetting('CONNECTOR_HTTPS_DOMAIN');
        this.start('https');
    }

    restartHttpsServer() {
        Logger.log('Restarting HTTPS server.');
        this.httpsServer.close();
        setTimeout(() => {
            this.httpsServer.start();
        }, 1000);
    }

    start(type = 'http') {
        const that = this;
        const restifyServer = type === 'https' ? that.httpsServer : that.httpServer;
        const {server} = restifyServer;

        that.electronWindow = that.httpsServer.electronWindow || that.httpServer.electronWindow;

        server.use(CookieParser.parse);
        server.use(PlotlyOAuth(that.electronWindow));

        server.use(restify.queryParser());
        server.use(restify.bodyParser({mapParams: true}));
        server.pre(function (request, response, next) {
            Logger.log(`Request: ${request.href()}`, 2);
            next();
        });

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
            origins: getSetting('CORS_ALLOWED_ORIGINS'),
            credentials: true,
            headers: headers
        }));
        headers.forEach(header => restify.CORS.ALLOW_HEADERS.push(header));
        Logger.log('CORS_ALLOWED_ORIGINS: ' + JSON.stringify(
            getSetting('CORS_ALLOWED_ORIGINS')
        ), 2);
        server.opts( /.*/, function (req, res) {
            res.header(
                'Access-Control-Allow-Headers',
                restify.CORS.ALLOW_HEADERS.join( ', ' )
            );
            res.header(
                'Access-Control-Allow-Methods',
                'PATCH, POST, GET, DELETE, OPTIONS'
            );
            res.send(204);
        });

        const {protocol, domain, port} = restifyServer;
        Logger.log(`Listening at: ${protocol}://${domain}:${port}`);
        server.listen(port);

        server.get(/\/static\/?.*/, restify.serveStatic({
            directory: `${__dirname}/../`
        }));

        server.get(/\/images\/?.*/, restify.serveStatic({
            directory: `${__dirname}/../app/`
        }));

        server.get(/\/oauth2\/?$/, restify.serveStatic({
            directory: `${__dirname}/../static`,
            file: 'index.html'
        }));

        /*
         * Endpoints around the settings from settings.js as needed.
         * Each setting is a resource.
         * Careful if you want to serve USERS - it contains oauth tokens which
         * shouldn't be served to the front-end.
         */
        server.get('/settings', function serveSettings(req, res, next) {
            const sanitizedUsers = pluck('username', getSetting('USERS'));

            /*
             * Some of the settings the front-end needs.
             * Not serving all of them by default in case there are sensitive
             * settings that shouldn't be served in the on-prem context
             */
            const filteredSettings = {
                USERS: sanitizedUsers,
                PLOTLY_URL: getSetting('PLOTLY_URL')
            };

            return res.json(200, filteredSettings)
        });

        // Patch on /settings does a merge
        server.patch('/settings', function mergeSettings(req, res, next) {
            const partialSettings = req.params;
            keys(partialSettings).forEach(settingName =>
                saveSetting(settingName, partialSettings[settingName])
            );
            return res.json(200, {});
        });

        // TODO - urls isn't actually a setting, it's more of a config
        server.get('/settings/urls', function settings(req, res, next) {
            const {httpServer, httpsServer} = that;
            const HTTP_URL = `${httpServer.protocol}://${httpServer.domain}:${httpServer.port}`;
            const HTTPS_URL = httpsServer.domain
                ? `${httpsServer.protocol}://${httpsServer.domain}:${httpsServer.port}`
                : '';
            res.json(200, {http: HTTP_URL, https: HTTPS_URL});
        });

        server.post(/\/oauth2\/?$/, function saveOauth(req, res, next) {
            const {access_token} = req.params;
            Logger.log(`Checking token ${access_token} against ${getSetting('PLOTLY_API_URL')}/v2/users/current`);
            fetch(`${getSetting('PLOTLY_API_URL')}/v2/users/current`, {
                headers: {'Authorization': `Bearer ${access_token}`}
            })
            .then(userRes => userRes.json().then(userMeta => {
                if (userRes.status === 200) {
                    const {username} = userMeta;
                    if (!username) {
                        res.json(500, {error: {message: `User was not found at ${getSetting('PLOTLY_API_URL')}`}});
                        return;
                    }
                    const existingUsers = getSetting('USERS');
                    const existingUsernames = pluck('username', existingUsers);
                    let status;
                    if (contains(username, existingUsernames)) {
                        existingUsers[
                            existingUsernames.indexOf(username)
                        ].accessToken = access_token;
                        status = 200;
                    } else {
                        existingUsers.push({username, accessToken: access_token});
                        status = 201;
                    }
                    saveSetting('USERS', existingUsers);

                    res.setCookie('plotly-auth-token', access_token, {'path': '/'});

                    const db_connector_access_token = generateAndSaveAccessToken();
                    res.setCookie('db-connector-auth-token', db_connector_access_token, {'maxAge': 300, 'path': '/'});
                    res.setCookie('db-connector-user', username, {'path': '/'});

                    if (that.electronWindow) {

                        that.electronWindow.loadURL(`${protocol}://${domain}:${port}/`);
                        that.electronWindow.webContents.on('did-finish-load', () => {
                            that.electronWindow.webContents.send('username', username);
                        });

                    }
                    res.json(status, {});
                } else {
                    Logger.log(userMeta, 0);
                    res.json(500, {error: {message: `Error ${userRes.status} fetching user`}});
                }
            }))
            .catch(err => {
                Logger.log(err, 0);
                res.json(500, {error: {message: err.message}});
            });
        });

        // Keeping the base route to have backwards compatibility.
        server.get('/', restify.serveStatic({
            directory: `${__dirname}/../static`,
            file: 'index.html'
        }));

        server.post('/logout', function logoutHandler(req, res, next) {
            req.logout();
            res.redirect('/', next);
        });

        server.get('/login', restify.serveStatic({
            directory: `${__dirname}/../static`,
            file: 'index.html'
        }));

        server.get('/status', function statusHandler(req, res, next) {
            res.send('Connector status - running and available for requests.');
        });

        server.get('/ping', function pingHandler(req, res, next) {
            res.json(200, {message: 'pong'});
        });

        // Hidden URL to test uncaught exceptions
        server.post('/_throw', function throwHandler(req, res, next) {
            throw new Error('Yikes - uncaught error');
        });

        // Validate then save connections to a file
        server.post('/connections', function postDatastoresHandler(req, res, next) {
            /*
             * Check if the connection already exists
             * If it does, prevent overwriting so that IDs
             * that might be saved on other servers that refer
             * to this exact same connection doesn't get
             * overwritten.
             * Can update a connection with a `patch` to `/connections/:connectionId`
             */
            const connectionsOnFile = lookUpConnections(
                /*
                 * Remove the password field since the front-end might not
                 * supply a password if it originally loaded up these creds
                 * via `GET /connections`.
                 */
                sanitize(req.params)
            );
            if (connectionsOnFile) {
                res.send(409, {connectionId: connectionsOnFile.id});
                return;
            } else {

                // Check that the connections are valid
                const connectionObject = req.params;
                validateConnection(req.params).then(validation => {
                    if (isEmpty(validation)) {
                        res.json(200, {connectionId: saveConnection(req.params)});
                        return;
                    } else {
                        Logger.log(validation, 2);
                        res.json(400, {error: {message: validation.message}
                        });
                        return;
                    }
                }).catch(err => {
                    Logger.log(err, 2);
                    res.json(400, {error: {message: err.message}
                    });
                });
            }
        });

        // return sanitized connections
        server.get('/connections', function getDatastoresHandler(req, res, next) {
            res.json(200, getSanitizedConnections());
        });

        /*
         * return a single connection by id
         * ids are assigned by the server on connection save
         */
        server.get('/connections/:id', function getDatastoresIdHandler(req, res, next) {
            const connection = getSanitizedConnectionById(req.params.id);
            if (connection) {
                res.json(200, connection);
            } else {
                res.json(404, {});
            }
        });

        server.put('/connections/:id', (req, res, next) => {
            const connectionExists = getSanitizedConnectionById(req.params.id);
            if (!connectionExists) {
                res.json(404, {});
                return;
            }
            // continue knowing that the id exists already
            validateConnection(req.params).then(validation => {
                if (isEmpty(validation)) {
                    res.json(200, editConnectionById(req.params));
                } else {
                    Logger.log(validation, 2);
                    res.json(400, {error: validation.message});
                }
            }).catch(err => {
                Logger.log(err, 2);
                res.json(400, {error: err.message});
            });
        });

        // delete connections
        // TODO - delete all associated queries?
        server.del('/connections/:id', function delDatastoresHandler(req, res, next) {
            if (getSanitizedConnectionById(req.params.id)) {
                deleteConnectionById(req.params.id);
                res.json(200, {});
            } else {
                res.json(404, {});
            }
        });

        /* Connect */
        server.post('/connections/:connectionId/connect', function postConnectHandler(req, res, next) {
            Datastores.connect(getConnectionById(req.params.connectionId))
            .then(() => {
                res.json(200, {});
            });
        });

        /* One-Shot Queries */

        // Make a query and return the results as a grid
        server.post('/connections/:connectionId/query', function postQueryHandler(req, res, next) {
            Datastores.query(
                req.params.query,
                getConnectionById(req.params.connectionId)
            ).then(rows => {
                res.json(200, rows);
                next();
            }).catch(error => {
                res.json(400, {error: {message: error.message}});
            });
        });

        /*
         * Dialect-specific endpoints.
         *
         * The convention here is for the dialect to take the first part of the URL
         * with SQL-like dialects are grouped together as `sql`.
         * Multiple words are separated by hyphens instead of camelCased or
         * underscored.
         */
        server.post('/connections/:connectionId/sql-tables', function tablesHandler(req, res, next) {
            Datastores.tables(
                getConnectionById(req.params.connectionId)
            ).then(tables => {
                res.json(200, tables);
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
            });
        });

        server.post('/connections/:connectionId/sql-schemas', function schemasHandler(req, res, next) {
            Datastores.schemas(
                getConnectionById(req.params.connectionId)
            ).then(schemas => {
                res.json(200, schemas);
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
            });
        });

        server.post('/connections/:connectionId/s3-keys', function s3KeysHandler(req, res, next) {
            Datastores.files(
                getConnectionById(req.params.connectionId)
            ).then(files => {
                res.json(200, files);
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
            });
        });

        server.post('/connections/:connectionId/apache-drill-storage', function apacheDrillStorageHandler(req, res, next) {
            Datastores.storage(
                getConnectionById(req.params.connectionId)
            ).then(files => {
                res.json(200, files);
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
            });
        });

        server.post('/connections/:connectionId/apache-drill-s3-keys', function apacheDrills3KeysHandler(req, res, next) {
            Datastores.listS3Files(
                getConnectionById(req.params.connectionId)
            ).then(files => {
                res.json(200, files);
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
            });
        });

        server.post('/connections/:connectionId/elasticsearch-mappings', function elasticsearchMappingsHandler(req, res, next) {
            Datastores.elasticsearchMappings(
                getConnectionById(req.params.connectionId)
            ).then(mappings => {
                res.json(200, mappings);
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
            });
        });

        /* Plotly v2 API requests */

        server.post('/datacache', function getDatacacheHandler(req, res, next) {

            const {payload, type} = req.params;

            if (type !== 'csv') {
                const datacacheResp = newDatacache(payload, type);
                datacacheResp.then(plotlyRes => plotlyRes.json().then(resJSON => {
                    return res.json(plotlyRes.status, resJSON);
                })).catch(err => {
                    throw new Error(err);
                });
            }
            else {
                const rand = Math.round(Math.random()*1000).toString();
                const downloadPath = path.join(getSetting('STORAGE_PATH'), `data_export_${rand}.csv`);
                fs.writeFile(downloadPath, payload, (err) => {
                    if (err){
                        return res.json({type: 'error', message: err});
                    }
                    return res.json({
                        type: 'csv', url: 'file:///'.concat(downloadPath)
                    });
                });
            }
        });

        /* Persistent Datastores */

        // return the list of registered queries
        server.get('/queries', function getQueriesHandler(req, res, next) {
            res.json(200, getQueries());
        });

        server.get('/queries/:fid', function getQueriesFidHandler(req, res, next) {
            const query = getQuery(req.params.fid);
            if (query) {
                res.json(200, query);
            } else {
                res.json(404, {});
            }
        });

        // register or overwrite a query
        /*
         * TODO - Updating a query should be a PATCH or PUT under
         * the endpoint `/queries/:fid`
         */
        server.post('/queries', function postQueriesHandler(req, res, next) {
            // Make the query and update the user's grid
            const {fid, uids, query, connectionId, requestor} = req.params;

            // Check that the user has permission to edit the grid

            checkWritePermissions(fid, requestor)
            .then(function nowQueryAndUpdateGrid() {
                return that.queryScheduler.queryAndUpdateGrid(
                    fid, uids, query, connectionId, requestor
                );
            })
            .then(function returnSuccess() {
                let status;
                if (getQuery(req.params.fid)) {
                    // TODO - Technically, this should be
                    // under the endpoint `/queries/:fid`
                    status = 200;
                } else {
                    status = 201;
                }
                that.queryScheduler.scheduleQuery(req.params);
                res.json(status, {});
            })
            .catch(function returnError(error) {
                Logger.log(error, 0);
                res.json(400, {error: {message: error.message}});
            });

        });

        // delete a query
        server.del('/queries/:fid', function delQueriesHandler(req, res, next) {
            const {fid} = req.params;
            if (getQuery(fid)) {
                deleteQuery(fid);
                /*
                 * NOTE - return 200 instead of 204 here
                 * so that we can respond with an empty body
                 * which makes front-end generic API handlers
                 * a little easier to write
                 */
                res.json(200, {});
            } else {
                res.json(404, {});
            }
        });

        // Transform restify's error messages into our standard error object
        server.on('uncaughtException', function uncaughtExceptionHandler(req, res, route, err) {
            /*
             * TODO - This custom error handler causes an unhandled rejection error
             * "Can't set headers after they are sent" which gets fired after
             * uncaughtException responses.
             * It doesn't seem to affect the actual API responses (they are tested).
             * I haven't been able to track it down succcessfully.
             * It might be related to the CORS OPTIONS requests that get preceed
             * these requests.
             */
            if (err.message.indexOf("Can't set headers after they are sent") === -1) {
                Logger.log(err);
            }
            res.json(500, {
                error: {message: err.message}
            });
        });
    }

    closeHttpsServer() {
        const that = this;
        that.close('https');
    }

    close(type = 'http') {
        Logger.log(`Closing the ${type} server.`);
        const that = this;
        const restifyServer = type === 'https' ? that.httpsServer : that.httpServer;
        const {server} = restifyServer;
        server.close();
    }
}
