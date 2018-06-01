import {app, BrowserWindow, dialog, shell} from 'electron';
import fs from 'fs';

import {contains} from 'ramda';

import Logger from './logger.js';
import {setupMenus} from './menus.js';
import Servers from './routes.js';

Logger.log('Starting application', 2);

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')();
}

const isTestRun = contains('--test-type=webdriver', process.argv.slice(2));

const server = new Servers({createCerts: true, startHttps: true, isElectron: true});
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

    /*
     * This allows us to send pass information to electron renderer from
     * inside the server.
     */
    server.electronWindow = mainWindow;
    httpServer.electronWindow = mainWindow;
    httpsServer.electronWindow = mainWindow;

    const HTTP_URL = `${httpServer.protocol}://${httpServer.domain}:${httpServer.port}`;

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

    // prevent navigation out of HTTP_URL
    // see https://electronjs.org/docs/api/web-contents#event-will-navigate
    mainWindow.webContents.on('will-navigate', (event, url) => {
        if (!url.startsWith(HTTP_URL)) {
            Logger.log(`Preventing navigation to ${url}`, 2);
            event.preventDefault();
        }
    });

    // prevent navigation out of HTTP_URL
    // see https://electronjs.org/docs/api/web-contents#event-will-navigate
    mainWindow.webContents.on('new-window', (event, url) => {
        event.preventDefault();

        if (!url.startsWith('data:')) {
            Logger.log(`Opening ${url}`, 2);
            shell.openExternal(url);
            return;
        }

        // only download data URLs that contain a CSV file
        if (!url.startsWith('data:text/csv;base64,')) {
            Logger.log(`Preventing request ${url}`, 2);
            return;
        }

        dialog.showSaveDialog({
            title: 'Save CSV File',
            filters: [{
                name: 'CSV files',
                extensions: ['csv']
            }]
        }, (filename) => {
            if (!filename) {
                // silence error thrown when user cancels the save dialog
                return;
            }

            fs.writeFileSync(
                filename,
                Buffer.from(url.slice(1 + url.indexOf(',')), 'base64').toString()
            );
        });
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    setupMenus(app, mainWindow);

});

// close the app when windows is closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
