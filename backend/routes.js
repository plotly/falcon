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
    saveConnection
} from './persistent/Connections.js';
import QueryScheduler from './persistent/QueryScheduler.js';
import {getSetting, saveSetting} from './settings.js';
import {checkWritePermissions} from './persistent/PlotlyAPI.js';
import {dissoc, contains, isEmpty, pluck} from 'ramda';
import Logger from './logger';
import fetch from 'node-fetch';

const HOSTS = '/etc/hosts';


// return HTTPS certs if they exist for a server to use when created or null
export function getCerts() {
    try {
        const keyFile = `${__dirname}/..${getSetting('KEY_FILE')}`;
        const certFile = `${__dirname}/..${getSetting('CSR_FILE')}`;
        return {
            key: fs.readFileSync(keyFile),
            certificate: fs.readFileSync(certFile)
        };
    } catch (e) {
        return {};
    }
}

export default class Server {
    constructor() {
        this.certs = getCerts();
        this.server = isEmpty(this.certs) ? restify.createServer() : restify.createServer(this.certs);
        this.domain = isEmpty(this.certs) ? 'localhost' : getSetting('CONNECTOR_HTTPS_DOMAIN');
        this.protocol = isEmpty(this.certs) ? 'http' : 'https';

        this.queryScheduler = new QueryScheduler();

        this.start = this.start.bind(this);
        this.close = this.close.bind(this);
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
            credentials: false,
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
        server.listen(
            parseInt(getSetting('PORT'), 10)
        );

        server.get(/\/static\/?.*/, restify.serveStatic({
            directory: `${__dirname}/../`
        }));
        server.get(/\/images\/?.*/, restify.serveStatic({
            directory: `${__dirname}/../app/`
        }));

        server.get('/oauth2/callback', restify.serveStatic({
            directory: `${__dirname}/../static`,
            file: 'oauth.html'
        }));

        server.post('/oauth2/token', function saveOauth(req, res, next) {
            const {access_token} = req.params;
            fetch(`${getSetting('PLOTLY_API_URL')}/v2/users/current`, {
                headers: {'Authorization': `Bearer ${access_token}`}
            })
            .then(userRes => userRes.json().then(userMeta => {
                if (userRes.status === 200) {
                    const {username} = userMeta;
                    if (!username) {
                        res.json(500, {error: {message: 'User was not found.'}});
                        return;
                    }
                    const existingUsers = getSetting('USERS');
                    const existingUsernames = pluck('username', existingUsers);
                    let status;
                    if (contains(username, existingUsernames)) {
                        existingUsers[
                            existingUsernames.indexOf(username)
                        ]['access_token'] = access_token;
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
                dissoc('password', req.params)
            );
            if (connectionsOnFile) {
                res.send(409, {connectionId: connectionsOnFile.id});
                return;
            } else {

                // Check that the connections are valid
                const connectionObject = req.params;
                try {
                    Datastores.connect(connectionObject).then(() => {
                        res.json(200, {connectionId: saveConnection(req.params)});
                        return;
                    }).catch(err => {
                        Logger.log(err, 2);
                        res.json(400, {error: {message: err.message}});
                        return;
                    });
                } catch (err) {
                    Logger.log(err, 2);
                    res.json(400, {error: {message: err.message}});
                }

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
            const connection = getSanitizedConnectionById(req.id);
            if (connection) {
                res.json(200, connection);
            } else {
                res.json(404, {});
            }
        });

        server.put('/connections/:id', (req, res, next) => {
            const connection = getSanitizedConnectionById(req.params.id);
            if (connection) {
                res.json(200, editConnectionById(req.params));
            } else {
                res.json(404, {});
            }
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
                )
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
                res.json(404, false);
            } else {
                res.json(200, true);
            }
        });

        // TODO - This endpoint is untested
        server.get('is-url-redirected', (req, res, next) => {
            const contents = fs.readFileSync(HOSTS);
            if (contents.indexOf(getSetting('CONNECTOR_HTTPS_DOMAIN')) > -1) {
                res.json(200, true);
            } else {
                res.json(404, false);
            }
        });

        // TODO - This endpoint is untested
        server.get('start-temp-https-server', (req, res, next) => {
            // can't install certificates without having visited the https server
            // and can't start a https app without having installed certificates ...
            // so while an http one is up this endpoint starts a https one for the sole
            // purpose of installing certificates into the user's keychain
            // before restarting the app and simply running a single https instance
            try {
                const certs = getCerts();
                if (isEmpty(certs)) {
                    throw new Error('No certs found.');
                }
                const tempServer = restify.createServer(certs);
                tempServer.use(restify.CORS({
                    origins: getSetting('CORS_ALLOWED_ORIGINS'),
                    credentials: false,
                    headers: headers
                }));
                tempServer.listen(getSetting('PORT') + 1); // not to clash with the open http port
                tempServer.opts( /.*/, (req, res) => res.send(204));
                tempServer.get(/\/ssl\/?.*/, restify.serveStatic({
                    directory: `${__dirname}/../`
                }));
                tempServer.get('/status', (req, res) => {
                    if (req.isSecure()) {
                        fs.readFile(
                            `${__dirname}/../ssl/status.html`, 'utf8', function(err, file) {
                            if (err) {
                                res.send(500);
                            }
                            res.write(file);
                            res.end();
                        });
                    } else {
                        res.send(404, false);
                    }
                });
            } catch (err) {
                console.log(err);
                res.json(404, false);
            }
            res.json(200, true);
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
