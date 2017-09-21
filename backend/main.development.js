import {app, BrowserWindow, shell} from 'electron';
import {contains, join, isEmpty} from 'ramda';
import Logger from './logger';
import {setupMenus} from './menus';
import {getSetting} from './settings';

import Servers from './routes.js';

Logger.log('Starting application', 2);

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')();
}

const isTestRun = contains('--test-type=webdriver', process.argv.slice(2));

const server = new Servers();
Logger.log('Starting server', 2);
server.start();
Logger.log('Loading persistent queries', 2);
Logger.log('Electron version: ' + process.versions.electron, 2);
Logger.log('Chrome version: ' + process.versions.chrome, 2);
server.queryScheduler.loadQueries();


app.on('ready', () => {

    let mainWindow = new BrowserWindow({
        show: true,
        width: 1024,
        height: 1024
    });

    const {httpServer, httpsServer} = server;

    httpServer.electronWindow = mainWindow;
    httpsServer.electronWindow = mainWindow;

    const HTTP_URL = `${httpServer.protocol}://${httpServer.domain}:${httpServer.port}`;
    const HTTPS_URL = `${httpsServer.protocol}://${httpsServer.domain}:${httpsServer.port}`;

    mainWindow.loadURL(`${HTTP_URL}/`);
    // startup main window
    mainWindow.webContents.on('did-finish-load', () => {

        // show main window if not a test
        if (!isTestRun) {
            mainWindow.show();
            mainWindow.focus();
        }

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
