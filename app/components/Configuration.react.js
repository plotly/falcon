import cookie from 'react-cookies'
import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Settings from './Settings/Settings.react';
import {baseUrl, isElectron} from '../utils/utils';
import {Link} from 'react-router'
import {contains} from 'ramda';
import * as SessionsActions from '../actions/sessions';

const LINKS = {
    PLANS: 'http://plot.ly/plans/',
    DOCS: 'http://help.plot.ly/database-connectors/',
    TYPEFORM: 'https://plotly.typeform.com/to/KUiCSl',
    GITHUB: 'https://github.com/plotly/plotly-database-connector',
    ABOUT: 'https://plot.ly/database-connectors/'
};
const ONPREM = contains('external-data-connector', window.location.href);

class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            isMenuOpen: false,
            username: cookie.load('db-connector-user')
        }
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
        this.logOut = this.logOut.bind(this);

        /*
         * If this is an electron app, then we don't have access to cookies and
         * we don't require authentication in the API.
         * In the browser, the username is set with a cookie but in electron
         * this is set using electron's ipcRenderer.
         */
        if(isElectron()) {
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
      this.setState({ username: ''});

      // reload page when running in browser:
      if (!isElectron()) {
          window.location.reload()
      }
    }

    render() {
        const menuOptions = {
            isOpen: this.state.isMenuOpen,
            close: this.close,
            toggle: <button type="button" onClick={this.toggle}>MENU</button>,
            align: 'right',
            animate: false
        };
        const loginMessage = this.state.username ?
                             <div className="supportLinksContainer">
                                 Logged in as "{this.state.username}" &nbsp;
                                 <Link onClick={this.logOut} >
                                     Log Out
                                 </Link>
                             </div>
                             :
                             <div>
                                 <Link to="/login" >Log In</Link>
                             </div>

        return (
            <div className="fullApp">
                {loginMessage}
                <Settings/>
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
