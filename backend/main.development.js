import {app, BrowserWindow} from 'electron';
import {contains, join, isEmpty} from 'ramda';
import Logger from './logger';
import {setupMenus} from './menus';
import {getSetting} from './settings';

import Server from './routes.js';

Logger.log('Starting application', 2);

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')();
}

const isTestRun = contains('--test-type=webdriver', process.argv.slice(2));

const server = new Server();
Logger.log('Starting server', 2);
server.start();
Logger.log('Loading persistent queries', 2);
server.queryScheduler.loadQueries();

app.on('ready', () => {

    let mainWindow = new BrowserWindow({
        show: true,
        width: 1024,
        height: 1024
    });

    const {httpServer, httpsServer} = server;
    const HTTP_URL = `${httpServer.protocol}://${httpServer.domain}:${httpServer.port}`;
    const HTTPS_URL = `${httpsServer.protocol}://${httpsServer.domain}:${httpsServer.port}`;

    console.log(`Visit ${HTTP_URL}`);

    // Provide the port of the server to the front-end as a query string param.
    mainWindow.loadURL(`${HTTP_URL}/login`);
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
