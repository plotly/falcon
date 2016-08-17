import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {shell} from 'electron';
import * as styles from './Settings.css';
import DatabaseDropdown from './DatabaseDropdown/DatabaseDropdown.react';
import TableDropdown from './TableDropdown/TableDropdown.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import UserCredentials from './UserCredentials/UserCredentials.react';
import LoggerController from './Logger/LoggerController.react';
import Preview from './Preview/Preview.react';
import HttpsInstructions from './HttpsInstructions/HttpsInstructions.react';
import DetectHttpsServer from './DetectHttpsServer/DetectHttpsServer.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import {APP_STATUS} from '../../constants/constants';
import {OPTIONS} from '../../../sequelizeManager';

const httpsGithubIssue = 'https://github.com/plotly/' +
                         'plotly-database-connector/issues/51';

const plotlyWorkspace = 'https://plot.ly/alpha/workspace';

export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            expandInstructions: false
        };
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
        let step4 = null;
        if (connection.get('status') === APP_STATUS.CONNECTED ||
            connection.get('status') === APP_STATUS.ERROR) {
            step2 = (
                <div className={styles.step2Container}>
                    <h5>2. Preview Database and Tables</h5>
                    {selectDatabaseTable}
                    {tablePreview}
                </div>
            );


            // TODO - pass process.platform up and only show this if we're on mac or linux
            const step3Header = (<h5>3. Secure your connection with HTTPS</h5>);

            let step3Certs = null;
            if (ipc.get('hasSelfSignedCert')) {
                step3Certs = (
                    <div>✓ This app is successfully running on HTTPS.</div>
                );
            } else {
                step3Certs = (
                    <div>
                        This app is not running on HTTPS.&nbsp;
                        <a
                           onClick={ipcActions.setupHttpsServer}
                        >
                            Click to generate HTTPS certificates.
                        </a>
                    </div>
                );
            }

            const step3InstallCerts = (
                <DetectHttpsServer
                    renderSuccess={(
                        <div>✓ Your certificates are installed on this computer.</div>
                    )}
                    renderFailed={(
                        <div>
                            <div>
                                Install your self-signed certificates.&nbsp;
                                <a onClick={() => this.setState({expandInstructions: !this.state.expandInstructions})}>
                                    {this.state.expandInstructions ? 'Hide' : 'View'} instructions.
                                </a>
                            </div>

                            {
                                this.state.expandInstructions ? HttpsInstructions() : null
                            }
                        </div>
                    )}
                />
            );

            step3 = (
                <div>
                    {step3Header}
                    <ul>
                        {
                            [step3Certs, step3InstallCerts].map(
                                step => step ? <li>{step}</li> : null
                            )
                        }
                    </ul>
                    <div style={{fontSize: '0.8em'}}>

                        Alternatively, you can run the connector without
                        HTTPS and allow your browser to make insecure requests.
                        &nbsp;
                        <a onClick={() => {
                            shell.openExternal(httpsGithubIssue);
                        }}
                        >
                            Here&#39;s how
                        </a>.
                    </div>
                </div>
            );

            step4 = (
                <div className={styles.step3Container}>
                    <h5>4. Query from Plotly 2.0</h5>
                    <div className={styles.futureDirections}>
                        Query data by clicking on 'import data' from
                        <a onClick={() => {
                            shell.openExternal(plotlyWorkspace);
                        }}
                        >
                        &nbsp;<u>plotly workspace</u>&nbsp;
                        </a>
                        and choose the SQL option.<br/>
                        Remember to keep this app running
                        while you are making queries!
                    </div>
                    <img
                        src="./images/workspace.png"
                        className={styles.workspace}
                    >
                    </img>
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
                    {step4}
                    {logContainer}

                </div>

            </div>
        );
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
