import {app, BrowserWindow, ipcMain} from 'electron';
import {contains} from 'ramda';

import {Sessions} from './sessions';
import {Logger} from './logger';
import {SequelizeManager, OPTIONS} from './sequelizeManager';
import {ElasticManager} from './elasticManager';
import QueryScheduler from './persistent/QueryScheduler.js';
import {ipcMessageReceive,
        CHANNEL} from './messageHandler';
import {setupHTTP, setupHTTPS, findSelfSignedCert} from './setupServers';
import {setupMenus} from './menus';

import Server from './persistent/routes.js';

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')();
}

const isUnix = () => {
    return (process.platform === 'darwin' || process.platform === 'linux');
};
// TODO ^ why does this need to be a function? does this change during run-time?

const isTestRun = () => {
    return (contains('--test-type=webdriver', process.argv.slice(2)));
};
// TODO ^ why does this need to be a function? does this change during run-time?

// TODO: issue #65 shell scripts for HTTPS setup will not work on windows atm
const canSetupHTTPS = isUnix() && !isTestRun();

const server = new Server();
server.start();

app.on('ready', () => {


    let mainWindow = new BrowserWindow({
        show: true,
        width: 1024,
        height: OPTIONS.large ? 1024 : 728
    });

    const logger = new Logger(OPTIONS, mainWindow, CHANNEL);
    // const sessions = new Sessions();
    // const sequelizeManager = new SequelizeManager(logger, sessions);
    // const elasticManager = new ElasticManager(logger, sessions);

    /*
        'responseTools' is generic for the things required to handle
        responses from either the app through IPC CHANNEL or from a API
        request
    */
    // const responseTools = {
    //     sequelizeManager, elasticManager, mainWindow, OPTIONS, queryScheduler
    // };

    // sequelizeManager.log('Starting Application...', 0);

    mainWindow.loadURL(`file://${__dirname}/../app/app.html`);

    // startup main window
    mainWindow.webContents.on('did-finish-load', () => {

        // show window if it's not running in headless mode and not a test
        if (!OPTIONS.headless && !isTestRun()) {
            // sequelizeManager.log('Opening main window.', 2);
            mainWindow.show();
            mainWindow.focus();
        }

        // ipcMain.removeAllListeners(CHANNEL);
        // // what to do when a message through IPC is received
        // ipcMain.on(CHANNEL, ipcMessageReceive(responseTools));
        // // what to do when a message through API is received
        // // setupHTTP(responseTools);

        // mainWindow.webContents.send(CHANNEL, {canSetupHTTPS});
        //
        // if (canSetupHTTPS) {
        //     const hasSelfSignedCert = findSelfSignedCert();
        //     mainWindow.webContents.send(CHANNEL, {hasSelfSignedCert});
        //     // if user has certificates, setup the HTTPS server right away
        //     if (hasSelfSignedCert) {
        //         // setupHTTPS(responseTools);
        //     }
        // }

    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.openDevTools();
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    setupMenus(app, mainWindow);

});

// close the app when windows is closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
