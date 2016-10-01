import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {shell} from 'electron';
import * as styles from './Settings.css';
import DialectSelector from './DialectSelector/DialectSelector.react';
import UserCredentials from './UserCredentials/UserCredentials.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import DatabaseDropdown from './DatabaseDropdown/DatabaseDropdown.react';
import TableDropdown from './TableDropdown/TableDropdown.react';
import Preview from './Preview/Preview.react';
import DetectHttpsServer from './HttpsServer/DetectHttpsServer.react';
// import Https from './HttpsServer/Https.reac';
import ImportModal from './ImportModal/ImportModal.react';
import LoggerController from './Logger/LoggerController.react';

import {APP_STATUS} from '../../constants/constants';

const canConfigureHTTPS = process.platform === 'darwin' ||
    process.platform === 'linux';

export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showStep1: true,
            showStep2: false,
            showStep3: false,
            showStep4: false
        };
    }

    render() {
        const {
            configuration,
            ipc,
            connection,
            sessionsActions
        } = this.props;

        // if (connection.get('status') === APP_STATUS.CONNECTED ||
        //     connection.get('status') === APP_STATUS.ERROR) {
        //     this.setState({
        //         showStep1: false,
        //         showStep2: true,
        //         showStep3: false,
        //         showStep4: false
        //     });
        // }

        const dialectSelector = (
            <div>
                <DialectSelector
                    configuration={configuration}
                    sessionsActions={sessionsActions}
                />
            </div>
        );

        const userCredentials = (
            <UserCredentials
                configuration={configuration}
                sessionsActions={sessionsActions}
            />
        );

        const connectButton = (
            <ConnectButton
                configuration={configuration}
                connection={connection}
                ipc={ipc}
                sessionsActions={sessionsActions}
            />
        );

        let tablePreview = null;
        if (ipc.has('previews') && ipc.get('previews')) {
            tablePreview = (
                <div className={styles.previewController}>
                    <Preview
                        ipc={ipc}
                        sessionsActions={sessionsActions}
                    />
                </div>
            );
        }

        const selectDatabaseAndTable = (
            <div>
                <DatabaseDropdown
                    configuration={configuration}
                    ipc={ipc}
                    sessionsActions={sessionsActions}
                />
                <TableDropdown
                    ipc={ipc}
                    sessionsActions={sessionsActions}
                />
            </div>
        );

        const logger = (
            <div className={styles.logContainer}>
                <hr/>
                <div className={styles.log}>
                    <LoggerController ipc={ipc}/>
                </div>
            </div>
        );

        // #STEP1
        let userConfiguration = null;
        if (this.state.showStep1) {
            userConfiguration = (
                <div className={styles.configurationOptions}>
                    <div className={styles.dialectSelector}>
                        {dialectSelector}
                    </div>
                    <div className={styles.userCredentials}>
                        {userCredentials}
                    </div>
                </div>
            );
        }
        const step1 = (
            <div>
                <h5>
                    <a
                        onClick={() => this.setState({showStep1: !this.state.showStep1})}
                    >
                        1. Connect to Database
                    </a>
                </h5>
                {userConfiguration}
                <div className={styles.connectButton}>
                    {connectButton}
                </div>
            </div>
        );

        // #STEP2
        let dropDowns = null;
        if (this.state.showStep2) {
            dropDowns = (
                <div>
                    {selectDatabaseAndTable}
                    {tablePreview}
                </div>
            );
        }
        const step2 = (
            <div className={styles.step2Container}>
                <h5>
                    <a
                        onClick={() => this.setState({showStep2: !this.state.showStep2})}
                    >
                        2. Preview Database and Tables
                    </a>
                </h5>
                {dropDowns}
            </div>
        );

        // #STEP3
        let step3Header = null;
        let step3InstallCerts = null;
        let step3HTTPSServerStatus = null;
        if (canConfigureHTTPS) {
            step3Header = (
                <h5>
                    <a
                        onClick={() => this.setState({showStep3: !this.state.showStep3})}
                    >
                        3. Secure your connection with HTTPS
                    </a>
                </h5>
            );
            if (this.state.showStep3) {
                step3InstallCerts = (
                    <a>DetectHttpsServer</a>
                );
                step3HTTPSServerStatus = (
                    <a>step3InstallCerts</a>
                );
            }
        }
        const step3 = (
            <div className={styles.step3Container}>
                {step3Header}
                <ul>
                    {
                        [step3HTTPSServerStatus, step3InstallCerts].map(
                            step => step ? <li>{step}</li> : null
                        )
                    }
                </ul>
            </div>
        );

        // #STEP4
        let importModal = null;
        if (this.state.showStep4 && canConfigureHTTPS) {
            importModal = (
                ImportModal(ipc.has('hasSelfSignedCert') &&
                    ipc.get('hasSelfSignedCert'))
            );
        }
        const step4 = (
            <div className={styles.step4Container}>
                <h5>
                    <a
                        onClick={() => this.setState({showStep4: !this.state.showStep4})}
                    >
                        {canConfigureHTTPS ? 4 : 3}. Query from Plotly 2.0
                    </a>
                </h5>
                {importModal}
            </div>
        );

        return (
            <div className={styles.containerWrapper}>
                <div className={styles.container}>
                    {step1}
                    {step2}
                    {step3}
                    {step4}
                    {logger}
                </div>
            </div>
        );
    }
}

Settings.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    sessionsActions: PropTypes.object,
    ipc: ImmutablePropTypes.map.isRequired,
    connection: ImmutablePropTypes.map.isRequired
};
