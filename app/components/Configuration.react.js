import cookie from 'react-cookies';
import React, { Component, PropTypes } from 'react';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Settings from './Settings/Settings.react';
import {isElectron} from '../utils/utils';
import * as SessionsActions from '../actions/sessions';
import Login from './Login.react';


class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMenuOpen: false,
            username: cookie.load('db-connector-user'),
            /* global PLOTLY_ENV */
            authDisabled: !PLOTLY_ENV.AUTH_ENABLED
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
        if (isElectron()) {
            window.require('electron').ipcRenderer.once('username',
                (event, message) => {
                    this.setState({username: message});
                });
        }
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
      cookie.remove('db-connector-auth-disabled');
      this.setState({ username: ''});

      // reload page when running in browser:
      if (!isElectron()) {
          window.location.reload();
      }
    }

    render() {
        return (isElectron() || this.state.authDisabled || this.state.username) ? (
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
