var restify = require('restify');
import {query, connect} from './connections/Connections.js';
import {getQueries} from './Queries';
import {lookUpCredentials} from './Credentials.js';

export default class Server {
    constructor() {
        const server = restify.createServer();
        this.server = server;
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

        server.get('/ping', (req, res, next) => {
            res.send(200, 'pong');
            return next();
        });

        server.post('/queries', (req, res, next) => {
            res.json(200, getQueries());
        });

        server.post('/query', (req, res, next) => {
            query(
                req.params.query,
                lookUpCredentials(req.params.configuration)
            ).then(rows => {
                res.json(200, rows);
                next();
            }).catch(next);
        });

    }

    close() {
        this.server.close();
    }
}
