import { app, BrowserWindow, Menu, crashReporter, shell } from 'electron';
import restify from 'restify';
import parse from './parse';
import SequelizeManager from './sequelizeManager';

const sequelizeManager = new SequelizeManager();
const ipcMain = require('electron').ipcMain;

let menu;
let template;
let mainWindow = null;

crashReporter.start();

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
        height: 728
    });

    mainWindow.loadURL(`file://${__dirname}/app/app.html`);

    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.show();
        mainWindow.focus();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    const server = restify.createServer();
    server.use(restify.queryParser());
    server.use(restify.CORS({
        origins: ['*'],   // defaults to ['*']
        credentials: false,                 // defaults to false
        headers: ['Access-Control-Allow-Origin']  // sets expose-headers
    }));

    server.listen(5000, () => {
    });

    mainWindow.webContents.on('did-finish-load', () => {
        ipcMain.on('connect', (event, payload) => {
            sequelizeManager.login(payload)
            .then(msg => {
                event.sender.send('channel', { log: `logged in, msg: ${msg}` });
            })
            .then( () => {
                sequelizeManager.connection.query('SHOW DATABASES')
                    .spread((rows, metadata) => {
                        event.sender.send('channel', {databases: rows, metadata, error: '', tables: ''});
                        return null;
                    });
            })
            .catch(error => {
                event.sender.send('channel', { error });
                });
        });

        ipcMain.on('receive', (event, payload) => {
            const statement = payload.statement;
            sequelizeManager.connection.query(statement)
            .spread((rows, metadata) => {
                event.sender.send('channel', {rows, metadata, error: ''});
            }).catch(error => {
                event.sender.send('channel', { error });
            });
        });

        ipcMain.on('useDatabase', (event, database) => {
            sequelizeManager.login(payload)
            .then(msg => {
                event.sender.send('channel', { log: `logged in, msg: ${msg}` });
            })
            .then( () => {
                sequelizeManager.connection.query('SHOW TABLES')
                    .spread((rows, metadata) => {
                        event.sender.send('channel', {databases: rows, metadata, error: '', tables: ''});
                        return null;
                    });
            })
            .catch(error => {
                event.sender.send('channel', { error });
                });
        });

        ipcMain.on('disconnect', (event) => {
            console.warn('disconnect');
            sequelizeManager.disconnect();
            event.sender.send('channel', { log: 'You are logged out'});
        });


        server.get('/query', (req, res) => {
            const statement = req.query.statement;
            mainWindow.webContents.send('channel', { log: statement });
            sequelizeManager.connection.query(statement).spread((rows, metadata) => {
                // Send back to app
                mainWindow.webContents.send('channel', { rows, metadata, error: '' });
                // Send back to plotly 2.0
                res.send(parse(rows));
            }).catch(error => {
                event.sender.send('channel', { error });
                res.send({ error });
            });
        });
    });

    if (process.env.NODE_ENV === 'development') {
        mainWindow.openDevTools();
    }

    if (process.platform === 'darwin') {
        template = [{
            label: 'Electron',
            submenu: [{
                label: 'About ElectronReact',
                selector: 'orderFrontStandardAboutPanel:'
            }, {
                type: 'separator'
            }, {
                label: 'Services',
                submenu: []
            }, {
                type: 'separator'
            }, {
                label: 'Hide ElectronReact',
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
                    shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme');
                }
            }, {
                label: 'Community Discussions',
                click() {
                    shell.openExternal('https://discuss.atom.io/c/electron');
                }
            }, {
                label: 'Search Issues',
                click() {
                    shell.openExternal('https://github.com/atom/electron/issues');
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
                    shell.openExternal('http://electron.atom.io');
                }
            }, {
                label: 'Documentation',
                click() {
                    shell.openExternal('https://github.com/atom/electron/tree/master/docs#readme');
                }
            }, {
                label: 'Community Discussions',
                click() {
                    shell.openExternal('https://discuss.atom.io/c/electron');
                }
            }, {
                label: 'Search Issues',
                click() {
                    shell.openExternal('https://github.com/atom/electron/issues');
                }
            }]
        }];
        menu = Menu.buildFromTemplate(template);
        mainWindow.setMenu(menu);
    }
});
