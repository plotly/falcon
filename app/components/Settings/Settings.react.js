import React, {Component, PropTypes} from 'react';
import {reduce, flip, dissoc, contains} from 'ramda';
import {connect} from 'react-redux';
import classnames from 'classnames';
import * as Actions from '../../actions/sessions';
import * as styles from './Settings.css';
import Tabs from './Tabs/Tabs.react';
import UserCredentials from './UserCredentials/UserCredentials.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import TableDropdown from './TableDropdown/TableDropdown.react';
import Preview from './Preview/Preview.react';
import {DIALECTS} from '../../constants/constants.js';

const unfoldIcon = (
    <img
        src="./images/unfold.png"
        className={styles.unfoldIcon}
    >
    </img>
);

function SettingsForm(props) {
    const {credentialObject, updateCredential, connectRequest} = props;
    return (
        <div className={styles.configurationContainer}>
            <div className={styles.dialectSelector}>
                <DialectSelector
                    credentialObject={credentialObject}
                    updateCredential={updateCredential}
                />
            </div>
            <UserCredentials
                credentialObject={credentialObject}
                updateCredential={updateCredential}
            />
        </div>
    );
}

class Settings extends Component {
    constructor(props) {
        super(props);
        this.fetchData = this.fetchData.bind(this);
        this.wrapComponent = this.wrapComponent.bind(this);
        this.state = {show_credentials: true};
    }

    wrapComponent(name, reactComponent) {
        return (
            <div className={styles.stepTitleContainer}>
                <h5>
                    <a
                        className={styles.stepTitle}
                        onClick={() => this.setState({
                            [`show_${name}`]: !this.state[`show_${name}`]
                        })}
                    >
                        {name}
                    </a>
                    {this.state[`show_${name}`] ? null : unfoldIcon}
                </h5>
                {this.state[`show_${name}`] ? reactComponent : null}
            </div>
        );
    }

    componentDidMount() {
        this.fetchData();
    }
    componentDidUpdate() {
        this.fetchData();
    }
    fetchData() {
        const {
            credentialsRequest,
            initialize,
            previewTables,
            previewTableRequest,
            connectRequest,
            getTables,
            getS3Keys,
            getApacheDrillStorage,
            getApacheDrillS3Keys,
            selectedTable,
            setTable,
            tablesRequest,
            s3KeysRequest,
            apacheDrillStorageRequest,
            apacheDrillS3KeysRequest,
            credentials,
            selectedTab
        } = this.props;
        console.warn('fetchData: ', this.props);
        if (credentialsRequest && !credentialsRequest.status) {
            initialize();
        }
        const credentialObject = credentials[selectedTab] || {};
        if (contains(credentialObject.dialect, [
                     DIALECTS.MYSQL, DIALECTS.MARIADB, DIALECTS.POSTGRES,
                     DIALECTS.REDSHIFT, DIALECTS.MSSQL, DIALECTS.SQLITE])) {
            if (connectRequest.status !== 200 && !this.state.show_credentials) {
                this.setState({show_credentials: true});
            }
            if (connectRequest.status === 200 && !tablesRequest.status) {
                getTables();
            }
            if (tablesRequest.status === 200 && !selectedTable) {
                this.setState({show_credentials: false});
                setTable(tablesRequest.content[0][0]);
            }
            if (selectedTable && !previewTableRequest.status) {
                previewTables();
            }

        } else if (credentialObject.dialect === DIALECTS.S3) {

            if (connectRequest.status === 200 && !s3KeysRequest.status) {
                getS3Keys();
            }

        } else if (credentialObject.dialect === DIALECTS.APACHE_DRILL) {

            if (connectRequest.status === 200 && !apacheDrillStorageRequest.status) {
                getApacheDrillStorage();
            }

            if (apacheDrillStorageRequest.status === 200 && !apacheDrillS3KeysRequest.status) {
                getApacheDrillS3Keys();
            }
        }
    }


    render() {
        const {
            credentials,
            selectedTab,
            updateCredential,
            connect,
            connectRequest,
            saveCredentialsRequests,
            deleteCredentialsRequests,
            credentialsHaveBeenSaved,
            setTable,
            selectedTable,
            tablesRequest,
            previewTableRequest,
            s3KeysRequest,
            apacheDrillStorageRequest,
            apacheDrillS3KeysRequest,
            newTab,
            deleteTab,
            setTab
        } = this.props;

        if (!selectedTab) {
            return null; // initializing
        }

        return (
            <div>
                <Tabs
                    credentials={credentials}
                    selectedTab={selectedTab}
                    newTab={newTab}
                    setTab={setTab}
                    deleteTab={deleteTab}
                />

                <div className={styles.openTab}>
                    {this.wrapComponent('credentials',
                    <SettingsForm
                        connectRequest={connectRequest}
                        credentialObject={credentials[selectedTab]}
                        updateCredential={updateCredential}
                    />)}

                    <ConnectButton
                        credentialsHaveBeenSaved={credentialsHaveBeenSaved}
                        connect={connect}
                        saveCredentialsRequest={saveCredentialsRequests}
                        connectRequest={connectRequest}
                    />

                    <TableDropdown
                        selectedTable={selectedTable}
                        tablesRequest={tablesRequest}
                        setTable={setTable}
                    />

                    <Preview
                        previewTableRequest={previewTableRequest}
                        s3KeysRequest={s3KeysRequest}
                        apacheDrillStorageRequest={apacheDrillStorageRequest}
                        apacheDrillS3KeysRequest={apacheDrillS3KeysRequest}
                    />

                </div>

                <pre>
                    {JSON.stringify(this.props, null, 2)}
                </pre>
            </div>
        );

    }
}

Settings.propTypes = {
// TODO - fill this out.
};

function mapStateToProps(state) {
    const {
        selectedTab,
        tabMap,
        credentials,
        credentialsRequest,
        connectRequests,
        saveCredentialsRequests,
        deleteCredentialsRequests,
        previewTableRequests,
        tablesRequests,
        selectedTables,
        s3KeysRequests,
        apacheDrillStorageRequests,
        apacheDrillS3KeysRequests
    } = state;

    const selectedCredentialId = tabMap[selectedTab];
    const credentialsHaveBeenSaved = Boolean(selectedCredentialId);
    const selectedTable = selectedTables[selectedTab];

    let previewTableRequest = {};
    if (previewTableRequests[selectedCredentialId] &&
        previewTableRequests[selectedCredentialId][selectedTable]
    ) {
        previewTableRequest = previewTableRequests[selectedCredentialId][selectedTable];
    }

    return {
        credentialsRequest,
        connectRequest: connectRequests[selectedCredentialId] || {},
        saveCredentialsRequest: saveCredentialsRequests[selectedCredentialId] || {},
        deleteCredentialsRequest: deleteCredentialsRequests[selectedCredentialId] || {},
        previewTableRequest,
        tablesRequest: tablesRequests[selectedCredentialId] || {},
        s3KeysRequest: s3KeysRequests[selectedCredentialId] || {},
        apacheDrillStorageRequest: apacheDrillStorageRequests[selectedCredentialId] || {},
        apacheDrillS3KeysRequest: apacheDrillS3KeysRequests[selectedCredentialId] || {},
        selectedTab,
        credentials,
        credentialsHaveBeenSaved,
        credentialObject: credentials[selectedTab],
        selectedTable,
        selectedCredentialId
    };
}

function mapDispatchToProps(dispatch) {
    return {
        initialize: () => {
            dispatch(Actions.getCredentials())
            .then(() => dispatch(Actions.initializeTabs()));
        },
        dispatch
    };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
    const {
        selectedTab,
        selectedTable,
        credentials,
        selectedCredentialId,
        credentialsHaveBeenSaved,
        credentialObject
    } = stateProps;
    const {dispatch} = dispatchProps;

    function boundUpdateCredential(credentialUpdate) {
        dispatch(Actions.updateCredential({
            tableId: selectedTab,
            update: credentialUpdate
        }));
    }
    function boundGetTables() {
        return dispatch(Actions.getTables(selectedCredentialId));
    }
    function boundGetS3Keys() {
        return dispatch(Actions.getS3Keys(selectedCredentialId));
    }
    function boundGetApacheDrillStorage() {
        return dispatch(Actions.getApacheDrillStorage(selectedCredentialId));
    }
    function boundGetApacheDrillS3Keys() {
        return dispatch(Actions.getApacheDrillS3Keys(selectedCredentialId));
    }
    function boundSetTable(table) {
        return dispatch(Actions.setTable({[selectedTab]: table}));
    }
    function boundPreviewTables() {
        return dispatch(Actions.previewTable(
            selectedCredentialId,
            credentialObject.dialect,
            selectedTable,
            credentialObject.database
        ));
    }

    /*
     * dispatchConnect either saves the credentials and then connects
     * or just connects if the credentials have already been saved
     */
    let dispatchConnect;
    if (!credentialsHaveBeenSaved) {
        dispatchConnect = function saveAndConnect() {
            dispatch(Actions.saveCredentials(credentials[selectedTab], selectedTab))
            .then(json => {
                dispatch(Actions.connect(json.credentialId));
            });
            // TODO - If connecting *fails* then we should delete the credential
            // so that the user can re-try.
            // TODO - support updating credentials.
        };
    } else {
        dispatchConnect = () => dispatch(Actions.connect(selectedCredentialId));
    }

    return Object.assign(
        {},
        reduce(flip(dissoc), stateProps, ['dispatch']),
        dispatchProps,
        ownProps, {
            updateCredential: boundUpdateCredential,
            getTables: boundGetTables,
            setTable: boundSetTable,
            previewTables: boundPreviewTables,
            getS3Keys: boundGetS3Keys,
            getApacheDrillStorage: boundGetApacheDrillStorage,
            getApacheDrillS3Keys: boundGetApacheDrillS3Keys,
            newTab: () => dispatch(Actions.newTab()),
            deleteTab: tab => dispatch(Actions.deleteTab(tab)),
            setTab: tab => dispatch(Actions.setTab(tab)),
            connect: dispatchConnect
        }
    );
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Settings);
