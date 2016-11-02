import React, {Component, PropTypes} from 'react';
import { connect } from 'react-redux';
import * as Actions from '../../actions/sessions';
import * as styles from '../SessionsManager/SessionsManager.css';
import UserCredentials from './UserCredentials/UserCredentials.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import {reduce, flip, dissoc} from 'ramda';
import Select from 'react-select';
import TableDropdown from './TableDropdown/TableDropdown.react';
import classnames from 'classnames';

const LOGOS = {
    postgres: './images/postgres-logo-small.png',
    mysql: './images/mysql-logo-small.png',
    mariadb: './images/mariadb-logo-small.png',
    mssql: './images/mssql-logo-small.png',
    sqlite: './images/sqlite-logo-small.png',
    elasticsearch: './images/elastic-logo.png',
    redshift: './images/redshift-logo.png'
};

function Tab(props) {
    const {tabId, isSelected, credentialObject, setTab, deleteTab} = props;
    const {username, host, dialect, id} = credentialObject;
    return (
        <div className={classnames(
            styles.sessionWrapper,
            {[styles.sessionWrapperSelected]: isSelected}
        )}>

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
                onClick={() => setTab(tabId)}
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
            selectedTable,
            setTable,
            tablesRequest
        } = this.props;
        console.warn('fetchData: ', this.props);
        if (credentialsRequest && !credentialsRequest.status) {
            initialize();
        }
        if (connectRequest.status === 200 && !tablesRequest.status) {
            getTables();
        }
        if (tablesRequest.status === 200 && !selectedTable) {
            setTable(tablesRequest.content[0]);
        }
        if (selectedTable && !previewTableRequest.status) {
            previewTables();
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
            newTab,
            deleteTab,
            setTab
        } = this.props;

        if (!selectedTab) {
            return null; // initializing
        }

        console.log(JSON.stringify(this.props, null, 2));

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
        selectedTables
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
        updateCredential: () => {
            dispatch({
                type: 'MERGE'
            });
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
        dispatch({
            type: 'UPDATE_CREDENTIAL',
            payload: {
                tableId: selectedTab,
                update: credentialUpdate
            }
        });
    }
    function boundGetTables() {
        return dispatch(Actions.getTables(selectedCredentialId));
    }
    function boundSetTable(table) {
        return dispatch({
            type: 'SET_TABLE',
            payload: {[selectedTab]: table}
        });
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
                console.warn('THEN!!!!!', json);
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
            newTab: () => dispatch(Actions.newTab()),
            deleteTab: tab => dispatch(Actions.deleteTab(tab)),
            setTab: tab => dispatch(Actions.setTab(tab)),
            connect
        }
    );
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Settings);
