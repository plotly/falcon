import cookie from 'react-cookies';
import React, { Component, PropTypes } from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';

import Login from './Login.react.js';
import * as SessionsActions from '../actions/sessions.js';
import Settings from './Settings/Settings.react.js';
import {isElectron, setUsernameListener} from '../utils/utils.js';


class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            authEnabled: (cookie.load('db-connector-auth-enabled') === 'true'),
            clientId: cookie.load('db-connector-client-id'),
            isMenuOpen: false,
            username: cookie.load('db-connector-user')
        };
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
        this.logOut = this.logOut.bind(this);

        /*
         * If this is an electron app, then we don't have access to cookies and
         * we don't require authentication in the API.
         * In the browser, the username is set with a cookie but in electron
         * this is set using electron's ipcRenderer.
         */
        setUsernameListener((event, message) => {
            this.setState({username: message});}
        );
    }

    toggle() {
        this.setState({ isMenuOpen: !this.state.isMenuOpen });
    }

    close() {
        this.setState({ isMenuOpen: false });
    }

    logOut() {
        /*
         * Delete all the cookies and reset user state. This does not kill
         * any running connections, but user will not be able to access them
         * without logging in again.
         */
        cookie.remove('db-connector-user');
        cookie.remove('plotly-auth-token');
        cookie.remove('db-connector-auth-token');
        this.setState({ username: ''});

        // reload page when running in browser:
        if (!isElectron()) {
            window.location.reload();
        }
    }

    render() {
        return (isElectron() || !this.state.authEnabled || this.state.username) ? (
            <div className="fullApp">
                <Settings username={this.state.username} logout={this.logOut}/>
            </div>
        ) : (
            <div className="fullApp">
                <Login/>
            </div>
        );
    }
}

Configuration.propTypes = {
    sessionsActions: PropTypes.object
};

function mapStateToProps(state) {
    return {sessions: state.sessions};
}

function mapDispatchToProps(dispatch) {
    const sessionsActions = bindActionCreators(SessionsActions, dispatch);
    return {sessionsActions};
}

export default connect(mapStateToProps, mapDispatchToProps)(Configuration);
