var restify = require('restify');
import * as Connections from './persistent/datastores/Datastores.js';
import {getQueries, getQuery, deleteQuery} from './persistent/Queries';
import {
    saveConnection,
    lookUpConnections,
    getSanitizedConnections,
    getSanitizedConnectionById,
    deleteConnectionById,
    getConnectionById
} from './persistent/Connections.js';
import QueryScheduler from './persistent/QueryScheduler.js';
import {getSetting, saveSetting} from './settings.js';
import {dissoc, contains, isEmpty, pluck} from 'ramda';
import {createCerts, deleteCerts, hasCerts, getCerts, redirectUrl} from './https.js';
import Logger from './logger';
import fetch from 'node-fetch';

export default class Server {
    constructor() {
        const certs = getCerts();
        const server = isEmpty(certs) ? restify.createServer() : restify.createServer(certs);

        const queryScheduler = new QueryScheduler();

        this.domain = isEmpty(certs) ? 'localhost' : getSetting('CONNECTOR_HTTPS_DOMAIN');
        this.protocol = isEmpty(certs) ? 'http' : 'https';
        this.server = server;
        this.queryScheduler = queryScheduler;

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
            getSetting('PORT')
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

        // Careful - this endpoint is untested
        server.post('/oauth-token', function saveOauth(req, res, next) {
            const {access_token} = req.params;
            fetch(`${getSetting('PLOTLY_API_DOMAIN')}/v2/users/current`, {
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

        // save connections to a file
        server.post('/connections', function postConnectionsHandler(req, res, next) {
            /*
             * Check if the connection already exists
             * If it does, prevent overwriting so that IDs
             * that might be saved on other servers that refer
             * to this exact same connection doesn't get
             * overwritten.
             */
            const connectionsOnFile = lookUpConnections(
                dissoc('password', req.params)
            );
            if (connectionsOnFile) {
                res.send(409, {connectionId: connectionsOnFile.id});
            } else {
                res.send(200, {connectionId: saveConnection(req.params)});
            }
        });

        // return sanitized connections
        server.get('/connections', function getConnectionsHandler(req, res, next) {
            res.json(200, getSanitizedConnections());
        });

        /*
         * return a single connection by id
         * ids are assigned by the server on connection save
         */
        server.get('/connections/:id', function getConnectionsIdHandler(req, res, next) {
            const connection = getSanitizedConnectionById(req.id);
            if (connection) {
                res.json(200, connection);
            } else {
                res.json(404, {});
            }
        });

        // delete connections
        // TODO - delete all associated queries?
        // TODO - deleting, at least from the front end, isn't working.
        server.del('/connections/:id', function delConnectionsHandler(req, res, next) {
            if (getSanitizedConnectionById(req.params.id)) {
                deleteConnectionById(req.params.id);
                res.json(200, {});
            } else {
                res.json(404, {});
            }
        });

        /* Connections */
        server.post('/connect/:connectionId', function postConnectHandler(req, res, next) {
            Connections.connect(getConnectionById(req.params.connectionId))
            .then(() => {
                res.json(200, {});
            });
        });

        /* One-Shot Queries */

        // Make a query and return the results as a grid
        server.post('/query/:connectionId', function postQueryHandler(req, res, next) {
            Connections.query(
                req.params.query,
                getConnectionById(req.params.connectionId)
            ).then(rows => {
                res.json(200, rows);
                next();
            }).catch(error => {
                res.json(400, {error: {message: error.message}});
            });
        });

        server.post('/tables/:connectionId', function tablesHandler(req, res, next) {
            Connections.tables(
                getConnectionById(req.params.connectionId)
            ).then(tables => {
                res.json(200, tables);
            });
        });

        server.post('/s3-keys/:connectionId', function s3KeysHandler(req, res, next) {
            Connections.files(
                getConnectionById(req.params.connectionId)
            ).then(files => {
                res.json(200, files);
            });
        });

        server.post('/apache-drill-storage/:connectionId', function apacheDrillStorageHandler(req, res, next) {
            Connections.storage(
                getConnectionById(req.params.connectionId)
            ).then(files => {
                res.json(200, files);
            });
        });

        server.post('/apache-drill-s3-keys/:connectionId', function apacheDrills3KeysHandler(req, res, next) {
            Connections.listS3Files(
                getConnectionById(req.params.connectionId)
            ).then(files => {
                res.json(200, files);
            });
        });

        // TODO - do we need `.catch` on all of these or will our
        // uncaughtExceptionHandler deal with it appropriately?
        server.post('/elasticsearch-mappings/:connectionId', function elasticsearchMappingsHandler(req, res, next) {
            Connections.elasticsearchMappings(
                getConnectionById(req.params.connectionId)
            ).then(mappings => {
                res.json(200, mappings);
            });
        });

        /* Persistent Connections */

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

        // register or update a query
        // TODO - Updating a query should probably be under
        // the endpoint `/queries/:fid`
        server.post('/queries', function postQueriesHandler(req, res, next) {
            // TODO - Verify that the app has access to
            // the user's API key and attempt to make a
            // request to see if it is valid.

            // Make the query and update the user's grid
            const {fid, uids, query, connectionId} = req.params;
            that.queryScheduler.queryAndUpdateGrid(
                fid, uids, query, connectionId
            )
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
                res.json(200, {});
            } else {
                res.json(404, {});
            }
        });

        // https
        server.get('/has-certs', (req, res, next) => {
            res.json(200, hasCerts());
        });

        server.get('/create-certs', (req, res, next) => {
            res.json(200, createCerts());
        });

        server.get('/redirect-url', (req, res, next) => {
            res.json(200, redirectUrl(getSetting('CONNECTOR_HTTPS_DOMAIN')));
        });

        server.get('/delete-certs', (req, res, next) => {
            res.json(200, deleteCerts());
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
