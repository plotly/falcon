var restify = require('restify');
import * as Connections from './connections/Connections.js';
import {getQueries, getQuery, deleteQuery} from './Queries';
import {
    saveCredential,
    lookUpCredentials,
    getSanitizedCredentials,
    getSanitizedCredentialById,
    deleteCredentialById,
    getCredentialById
} from './Credentials.js';
import QueryScheduler from './QueryScheduler.js';
import {dissoc} from 'ramda';

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
        const server = this.server;
        server.use(restify.queryParser());
        server.use(restify.bodyParser({mapParams: true}));
        server.listen(
            9000
        );

        server.get('/', (req, res, next) => {
            restify.serveStatic({
                directory: `${__dirname}/../../static`,
                default: 'index.html'
            });
        });

        server.get('/ping', (req, res, next) => {
            res.send(200);
        });

        // save credentials to a file
        server.post('/credentials', (req, res, next) => {
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
        server.get('/credentials', (req, res, next) => {
            res.json(200, getSanitizedCredentials());
        });

        /*
         * return a single credential by id
         * ids are assigned by the server on credential save
         */
        server.get('/credentials/:id', (req, res, next) => {
            const credential = getSanitizedCredentialById(req.id);
            if (credential) {
                res.json(200, credential);
            } else {
                res.send(404);
            }
        });

        // delete credentials
        server.del('/credentials/:id', (req, res, next) => {
            if (getSanitizedCredentialById(req.params.id)) {
                deleteCredentialById(req.params.id);
                res.json(204);
            } else {
                res.json(404);
            }
        });

        /* Connections */
        server.post('/connect/:credentialId', (req, res, next) => {
            Connections.connect(getCredentialById(req.params.credentialId)).then(() => {
                res.send(200);
            });
        });

        /* One-Shot Queries */

        // Make a query and return the results as a grid
        server.post('/query/:credentialId', (req, res, next) => {
            Connections.query(
                req.params.query,
                getCredentialById(req.params.credentialId)
            ).then(rows => {
                res.json(200, rows);
                next();
            });
        });

        // return a list of tables or documents
        server.post('/tables/:credentialId', (req, res, next) => {
            Connections.tables(
                getCredentialById(req.params.credentialId)
            ).then(tables => {
                res.json(200, tables);
            });
        });

        // return a list of tables or documents
        server.post('/databases/:credentialId', (req, res, next) => {
            Connections.databases(
                getCredentialById(req.params.credentialId)
            ).then(databases => {
                res.json(200, databases);
                // TODO - fix this up
            });
        });

        /* Persistent Connections */

        // return the list of registered queries
        server.get('/queries', (req, res, next) => {
            res.json(200, getQueries());
        });

        server.get('/queries/:fid', (req, res, next) => {
            const query = getQuery(req.params.fid);
            if (query) {
                res.json(200, query);
            } else {
                res.send(404);
            }
        });

        // register a query
        server.post('/queries', (req, res, next) => {
            this.queryScheduler.scheduleQuery(req.params);
            res.send(200);
        });

        // delete a query
        server.del('/queries/:fid', (req, res, next) => {
            const {fid} = req.params;
            if (getQuery(fid)) {
                deleteQuery(fid);
                res.json(204);
            } else {
                res.json(404);
            }
        });

    }

    close() {
        this.server.close();
    }
}
