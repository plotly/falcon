import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './Settings.css';
import DatabaseDropdown from './DatabaseDropdown/DatabaseDropdown.react';
import TableDropdown from './TableDropdown/TableDropdown.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import UserCredentials from './UserCredentials/UserCredentials.react';
import LoggerController from './Logger/LoggerController.react';
import Preview from './Preview/Preview.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import {APP_STATUS} from '../../constants/constants';
import {OPTIONS} from '../../../sequelizeManager';

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

        const dialectSelector = (
            <div>
                <DialectSelector
                    configActions={configActions}
                    configuration={configuration}
                />
            </div>
        );

        const userCredentials = (
            <UserCredentials
                configuration={configuration}
                configActions={configActions}
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

        let tablePreview = null;
        if (ipc.has('previews')) {
            tablePreview = (
                <div className={styles.previewController}>
                    <Preview
                        ipcActions={ipcActions}
                        ipc={ipc}
                    />
                </div>
            );
        }

        const selectDatabaseTable = (
            <div>

                <DatabaseDropdown
                    configuration={configuration}
                    configActions={configActions}
                    ipc={ipc}
                    ipcActions={ipcActions}
                />

                <TableDropdown
                    ipc={ipc}
                    ipcActions={ipcActions}
                />

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
        if (connection.get('status') === APP_STATUS.CONNECTED ||
            connection.get('status') === APP_STATUS.ERROR) {
            step2 = (
                <div className={styles.step2Container}>
                    <h5>2. Preview Database and Tables</h5>
                    {selectDatabaseTable}
                    {tablePreview}
                </div>
            );

            step3 = (
                /*eslint-disable */
                <div className={styles.step3Container}>
                    <h5>3. Query from Plotly 2.0</h5>
                    <div className={styles.futureDirections}>
                        Query data by clicking on 'import data' from
                        {" "}

                        <a href="javascript:require('electron').shell.openExternal('https://plot.ly/alpha/workspace');">
                        plotly workspace</a>


                        {" "}
                        and choose the SQL option.<br/>
                        Remember to keep this app running
                        while you are making queries!
                    </div>
                </div>
                /*eslint-disable */

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
        /*eslint-disable */
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
                    <div className={styles.info}>
                        This application is running on {" "}
                        <u>http://localhost:{OPTIONS.port}</u> and {" "}
                        <u>https://connector.plot.ly:{OPTIONS.port + 1}</u>
                        <br/>
                        Learn more
                        {" "}
                        <a href="javascript:require('electron').shell.openExternal('https://github.com/plotly/plotly-database-connector/issues/51');">here</a>
                        {" "}
                        about setting up a connection using https.
                    </div>
                    {step1}
                    {step2}
                    {step3}
                    {logContainer}

                </div>

            </div>
        );
        /*eslint-disable */
    }
}

Settings.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    configActions: PropTypes.object,
    ipc: ImmutablePropTypes.map.isRequired,
    ipcActions: PropTypes.object,
    connection: ImmutablePropTypes.map.isRequired,
    connectionActions: PropTypes.object
};
