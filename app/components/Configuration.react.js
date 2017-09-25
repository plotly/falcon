import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {bindActionCreators} from 'redux';
import {connect} from 'react-redux';
import Settings from './Settings/Settings.react';
import {baseUrl} from '../utils/utils';
import {Link} from './Link.react';
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
            isMenuOpen: false
        }
        this.toggle = this.toggle.bind(this);
        this.close = this.close.bind(this);
    }

    toggle() {
        this.setState({ isMenuOpen: !this.state.isMenuOpen });
    }

    close() {
        this.setState({ isMenuOpen: false });
    }

    render() {
        const menuOptions = {
            isOpen: this.state.isMenuOpen,
            close: this.close,
            toggle: <button type="button" onClick={this.toggle}>MENU</button>,
            align: 'right',
            animate: false
        };

        return (
            <div className="fullApp">
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
