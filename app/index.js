import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';

import configureStore from './store/configureStore';

import {productName, version} from '../package.json';
import './styles/app.global.css';

const store = configureStore();

import ConfigurationPage from './containers/ConfigurationPage';

window.document.title = `${productName} v${version}`;

render(
    <Provider store={store}>
        <ConfigurationPage/>
    </Provider>,
    document.getElementById('root')
);
