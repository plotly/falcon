// Entry point for running the app without electron
import Logger from './logger';
import Server from './routes.js';


const server = new Server();
Logger.log('Starting server', 2);
server.start();
Logger.log('Loading persistent queries', 2);
server.queryScheduler.loadQueries();
