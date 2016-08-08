import * as fs from 'fs';
import restify from 'restify';
import {setupRoutes} from './routes';
const {dialog} = require('electron');
import sudo from 'electron-sudo';
import {replace} from 'ramda';

const httpsMessage = 'This application will establish an encrypted link ' +
    'between the connector application and plotly 2.0 client. In order to ' +
    'provide that communication tunnel, a new private key for your device ' +
    'will be generated using the \'openssl\' command which requires ' +
    'administrator\'s password.';

// asking for sudo more than once, but show a dialog window only once
let messageShown = false;
const showSudoMessage = () => {
    if (!messageShown) {
        dialog.showMessageBox(
            {type: 'info', buttons: ['OK'], message: httpsMessage}
        );
        messageShown = true;
    }
};

const setupSecureRestifyServer = (
    {keyFile, csrFile, sequelizeManager,
    serverMessageReceive, mainWindow, OPTIONS}
) => {

    const https_options = {
        key: fs.readFileSync(keyFile),
        certificate: fs.readFileSync(csrFile)
    };

    const server = restify.createServer(https_options);
    server.use(restify.queryParser());
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

    const server = restify.createServer();
    server.use(restify.queryParser());
    server.use(restify.CORS({
        origins: ['*'],
        credentials: false,
        headers: ['Access-Control-Allow-Origin']
    })).listen(OPTIONS.port);

    setupRoutes(server, serverMessageReceive(
        sequelizeManager, mainWindow.webContents)
    );
}

export function setupHTTPS(
    {sequelizeManager, serverMessageReceive, mainWindow, OPTIONS}
) {

    const keyFile = `${__dirname}/ssl/certs/server/privkey.pem`;
    const csrFile = `${__dirname}/ssl/certs/server/fullchain.pem`;

    const hosts = '/etc/hosts';
    const connectorURL = 'connector.plot.ly';

    const options = {
        name: 'Connector',
        process: {
            options: {
                env: {'VAR': 'VALUE'}
            },
            on: (ps) => {
                ps.stdout.on('data', function(data) {console.log(data);});
                setTimeout(function() {
                    ps.kill();
                }, 50000);
            }
        }
    };

    const scriptsDirectory = replace(/\ /g, '\\ ', `${__dirname}`);

    // redirect connectorURL to localhost
    try {
        fs.readFile(hosts, function (err, data) {
            if (data.indexOf(connectorURL) < 0) {
                showSudoMessage();
                sudo.exec(`sh  "${scriptsDirectory}"/ssl/redirectConnector.sh`,
                    options, function(error) {
                    if (error) {
                        dialog.showMessageBox(
                            {type: 'info', buttons: ['OK'], message: 'error'}
                        );
                        console.log(error);
                    } else {
                        console.log(`${connectorURL} is now wired to local.`);
                    }
                });
            } else {
                console.log(`${connectorURL} is already wired to a local port.`);
            }
        });
    } catch (error) {
        console.log(error);
    }

    // setup HTTPS server with self signed certs
    try {
        // try reading certs
        fs.accessSync(keyFile, fs.F_OK);
        fs.accessSync(csrFile, fs.F_OK);

        console.log('Found certs files.');
        setupSecureRestifyServer(
            {keyFile, csrFile, sequelizeManager,
            serverMessageReceive, mainWindow, OPTIONS}
        );
    } catch (e) {
        console.log('Did not find certs, generating...');
        // if error returned, certs do not exist -- let's create them
        showSudoMessage();
        sudo.exec(`sh  "${scriptsDirectory}"/ssl/createKeys.sh`, options, function(error) {
            if (error) {
                dialog.showMessageBox(
                    {type: 'info', buttons: ['OK'], message: error.toString()}
                );
                sequelizeManager.log('Opening main window.', 2);
                console.log(error);
                dialog.showMessageBox(
                    {type: 'info', buttons: ['OK'], message: `${__dirname}/ssl/createKeys.sh`}
                );
            } else {
                sequelizeManager.log('script ran');
                console.log('Keys generated.');
                // setup server with those keys
                setupSecureRestifyServer(
                    {keyFile, csrFile, sequelizeManager,
                    serverMessageReceive, mainWindow, OPTIONS}
                );
                require('electron').shell
                    .openExternal('http://connector.plot.ly:5000/steps');
            }
        });
    }
}
