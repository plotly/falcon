import React, {Component, PropTypes} from 'react';
import { connect } from 'react-redux';
import * as Actions from '../../actions/sessions';
import * as styles from '../SessionsManager/SessionsManager.css';
import UserCredentials from './UserCredentials/UserCredentials.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import {reduce, flip, dissoc, contains} from 'ramda';
import Select from 'react-select';
import TableDropdown from './TableDropdown/TableDropdown.react';
import classnames from 'classnames';
import {LOGOS, DIALECTS} from '../../constants/constants.js';

function Tab(props) {
    const {tabId, isSelected, credentialObject, setTab, deleteTab} = props;
    const {username, host, dialect, id} = credentialObject;
    return (
        <div
            className={classnames(
                styles.sessionWrapper,
                {[styles.sessionWrapperSelected]: isSelected}
            )}
            onClick={() => setTab(tabId)}
        >

            {/* TODO - Move this x to the other side */}
            <img
                className={styles.sessionDelete}
                onClick={() => deleteTab(tabId)}
                src="./images/delete.png"
                id={`test-session-delete-${id}`}
            >
            </img>

            <p className={styles.sessionIdentifier}>
                <span>
                    {username}@{host}
                </span>
            </p>

            <img
                className={styles.sessionLogo}
                src={LOGOS[dialect]}
                id={`test-session-id-${id}`}
            >
            </img>

        </div>


    );
}

function Tabs(props) {
    const {credentials, selectedTab, newTab, setTab, deleteTab} = props;
    return (
        <div>
            {Object.keys(credentials).map(tabId =>
                <Tab
                    key={tabId}
                    tabId={tabId}
                    isSelected={tabId===selectedTab}
                    credentialObject={credentials[tabId]}
                    setTab={setTab}
                    deleteTab={deleteTab}
                />
            )}

            <div className={styles.sessionAddWrapper}>
                <img
                    className={styles.sessionAdd}
                    onClick={newTab}
                    src="./images/add.png"
                    id="test-session-add"
                >
                </img>
            </div>

        </div>
    );
}

function SettingsForm(props) {
    const {credentialObject, updateCredential} = props;
    return (
        <div className={styles.configurationOptions}>
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

const Table = props => {
    const {rows, columns} = props;

    return (
        <table>
            <thead>
                <tr>
                    {columns.map(column => <th>{column}</th>)}
                </tr>
            </thead>

            <tbody>
                {
                    rows.map(row =>
                        <tr>
                            {row.map(cell => <td>{cell}</td>)}
                        </tr>
                    )
                }
            </tbody>
        </table>
    );
}

const TablePreview = props => {
    const {previewTableRequest} = props;
    if (previewTableRequest.status >= 400) {
        return (<div>{'Hm... An error while trying to load this table'}</div>);
    } else if (previewTableRequest.status === 'loading') {
        return (<div>{'Loading...'}</div>);
    } else if (previewTableRequest.status === 200) {
        return (
            <Table
                rows={previewTableRequest.content.rows}
                columns={previewTableRequest.content.columnnames}
            />
        );
    } else {
        return null;
    }
}

const S3Preview = props => {
    const {s3KeysRequest} = props;
    if (s3KeysRequest.status >= 400) {
        return (<div>{'Hm... An error while trying to load S3 keys'}</div>);
    } else if (s3KeysRequest.status === 'loading') {
        return (<div>{'Loading...'}</div>);
    } else if (s3KeysRequest.status === 200) {
        return (
            <div>
                <h5>CSV Files on S3</h5>
                <div style={{maxHeight: 500, overflowY: 'auto'}}>
                    {s3KeysRequest.content.filter(object => object.Key.endsWith('.csv'))
                        .map(object => <div>{object.Key}</div>
                    )}
                </div>
            </div>
        );
    } else {
        return null;
    }
}


const ApacheDrillPreview = props => {
    const {
        apacheDrillStorageRequest,
        apacheDrillS3KeysRequest
    } = props;
    if (apacheDrillStorageRequest.status >= 400) {
        return (<div>{'Hm... An error while trying to load Apache Drill'}</div>);
    } else if (apacheDrillStorageRequest.status === 'loading') {
        return (<div>{'Loading...'}</div>);
    } else if (apacheDrillStorageRequest.status === 200) {
        const storage = (
            <div>
                <h5>Enabled Apache Drill Storage Plugins</h5>
                <div style={{maxHeight: 500, overflowY: 'auto'}}>
                    {apacheDrillStorageRequest.content
                        .filter(object => object.config.enabled)
                        .map(object => (
                            <div>{`${object.name} - ${object.config.connection}`}</div>
                        ))
                    }
                </div>
            </div>
        );

        let availableFiles = null;
        if (apacheDrillS3KeysRequest.status === 200) {
            const parquetFiles = apacheDrillS3KeysRequest
                .content
                .filter(object => object.Key.indexOf('.parquet') > -1)
                .map(object => object.Key.slice(0, object.Key.indexOf('.parquet')) + '.parquet');
            const uniqueParquetFiles = [];
            parquetFiles.forEach(file => {
                if (uniqueParquetFiles.indexOf(file) === -1) {
                    uniqueParquetFiles.push(file);
                }
            });
            if (uniqueParquetFiles.length === 0) {
                availableFiles = (
                    <div>
                        Heads up! It looks like no .parquet files were
                        found in this S3 bucket.
                    </div>
                );
            } else {
                availableFiles = (
                    <div>
                        <h5>Available Parquet Files on S3</h5>
                        <div style={{maxHeight: 500, overflowY: 'auto'}}>
                            {uniqueParquetFiles.map(key => (
                                <div>{`${key}`}</div>
                            ))}
                        </div>
                    </div>
                );
            }
        }
        return (
            <div>
                {storage}
                {availableFiles}
            </div>
        );
    } else {
        return null;
    }
}


class Settings extends Component {
    constructor(props) {
        super(props);
        this.fetchData = this.fetchData.bind(this);
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

             if (connectRequest.status === 200 && !tablesRequest.status) {
                 getTables();
             }
             if (tablesRequest.status === 200 && !selectedTable) {
                 setTable(tablesRequest.content[0]);
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
            saveCredentialsRequest,
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

        console.log('props: ', this.props);

        return (
            <div>
                <Tabs
                    credentials={credentials}
                    selectedTab={selectedTab}
                    newTab={newTab}
                    setTab={setTab}
                    deleteTab={deleteTab}
                />

                <SettingsForm
                    credentialObject={credentials[selectedTab]}
                    updateCredential={updateCredential}
                />
                <ConnectButton
                    credentialsHaveBeenSaved={credentialsHaveBeenSaved}
                    connect={connect}
                    saveCredentialsRequest={saveCredentialsRequest}
                    connectRequest={connectRequest}
                />

                <TableDropdown
                    selectedTable={selectedTable}
                    tablesRequest={tablesRequest}
                    setTable={setTable}
                />

                <TablePreview previewTableRequest={previewTableRequest}/>

                <S3Preview
                    s3KeysRequest={s3KeysRequest}
                />

                <ApacheDrillPreview
                    apacheDrillStorageRequest={apacheDrillStorageRequest}
                    apacheDrillS3KeysRequest={apacheDrillS3KeysRequest}
                />

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
        connectRequest: connectRequests[selectedCredentialId] || {},
        saveCredentialsRequest: saveCredentialsRequests[selectedCredentialId] || {},
        previewTableRequest: previewTableRequests[selectedCredentialId] || {},
        tablesRequest: tablesRequests[selectedCredentialId] || {},
        s3KeysRequest: s3KeysRequests[selectedCredentialId] || {},
        apacheDrillStorageRequest: apacheDrillStorageRequests[selectedCredentialId] || {},
        apacheDrillS3KeysRequest: apacheDrillS3KeysRequests[selectedCredentialId] || {},
        previewTableRequest,
        credentialObject: credentials[selectedTab],
        selectedTable,
        credentialsRequest,
        credentials,
        credentialsHaveBeenSaved,
        selectedTab,
        selectedCredentialId
    }
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
     * Connect either saves the credentials and then connects
     * or just connects if the credentials have already been saved
     */
    let connect;
    if (!credentialsHaveBeenSaved) {
        connect = function saveAndConnect() {
            dispatch(Actions.saveCredentials(credentials[selectedTab], selectedTab))
            .then(json => {
                dispatch(Actions.connect(json.credentialId))
            })
            // TODO - If connecting *fails* then we should delete the credential
            // so that the user can re-try.
            // TODO - support updating credentials.
        };
    } else {
        connect = () => dispatch(Actions.connect(selectedCredentialId));
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
            connect
        }
    );
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Settings);
