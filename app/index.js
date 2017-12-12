import React from 'react';
import {render} from 'react-dom';
import {Provider} from 'react-redux';
import {Route, Router, browserHistory} from 'react-router';

import configureStore from './store/configureStore';
import {build, version} from '../package.json';

import Login from './components/Login.react';
import Configuration from './components/Configuration.react';
import Status from './components/Oauth.react';
import {homeUrl, isOnPrem} from './utils/utils';

const store = configureStore();

window.document.title = isOnPrem() ?
    `${build.productName}` :
    `${build.productName} v${version}`;

render(
    <Provider store={store}>
      <Router history={browserHistory}>
        <Route path={homeUrl() + '/'} component={Configuration} />
        <Route path={homeUrl() + '/login'} component={Login} />
        <Route path={homeUrl() + '/oauth2/callback'} component={Status} />
      </Router>
    </Provider>,
    document.getElementById('root')
);
