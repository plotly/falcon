const fetch = require('node-fetch');
import {contains, equals, filter, keys, isEmpty, merge, pluck, propEq, reject} from 'ramda';
const restify = require('restify');
const CookieParser = require('restify-cookies');

import * as fs from 'fs';
import path from 'path';

import {PlotlyOAuth} from './plugins/authorization.js';
import {generateAndSaveAccessToken} from './utils/authUtils.js';
import {
    getAccessTokenCookieOptions,
    getCookieOptions,
    getUnsecuredCookieOptions
} from './constants.js';
import {getCerts, timeoutFetchAndSaveCerts, setRenewalJob} from './certificates.js';
import * as Datastores from './persistent/datastores/Datastores.js';
import init from './init.js';
import Logger from './logger.js';
import {checkWritePermissions, newDatacache} from './persistent/plotly-api.js';
import {getQueries, getQuery, deleteQuery, saveQuery, updateQuery} from './persistent/Queries.js';
import {getTags, getTag, saveTag, deleteTag} from './persistent/Tags.js';
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
import { EXE_STATUS } from '../shared/constants.js';


export default class Servers {
    /*
     * Returns an object {httpServer, httpsServer}
     * The httpServer is always open for oauth.
     * The httpsServer starts when certificates have been created.
     */
    constructor(args = {createCerts: true, startHttps: true, isElectron: false}) {
        init();

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
        this.isElectron = args.isElectron;

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

        if (args.startHttps && !getSetting('IS_RUNNING_INSIDE_ON_PREM') && this.isElectron) {
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

        this.httpServer.close = function() {
            Logger.log('Closing the http server.');
            const server = this.httpServer.server;
            server.close.apply(server, arguments);
        }.bind(this);

        this.httpsServer.close = function() {
            Logger.log('Closing the https server.');
            const server = this.httpsServer.server;
            server.close.apply(server, arguments);
        }.bind(this);
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

        server.pre(function (req, res, next) {
            res.header(
                'X-Frame-Options',
                'DENY'
            );
            next();
        });

        server.use(CookieParser.parse);
        server.use(PlotlyOAuth(Boolean(that.isElectron)));

        server.use(restify.queryParser());
        server.use(restify.bodyParser({mapParams: true}));
        server.pre(function (request, response, next) {
            const href = request.href();
            const skip =
                href.startsWith('/settings/urls') ||
                href.startsWith('/static') ||
                href.startsWith('/images');
            if (!skip) Logger.log(`Request: ${href}`, 2);
            next();
        });
        server.use(function (request, response, next) {
            const href = request.href();
            const skip =
                href.startsWith('/settings/urls') ||
                href.startsWith('/static') ||
                href.startsWith('/images');
            if (!skip) Logger.log(`Response: ${href}`, 2);
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
        server.opts(/.*/, function (req, res) {
            res.header(
                'Access-Control-Allow-Headers',
                restify.CORS.ALLOW_HEADERS.join(', ')
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

        server.get(/\/oauth2\/callback\/?$/, restify.serveStatic({
            directory: `${__dirname}/../static`,
            file: 'oauth.html'
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

            res.json(200, filteredSettings);
            return next();
        });

        // Patch on /settings does a merge
        server.patch('/settings', function mergeSettings(req, res, next) {
            const partialSettings = req.params;
            keys(partialSettings).forEach(settingName =>
                saveSetting(settingName, partialSettings[settingName])
            );
            res.json(200, {});
            return next();
        });

        // TODO - urls isn't actually a setting, it's more of a config
        server.get('/settings/urls', function settings(req, res, next) {
            const {httpServer, httpsServer} = that;
            const HTTP_URL = `${httpServer.protocol}://${httpServer.domain}:${httpServer.port}`;
            const HTTPS_URL = httpsServer.domain
                ? `${httpsServer.protocol}://${httpsServer.domain}:${httpsServer.port}`
                : '';
            res.json(200, {http: HTTP_URL, https: HTTPS_URL});
            return next();
        });

        server.post(/\/oauth2\/?$/, function saveOauth(req, res, next) {
            const {access_token} = req.params;
            Logger.log(`Checking token ${access_token} against ${getSetting('PLOTLY_API_URL')}/v2/users/current`);
            fetch(`${getSetting('PLOTLY_API_URL')}/v2/users/current`, {
                headers: {'Authorization': `Bearer ${access_token}`}
            })
            .then(userRes => {
                if (userRes.status !== 200) {
                    return userRes.text().then(body => {
                        const errorMessage = `Error fetching user. Status: ${userRes.status}. Body: ${body}.`;
                        Logger.log(errorMessage, 0);
                        res.json(500, {error: {message: errorMessage}});
                        return next();
                    });
                }

                return userRes.json().then(userMeta => {
                    const {username} = userMeta;
                    if (!username) {
                        res.json(500, {error: {message: `User was not found at ${getSetting('PLOTLY_API_URL')}`}});
                        return next();
                    }

                    /*
                     * Allow users access to app if any one of the following conditions apply:
                     * 1. username is present in `ALLOWED_USERS` setting.
                     * 2. The app is running locally (as electron-app).
                     * 3. Authentication is disabled.
                     * 4. The app is running on-premise.
                     */
                    if (contains(username, getSetting('ALLOWED_USERS')) || that.isElectron ||
                        !getSetting('AUTH_ENABLED') || getSetting('IS_RUNNING_INSIDE_ON_PREM')) {
                        res.setCookie('plotly-auth-token', access_token, getCookieOptions());

                        const db_connector_access_token = generateAndSaveAccessToken();
                        res.setCookie('db-connector-auth-token',
                                      db_connector_access_token,
                                      getAccessTokenCookieOptions());
                        res.setCookie('db-connector-user', username, getUnsecuredCookieOptions());

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

                        if (getSetting('IS_RUNNING_INSIDE_ON_PREM') &&
                            !contains(username, getSetting('ALLOWED_USERS'))) {

                            // Add user to ALLOWED_USERS:
                            const allowedUsers = getSetting('ALLOWED_USERS');
                            allowedUsers.push(username);
                            saveSetting('ALLOWED_USERS', allowedUsers);
                        }
                        if (that.isElectron) {
                            /*
                             * This part is handled separately for electron-app
                             * because electron apps does not support cookies
                             * like browsers do.
                             */
                            that.electronWindow.loadURL(`${protocol}://${domain}:${port}/`);
                            that.electronWindow.webContents.on('did-finish-load', () => {
                                that.electronWindow.webContents.send('username', username);
                            });
                        }
                        res.json(status, {});
                        return next();
                    }
                    res.json(403, {error: {message: `User ${username} is not allowed to view this app`}});
                    return next();
                })
                .catch(err => {
                    Logger.log(err, 0);
                    res.json(500, {error: {message: err.message}});
                    return next();
                });
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
            return next();
        });

        server.get('/ping', function pingHandler(req, res, next) {
            res.json(200, {message: 'pong'});
            return next();
        });

        // Hidden URL to test uncaught exceptions
        server.post('/_throw', function throwHandler() {
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
                res.json(409, {connectionId: connectionsOnFile.id});
                return next();
            }

            // Check that the connections are valid
            validateConnection(req.params).then(validation => {
                if (isEmpty(validation)) {
                    res.json(200, {connectionId: saveConnection(req.params)});
                    return next();
                }

                Logger.log(validation, 2);
                res.json(400, {
                    error: {message: validation.message}
                });
                return next();
            }).catch(err => {
                Logger.log(err, 2);
                res.json(400, {
                    error: {message: err.message}
                });
                return next();
            });
        });

        // return sanitized connections
        server.get('/connections', function getDatastoresHandler(req, res, next) {
            res.json(200, getSanitizedConnections());
            return next();
        });

        /*
         * return a single connection by id
         * ids are assigned by the server on connection save
         */
        server.get('/connections/:id', function getDatastoresIdHandler(req, res, next) {
            const connection = getSanitizedConnectionById(req.params.id);
            if (connection) {
                res.json(200, connection);
                return next();
            }
            res.json(404, {});
            return next();
        });

        server.put('/connections/:id', (req, res, next) => {
            const connectionExists = getSanitizedConnectionById(req.params.id);
            if (!connectionExists) {
                res.json(404, {});
                return next();
            }
            // continue knowing that the id exists already
            validateConnection(req.params).then(validation => {
                if (isEmpty(validation)) {
                    res.json(200, editConnectionById(req.params));
                    return next();
                }
                Logger.log(validation, 2);
                res.json(400, {error: {message: validation.message}});
                return next();
            }).catch(err => {
                Logger.log(err, 2);
                res.json(400, {error: {message: err.message}});
                return next();
            });
        });

        // delete connections
        // TODO - delete all associated queries?
        server.del('/connections/:id', function delDatastoresHandler(req, res, next) {
            if (getSanitizedConnectionById(req.params.id)) {
                deleteConnectionById(req.params.id);
                res.json(200, {});
                return next();
            }
            res.json(404, {});
            return next();
        });

        /* Connect */
        server.post('/connections/:connectionId/connect', function postConnectHandler(req, res, next) {
            Datastores.connect(getConnectionById(req.params.connectionId))
            .then(() => {
                res.json(200, {});
                return next();
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
                return next();
            }).catch(error => {
                res.json(400, {error: {message: error.message}});
                return next();
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
                return next();
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
                return next();
            });
        });

        server.post('/connections/:connectionId/sql-schemas', function schemasHandler(req, res, next) {
            Datastores.schemas(
                getConnectionById(req.params.connectionId)
            ).then(schemas => {
                res.json(200, schemas);
                return next();
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
                return next();
            });
        });

        server.post('/connections/:connectionId/s3-keys', function s3KeysHandler(req, res, next) {
            Datastores.files(
                getConnectionById(req.params.connectionId)
            ).then(files => {
                res.json(200, files);
                return next();
            }).catch(error => {
                res.json(500, {error: {message: error.message}});
                return next();
            });
        });

        server.post('/connections/:connectionId/apache-drill-storage',
            function apacheDrillStorageHandler(req, res, next) {
                Datastores.storage(
                    getConnectionById(req.params.connectionId)
                ).then(files => {
                    res.json(200, files);
                    return next();
                }).catch(error => {
                    res.json(500, {error: {message: error.message}});
                    return next();
                });
            });

        server.post('/connections/:connectionId/apache-drill-s3-keys',
            function apacheDrills3KeysHandler(req, res, next) {
                Datastores.listS3Files(
                    getConnectionById(req.params.connectionId)
                ).then(files => {
                    res.json(200, files);
                    return next();
                }).catch(error => {
                    res.json(500, {error: {message: error.message}});
                    return next();
                });
            });

        server.post('/connections/:connectionId/elasticsearch-mappings',
            function elasticsearchMappingsHandler(req, res, next) {
                Datastores.elasticsearchMappings(
                    getConnectionById(req.params.connectionId)
                ).then(mappings => {
                    res.json(200, mappings);
                    return next();
                }).catch(error => {
                    res.json(500, {error: {message: error.message}});
                    return next();
                });
            });

        /* Plotly v2 API requests */

        server.post('/datacache', function getDatacacheHandler(req, res, next) {
            const {payload, requestor, type: contentType} = req.params;

            if (contentType !== 'csv') {
                const datacacheResp = newDatacache(payload, contentType, requestor);
                datacacheResp.then(json => {
                    res.json(200, json);
                    return next();
                }).catch(error => {
                    res.json(500, {error: {message: error.message}});
                    return next();
                });
            }
            else {
                const rand = Math.round(Math.random() * 1000).toString();
                const downloadPath = path.resolve(
                    path.join(getSetting('STORAGE_PATH'), `data_export_${rand}.csv`)
                );
                fs.writeFile(downloadPath, payload, (err) => {
                    if (err) {
                        res.json({type: 'error', message: err});
                        return next();
                    }
                    res.json({type: 'csv', url: 'file://'.concat(downloadPath)});
                    return next();
                });
            }
        });

        /* Persistent Datastores */
        // get all tags
        server.get('/tags', function getTagsHandler(req, res, next) {
            res.json(200, getTags());
            return next();
        });

        // register a tag
        server.post('/tags', function postTagsHandler(req, res, next) {
            const HEX_CODE_REGEX = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
            const MAX_TAG_LENGTH = 30;

            const {
                name,
                color
            } = req.params;

            if (!name || !color) {
                res.json(400, {error: {message: 'Tags must have name and color parameters.'}});
                return next();
            } else if (name.length > MAX_TAG_LENGTH) {
                res.json(400, {error: {message: `Tag name must be less than ${MAX_TAG_LENGTH} characters.`}});
                return next();
            } else if (!HEX_CODE_REGEX.test(color)) {
                res.json(400, {error: {message: 'Tag color must be a valid hex code.'}});
                return next();
            }

            const existingTags = getTags();
            const duplicateTags = filter(propEq('name', name), existingTags);
            if (duplicateTags.length) {
                res.json(400, {error: {message: 'A tag with that name already exists'}});
                return next();
            }

            const createdTag = saveTag({name, color});
            res.json(201, createdTag);
            return next();
        });

        // delete a tag
        server.del('/tags/:id', function deleteTagHandler(req, res, next) {
            const {
                id
            } = req.params;

            if (!getTag(id)) {
                res.json(404, {});
                return next();
            }

            deleteTag(id);
            const queries = getQueries();
            queries.forEach(query => {
                if (query.tags) {
                    deleteQuery(query.fid);
                    query.tags = reject(equals(id), query.tags);
                    saveQuery(query);
                }
            });

            res.json(200, {});
            return next();
        });

        // return the list of registered queries
        server.get('/queries', function getQueriesHandler(req, res, next) {
            res.json(200, getQueries());
            return next();
        });

        server.get('/queries/:fid', function getQueriesFidHandler(req, res, next) {
            const query = getQuery(req.params.fid);
            if (query) {
                res.json(200, query);
                return next();
            }
            res.json(404, {});
            return next();
        });

        // register/update a query (and create/update a grid)
        /*
         * TODO - Updating a query should be a PATCH or PUT under
         * the endpoint `/queries/:fid`
         */
        server.post('/queries', function postQueriesHandler(req, res, next) {
            const {
                filename,
                fid,
                query,
                connectionId,
                requestor,
                cronInterval = null,
                refreshInterval = null
            } = req.params;

            // If a filename has been provided,
            // make the query and create a new grid
            if (filename) {
                return that.queryScheduler.queryAndCreateGrid(
                    filename, query, connectionId, requestor, cronInterval, refreshInterval
                )
                .then((executionRes) => {
                    const { completedAt, duration, rowCount, uids } = executionRes.queryResults;
                    const queryObject = {
                        ...req.params,
                        fid: executionRes.fid,
                        uids,
                        lastExecution: {
                            status: EXE_STATUS.ok,
                            completedAt,
                            duration,
                            rowCount
                        }
                    };
                    that.queryScheduler.scheduleQuery(queryObject);
                    res.json(201, queryObject);
                    return next();
                })
                .catch(onError);
            }

            // If a grid fid has been provided,
            // check the user has permission to edit,
            // make the query and update the grid
            if (fid) {
                return checkWritePermissions(fid, requestor).then(function () {
                    // if query already exists, make sure it's status is correctly set while
                    // executing
                    if (getQuery(fid)) {
                        updateQuery(fid, {lastExecution: {status: EXE_STATUS.running}});
                    }

                    return that.queryScheduler.queryAndUpdateGrid(
                        fid, query, connectionId, requestor, cronInterval, refreshInterval
                    );
                })
                .then((executionRes) => {
                    const { completedAt, duration, rowCount, uids } = executionRes.queryResults;
                    const previousQuery = getQuery(req.params.fid);

                    let status;
                    if (previousQuery) {
                        // TODO - Technically, this should be
                        // under the endpoint `/queries/:fid`
                        status = 200;
                    } else {
                        status = 201;
                    }

                    let oldParamsToCarryOver = {};
                    if (previousQuery) {
                        const {name, tags} = previousQuery;
                        oldParamsToCarryOver = {name, tags};
                    }

                    const queryObject = {
                        ...oldParamsToCarryOver,
                        ...req.params,
                        uids,
                        lastExecution: {
                            status: EXE_STATUS.ok,
                            completedAt,
                            duration,
                            rowCount
                        }
                    };

                    that.queryScheduler.scheduleQuery(queryObject);
                    res.json(status, queryObject);
                    return next();
                })
                .catch((err) => {
                    if (getQuery(req.params.fid)) {
                        updateQuery(req.params.fid, {
                            lastExecution: {
                                status: EXE_STATUS.failed,
                                completedAt: Date.now(),
                                errorMessage: err.toString()
                            }
                        });
                    }

                    throw err;
                })
                .catch(onError);
            }

            return onError(new Error('Bad request'));

            function onError(error) {
                Logger.log(error, 0);
                res.json(400, {error: {message: error.message}});
                return next();
            }
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
                return next();
            }
            res.json(404, {});
            return next();
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
}
