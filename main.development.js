import { app, BrowserWindow, Menu, crashReporter, shell } from 'electron';
import { createStore, applyMiddleware, compose } from 'redux';
import { electronEnhancer } from 'redux-electron-store';
import Immutable from 'immutable';
import Sequelize from 'sequelize';
import restify from 'restify';

const ipcMain = require('electron').ipcMain;

let menu;
let template;
let mainWindow = null;

crashReporter.start();


if (process.env.NODE_ENV === 'development') {
  require('electron-debug')();
}

/*
// REDUX STORE
let enhancer = compose(
  // applyMiddleware(...middleware),
  electronEnhancer()
);

const initialState = Immutable.Map({
    query: 'asdfasdfasdf',
    status: true,
    config: {
        username: 'chris',
        pw: 'test'
    }
});

function reducer(state = initialState, action) {
    switch (action.type) {
        case 'update':
            state = state.set(action.key, action.value);
            console.warn('updating store: ', state.toJS());
            return state;
        default:
            return state;
    }
}

// Note: passing enhancer as the last argument to createStore requires redux@>=3.1.0
let i = 99;
// const initialState = Immutable.Map({test: i});
const store = createStore(reducer, initialState, electronEnhancer());

setInterval(() => {
    console.warn(`dispatching ${i}`);
    i += 1;
    store.dispatch({type: 'update', key: 'test', value: i});
}, 10000);
*/


//////////

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




  function parse(data) {

      var nrows = data.length;

      if (nrows === undefined || nrows === null){
          keys = ['message'];
          nrows = 1;
          ncols = 1;
          rows = [['command executed']];
      }else{
          var rows = [];
          var ncols = Object.keys(data[0]).length;
          var keys = Object.keys(data[0]);

          for (var i = 0; i < nrows; i++) {
              var row = [];
              for (var j = 0; j < ncols; j++) {
                  row.push(data[i][keys[j]]);
              };
              rows.push(row);
          };
      };
      const data_formatted = { 'columnnames': keys, 'ncols': ncols, 'nrows': nrows, 'rows': rows };

      return data_formatted;

  };













const server = restify.createServer();
server.use(restify.queryParser());
server.use(restify.CORS({
    origins: ['*'],   // defaults to ['*']
    credentials: false,                 // defaults to false
    headers: ['Access-Control-Allow-Origin']  // sets expose-headers
}));

server.listen(5000, function(){
    console.log('%s listening at %s', server.name, server.url);
})


// extract variables from the sent url to localhost 5000
var usr = 'readonly';
var psw = 'password';
var db = 'world';
var prt = 3308;
var engine = 'mysql';

console.log('Trying to connect to database ' + db + ' as ' + usr);

const sequelize = new Sequelize(db, usr, psw, {
    dialect: engine, // 'mysql'|'mariadb'|'sqlite'|'postgres'|'mssql'
    port:    prt, // or 5432 (for postgres)
});

mainWindow.webContents.on('did-finish-load', function() {

    console.warn('making request');
    sequelize.authenticate().then(msg => {
        console.warn('succcess: ', msg);
        mainWindow.webContents.send('channel', {success: msg});

    }).catch(err => {
        console.warn('failed: ', err);
        mainWindow.webContents.send('channel', {error: err});
    });

    ipcMain.on('receive', function(event, payload) {
        console.log('payload: ', payload);

        sequelize.query(payload.statement).spread((rows, metadata) => {
            const response = {rows, metadata, error: ''};
            event.sender.send('channel', response);
        }).catch(err => {
            console.warn('ERROR: ', err);
            event.sender.send('channel', {error: err});
        });

    });


    server.get('/query', function(req, res, next) {
        console.warn('query: ', req.query.statement);
        const statement = req.query.statement;
        mainWindow.webContents.send('channel', {log: statement});
        sequelize.query(statement).spread((rows, metadata) => {
            const response = {rows, metadata, error: ''};

            // Send back to app
            mainWindow.webContents.send('channel', response);

            // Send back to plotly 2.0
            const parsedResponse = parse(rows);
            console.warn('response: ', parsedResponse);
            res.send(parsedResponse);
        }).catch(err => {
            console.warn('ERROR: ', err);
            mainWindow.webContents.send('channel', {error: err});
            res.send({err});
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
