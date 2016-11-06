import {app, BrowserWindow, ipcMain} from 'electron';
import {contains} from 'ramda';

import Logger from './logger';
import {SequelizeManager, OPTIONS} from './sequelizeManager';
import QueryScheduler from './persistent/QueryScheduler.js';
import {setupMenus} from './menus';

import Server from './routes.js';

Logger.log('Starting application', 2);

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')();
}


const isTestRun = () => {
    return (contains('--test-type=webdriver', process.argv.slice(2)));
};
// TODO ^ why does this need to be a function? does this change during run-time?


const server = new Server();
Logger.log('Starting server', 2);
server.start();
Logger.log('Loading persistent queries', 2);
server.queryScheduler.loadQueries();

app.on('ready', () => {


    let mainWindow = new BrowserWindow({
        show: true,
        width: 1024,
        height: OPTIONS.large ? 1024 : 728
    });

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
