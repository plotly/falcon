import * as fs from 'fs';
import restify from 'restify';

const ENDPOINTS = {
    v1: [
        'connect',
        'authenticate',
        'sessions',
        'deletesession',
        'databases',
        'selectdatabase',
        'tables',
        'preview',
        'query',
        'disconnect'
    ]
};

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

    // setup v1 endpoints
    ENDPOINTS.v1.forEach (endpoint => {
        server.get(`/v1/${endpoint}`, processMessageFunction);
        server.post(`/v1/${endpoint}`, processMessageFunction);
    });

}
