import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styles from './Configuration.css';
import Settings from './Settings/Settings.react';
import Monitor from './Monitor/Monitor.react';

const TABS = {
    SETTINGS: 'SETTINGS',
    MONITOR: 'MONITOR'
};

export default class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            query: '',
            currentTab: TABS.SETTINGS
        };
    }

    render() {

        let content;
        if (this.state.currentTab === TABS.SETTINGS) {
            content = <Settings
                configuration={this.props.configuration}
                configActions={this.props.configActions}
                ipcActions={this.props.ipcActions}
                ipc={this.props.ipc}
                connection={this.props.connection}
                connectionActions={this.props.connectionActions}
            />;
        } else {
            content = <Monitor/>;
        }

        return (
            <div>
                {content}
            </div>
        );
    }
}

Configuration.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    configActions: PropTypes.object,
    ipc: ImmutablePropTypes.map.isRequired,
    ipcActions: PropTypes.object,
    connection: ImmutablePropTypes.map.isRequired,
    connectionActions: PropTypes.object
};
