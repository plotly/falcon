import {Sessions} from './sessions';
import {Logger} from './logger';
import {SequelizeManager, OPTIONS} from './sequelizeManager';
import {ElasticManager} from './elasticManager';
import {serverMessageReceive,
        CHANNEL} from './messageHandler';

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

const httpServer = restify.createServer();
httpServer.use(restify.queryParser());
httpServer.use(restify.bodyParser({ mapParams: true }));
httpServer.use(restify.CORS({
    origins: ['*'],
    credentials: false,
    headers: ['Access-Control-Allow-Origin']
})).listen(responseTools.OPTIONS.port);
responseTools.sequelizeManager.log(
    `Listening on port ${responseTools.OPTIONS.port}`, 1
);
setupRoutes(httpServer, serverMessageReceive(responseTools));
