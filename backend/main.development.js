import {app, BrowserWindow} from 'electron';
import {contains} from 'ramda';
import {Logger} from './logger';
import {SequelizeManager, OPTIONS} from './sequelizeManager';
import {ipcMessageReceive,
        serverMessageReceive,
        channel} from './messageHandler';
import {setupHTTP, setupHTTPS, findSelfSignedCert} from './setupServers';
import {setupMenus} from './menus';

const ipcMain = require('electron').ipcMain;

let mainWindow = null;

if (process.env.NODE_ENV === 'development') {
    require('electron-debug')();
}

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        show: false,
        width: 1024,
        height: OPTIONS.large ? 1024 : 728
    });

    const logger = new Logger(OPTIONS, mainWindow, channel);

    const sequelizeManager = new SequelizeManager(logger);

    // TODO: issue #65 shell scripts for HTTPS setup may not work on windows atm
    const canSetupHTTPS = (
        (process.platform === 'darwin' || process.platform === 'linux') &&
        !contains('--test-type=webdriver', process.argv.slice(2))
    );

    sequelizeManager.log('Starting Application...', 0);

    mainWindow.loadURL(`file://${__dirname}/../app/app.html`);

    mainWindow.webContents.on('did-finish-load', () => {

        // show window if it's not running in headless mode
        if (!OPTIONS.headless &&
            !contains('--test-type=webdriver', process.argv.slice(2))) {
            sequelizeManager.log('Opening main window.', 2);
            mainWindow.show();
            mainWindow.focus();
        }

        ipcMain.removeAllListeners(channel);
        ipcMain.on(
            channel,
            ipcMessageReceive(sequelizeManager, mainWindow, OPTIONS)
        );

        setupHTTP({
            sequelizeManager, serverMessageReceive,
            mainWindow, OPTIONS
        });

        mainWindow.webContents.send(channel, {
            canSetupHTTPS: true
        });

        if (canSetupHTTPS) {
            const hasSelfSignedCert = findSelfSignedCert();
            mainWindow.webContents.send(channel, {
                    hasSelfSignedCert: hasSelfSignedCert
            });
            if (hasSelfSignedCert) {
                setupHTTPS({
                    sequelizeManager, serverMessageReceive,
                    mainWindow, OPTIONS
                });
            }
        }

    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.openDevTools();
    }

    setupMenus(app, mainWindow);

});
