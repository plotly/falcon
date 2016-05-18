import React from 'react';
import { Route, IndexRoute } from 'react-router';
import App from './containers/App';
import HomePage from './containers/HomePage';
import ConfigurationPage from './containers/ConfigurationPage';

export default (
    <Route path="/" component={App}>
    <IndexRoute component={HomePage} />
    <Route path="/configuration" component={ConfigurationPage} />
    </Route>
);
