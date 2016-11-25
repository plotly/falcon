import React, {Component, PropTypes} from 'react';
import {contains, dissoc, flip, head, reduce } from 'ramda';
import {connect} from 'react-redux';
import classnames from 'classnames';
import * as Actions from '../../actions/sessions';
import * as styles from './Settings.css';
import * as buttonStyles from './ConnectButton/ConnectButton.css';
import Tabs from './Tabs/Tabs.react';
import UserConnections from './UserConnections/UserConnections.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import OptionsDropdown from './OptionsDropdown/OptionsDropdown.react';
import Preview from './Preview/Preview.react';
import HttpsSetup from './HttpsServer/HttpsSetup.react';
import {DIALECTS} from '../../constants/constants.js';

const unfoldIcon = (
    <img
        src="./images/unfold.png"
        className={styles.unfoldIcon}
    >
    </img>
);

function SettingsForm(props) {
    const {
        connectionObject,
        connectRequest,
        connectionsHaveBeenSaved,
        saveConnectionsRequest,
        updateConnection,
        disabled
    } = props;
    return (
        <div
            className={classnames(
                styles.configurationContainer,
                disabled ? styles.disabledSection : null
            )}
        >
            <div className={styles.dialectSelector}>
                <DialectSelector
                    connectionObject={connectionObject}
                    updateConnection={updateConnection}
                />
            </div>
            <UserConnections
                connectionObject={connectionObject}
                updateConnection={updateConnection}
            />
            <ConnectButton
                connectionsHaveBeenSaved={connectionsHaveBeenSaved}
                connect={connect}
                saveConnectionsRequest={saveConnectionsRequest}
                connectRequest={connectRequest}
            />
        </div>
    );
}

class Settings extends Component {
    constructor(props) {
        super(props);
        this.fetchData = this.fetchData.bind(this);
        this.wrapWithAutoHide = this.wrapWithAutoHide.bind(this);
        this.state = {showConnections: true, showPreview: true, editMode: false};
    }

    wrapWithAutoHide(name, reactComponent) {
        return (
            <div className={styles.stepTitleContainer}>
                <h5 className={
                    {'border-bottom': '1px solid lightgrey;'}}
                >
                    <a
                        className={styles.stepTitle}
                        onClick={() => this.setState({
                            [`show${name}`]: !this.state[`show${name}`]
                        })}
                    >
                        {name}
                    </a>
                    {this.state[`show${name}`] ? null : unfoldIcon}
                </h5>
                {this.state[`show${name}`] ? reactComponent : null}
            </div>
        );
    }

    componentDidMount() {
        this.fetchData();
        this.props.dispatch(Actions.hasCerts());
    }

    componentDidUpdate() {
        this.fetchData();
    }

    renderEditButton(show) {
        return (
            <div>
                {show ? (
                    <div
                        className={buttonStyles.buttonPrimary}
                        onClick={() => {this.setState({showConnections: true, editMode: true});}}
                    >
                        {'Edit Credentials'}
                    </div>
                ) : null}
            </div>
        );
    }

    fetchData() {
        const {
            apacheDrillStorageRequest,
            apacheDrillS3KeysRequest,
            connections,
            connectRequest,
            connectionsRequest,
            elasticsearchMappingsRequest,
            getApacheDrillStorage,
            getApacheDrillS3Keys,
            getElasticsearchMappings,
            getTables,
            getS3Keys,
            initialize,
            previewTables,
            previewTableRequest,
            selectedTable,
            setTable,
            s3KeysRequest,
            selectedTab,
            tablesRequest
        } = this.props;
        if (connectionsRequest && !connectionsRequest.status) {
            initialize();
        }
        const connectionObject = connections[selectedTab] || {};
        if (contains(connectionObject.dialect, [
                    DIALECTS.MYSQL, DIALECTS.MARIADB, DIALECTS.POSTGRES,
                    DIALECTS.REDSHIFT, DIALECTS.MSSQL, DIALECTS.SQLITE
        ])) {
            if (connectRequest.status !== 200 && !this.state.showConnections) {
                this.setState({showConnections: true});
            }
            if (connectRequest.status === 200 && !tablesRequest.status) {
                getTables();
            }
            if (tablesRequest.status === 200 && !selectedTable) {
                this.setState({showConnections: false});
                setTable(head(tablesRequest.content));
            }
            if (selectedTable && !previewTableRequest.status) {
                previewTables();
            }
        } else if (connectionObject.dialect === DIALECTS.ELASTICSEARCH) {
            if (connectRequest.status !== 200 && !this.state.showConnections) {
                this.setState({showConnections: true});
            }
            if (connectRequest.status === 200 && !elasticsearchMappingsRequest.status) {
                this.setState({showConnections: false});
                getElasticsearchMappings();
            }
            if (selectedTable && !previewTableRequest.status) {
                previewTables();
            }
        } else if (connectionObject.dialect === DIALECTS.S3) {
            if (connectRequest.status === 200 && !s3KeysRequest.status) {
                getS3Keys();
            }
        } else if (connectionObject.dialect === DIALECTS.APACHE_DRILL) {
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
            connections,
            selectedTab,
            updateConnection,
            connect,
            connectRequest,
            hasCertsRequest,
            redirectUrlRequest,
            createCertsRequest,
            saveConnectionsRequest,
            deleteConnectionsRequest,
            connectionsHaveBeenSaved,
            setTable,
            setIndex,
            selectedTable,
            index,
            tablesRequest,
            elasticsearchMappingsRequest,
            previewTableRequest,
            s3KeysRequest,
            apacheDrillStorageRequest,
            apacheDrillS3KeysRequest,
            newTab,
            deleteTab,
            setTab,
            createCerts,
            hasCerts,
            redirectUrl,
            startTempHttpsServer,
            startTempHttpsServerRequest
        } = this.props;

        if (!selectedTab) {
            return null; // initializing
        }

        return (
            <div>
                <Tabs
                    connections={connections}
                    selectedTab={selectedTab}
                    newTab={newTab}
                    setTab={setTab}
                    deleteTab={deleteTab}
                />

                <div className={styles.openTab}>
                    {this.wrapWithAutoHide('Connections',
                        <SettingsForm
                            connectRequest={connectRequest}
                            connectionObject={connections[selectedTab]}
                            updateConnection={updateConnection}
                            connectionsHaveBeenSaved={connectionsHaveBeenSaved}
                            saveConnectionsRequest={saveConnectionsRequest}
                            disabled={!this.state.editMode}
                        />
                    )}

                    {this.renderEditButton(!this.state.editMode)}

                    {this.wrapWithAutoHide('Preview',
                        <div>
                            <OptionsDropdown
                                connectionObject={connections[selectedTab]}
                                selectedTable={selectedTable}
                                elasticsearchMappingsRequest={elasticsearchMappingsRequest}
                                tablesRequest={tablesRequest}
                                setTable={setTable}
                                setIndex={setIndex}
                                index={index}
                            />

                            <Preview
                                previewTableRequest={previewTableRequest}
                                s3KeysRequest={s3KeysRequest}
                                apacheDrillStorageRequest={apacheDrillStorageRequest}
                                apacheDrillS3KeysRequest={apacheDrillS3KeysRequest}
                            />
                        </div>
                    )}

                    <HttpsSetup
                        hasCertsRequest={hasCertsRequest}
                        createCertsRequest={createCertsRequest}
                        redirectUrlRequest={redirectUrlRequest}
                        createCerts={createCerts}
                        hasCerts={hasCerts}
                        redirectUrl={redirectUrl}
                        startTempHttpsServer={startTempHttpsServer}
                        startTempHttpsServerRequest={startTempHttpsServerRequest}
                    />

                </div>
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
        connections,
        connectionsRequest,
        hasCertsRequest,
        startTempHttpsServerRequest,
        redirectUrlRequest,
        createCertsRequest,
        connectRequests,
        saveConnectionsRequests,
        deleteConnectionsRequests,
        previewTableRequests,
        tablesRequests,
        elasticsearchMappingsRequests,
        selectedTables,
        selectedIndecies,
        s3KeysRequests,
        apacheDrillStorageRequests,
        apacheDrillS3KeysRequests
    } = state;

    const selectedConnectionId = tabMap[selectedTab];
    const connectionsHaveBeenSaved = Boolean(selectedConnectionId);
    const selectedTable = selectedTables[selectedTab] || null;
    const index = selectedIndecies[selectedTab] || null;

    let previewTableRequest = {};
    if (previewTableRequests[selectedConnectionId] &&
        previewTableRequests[selectedConnectionId][selectedTable]
    ) {
        previewTableRequest = previewTableRequests[selectedConnectionId][selectedTable];
    }

    return {
        connectionsRequest,
        hasCertsRequest,
        createCertsRequest,
        startTempHttpsServerRequest,
        redirectUrlRequest,
        connectRequest: connectRequests[selectedConnectionId] || {},
        saveConnectionsRequest: saveConnectionsRequests[selectedConnectionId] || {},
        deleteConnectionsRequest: deleteConnectionsRequests[selectedConnectionId] || {},
        previewTableRequest,
        tablesRequest: tablesRequests[selectedConnectionId] || {},
        elasticsearchMappingsRequest: elasticsearchMappingsRequests[selectedConnectionId] || {},
        s3KeysRequest: s3KeysRequests[selectedConnectionId] || {},
        apacheDrillStorageRequest: apacheDrillStorageRequests[selectedConnectionId] || {},
        apacheDrillS3KeysRequest: apacheDrillS3KeysRequests[selectedConnectionId] || {},
        selectedTab,
        connections,
        connectionsHaveBeenSaved,
        connectionObject: connections[selectedTab],
        selectedTable,
        index,
        selectedConnectionId
    };
}

function mapDispatchToProps(dispatch) {
    return {
        initialize: () => {
            dispatch(Actions.getConnections())
            .then(() => dispatch(Actions.initializeTabs()));
        },
        dispatch
    };
}

function mergeProps(stateProps, dispatchProps, ownProps) {
    const {
        selectedTab,
        selectedTable,
        connections,
        selectedConnectionId,
        connectionsHaveBeenSaved,
        connectionObject
    } = stateProps;
    const {dispatch} = dispatchProps;

    function boundUpdateConnection(connectionUpdate) {
        dispatch(Actions.updateConnection({
            tableId: selectedTab,
            update: connectionUpdate
        }));
    }
    function boundGetTables() {
        return dispatch(Actions.getTables(selectedConnectionId));
    }
    function boundGetElasticsearchMappings() {
        return dispatch(Actions.getElasticsearchMappings(selectedConnectionId));
    }
    function boundGetS3Keys() {
        return dispatch(Actions.getS3Keys(selectedConnectionId));
    }
    function boundGetApacheDrillStorage() {
        return dispatch(Actions.getApacheDrillStorage(selectedConnectionId));
    }
    function boundGetApacheDrillS3Keys() {
        return dispatch(Actions.getApacheDrillS3Keys(selectedConnectionId));
    }
    function boundSetTable(table) {
        return dispatch(Actions.setTable({[selectedTab]: table}));
    }
    function boundSetIndex(index) {
        return dispatch(Actions.setIndex({[selectedTab]: index}));
    }
    function boundPreviewTables() {
        return dispatch(Actions.previewTable(
            selectedConnectionId,
            connectionObject.dialect,
            selectedTable,
            connectionObject.database
        ));
    }

    /*
     * dispatchConnect either saves the connection and then connects
     * or just connects if the connections have already been saved
     */
    let dispatchConnect;
    if (!connectionsHaveBeenSaved) {
        dispatchConnect = function saveAndConnect() {
            dispatch(Actions.saveConnections(connections[selectedTab], selectedTab))
            .then(json => {
                dispatch(Actions.connect(json.connectionId));
            });
            // TODO - If connecting *fails* then we should delete the connection
            // so that the user can re-try.
            // TODO - support updating connections.
        };
    } else {
        dispatchConnect = () => dispatch(Actions.connect(selectedConnectionId));
    }

    return Object.assign(
        {},
        reduce(flip(dissoc), stateProps, ['dispatch']),
        dispatchProps,
        ownProps, {
            updateConnection: boundUpdateConnection,
            getTables: boundGetTables,
            getElasticsearchMappings: boundGetElasticsearchMappings,
            setTable: boundSetTable,
            setIndex: boundSetIndex,
            previewTables: boundPreviewTables,
            getS3Keys: boundGetS3Keys,
            getApacheDrillStorage: boundGetApacheDrillStorage,
            getApacheDrillS3Keys: boundGetApacheDrillS3Keys,
            newTab: () => dispatch(Actions.newTab()),
            deleteTab: tab => dispatch(Actions.deleteTab(tab)),
            setTab: tab => dispatch(Actions.setTab(tab)),
            connect: dispatchConnect,
            createCerts: () => dispatch(Actions.createCerts()),
            hasCerts: () => dispatch(Actions.hasCerts()),
            redirectUrl: () => dispatch(Actions.redirectUrl()),
            startTempHttpsServer: () => dispatch(Actions.startTempHttpsServer()),
            editCredential: c => dispatch(Actions.editCredential(c))
        }
    );
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Settings);
