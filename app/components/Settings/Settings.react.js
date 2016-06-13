import React, {Component, PropTypes} from 'react';
import styles from './Settings.css';
import DatabaseDropdown from './DatabaseDropdown/DatabaseDropdown.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import UserCredentials from './UserCredentials/UserCredentials.react';
import LoggerController from './Logger/LoggerController.react';
import PreviewController from './Preview/PreviewController.react';
import EngineSelector from './EngineSelector/EngineSelector.react';
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

        const dialectSelector = (
            <div>
                <EngineSelector
                    configActions={configActions}
                    configuration={configuration}
                />
            </div>
        );

        const userCredentials = (
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

        const databaseDropdown = (
            <div>

                <DatabaseDropdown
                    configuration={configuration}
                    merge={merge}
                    ipcActions={ipcActions}
                    ipc={ipc}
                />

                <div className={styles.previewController}>
                    <PreviewController ipc={ipc}/>
                </div>

            </div>
        );

        const logger = (
            <LoggerController ipc={ipc}/>
        );

        const step1 = (
            <div>
                <h5>1. Connect to Database</h5>
                <div className={styles.configurationOptions}>
                    <div className={styles.dialectSelector}>
                        {dialectSelector}
                    </div>
                    <div className={styles.userCredentials}>
                        {userCredentials}
                    </div>
                </div>
                <div className={styles.connectButton}>
                    {connectButton}
                </div>
            </div>
        );

        let step2 = null;
        let step3 = null;

        if (connection.get('status') === APP_STATUS_CONSTANTS.CONNECTED) {
            step2 = (
                <div className={styles.step2Container}>
                    <h5>2. Test Connection and Preview Tables</h5>
                    {databaseDropdown}
                </div>
            );

            step3 = (
                <div className={styles.step2Container}>
                    <h5>3. Query from Plotly 2.0</h5>
                    <div>
                        Open <a href="">Plotly 2.0</a> and make queries through this connector.
                        {" Remember to keep this app running while you're making queries!"}
                    </div>
                </div>
            );
        }

        const logContainer = (
            <div className={styles.logContainer}>
                <hr/>
                <div className={styles.log}>
                    {logger}
                </div>
            </div>
        );

        return (
            <div className={styles.containerWrapper}>

                <div className={styles.container}>
                    <img
                        src="./images/plotlyLogo.png"
                        className={styles.plotlyLogo}
        >
                    </img>
                    <h4>
                        Plotly 2.0 Database Connector
                    </h4>

                    {step1}
                    {step2}
                    {step3}
                    {logContainer}

                </div>

            </div>
        );
    }
}
