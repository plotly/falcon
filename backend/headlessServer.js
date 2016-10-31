import {Sessions} from './sessions';
import {Logger} from './logger';
import {SequelizeManager, OPTIONS} from './sequelizeManager';
import {ElasticManager} from './elasticManager';
import {serverMessageReceive,
        CHANNEL} from './messageHandler';
import * as fs from 'fs';
import YAML from 'yamljs';

let mainWindow = null;
import restify from 'restify';
import {setupRoutes} from './routes';

const logger = new Logger(OPTIONS, mainWindow, CHANNEL);
const sessions = new Sessions();
const sequelizeManager = new SequelizeManager(logger, sessions);
const elasticManager = new ElasticManager(logger, sessions);

const responseTools = {
    sequelizeManager, elasticManager, mainWindow, OPTIONS
};

const acceptRequestsFrom = YAML.load(`${__dirname}/acceptedDomains.yaml`);

if (OPTIONS.https) {

    const keyFile = `${__dirname}/../ssl/certs/server/privkey.pem`;
    const csrFile = `${__dirname}/../ssl/certs/server/fullchain.pem`;
    console.log('using the following certs');
    console.warn('keyFile: ', keyFile);
    console.warn('csrFile: ', csrFile);

    const httpsOptions = {
        key: fs.readFileSync(keyFile),
        certificate: fs.readFileSync(csrFile)
    };

    const httpsServer = restify.createServer(httpsOptions);
    /*
     * parsed content will always be available in req.query,
     * additionally params are merged into req.params
     */
    httpsServer.use(restify.queryParser());
    httpsServer.use(restify.bodyParser({ mapParams: true }));
    httpsServer.use(restify.CORS({
        origins: acceptRequestsFrom.domains,
        credentials: false,
        headers: ['Access-Control-Allow-Origin']
    })).listen(OPTIONS.port);
    console.log('listening on port ', OPTIONS.port);
    /*
     * https://github.com/restify/node-restify/issues/664
     * Handle all OPTIONS requests to a deadend (Allows CORS to work them out)
     */
    httpsServer.opts( /.*/, (req, res) => res.send(204));
    setupRoutes(httpsServer, serverMessageReceive(responseTools));
    console.log('https server is setup');

} else {

    const httpServer = restify.createServer();
    httpServer.use(restify.queryParser());
    httpServer.use(restify.bodyParser({ mapParams: true }));
    httpServer.use(restify.CORS({
        origins: ['*'],
        credentials: false,
        headers: ['Access-Control-Allow-Origin']
    })).listen(OPTIONS.port);
    console.log(`listening on port ${OPTIONS.port}`);

    setupRoutes(httpServer, serverMessageReceive(responseTools));
    console.log('http server is setup');

}
