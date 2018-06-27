import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {contains, dissoc, flip, head, hasIn, isEmpty, keys, merge, propEq, propOr, reduce} from 'ramda';
import {connect} from 'react-redux';
import ReactToolTip from 'react-tooltip';
import classnames from 'classnames';
import * as Actions from '../../actions/sessions';
import fetch from 'isomorphic-fetch';
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs';
import ConnectionTabs from './Tabs/Tabs.react';
import UserConnections from './UserConnections/UserConnections.react';
import DialectSelector from './DialectSelector/DialectSelector.react';
import ConnectButton from './ConnectButton/ConnectButton.react';
import Preview from './Preview/Preview.react';
import {Link} from '../Link.react';
import Scheduler from './Scheduler.react';
import {DIALECTS, FAQ, PREVIEW_QUERY, SQL_DIALECTS_USING_EDITOR} from '../../constants/constants.js';
import {isElectron, isOnPrem} from '../../utils/utils';

class Settings extends Component {
    constructor(props) {
        super(props);
        this.fetchData = this.fetchData.bind(this);
        this.renderEditButton = this.renderEditButton.bind(this);
        this.renderSettingsForm = this.renderSettingsForm.bind(this);
        this.state = {
            editMode: true,
            selectedPanel: {},
            urls: {
                https: null,
                http: null
            },
            timeElapsed: 0,
            httpsServerIsOK: false
        };
        this.intervals = {
            timeElapsedInterval: null,
            checkHTTPSEndpointInterval: null,
            getConnectorUrlsInterval: null
        };
    }

    componentDidMount() {
        this.fetchData();
        this.intervals.getConnectorUrlsInterval = setInterval(() => {
            // TODO - Clear this?
            this.props.dispatch(Actions.getConnectorUrls());
        }, 5 * 1000);
        let timeElapsed = 0;

        const STARTED_AT = new Date();
        this.intervals.timeElapsedInterval = setInterval(() => {
            const seconds = Math.round((new Date().getTime() - STARTED_AT.getTime()) / 1000);
            const minutes = Math.floor(seconds / 60);
            timeElapsed = seconds > 60 ?
                `${minutes} ${minutes > 1 ? 'minutes' : 'minute'} and ${seconds % 60} seconds` :
                `${seconds} seconds`;
            this.setState({timeElapsed});
        }, 5 * 1000);

        this.intervals.checkHTTPSEndpointInterval = setInterval(() => {
            if (this.state.urls.https) {
                fetch(this.state.urls.https)
                .then(() => {
                    this.setState({httpsServerIsOK: true});
                    clearInterval(this.intervals.checkHTTPSEndpointInterval);
                    clearInterval(this.intervals.timeElapsedInterval);
                })
                .catch(() => {
                    // silence fetch errors
                });
            }
        }, 5 * 1000);

    }

    componentDidUpdate() {
        this.fetchData();
    }

    renderEditButton(show) {
        return (
            <div className={'editButtonContainer'}>
                {show ? (
                    <button
                        className = "btn-secondary"
                        onClick={() => {
                            this.setState({showConnections: true, editMode: true});
                            this.props.setConnectionNeedToBeSaved(true);
                        }}
                    >
                        {'Edit Credentials'}
                    </button>
                ) : null}
            </div>
        );
    }


    renderSettingsForm() {
        const {
            connectionObject,
            connectRequest,
            saveConnectionsRequest,
            updateConnection,

            // Assign to new variable name to avoid shadowing (ESLint no-shadow)
            // function `connect` in outer scope
            connect: doConnect
        } = this.props;

        return (
            <div
                className={classnames(
                    'configurationContainer',
                    this.state.editMode ? null : 'disabledSection'
                )}
            >
                <div className={'dialectSelector'}>
                    <ReactToolTip place={'top'} type={'dark'} effect={'solid'} />
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
                    connect={doConnect}
                    connectRequest={connectRequest}
                    editMode={this.state.editMode}
                    saveConnectionsRequest={saveConnectionsRequest}
                />
                {!isElectron() && <div className={'description'}>
                    Warning:
                    connections set up in this instance of Falcon are accessible to all Plotly On-Premise users.
                </div>}
            </div>
        );
    }

    componentWillReceiveProps(nextProps) {
        // if status goes to 200, credentials have been successfully saved to disk
        if (nextProps.connectRequest.status === 200 &&
            this.props.connectRequest.status !== 200) {
            if (this.state.editMode) {
                this.setState({editMode: false});
            }
            if (this.props.connectionNeedToBeSaved) {
                this.props.setConnectionNeedToBeSaved(false);
            }
        }
        if (nextProps.connectorUrlsRequest.status === 200 && this.props.connectorUrlsRequest.status !== 200) {
            this.setState({urls: nextProps.connectorUrlsRequest.content});
        }
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
            getScheduledQueries,
            getS3Keys,
            getSettings,
            initialize,
            previewTables,
            previewTableRequest,
            selectedTable,
            settingsRequest,
            setTable,
            setIndex,
            s3KeysRequest,
            selectedTab,
            selectedIndex,
            tablesRequest,
            scheduledQueriesRequest
        } = this.props;
        if (connectionsRequest && !connectionsRequest.status) {
            initialize();
        }
        // keeps the credentials form open until connected
        if (connectRequest.status !== 200 && !this.state.showConnections) {
            this.setState({showConnections: true});
        }
        if (connectRequest.status !== 200 && !this.state.editMode) {
            this.setState({editMode: true});
        }

        // // get the settings to prefill the URL
        if (!settingsRequest.status) {
            getSettings();
        }

        if (connectRequest.status === 200 && !scheduledQueriesRequest.status) {
          getScheduledQueries();
        }

        const connectionObject = connections[selectedTab] || {};
        if (contains(connectionObject.dialect, SQL_DIALECTS_USING_EDITOR)) {
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
            connections,
            connectRequest,
            deleteTab,
            elasticsearchMappingsRequest,
            getSqlSchema,
            logout,
            schemaRequest,
            newTab,
            preview,
            previewTableRequest,
            runSqlQuery,
            queryRequest,
            s3KeysRequest,
            selectedTab,
            settingsRequest,
            setIndex,
            setTable,
            selectedTable,
            selectedScheduledQueries,
            getScheduledQueries,
            selectedIndex,
            setTab,
            tablesRequest,
            updatePreview,
            username
        } = this.props;

        if (!selectedTab) {
            return null; // initializing
        }

        const connectorUrl = this.state.urls.https;
        const {httpsServerIsOK, timeElapsed} = this.state;

        const plotlyUrl = (settingsRequest.status === 200 ?
            settingsRequest.content.PLOTLY_URL : 'https://plot.ly'
        );

        const dialect = connections[selectedTab].dialect;

        const queryPanelDisabled = (
            connectRequest.status !== 200 ||
            (!selectedTable && contains(dialect, SQL_DIALECTS_USING_EDITOR))
        );

        return (
            <div>
                <ConnectionTabs
                    connections={connections}
                    selectedTab={selectedTab}
                    newTab={newTab}
                    setTab={tabId => {
                        updatePreview({
                            showChart: false,
                            showEditor: true,
                            size: 200
                        });
                        setTab(tabId);
                    }}
                    deleteTab={deleteTab}
                />

                <div className={'openTab'}>

                    <Tabs
                        selectedIndex={this.state.selectedPanel[selectedTab] || 0}
                        onSelect={(panelIndex) => {
                            updatePreview({
                                showChart: false,
                                showEditor: true,
                                size: 200
                            });
                            this.setState({selectedPanel: {[selectedTab]: panelIndex}});
                        }}
                    >

                        <TabList>
                            <Tab>Connection</Tab>
                            <Tab disabled={queryPanelDisabled}>Query</Tab>
                            <Tab disabled={false}>Schedule</Tab>
                            {isOnPrem() || <Tab
                                className="test-ssl-tab react-tabs__tab"
                            >
                                Plot.ly
                            </Tab>}
                            { isElectron() && <Tab>FAQ</Tab> }
                        </TabList>

                        <TabPanel className={['tab-panel-connection', 'react-tabs__tab-panel']}>
                            {this.renderSettingsForm()}
                            {this.renderEditButton(!this.state.editMode)}
                        </TabPanel>

                        <TabPanel className={['tab-panel-query', 'react-tabs__tab-panel']}>
                            {queryPanelDisabled ? (
                                <div className="big-whitespace-tab">
                                    <p>Please connect to a data store in the Connection tab first.</p>
                                </div>
                            ) : (
                                <Preview
                                    username={username}

                                    connections={connections}
                                    connectionObject={connections[selectedTab]}

                                    selectedTab={selectedTab}

                                    selectedIndex={selectedIndex}
                                    setIndex={setIndex}

                                    selectedTable={selectedTable}
                                    setTable={setTable}

                                    getSqlSchema={getSqlSchema}
                                    schemaRequest={schemaRequest}

                                    preview={preview || {}}
                                    updatePreview={updatePreview}

                                    runSqlQuery={runSqlQuery}
                                    queryRequest={queryRequest || {}}
                                    s3KeysRequest={s3KeysRequest}
                                    apacheDrillStorageRequest={apacheDrillStorageRequest}
                                    apacheDrillS3KeysRequest={apacheDrillS3KeysRequest}
                                    elasticsearchMappingsRequest={elasticsearchMappingsRequest}
                                    previewTableRequest={previewTableRequest || {}}
                                    tablesRequest={tablesRequest}
                                />
                            )}
                        </TabPanel>

                        <TabPanel>
                          <Scheduler queries={selectedScheduledQueries} refreshQueries={getScheduledQueries} />
                        </TabPanel>

                        {isOnPrem() || <TabPanel>
                            {this.props.connectRequest.status === 200 ? (
                                <div className="big-whitespace-tab">
                                    {httpsServerIsOK ? (
                                        <div id="test-ssl-initialized" style={{textAlign: 'center'}}>
                                            <img
                                                src="/static/images/ms-icon-150x150.png"
                                                style={{border: '1px solid #ebf0f8'}}
                                            >
                                            </img>
                                            <p>
                                                {`The Falcon SQL Client can be a middle man between
                                                    your database and Plot.ly, so that when your database updates,
                                                    your charts and dashboards update as well. Run Falcon on a server
                                                    for 24/7 dashboard updates, or just keep this app open on an
                                                    office computer. If you have Plotly On-Premises, this app is
                                                    already running in your container. Contact your On-Prem admin
                                                    to learn how to connect.`}
                                            </p>

                                            <Link
                                                className="btn-primary"
                                                style={{maxWidth: '50%', marginTop: '40px', marginBottom: '30px'}}
                                                href={`${plotlyUrl}/create?upload=sql&url=${connectorUrl}`}
                                                target="_blank"
                                            >
                                                Query {dialect} from plot.ly
                                            </Link>
                                            <div>
                                                <code>Falcon has auto-generated a local URL
                                                    and SSL certificate for itself: </code>
                                                <br />
                                                <Link
                                                    href={`${plotlyUrl}/create?upload=sql&url=${connectorUrl}`}
                                                    target="_blank"
                                                >
                                                    <strong><code>{connectorUrl}</code></strong>
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (username) ? (
                                        <div>
                                            <p>
                                                {`Plotly is automatically initializing a
                                                  unique SSL certificate and URL for you.
                                                  This can take up to 10 minutes. Once this
                                                  is complete, you'll be able to query your
                                                  databases from `}
                                                <Link href={`${plotlyUrl}/create?upload=sql`}>
                                                        Plotly
                                                </Link>
                                                {`. It has been ${timeElapsed}. Check out the
                                                FAQ while you wait! 📰`}
                                            </p>
                                        </div>
                                    ) : (
                                        <div>
                                            <p>
                                                <a onClick={() => window.location.assign('/login')}>Log into Plotly</a>
                                                <br/>
                                                Log in to Plotly in order to schedule queries and make queries
                                                directly from the <a href={`https://${plotlyUrl}/create`}>
                                                Plotly Chart Studio </a>
                                            </p>
                                        </div>
                                    )
                                    }
                                </div>
                            ) : (
                                <div className="big-whitespace-tab">
                                    <p>Please connect to a data store in the Connection tab first.</p>
                                </div>
                            )}
                            {username && <p style={{textAlign: 'right'}}>
                                {`Logged in as "${username}"`}
                                <br/>
                                <a onClick={logout}>Log Out</a>
                            </p>}
                        </TabPanel> }

                        {isElectron() && <TabPanel>
                            <div className="big-whitespace-tab">
                                <ul>
                                    {FAQ.map(function(obj, i) {
                                        return (
                                            <li key={i}>
                                                {obj.q}
                                                <p>{obj.a}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        </TabPanel>}
                    </Tabs>
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
        scheduledQueries,
        scheduledQueriesRequest,
        elasticsearchMappingsRequests,
        selectedTables,
        selectedIndecies,
        settingsRequest,
        s3KeysRequests,
        apacheDrillStorageRequests,
        apacheDrillS3KeysRequests,
        schemaRequests,
        queryRequests,
        previews
    } = state;

    const selectedConnectionId = tabMap[selectedTab];
    const connectionsHaveBeenSaved = Boolean(selectedConnectionId);
    const selectedTable = selectedTables[selectedConnectionId] || null;
    const selectedIndex = selectedIndecies[selectedConnectionId] || null;
    const selectedScheduledQueries = scheduledQueries.filter(propEq('connectionId', selectedConnectionId)) 

    let previewTableRequest = {};
    if (previewTableRequests[selectedConnectionId] &&
        previewTableRequests[selectedConnectionId][selectedTable]
    ) {
        previewTableRequest = previewTableRequests[selectedConnectionId][selectedTable];
    }
    const preview = previews[selectedConnectionId] || {};
    const connection = connections[selectedTab];
    if (connection && !hasIn('code', preview)) {
        preview.code = PREVIEW_QUERY(connection, selectedTable);
    }

    return {
        connectionsRequest,
        connectRequest: connectRequests[selectedConnectionId] || {},
        saveConnectionsRequest: saveConnectionsRequests[selectedTab] || {},
        deleteConnectionsRequest: deleteConnectionsRequests[selectedConnectionId] || {},
        previewTableRequest,
        tablesRequest: tablesRequests[selectedConnectionId] || {},
        scheduledQueriesRequest: scheduledQueriesRequest || {},
        elasticsearchMappingsRequest: elasticsearchMappingsRequests[selectedConnectionId] || {},
        s3KeysRequest: s3KeysRequests[selectedConnectionId] || {},
        apacheDrillStorageRequest: apacheDrillStorageRequests[selectedConnectionId] || {},
        apacheDrillS3KeysRequest: apacheDrillS3KeysRequests[selectedConnectionId] || {},
        selectedTab,
        connections,
        connectionNeedToBeSaved: connectionsNeedToBeSaved[selectedTab] || true,
        connectionsHaveBeenSaved,
        connectionObject: connections[selectedTab],
        preview,
        schemaRequest: schemaRequests[selectedConnectionId],
        queryRequest: queryRequests[selectedConnectionId],
        selectedTable,
        selectedScheduledQueries,
        selectedIndex,
        selectedConnectionId,
        settingsRequest,
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
        connectionObject,
        preview
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
    function boundGetScheduledQueries() {
        return dispatch(Actions.getScheduledQueries(selectedConnectionId));
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
            connectionObject,
            selectedTable,
            selectedIndex
        ));
    }
    function boundUpdatePreview(previewUpdateObject) {
        return dispatch(Actions.updatePreview(
            merge(
                {connectionId: selectedConnectionId},
                previewUpdateObject
            )
        ));
    }
    function boundSetConnectionNeedToBeSaved(bool) {
        return dispatch(Actions.setConnectionNeedToBeSaved(
            selectedTab,
            bool
        ));
    }
    function boundGetSettings() {
        return dispatch(Actions.getSettings());
    }
    function boundGetSqlSchema() {
        return dispatch(Actions.getSqlSchema(
            selectedConnectionId,
            connectionObject.dialect,
            connectionObject.database
        ));
    }

    function boundRunSqlQuery() {
        return dispatch(Actions.runSqlQuery(
            selectedConnectionId,
            propOr('', 'code', preview)
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
            getScheduledQueries: boundGetScheduledQueries,
            getElasticsearchMappings: boundGetElasticsearchMappings,
            setTable: boundSetTable,
            setIndex: boundSetIndex,
            previewTables: boundPreviewTables,
            getS3Keys: boundGetS3Keys,
            getSettings: boundGetSettings,
            getApacheDrillStorage: boundGetApacheDrillStorage,
            getApacheDrillS3Keys: boundGetApacheDrillS3Keys,
            runSqlQuery: boundRunSqlQuery,
            getSqlSchema: boundGetSqlSchema,
            newTab: () => dispatch(Actions.newTab()),
            deleteTab: tab => dispatch(Actions.deleteTab(tab)),
            setTab: tab => dispatch(Actions.setTab(tab)),
            connect: dispatchConnect,
            editCredential: c => dispatch(Actions.editCredential(c)),
            updatePreview: boundUpdatePreview
        }
    );
}

Settings.propTypes = {
    connect: PropTypes.func,
    connectionObject: PropTypes.object,
    connectRequest: PropTypes.object,
    saveConnectionsRequest: PropTypes.object,
    updateConnection: PropTypes.func,
    dispatch: PropTypes.func,
    setConnectionNeedToBeSaved: PropTypes.func,
    connectorUrlsRequest: PropTypes.shape({
        status: PropTypes.number,
        content: PropTypes.array
    }),
    connectionNeedToBeSaved: PropTypes.bool,
    apacheDrillStorageRequest: PropTypes.object,
    apacheDrillS3KeysRequest: PropTypes.object,
    connections: PropTypes.object,
    connectionsRequest: PropTypes.object,
    elasticsearchMappingsRequest: PropTypes.object,
    getApacheDrillStorage: PropTypes.func,
    getApacheDrillS3Keys: PropTypes.func,
    getElasticsearchMappings: PropTypes.func,
    getTables: PropTypes.func,
    getS3Keys: PropTypes.func,
    getSettings: PropTypes.func,
    initialize: PropTypes.func,
    previewTables: PropTypes.func,
    previewTableRequest: PropTypes.object,
    selectedTable: PropTypes.any,
    settingsRequest: PropTypes.object,
    setTable: PropTypes.func,
    setIndex: PropTypes.func,
    s3KeysRequest: PropTypes.object,
    selectedTab: PropTypes.string,
    selectedIndex: PropTypes.any,
    selectedScheduledQueries: PropTypes.arrayOf(PropTypes.shape({
        query: PropTypes.string,
        refreshInterval: PropTypes.number
    })),
    scheduledQueriesRequest: PropTypes.object,
    getScheduledQueries: PropTypes.func,
    tablesRequest: PropTypes.object,
    deleteTab: PropTypes.func,
    getSqlSchema: PropTypes.func,
    schemaRequest: PropTypes.object,
    newTab: PropTypes.func,
    preview: PropTypes.object,
    runSqlQuery: PropTypes.func,
    queryRequest: PropTypes.object,
    setTab: PropTypes.func,
    updatePreview: PropTypes.func,
    logout: PropTypes.func,
    username: PropTypes.string
};

export default connect(mapStateToProps, mapDispatchToProps, mergeProps)(Settings);
