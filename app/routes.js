import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import ConfigurationPage from './containers/ConfigurationPage';

// TODO: remove react-router
export default (
    <Route path="/" component={ConfigurationPage}></Route>
);
