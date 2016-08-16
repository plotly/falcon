import {app, BrowserWindow, Menu, shell} from 'electron';
import {contains} from 'ramda';
import {Logger} from './logger';
import {SequelizeManager, OPTIONS} from './sequelizeManager';
import {ipcMessageReceive,
        serverMessageReceive,
        channel} from './messageHandler';
import {setupHTTP, setupHTTPS, findSelfSignedCert} from './setupServers';


const ipcMain = require('electron').ipcMain;

let menu;
let template;
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
        width: OPTIONS.large ? 1024 : 728,
        height: 728
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
        if (!OPTIONS.headless) {
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
                    hasSelfSignedCert: true
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

    if (process.platform === 'darwin') {
        template = [{
            label: 'Plotly Database Connector',
            submenu: [{
                label: 'About Plotly Database Connector',
                selector: 'orderFrontStandardAboutPanel:'
            }, {
                type: 'separator'
            }, {
                label: 'Services',
                submenu: []
            }, {
                type: 'separator'
            }, {
                label: 'Hide Plotly Database Connector',
                accelerator: 'Command+H',
                selector: 'hide:'
            }, {
                label: 'Hide Others',
                accelerator: 'Command+Shift+H',
                selector: 'hideOtherApplications:'
            }, {
                label: 'Show All',
                selector: 'unhideAllApplications:'
            }, {
                type: 'separator'
            }, {
                label: 'Quit',
                accelerator: 'Command+Q',
                click() {
                    app.quit();
                }
            }]
        }, {
            label: 'Edit',
            submenu: [{
                label: 'Undo',
                accelerator: 'Command+Z',
                selector: 'undo:'
            }, {
                label: 'Redo',
                accelerator: 'Shift+Command+Z',
                selector: 'redo:'
            }, {
                type: 'separator'
            }, {
                label: 'Cut',
                accelerator: 'Command+X',
                selector: 'cut:'
            }, {
                label: 'Copy',
                accelerator: 'Command+C',
                selector: 'copy:'
            }, {
                label: 'Paste',
                accelerator: 'Command+V',
                selector: 'paste:'
            }, {
                label: 'Select All',
                accelerator: 'Command+A',
                selector: 'selectAll:'
            }]
        }, {
            label: 'View',
            submenu: (process.env.NODE_ENV === 'development') ? [{
                label: 'Reload',
                accelerator: 'Command+R',
                click() {
                    mainWindow.restart();
                }
            }, {
                label: 'Toggle Full Screen',
                accelerator: 'Ctrl+Command+F',
                click() {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }, {
                label: 'Toggle Developer Tools',
                accelerator: 'Alt+Command+I',
                click() {
                    mainWindow.toggleDevTools();
                }
            }] : [{
                label: 'Toggle Full Screen',
                accelerator: 'Ctrl+Command+F',
                click() {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }]
        }, {
            label: 'Window',
            submenu: [{
                label: 'Minimize',
                accelerator: 'Command+M',
                selector: 'performMiniaturize:'
            }, {
                label: 'Close',
                accelerator: 'Command+W',
                selector: 'performClose:'
            }, {
                type: 'separator'
            }, {
                label: 'Bring All to Front',
                selector: 'arrangeInFront:'
            }]
        }, {
            label: 'Help',
            submenu: [{
                label: 'Learn More',
                click() {
                    shell.openExternal('http://electron.atom.io');
                }
            }, {
                label: 'Documentation',
                click() {
                    shell.openExternal('https://github.com/' +
                        'atom/electron/tree/master/docs#readme');
                }
            }, {
                label: 'Community Discussions',
                click() {
                    shell.openExternal('https://discuss.atom.io/c/electron');
                }
            }, {
                label: 'Search Issues',
                click() {
                    shell.openExternal('https://github.com/' +
                        'atom/electron/issues');
                }
            }]
        }];
        menu = Menu.buildFromTemplate(template);
        Menu.setApplicationMenu(menu);
    } else {
        template = [{
            label: '&File',
            submenu: [{
                label: '&Open',
                accelerator: 'Ctrl+O'
            }, {
                label: '&Close',
                accelerator: 'Ctrl+W',
                click() {
                    mainWindow.close();
                }
            }]
        }, {
            label: '&View',
            submenu: (process.env.NODE_ENV === 'development') ? [{
                label: '&Reload',
                accelerator: 'Ctrl+R',
                click() {
                    mainWindow.restart();
                }
            }, {
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click() {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }, {
                label: 'Toggle &Developer Tools',
                accelerator: 'Alt+Ctrl+I',
                click() {
                    mainWindow.toggleDevTools();
                }
            }] : [{
                label: 'Toggle &Full Screen',
                accelerator: 'F11',
                click() {
                    mainWindow.setFullScreen(!mainWindow.isFullScreen());
                }
            }]
        }, {
            label: 'Help',
            submenu: [{
                label: 'Learn More',
                click() {
                    shell.openExternal('https://github.com/plotly/' +
                        'plotly-database-connector/blob/master');
                }
            }, {
                label: 'Documentation',
                click() {
                    shell.openExternal('https://github.com/plotly/' +
                        'plotly-database-connector/blob/master/README.md');
                }
            }, {
                label: 'Search Issues',
                click() {
                    shell.openExternal('https://github.com/plotly/' +
                        'plotly-database-connector/issues');
                }
            }]
        }];
        menu = Menu.buildFromTemplate(template);
        mainWindow.setMenu(menu);
    }
});
