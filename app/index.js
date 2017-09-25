import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {Route, Router, hashHistory, browserHistory} from 'react-router'

import configureStore from './store/configureStore';
import {productName, version} from '../package.json';

import Login from './components/Login.react'
import Configuration from './components/Configuration.react'
import Status from './components/Oauth.react'

const store = configureStore();

window.document.title = `${productName} v${version}`;

render(
    <Provider store={store}>
      <Router history={browserHistory}>
        <Route exact path='/' component={Configuration} />
        <Route path='/login' component={Login} />
        <Route path='/oauth2' component={Status} />
      </Router>
    </Provider>,
    document.getElementById('root')
);
