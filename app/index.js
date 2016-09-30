import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {Router, hashHistory} from 'react-router';
import {syncHistoryWithStore} from 'react-router-redux';
import routes from './routes';
import configureStore from './store/configureStore';
import {updateIpcState} from './actions/sessions';
import {productName, version} from '../package.json';
import './app.global.css';

const store = configureStore();
const history = syncHistoryWithStore(hashHistory, store);

const ipcRenderer = require('electron').ipcRenderer;
ipcRenderer.on('CHANNEL', function(event, message) {
    store.dispatch(updateIpcState(message));
});

window.document.title = `${productName} v${version}`;

render(
    <Provider store={store}>
        <Router
            history={history}
            routes={routes}
        />
    </Provider>,
    document.getElementById('root')
);
