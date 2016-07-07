import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';


export default class Configuration extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                <Settings
                    configuration={this.props.configuration}
                    configActions={this.props.configActions}
                    ipcActions={this.props.ipcActions}
                    ipc={this.props.ipc}
                    connection={this.props.connection}
                    connectionActions={this.props.connectionActions}
                />;
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
