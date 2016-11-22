import {app, BrowserWindow, ipcMain} from 'electron';
import {contains} from 'ramda';

import Logger from './logger';
import {SequelizeManager, OPTIONS} from './sequelizeManager';
import QueryScheduler from './persistent/QueryScheduler.js';
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
        height: OPTIONS.large ? 1024 : 728
    });

    const URL = `${server.protocol}://${getSetting('CONNECTOR_HTTPS_DOMAIN')}`;
    console.log('URL', URL);
    // TODO - Does this work too?
    // mainWindow.loadURL(`http://localhost:${getSetting('PORT')}`);
    // Provide the port of the server to the front-end as a query string param.
    mainWindow.loadURL(`file://${__dirname}/../app/app.html?url=${URL}&port=${getSetting('PORT')}`);

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
