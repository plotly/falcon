import React, {Component, PropTypes} from 'react';
import styles from './Settings.css';
import classnames from 'classnames';
import DatabaseDropdown from './DatabaseDropdown.react';
import ConnectButton from './ConnectButton.react';
import UserCredentials from './UserCredentials.react';
import Logos from './Logos.react';

export default class Settings extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {configuration, configActions, ipc, ipcActions} = this.props;
        const {merge} = configActions;

        /*
            Dissapears once an engine is chosen.
            TODO: more instruction steps to be added here that are
            toggled off once met.
        */
        let messageChooseEngine;
        if (configuration.get('engine') === null) {
            messageChooseEngine =
            <h5>Please select a database engine</h5>;
        } else {
            messageChooseEngine = <h5></h5>;
        }

        return (
            <div style={{width: '100%'}}>
                <h2>Configuration</h2>
                <div>
                    {messageChooseEngine}

                    <Logos
                        merge={merge}
                    />
                </div>
                <UserCredentials
                    configuration={configuration}
                    merge={merge}
                />

                <ConnectButton
                    configuration={configuration}
                    ipc={ipc}
                    ipcActions={ipcActions}
                />

                <DatabaseDropdown
                    configuration={configuration}
                    merge={merge}
                    ipcActions={ipcActions}
                    ipc={ipc}
                />

                <hr/>
                config
                <pre>
                    {JSON.stringify(this.props.configuration.toJS())}
                </pre>
                tables
                <pre>
                    {JSON.stringify(this.props.ipc.toJS().tables, null, 2)}
                </pre>
                rows
                <pre>
                    {JSON.stringify(this.props.ipc.toJS().rows, null, 2)}
                </pre>

            </div>
        );
    }
}
