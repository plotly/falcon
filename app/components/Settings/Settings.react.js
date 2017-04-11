import React, {Component, PropTypes} from 'react';
import {contains, dissoc, eqProps, hasIn, flip, head, keys, isEmpty, reduce } from 'ramda';
import {connect} from 'react-redux';
import classnames from 'classnames';
import * as Actions from '../../actions/sessions';
import * as styles from './Settings.css';
import * as buttonStyles from './ConnectButton/ConnectButton.css';
import fetch from 'isomorphic-fetch';
import Tabs from './Tabs/Tabs.react';
import UserConnections from './UserConnections/UserConnections.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import OptionsDropdown from './OptionsDropdown/OptionsDropdown.react';
import Preview from './Preview/Preview.react';
import {Link} from '../Link.react';
import {DIALECTS} from '../../constants/constants.js';
import {plotlyUrl, getAllBaseUrls} from '../../utils/utils';


const WORKSPACE_IMPORT_SQL_URL = `${plotlyUrl()}/create?upload=sql&url=`;

let STARTED_AT = null;

const unfoldIcon = (
    <img
        src="images/unfold.png"
        className={styles.unfoldIcon}
    >
    </img>
);

let checkconnectorUrls;
let checkDNS;

const isStatusOK = (url) => {
    return fetch(url, {
        method: 'GET'
        // credentials: 'include',
        // headers: {
        //     'Accept': 'application/json',
        //     'Content-Type': 'application/json'
        // }
    })
    .then(res => {
        console.log('fetched');
        return true;
    })
    .catch((e) => {
        console.log('failed');
        return false;
    });
};

class Settings extends Component {
    constructor(props) {
        super(props);
        this.fetchData = this.fetchData.bind(this);
        this.renderEditButton = this.renderEditButton.bind(this);
        this.renderSettingsForm = this.renderSettingsForm.bind(this);
        this.wrapWithAutoHide = this.wrapWithAutoHide.bind(this);
        this.state = {showConnections: true, showPreview: true, editMode: true, urls: {}};
    }

    wrapWithAutoHide(name, reactComponent) {
        return (
            <div className={styles.stepTitleContainer}>
                <h5
                    className={styles.stepTitle}
                    onClick={() => this.setState({
                        [`show${name}`]: !this.state[`show${name}`]
                    })}
                >
                    <span>{name}</span>
                    <span className={this.state[`show${name}`] ? null : styles.collapsed}>
                        {unfoldIcon}
                    </span>
                </h5>
                {this.state[`show${name}`] ? reactComponent : null}
            </div>
        );
    }

    componentDidMount() {
        this.fetchData();
        checkconnectorUrls = setInterval(() => {
            this.props.dispatch(Actions.getConnectorUrls());
        }, 5000);
    }

    componentDidUpdate() {
        this.fetchData();
    }

    renderEditButton(show) {
        return (
            <div className={styles.editButtonContainer}>
                {show ? (
                    <div
                        className={buttonStyles.buttonPrimary}
                        onClick={() => {
                            this.setState({showConnections: true, editMode: true});
                            this.props.setConnectionNeedToBeSaved(true);
                        }}
                    >
                        {'Edit Credentials'}
                    </div>
                ) : null}
            </div>
        );
    }


    renderSettingsForm() {
        const {
            connect,
            connectionObject,
            connectRequest,
            connectionsHaveBeenSaved,
            saveConnectionsRequest,
            updateConnection
        } = this.props;

        return (
            <div
                className={classnames(
                    styles.configurationContainer,
                    this.state.editMode ? null : styles.disabledSection
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
                    connectRequest={connectRequest}
                    editMode={this.state.editMode}
                    saveConnectionsRequest={saveConnectionsRequest}
                />
            </div>
        );
    }

    componentWillReceiveProps(nextProps) {
        // if status goes to 200, credentials have been successfully saved to disk
        if (nextProps.connectRequest.status === 200 &&
            this.props.connectRequest.status !== 200)
        {
            if (this.state.editMode) this.setState({editMode: false});
            if (this.props.connectionNeedToBeSaved) this.props.setConnectionNeedToBeSaved(false);
        }
        if (nextProps.connectorUrlsRequest.status === 200 && this.props.connectorUrlsRequest.status !== 200) {
            this.setState({urls: nextProps.connectorUrlsRequest.content});
        }
    }

    fetchData() {
        const {
            apacheDrillStorageRequest,
            apacheDrillS3KeysRequest,
            connect,
            connections,
            connectRequest,
            connectionsRequest,
            connectionNeedToBeSaved,
            elasticsearchMappingsRequest,
            getApacheDrillStorage,
            getApacheDrillS3Keys,
            getConnectorUrls,
            getElasticsearchMappings,
            getTables,
            getS3Keys,
            initialize,
            previewTables,
            previewTableRequest,
            selectedTable,
            setConnectionNeedToBeSaved,
            setTable,
            setIndex,
            s3KeysRequest,
            selectedTab,
            selectedIndex,
            tablesRequest
        } = this.props;
        if (connectionsRequest && !connectionsRequest.status ) {
            initialize();
        }
        // keeps the credentials form open until connected
        if (connectRequest.status !== 200 && !this.state.showConnections) {
            this.setState({showConnections: true});
        }
        if (connectRequest.status !== 200 && !this.state.editMode) {
            this.setState({editMode: true});
        }

        const connectionObject = connections[selectedTab] || {};
        if (contains(connectionObject.dialect, [
                    DIALECTS.MYSQL, DIALECTS.MARIADB, DIALECTS.POSTGRES,
                    DIALECTS.REDSHIFT, DIALECTS.MSSQL, DIALECTS.SQLITE
        ])) {
            if (connectRequest.status === 200 && !tablesRequest.status) {
                this.setState({editMode: false});
                getTables();
            }
            if (tablesRequest.status === 200 && !selectedTable) {
                // Don't set the table to be undefined; causes inf loop.
                if (!isEmpty(tablesRequest.content)) {
                    setTable(head(tablesRequest.content));
                }
            }
            if (selectedTable && !previewTableRequest.status) {
                previewTables();
            }
        } else if (connectionObject.dialect === DIALECTS.ELASTICSEARCH) {
            if (connectRequest.status === 200 && !elasticsearchMappingsRequest.status) {
                getElasticsearchMappings();
            }
            if (elasticsearchMappingsRequest.status === 200 && !selectedIndex) {
                // Don't set the index to be undefined; causes inf loop.
                if (!isEmpty(keys(elasticsearchMappingsRequest.content))) {
                    setIndex(head(keys(elasticsearchMappingsRequest.content)));
                }
            }
            if (selectedIndex && !selectedTable) {
                setTable(head(keys(
                    elasticsearchMappingsRequest.content[selectedIndex].mappings
                )));
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
            apacheDrillStorageRequest,
            apacheDrillS3KeysRequest,
            connect,
            connectRequest,
            connections,
            connectionsHaveBeenSaved,
            connectorUrlsRequest,
            createCerts,
            deleteConnectionsRequest,
            deleteTab,
            elasticsearchMappingsRequest,
            newTab,
            previewTableRequest,
            redirectUrl,
            redirectUrlRequest,
            s3KeysRequest,
            selectedTab,
            saveConnectionsRequest,
            setIndex,
            setTable,
            selectedTable,
            selectedIndex,
            setTab,
            tablesRequest,
            updateConnection
        } = this.props;

        if (!selectedTab) {
            return null; // initializing
        }

        const connectorUrl = this.state.urls.https || this.state.urls.http;

        let httpsServerIsOK = false;
        if (!STARTED_AT && this.state.urls.https) {
            STARTED_AT = new Date();
            checkDNS = setInterval(() => {
                console.log('trying');
                if (isStatusOK(`${this.state.urls.https}/ping`)) {
                    httpsServerIsOK = true;
                }
            }, 5000);
        }

        let timeElapsed = null;
        if (STARTED_AT) {
            const seconds = Math.round((new Date().getTime() - STARTED_AT.getTime()) / 1000);
            timeElapsed = seconds > 60 ? `${Math.round(seconds / 60)} minutes ${seconds % 60} seconds` : `${seconds} seconds`;
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
                        this.renderSettingsForm()
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
                                selectedIndex={selectedIndex}
                            />

                            <Preview
                                previewTableRequest={previewTableRequest}
                                s3KeysRequest={s3KeysRequest}
                                apacheDrillStorageRequest={apacheDrillStorageRequest}
                                apacheDrillS3KeysRequest={apacheDrillS3KeysRequest}
                            />
                        </div>
                    )}

                    {this.wrapWithAutoHide('Endpoints',
                        <div>
                            <div>{'Your connector is running on '}</div>
                            {keys(this.state.urls).map(url => {
                                return (
                                    <div>
                                        <div className={styles.url}>
                                            {`${this.state.urls[url]}`}
                                        </div>
                                    </div>
                                );
                            })}
                            {httpsServerIsOK ? (
                                <div>
                                    {'HTTPS server is up and running.'}
                                </div>
                            ) : (
                                <div>
                                    {`HTTPS server is getting set-up. It may take several minutes. It has been ${timeElapsed}.`}
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.workspaceLink}>
                        {
                            Link(WORKSPACE_IMPORT_SQL_URL + connectorUrl,
                            'Make queries from Plotly')
                        }
                    </div>

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
        connectRequests,
        connectionsNeedToBeSaved,
        connectorUrlsRequest,
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
    const selectedTable = selectedTables[selectedConnectionId] || null;
    const selectedIndex = selectedIndecies[selectedConnectionId] || null;

    let previewTableRequest = {};
    if (previewTableRequests[selectedConnectionId] &&
        previewTableRequests[selectedConnectionId][selectedTable]
    ) {
        previewTableRequest = previewTableRequests[selectedConnectionId][selectedTable];
    }

    return {
        connectionsRequest,
        connectRequest: connectRequests[selectedConnectionId] || {},
        saveConnectionsRequest: saveConnectionsRequests[selectedTab] || {},
        deleteConnectionsRequest: deleteConnectionsRequests[selectedConnectionId] || {},
        previewTableRequest,
        tablesRequest: tablesRequests[selectedConnectionId] || {},
        elasticsearchMappingsRequest: elasticsearchMappingsRequests[selectedConnectionId] || {},
        s3KeysRequest: s3KeysRequests[selectedConnectionId] || {},
        apacheDrillStorageRequest: apacheDrillStorageRequests[selectedConnectionId] || {},
        apacheDrillS3KeysRequest: apacheDrillS3KeysRequests[selectedConnectionId] || {},
        selectedTab,
        connections,
        connectionNeedToBeSaved: connectionsNeedToBeSaved[selectedTab] || true,
        connectionsHaveBeenSaved,
        connectionObject: connections[selectedTab],
        selectedTable,
        selectedIndex,
        selectedConnectionId,
        connectorUrlsRequest
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
        selectedIndex,
        connectionNeedToBeSaved,
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
        return dispatch(Actions.setTable({[selectedConnectionId]: table}));
    }
    function boundSetIndex(index) {
        return dispatch(Actions.setIndex({[selectedConnectionId]: index}));
    }
    function boundPreviewTables() {
        return dispatch(Actions.previewTable(
            selectedConnectionId,
            connectionObject.dialect,
            selectedTable,
            connectionObject.database || selectedIndex
        ));
    }
    function boundSetConnectionNeedToBeSaved(bool) {
        return dispatch(Actions.setConnectionNeedToBeSaved(
            selectedTab,
            bool
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
                /*
                 * Do not try connecting because saving of credentials
                 * will not have happened on error
                 */
                if (!json.error) {
                    dispatch(Actions.connect(json.connectionId));
                }
            });
        };
    } else if (connectionNeedToBeSaved) {
        dispatchConnect = function editConnectionsAndResetRequests() {
            dispatch(Actions.editConnections(connections[selectedTab], selectedConnectionId))
            .then(() => {dispatch(Actions.reset({id: selectedConnectionId}));});
        };
    } else {
        dispatchConnect = () => dispatch(Actions.connect(selectedConnectionId));
    }

    return Object.assign(
        {},
        reduce(flip(dissoc), stateProps, ['dispatch']),
        dispatchProps,
        ownProps, {
            setConnectionNeedToBeSaved: boundSetConnectionNeedToBeSaved,
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
            editCredential: c => dispatch(Actions.editCredential(c))
        }
    );
}

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Settings);
