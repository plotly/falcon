var restify = require('restify');
import * as Connections from './persistent/connections/Connections.js';
import {getQueries, getQuery, deleteQuery} from './persistent/Queries';
import {
    saveCredential,
    lookUpCredentials,
    getSanitizedCredentials,
    getSanitizedCredentialById,
    deleteCredentialById,
    getCredentialById
} from './persistent/Credentials.js';
import QueryScheduler from './persistent/QueryScheduler.js';
import {getSetting, saveSetting} from './settings.js';
import {dissoc, pluck, contains} from 'ramda';
import Logger from './logger';
import fetch from 'node-fetch';

export default class Server {
    constructor() {
        const server = restify.createServer();
        const queryScheduler = new QueryScheduler();

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

        server.get('/oauth', restify.serveStatic({
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
                        res.json(500, {error: {message: `User was not found.`}});
                    }
                    const existingUsers = getSetting('USERS');
                    const existingUsernames = pluck('username', existingUsers);
                    let status;
                    if (contains(username, existingUsernames)) {
                        existingUsers[
                            existingUsernames.indexOf(username)
                        ]['access_token'] = access_token;
                        status = 200
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
        })

        // save credentials to a file
        server.post('/credentials', function postCredentialsHandler(req, res, next) {
            /*
             * Check if an existing set of credentials exist
             * If it does, prevent overwriting so that IDs
             * that might be saved on other servers that refer
             * to this exact same set of credentials don't get
             * overwritten.
             */
            const credentialsOnFile = lookUpCredentials(
                dissoc('password', req.params)
            );
            if (credentialsOnFile) {
                res.send(409, {credentialId: credentialsOnFile.id});
            } else {
                res.send(200, {credentialId: saveCredential(req.params)});
            }
        });

        // return sanitized credentials
        server.get('/credentials', function getCredentialsHandler(req, res, next) {
            res.json(200, getSanitizedCredentials());
        });

        /*
         * return a single credential by id
         * ids are assigned by the server on credential save
         */
        server.get('/credentials/:id', function getCredentialsIdHandler(req, res, next) {
            const credential = getSanitizedCredentialById(req.id);
            if (credential) {
                res.json(200, credential);
            } else {
                res.json(404, {});
            }
        });

        // delete credentials
        server.del('/credentials/:id', function delCredentialsHandler(req, res, next) {
            if (getSanitizedCredentialById(req.params.id)) {
                deleteCredentialById(req.params.id);
                res.json(204, {});
            } else {
                res.json(404, {});
            }
        });

        /* Connections */
        server.post('/connect/:credentialId', function postConnectHandler(req, res, next) {
            Connections.connect(getCredentialById(req.params.credentialId))
            .then(() => {
                res.json(200, {});
            });
        });

        /* One-Shot Queries */

        // Make a query and return the results as a grid
        server.post('/query/:credentialId', function postQueryHandler(req, res, next) {
            Connections.query(
                req.params.query,
                getCredentialById(req.params.credentialId)
            ).then(rows => {
                res.json(200, rows);
                next();
            }).catch(error => {
                res.json(400, {error: {message: error.message}});
            });
        });

        server.post('/tables/:credentialId', function tablesHandler(req, res, next) {
            Connections.tables(
                getCredentialById(req.params.credentialId)
            ).then(tables => {
                res.json(200, tables);
            });
        });

        server.post('/s3-keys/:credentialId', function s3KeysHandler(req, res, next) {
            Connections.files(
                getCredentialById(req.params.credentialId)
            ).then(files => {
                res.json(200, files);
            });
        });

        server.post('/apache-drill-storage/:credentialId', function apacheDrillStorageHandler(req, res, next) {
            Connections.storage(
                getCredentialById(req.params.credentialId)
            ).then(files => {
                res.json(200, files);
            });
        });

        server.post('/apache-drill-s3-keys/:credentialId', function apacheDrills3KeysHandler(req, res, next) {
            Connections.listS3Files(
                getCredentialById(req.params.credentialId)
            ).then(files => {
                res.json(200, files);
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
        server.post('/queries', function postQueriesHandler(req, res, next) {
            // TODO - Verify that the app has access to
            // the user's API key and attempt to make a
            // request to see if it is valid.

            // Make the query and update the user's grid
            const {fid, uids, query, credentialId} = req.params;
            that.queryScheduler.queryAndUpdateGrid(
                fid, uids, query, credentialId
            )
            .then(function returnSuccess(){
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
            .catch(function returnError(error){
                Logger.log(error, 0);
                res.json(400, {error: {message: error.message}});
            });

        });

        // delete a query
        server.del('/queries/:fid', function delQueriesHandler(req, res, next) {
            const {fid} = req.params;
            if (getQuery(fid)) {
                deleteQuery(fid);
                res.json(204, {});
            } else {
                res.json(404, {});
            }
        });
        //
        // server.on('uncaughtException', function uncaughtExceptionHandler(req, res, route, err) {
        //     if (err.message.indexOf("Can't set headers after they are sent") === -1) {
        //         Logger.log(err);
        //     }
        //     res.json(500, {
        //         error: {message: err.message}
        //     });
        // });

    }

    close() {
        this.server.close();
    }
}
