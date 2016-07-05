import React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { Router, hashHistory } from 'react-router';
import { syncHistoryWithStore } from 'react-router-redux';
import routes from './routes';
import configureStore from './store/configureStore';
import './app.global.css';
import { updateState } from './actions/ipc';
import {productName, version} from '../package.json';

const store = configureStore();
const history = syncHistoryWithStore(hashHistory, store);

const ipcRenderer = require('electron').ipcRenderer;
ipcRenderer.on('channel', function(event, message) {
    console.log('index.js', message);
    store.dispatch(updateState(message));
});

window.document.title = `${productName} v${version}`;

render(
    <Provider store={store}>
    <Router history={history} routes={routes} />
    </Provider>,
    document.getElementById('root')
);
