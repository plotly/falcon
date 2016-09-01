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
import DetectHttpsServer from './HttpsServer/DetectHttpsServer.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import {APP_STATUS} from '../../constants/constants';

const httpsGithubIssueLink = 'https://github.com/plotly/' +
                         'plotly-database-connector/issues/51';

const plotlyWorkspaceLink = 'https://plot.ly/alpha/workspace';

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
        if (ipc.has('previews') && ipc.get('previews')) {
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


            let step3Header = null;
            let step3HTTPSServerStatus = null;
            let step3InstallCerts = null;
            let httpNote = null;
            let importDataScreenShot = null;

            const canConfigureHTTPS = process.platform === 'darwin' ||
                process.platform === 'linux';

            const hasSelfSignedCert = ipc.has('hasSelfSignedCert') &&
                ipc.get('hasSelfSignedCert');

            if (canConfigureHTTPS) {

                step3Header = (
                    <h5>3. Secure your connection with HTTPS</h5>
                );

                if (hasSelfSignedCert) {

                    step3HTTPSServerStatus = (
                        <div>✓ This app is successfully running on HTTPS.</div>
                    );

                    importDataScreenShot = (
                        <img
                             src="./images/import-modal-https.png"
                             className={styles.workspace}
                        >
                        </img>
                    );

                    // reset to null if user creates https certs during runtime
                    httpNote = null;

                } else {
                    step3HTTPSServerStatus = (
                        <div>
                            This app is not running on HTTPS.&nbsp;
                            <a
                               onClick={ipcActions.setupHttpsServer}
                            >
                                Click to generate HTTPS certificates.
                            </a>
                        </div>
                    );

                    importDataScreenShot = (
                        <img
                             src="./images/import-modal-http.png"
                             className={styles.workspace}
                        >
                        </img>
                    );

                    httpNote = (
                        <div style={{fontSize: '0.8em'}}>
                            Alternatively, you can run the connector without
                            HTTPS and allow your browser to make insecure
                            requests.&nbsp;
                            <a onClick={() => {
                                shell.openExternal(httpsGithubIssueLink);
                            }}
                            >
                                Here&#39;s how
                            </a>.
                        </div>
                    );
                }

                step3InstallCerts = (
                    <DetectHttpsServer/>
                );

            }

            step3 = (
                <div className={styles.step3Container}>
                    {step3Header}
                    <ul>
                        {
                            [step3HTTPSServerStatus, step3InstallCerts].map(
                                step => step ? <li>{step}</li> : null
                            )
                        }
                    </ul>
                    {httpNote}
                </div>
            );

            step4 = (
                <div className={styles.step4Container}>
                    <h5>{canConfigureHTTPS ? 4 : 3}. Query from Plotly 2.0</h5>
                    <div className={styles.futureDirections}>
                        Query data by clicking on 'import data' from
                        <a onClick={() => {
                            shell.openExternal(plotlyWorkspaceLink);
                        }}
                        >
                        &nbsp;<u>plotly workspace</u>&nbsp;
                        </a>
                        and choose the SQL option.<br/>
                        Remember to keep this app running
                        while you are making queries!
                    </div>
                    {importDataScreenShot}
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
