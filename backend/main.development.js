import {app, BrowserWindow} from 'electron';
import {contains, join} from 'ramda';
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

    const URL = `${server.protocol}://${server.domain}`;
    const SETTINGS = join('&',
        [
            'APP_DIRECTORY',
            'PLOTLY_API_DOMAIN',
            'PORT'
        ].map(s => {
            return `${s}=${getSetting(s)}`;
    }));

    console.log(`Visit ${URL}:${getSetting('PORT')}`);
    // TODO - Does this work too?
    // mainWindow.loadURL(`http://localhost:${getSetting('PORT')}`);

    // Provide the port of the server to the front-end as a query string param.
    mainWindow.loadURL(`file://${__dirname}/../static/setup.html?URL=${URL}&${SETTINGS}`);
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
