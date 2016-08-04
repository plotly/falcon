import * as fs from 'fs';
import restify from 'restify';

function serveAcceptCerSteps(req, res) {
  fs.readFile('./ssl/steps.html', 'utf8', function(err, file) {
    if (err) {
      res.send(500);
    }
    res.write(file);
    res.end();
  });
}

function serveFinished(req, res) {
  fs.readFile('./ssl/finished.html', 'utf8', function(err, file) {
    if (err) {
      res.send(500);
    }
    res.write(file);
    res.end();
  });
}

export function setupRoutes(server, processMessageFunction) {
    // serve plain html for steps to accept self-signed certificate
    server.get(/\/ssl\/?.*/, restify.serveStatic({
      directory: __dirname
    }));

    server.get('/steps', serveAcceptCerSteps);
    server.get('/secure', serveFinished);

    server.get('/v0/connect', processMessageFunction);
    server.get('/v0/login', processMessageFunction);
    server.get('/v0/query', processMessageFunction);
    server.get('/v0/tables', processMessageFunction);
    server.get('/v0/disconnect', processMessageFunction);
    server.get('/v1/connect', processMessageFunction);
    server.get('/v1/authenticate', processMessageFunction);
    server.get('/v1/databases', processMessageFunction);
    server.get('/v1/selectdatabase', processMessageFunction);
    server.get('/v1/tables', processMessageFunction);
    server.get('/v1/preview', processMessageFunction);
    server.get('/v1/query', processMessageFunction);
    server.get('/v1/disconnect', processMessageFunction);
}
