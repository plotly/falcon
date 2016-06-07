import React, {Component, PropTypes} from 'react';
import styles from './Settings.css';
import DatabaseDropdown from './DatabaseDropdown.react';
import ConnectButton from './ConnectButton.react';
import UserCredentials from './UserCredentials.react';
import LoggerController from './LoggerController.react';
import PreviewController from './PreviewController.react';
import Logos from './Logos.react';
import {APP_STATUS_CONSTANTS} from '../../reducers/connection';

export default class Settings extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {
            configuration, configActions,
            ipc, ipcActions,
            connection, connectionActions
        } = this.props;
        const {merge} = configActions;

        const selectDatabase = (
            <div>
                <Logos
                    configActions={configActions}
                    configuration={configuration}
                />
            </div>
        );

        const credentials = (
            <UserCredentials
                configuration={configuration}
                merge={merge}
            />
        );

        const connectButton = (
            <ConnectButton
                configuration={configuration}
                connection={connection}
                connectionActions={connectionActions}
                ipc={ipc}
                ipcActions={ipcActions}
            />
        );

        const testConnection = (
            <div>

                <DatabaseDropdown
                    configuration={configuration}
                    merge={merge}
                    ipcActions={ipcActions}
                    ipc={ipc}
                />

                <div style={{maxHeight: 500, maxWidth: '100%', overflowY: 'scroll'}}>
                    <PreviewController ipc={ipc}/>
                </div>

            </div>
        );

        const logs = (
            <LoggerController ipc={ipc}/>
        );

        const step1 = (
            <div>
                <h5>1. Connect to Database</h5>
                <div style={{width: '100%'}}>
                    <div style={{float: 'left', display: 'inline-block'}}>
                        {selectDatabase}
                    </div>
                    <div style={{width: 300, marginLeft: 50, float: 'left', display: 'inline-block'}}>
                        {credentials}
                    </div>
                </div>
                <div style={{clear: 'left', paddingTop: 30}}>
                    {connectButton}
                </div>
            </div>
        );

        let step2 = null;
        let step3 = null;

        if (connection.get('status') === APP_STATUS_CONSTANTS.CONNECTED) {
            step2 = (
                <div style={{paddingTop: 60}}>
                    <h5>2. Test Connection and Preview Tables</h5>
                    {testConnection}
                </div>
            );

            step3 = (
                <div style={{paddingTop: 60}}>
                    <h5>3. Query from Plotly 2.0</h5>
                    <div>
                        Open <a href="">Plotly 2.0</a> and make queries through this connector.
                        {" Remember to keep this app running while you're making queries!"}
                    </div>
                </div>
            );
        }

        const logContainer = (
            <div style={{marginTop: 40}}>
                <hr/>
                <div style={{marginBottom: 100}}>
                    {logs}
                </div>
            </div>
        );

        return (
            <div style={{width: '100%'}}>

                <div style={{width: 600, marginLeft: 'auto', marginRight: 'auto'}}>

                    <h4>Plotly 2.0 Database Connector</h4>

                    {step1}
                    {step2}
                    {step3}
                    {logContainer}

                </div>

            </div>
        );
    }
}
