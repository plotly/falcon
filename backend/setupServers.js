import * as fs from 'fs';
import restify from 'restify';
import {dialog} from 'electron';
import sudo from 'electron-sudo';
import {replace, splitAt} from 'ramda';
import YAML from 'yamljs';

import {setupRoutes} from './routes';
import {serverMessageReceive, CHANNEL} from './messageHandler';

// generic directories
const HOSTS = '/etc/hosts';
const SCRIPTS_DIRECTORY = replace(/\ /g, '\\ ', `${__dirname}`);

// certificates setup
const keyFile = `${__dirname}/../ssl/certs/server/privkey.pem`;
const csrFile = `${__dirname}/../ssl/certs/server/fullchain.pem`;

// scripts
const REDIRECT_CONNECTOR_SCRIPT = `sh  "${SCRIPTS_DIRECTORY}"/../ssl/redirectConnector.sh`;
const CREATE_KEYS_SCRIPT = `sh  "${SCRIPTS_DIRECTORY}"/../ssl/createKeys.sh`;

// running sudo commands options
const SUDO_OPTIONS = {
    name: 'Connector',
    process: {
        options: {
            env: {'VAR': 'VALUE'}
        },
        on: (ps) => {
            ps.stdout.on('data', function() {});
            setTimeout(function() {
                ps.kill();
            }, 50000);
        }
    }
};

const errorMessageBox = (error) => {
    const shortenedMessage = splitAt(500, error.toString())[0];
    return {
        type: 'info',
        buttons: ['OK'],
        message: 'Yikes, an error occurred while setting up' +
            'HTTPS. Create an issue at ' +
            'https://github.com/plotly/plotly-database-connector/issues' +
            'and paste a screen shot of this error message:' +
            `${shortenedMessage}`
    };
};

// accept requests from these domains
export const CONNECTOR_URL = 'connector.plot.ly';
const acceptRequestsFrom = YAML.load(`${__dirname}/acceptedDomains.yaml`);
const addAcceptedDomain = (domain) => {
    acceptRequestsFrom.domains.push(`https://${domain}`);
};

// dialog message to create a https server and ask for password
const httpsMessage = 'Welcome to the Plotly Database Connector! ' +
'To get started we\'ll need your administrator password to set up encrypted ' +
'HTTPS on this app. Behind the scenes we will be running the openssl command ' +
'to generate a self-signed HTTPS certificate.';
let messageShown = false;
const showSudoMessage = (sequelizeManager, OPTIONS) => {
    if (!messageShown) {
        messageShown = true;
        if (OPTIONS.headless) {
            sequelizeManager.log(httpsMessage, 1);
        } else {
            dialog.showMessageBox(
                {type: 'info', buttons: ['OK'], message: httpsMessage}
            );
        }
    }
};


// Check if HTTPS has been setup or not yet
export function findSelfSignedCert() {
    try {
        // try reading certs
        fs.accessSync(keyFile, fs.F_OK);
        fs.accessSync(csrFile, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

// make available for general scope
let httpServer;
let httpsServer;

export const newOnPremSession = (
    domain, responseTools
) => {
    addAcceptedDomain(domain);
    if (httpServer) {
        httpServer.close();
        setupHTTP(responseTools);
    } else {
        httpsServer.close();
        setupHTTPS(responseTools);
    }
};

// sets up the server itself, called by setupHTTPS() function
const setupSecureRestifyServer = (responseTools) => {

    const {sequelizeManager, OPTIONS} = responseTools;

    const httpsOptions = {
        key: fs.readFileSync(keyFile),
        certificate: fs.readFileSync(csrFile)
    };

    sequelizeManager.log('Closing HTTP server.', 1);
    if (httpServer) {
        httpServer.close();
    }
    httpServer = null;

    httpsServer = restify.createServer(httpsOptions);
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

    /*
     * https://github.com/restify/node-restify/issues/664
     * Handle all OPTIONS requests to a deadend (Allows CORS to work them out)
     */
    httpsServer.opts( /.*/, (req, res) => res.send(204));

    setupRoutes(httpsServer, serverMessageReceive(responseTools));

};


// http

export function setupHTTP(responseTools) {

    httpServer = restify.createServer();
    httpServer.use(restify.queryParser());
    httpServer.use(restify.bodyParser({ mapParams: true }));
    httpServer.use(restify.CORS({
        origins: acceptRequestsFrom.domains,
        credentials: false,
        headers: ['Access-Control-Allow-Origin']
    })).listen(responseTools.OPTIONS.port);
    responseTools.sequelizeManager.log(
        `Listening on port ${responseTools.OPTIONS.port}`, 1
    );
    setupRoutes(httpServer, serverMessageReceive(responseTools));

}


/*
 * Run a couple scripts to generate a self-signed cert
 * and then run the https server.
 * These scripts require sudo and prompt for an admin password
 */

export function setupHTTPS(responseTools) {

    const {sequelizeManager, mainWindow, OPTIONS} = responseTools;
    const log = (args) => sequelizeManager.log(args);

    // 1 - redirect CONNECTOR_URL to localhost
    try {
        log(`checking if ${CONNECTOR_URL} is in /etc/hosts`, 1);
        fs.readFile(HOSTS, function (err, data) {
            if (data.indexOf(CONNECTOR_URL) < 0) {

                showSudoMessage(sequelizeManager, OPTIONS);
                log(`${CONNECTOR_URL} is not in /etc/hosts.`, 1);
                log(`Writing ${CONNECTOR_URL} to /etc/hosts.`, 1);
                sudo.exec(REDIRECT_CONNECTOR_SCRIPT,
                    SUDO_OPTIONS, function(error) {
                    if (error) {
                        dialog.showMessageBox(errorMessageBox(error));
                        log(error, 0);
                    } else {
                        log(`${CONNECTOR_URL} is now redirected to local.`, 1);
                    }
                });
            } else {
                log(`${CONNECTOR_URL} is already in /etc/hosts`, 1);
            }
        });
    } catch (error) {
        log(error, 0);
    }

    // 2 - setup HTTPS server with self signed certs
    try {
        log('Checking if HTTPS certificate and key files already exist', 1);
        // try reading certs
        fs.accessSync(keyFile, fs.F_OK);
        fs.accessSync(csrFile, fs.F_OK);
        log('Certificate and key files already exist.', 1);
        setupSecureRestifyServer(responseTools);
        mainWindow.webContents.send(CHANNEL, {hasSelfSignedCert: true});

    } catch (e) {
        // if error returned, certs do not exist -- let's create them
        log('Certificate and key files do not exist.', 1);
        log('Genearting certificate and key files.', 1);
        showSudoMessage(sequelizeManager, OPTIONS);
        sudo.exec(CREATE_KEYS_SCRIPT, SUDO_OPTIONS,
            function(error) {
                if (error) {
                    dialog.showMessageBox(errorMessageBox(error));
                    log(error, 0);
                } else {
                    log('New key and certificate generated', 1);
                    mainWindow.webContents.send(CHANNEL, {
                        hasSelfSignedCert: true
                    });
                    // setup server with those keys
                    setupSecureRestifyServer(responseTools);
                }
        });

    }
}
