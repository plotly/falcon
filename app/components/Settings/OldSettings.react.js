import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './Settings.css';
import DialectSelector from './DialectSelector/DialectSelector.react';
import UserCredentials from './UserCredentials/UserCredentials.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import TableDropdown from './TableDropdown/TableDropdown.react';
import Preview from './Preview/Preview.react';
import CreateCertificates from './HttpsServer/CreateCertificates.react';
import DetectCertificates from './HttpsServer/DetectCertificates.react';
import ImportModal from './ImportModal/ImportModal.react';

import {APP_STATUS} from '../../constants/constants';

const canConfigureHTTPS = process.platform === 'darwin' ||
    process.platform === 'linux';

export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showStep1: true,
            showStep2: true,
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
        if (ipc && ipc.has('previews') && ipc.get('previews')) {
            tablePreview = (
                <div className={styles.previewController}>
                    <Preview
                        ipc={ipc}
                        sessionsActions={sessionsActions}
                    />
                </div>
            );
        }

        const selectTable = (
            <div>
                <TableDropdown
                    ipc={ipc}
                    sessionsActions={sessionsActions}
                />
            </div>
        );

        // #STEP1
        let userConfiguration = null;
        let unfoldStep1 = null;
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
        } else {
            unfoldStep1 = (
                <img
                    src="./images/unfold.png"
                    className={styles.unfoldIcon}
                >
                </img>
            );
        }
        const step1 = (
            <div className={styles.step1Container}>
                <h5>
                    <a
                        onClick={() => this.setState({showStep1: !this.state.showStep1})}
                    >
                        1. Connect to Database
                    </a>
                    {unfoldStep1}
                </h5>
                {userConfiguration}
                <div className={styles.connectButton}>
                    {connectButton}
                </div>
            </div>
        );

        // #STEP2
        let dropDowns = null;
        let unfoldStep2 = null;
        if (this.state.showStep2) {
            dropDowns = (
                <div>
                    {selectTable}
                    {tablePreview}
                </div>
            );
        } else {
            unfoldStep2 = (
                <img
                    src="./images/unfold.png"
                    className={styles.unfoldIcon}
                >
                </img>
            );
        }
        const step2 = (
            <div className={styles.step2Container}>
                <h5
                    onClick={() => this.setState({showStep2: !this.state.showStep2})}
                >
                    <a>
                        2. Preview Tables
                    </a>
                    {unfoldStep2}
                </h5>
                {dropDowns}
            </div>
        );

        // #STEP3
        let step3Header = null;
        let step3InstallCerts = null;
        let step3HTTPSServerStatus = null;
        let unfoldStep3 = null;
        if (canConfigureHTTPS) {
            if (this.state.showStep3) {
                step3HTTPSServerStatus = (
                    <CreateCertificates
                        ipc={ipc}
                        sessionsActions={sessionsActions}
                    />
                );
                step3InstallCerts = (
                    <DetectCertificates
                        ipc={ipc}
                        sessionsActions={sessionsActions}
                    />
                );
            } else {
                unfoldStep3 = (
                    <img
                        src="./images/unfold.png"
                        className={styles.unfoldIcon}
                    >
                    </img>
                );
            }
            step3Header = (
                <h5>
                    <a
                        onClick={() => this.setState({showStep3: !this.state.showStep3})}
                    >
                        3. Secure your connection with HTTPS
                    </a>
                    {unfoldStep3}
                </h5>
            );
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
        let unfoldStep4 = null;
        if (this.state.showStep4) {
            importModal = (
                <ImportModal
                    ipc={ipc}
                />
            );
        } else {
            unfoldStep4 = (
                <img
                    src="./images/unfold.png"
                    className={styles.unfoldIcon}
                >
                </img>
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
                    {unfoldStep4}
                </h5>
                {importModal}
            </div>
        );


        // #ASSEMBLE
        let settings = (
            <div>
                {step1}
            </div>
        );
        if (connection.get('status') === APP_STATUS.CONNECTED ||
            connection.get('status') === APP_STATUS.ERROR) {
            settings = (
                <div>
                    {step1}
                    {step2}
                    {step3}
                    {step4}
                </div>
            );
        }

        return (
            <div className={styles.containerWrapper}>
                <div className={styles.container}>
                    {settings}
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
