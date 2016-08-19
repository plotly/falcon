import * as fs from 'fs';
import restify from 'restify';

function serveHttpsStatus(req, res) {
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
        res.send(404);
    }
}

export function setupRoutes(server, processMessageFunction) {
    // serve plain html for steps to accept self-signed certificate
    server.get(/\/ssl\/?.*/, restify.serveStatic({
        directory: `${__dirname}/../`
    }));

    server.get('/status', serveHttpsStatus);

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

    server.post('/v0/connect', processMessageFunction);
    server.post('/v0/login', processMessageFunction);
    server.post('/v0/query', processMessageFunction);
    server.post('/v0/tables', processMessageFunction);
    server.post('/v0/disconnect', processMessageFunction);
    server.post('/v1/connect', processMessageFunction);
    server.post('/v1/authenticate', processMessageFunction);
    server.post('/v1/databases', processMessageFunction);
    server.post('/v1/selectdatabase', processMessageFunction);
    server.post('/v1/tables', processMessageFunction);
    server.post('/v1/preview', processMessageFunction);
    server.post('/v1/query', processMessageFunction);
    server.post('/v1/disconnect', processMessageFunction);

}
