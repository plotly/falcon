import * as fs from 'fs';
import restify from 'restify';
import {setupRoutes} from './routes';
import {dialog} from 'electron';
import sudo from 'electron-sudo';
import {replace, splitAt} from 'ramda';

const httpsMessage = 'Welcome to the Plotly Database Connector! ' +
'To get started we\'ll need your administrator password to set up encrypted ' +
'HTTPS on this app. Behind the scenes we will be running the openssl command ' +
'to generate a self-signed HTTPS certificate.';

// asking for sudo more than once, but show a dialog window only once
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

const setupSecureRestifyServer = (
    {keyFile, csrFile, sequelizeManager,
    serverMessageReceive, mainWindow, OPTIONS}
) => {

    const httpsOptions = {
        key: fs.readFileSync(keyFile),
        certificate: fs.readFileSync(csrFile)
    };

    const server = restify.createServer(httpsOptions);
    server.use(restify.queryParser());
    sequelizeManager.log('Starting HTTPS Server', 1);
    server.use(restify.CORS({
        origins: ['*'],
        credentials: false,
        headers: ['Access-Control-Allow-Origin']
    })).listen(OPTIONS.port + 1);

    // https://github.com/restify/node-restify/issues/664
    server.opts( /.*/, (req, res) => res.send(204));

    setupRoutes(server, serverMessageReceive(
        sequelizeManager, mainWindow.webContents)
    );

};


export function setupHTTP(
    {sequelizeManager, serverMessageReceive, mainWindow, OPTIONS}
) {

    const httpServer = restify.createServer();
    httpServer.use(restify.queryParser());
    httpServer.use(restify.CORS({
        origins: ['*'],
        credentials: false,
        headers: ['Access-Control-Allow-Origin']
    })).listen(OPTIONS.port);

    setupRoutes(httpServer, serverMessageReceive(
        sequelizeManager, mainWindow.webContents)
    );

}

// https

const keyFile = `${__dirname}/ssl/certs/server/privkey.pem`;
const csrFile = `${__dirname}/ssl/certs/server/fullchain.pem`;

// Check if HTTPS has been setup or not yet
export function checkHTTPS() {
    try {
        // try reading certs
        fs.accessSync(keyFile, fs.F_OK);
        fs.accessSync(csrFile, fs.F_OK);
    } catch (e) {
        return false;
    }
    return true;
}

// Run a couple scripts to generate a self-signed cert and then run the https server
// these scripts require sudo and prompt for an admin password
export function setupHTTPS(
    {sequelizeManager, serverMessageReceive, mainWindow, OPTIONS}
) {

    const hosts = '/etc/hosts';
    const connectorURL = 'connector.plot.ly';

    const sudoOptions = {
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

    const scriptsDirectory = replace(/\ /g, '\\ ', `${__dirname}`);

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

    // redirect connectorURL to localhost
    try {

        sequelizeManager.log(
            `checking if ${connectorURL} is in /etc/hosts`, 1
        );

        fs.readFile(hosts, function (err, data) {
            if (data.indexOf(connectorURL) < 0) {

                showSudoMessage(sequelizeManager, OPTIONS);
                sequelizeManager.log(
                    `${connectorURL} is not in /etc/hosts.`, 1
                );
                sequelizeManager.log(
                    `Writing ${connectorURL} to /etc/hosts.`, 1
                );
                sudo.exec(`sh  "${scriptsDirectory}"/ssl/redirectConnector.sh`,
                    sudoOptions, function(error) {
                    if (error) {
                        dialog.showMessageBox(errorMessageBox(error));
                        sequelizeManager.log(error, 0);
                    } else {
                        sequelizeManager.log(
                            `${connectorURL} is now redirected to local.`, 1
                        );
                    }
                });
            } else {
                sequelizeManager.log(
                    `${connectorURL} is already in /etc/hosts`, 1
                );
            }
        });

    } catch (error) {
        sequelizeManager.log(error, 0);
    }

    // setup HTTPS server with self signed certs
    try {

        sequelizeManager.log('Checking if HTTPS certificate and key files already exist', 1);
        // try reading certs
        fs.accessSync(keyFile, fs.F_OK);
        fs.accessSync(csrFile, fs.F_OK);

        sequelizeManager.log('Certificate and key files already exist.', 1);
        setupSecureRestifyServer(
            {keyFile, csrFile, sequelizeManager,
            serverMessageReceive, mainWindow, OPTIONS}
        );

        mainWindow.webContents.send('channel', {
            hasSelfSignedCert: true
        });

    } catch (e) {

        sequelizeManager.log('Certificate and key files do not exist.', 1);
        sequelizeManager.log('Genearting certificate and key files.', 1);
        // if error returned, certs do not exist -- let's create them
        showSudoMessage(sequelizeManager, OPTIONS);
        sudo.exec(
            `sh  "${scriptsDirectory}"/ssl/createKeys.sh`, sudoOptions,
            function(error) {

            if (error) {
                dialog.showMessageBox(errorMessageBox(error));
                sequelizeManager.log(error, 0);
            } else {
                sequelizeManager.log('New key and certificate generated', 1);
                sequelizeManager.log('Closing HTTP Server', 1);

                mainWindow.webContents.send('channel', {
                    hasSelfSignedCert: true,
                    firstTimeRunningHttps: true
                });
                // setup server with those keys
                setupSecureRestifyServer(
                    {keyFile, csrFile, sequelizeManager,
                    serverMessageReceive, mainWindow, OPTIONS}
                );
            }
        });

    }
}
