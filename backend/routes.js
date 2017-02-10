var restify = require('restify');
import * as Datastores from './persistent/datastores/Datastores.js';
import * as fs from 'fs';

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
import {checkWritePermissions} from './persistent/PlotlyAPI.js';
import {contains, has, keys, isEmpty, merge, pluck} from 'ramda';
import {getCerts, fetchAndSaveCerts, setRenewalJob} from './certificates';
import Logger from './logger';
import fetch from 'node-fetch';

const HOSTS = '/etc/hosts';

export default class Server {
    constructor(args = {createCerts: true}) {
        this.certs = getCerts();
        /*
         * If server is given a protocol argument, enforce it,
         * otherwise decide which protocol to use
         * depending if there are certificates. This is mainly
         * used in tests.
        */
        const apiVersion = '1.0.0';
        this.apiVersion = apiVersion;
        this.port = parseInt(getSetting('PORT'), 10);
        if (args.protocol === 'HTTP' || isEmpty(this.certs)) {
            this.server = restify.createServer({version: apiVersion});
            this.protocol = 'http';
            this.domain = 'localhost';
            if (args.createCerts) {
                const createCertificates = setInterval(() => {
                    if (!isEmpty(getSetting('USERS'))) {
                        clearInterval(createCertificates);
                        fetchAndSaveCerts();
                    }
                }, 2000);
            }
            const restartAsHTTPS = setInterval(() => {
                if (!isEmpty(getCerts())) {
                    clearInterval(restartAsHTTPS);
                    this.restartWithSSL();
                }
            }, 2000);
        } else if (args.protocol || !isEmpty(this.certs)) {
            setRenewalJob();
            this.server = restify.createServer(merge({version: apiVersion}, this.certs));
            this.protocol = 'https';
            // TODO: Need to find better names for these or simplify them into one.
            this.domain = getSetting('CONNECTOR_HOST_INFO').host || getSetting('CONNECTOR_HTTPS_DOMAIN');
        } else {
            Logger.log('Failed to start the server.');
        }

        this.queryScheduler = new QueryScheduler();

        this.start = this.start.bind(this);
        this.close = this.close.bind(this);
    }

    restartWithSSL() {
        // We have certs, thus we have a user, we can thus close the HTTP server.
        this.close();
        // Reference the new certs into the instance.;
        this.certs = getCerts();
        // Start the interval to renew the certifications in 24 days.
        setRenewalJob();
        // Create a new server and attach it to the class instance.
        this.server = restify.createServer(merge(
            {version: this.apiVersion}, this.certs)
        );
        this.protocol = 'https';
        this.domain = getSetting('CONNECTOR_HOST_INFO').host || getSetting('CONNECTOR_HTTPS_DOMAIN');
        this.start();
    }

    start() {
        const that = this;
        const server = this.server;

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
        server.opts( /.*/, function (req, res) {
            res.header(
                'Access-Control-Allow-Headers',
                restify.CORS.ALLOW_HEADERS.join( ', ' )
            );
            res.header(
                'Access-Control-Allow-Methods',
                'POST, GET, DELETE, OPTIONS'
            );
            res.send(204);
        });

        /*
         * For some reason restartWithSSL() is triggered twice even if I
         * properly delete the interval that is calling it ... TODO: investigate.
         * For now a workaround is to catch the error when in use.
         * There is nothing else besides the app that starts the server so
         * there should be no real conflict or need to debug other in use
         */
        server.on('error', (e) => {
            if (e.code == 'EADDRINUSE') {
                console.log('The app is already running or your port is busy. ' +
                'If you think the case is the latter, kill the process and ' +
                'make sure the port is free.');
            }
        });
        console.log(`Listening at: ${this.protocol}://${this.domain}:${this.port}`);
        server.listen(this.port);

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

        server.get(/\/setup\/?$/, restify.serveStatic({
            directory: `${__dirname}/../static`,
            file: 'setup.html'
        }));

        server.post(/\/hasauth\/?$/, function hasAuth(req, res, next) {
            const users = getSetting('USERS');
            const allUserNames = pluck('username', users);
            res.json(200, {hasAuth: contains(req.params.username, allUserNames)});
        });

        server.post(/\/oauth2\/token\/?$/, function saveOauth(req, res, next) {
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

        server.get('/', restify.serveStatic({
            directory: `${__dirname}/../static`,
            file: 'index.html'
        }));

        server.get('/status', function statusHandler(req, res, next) {
            // TODO - Maybe fix up this copy
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

        // TODO - This endpoint is untested
        server.get('has-certs', (req, res, next) => {
            if (isEmpty(getCerts())) {
                res.json(200, false);
            } else {
                res.json(200, true);
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

    close() {
        this.server.close();
    }
}
