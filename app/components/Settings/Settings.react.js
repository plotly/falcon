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
import {getAllBaseUrls} from '../../utils/utils';


let checkconnectorUrls;
let checkDNS;

class Settings extends Component {
    constructor(props) {
        super(props);
        this.fetchData = this.fetchData.bind(this);
        this.renderEditButton = this.renderEditButton.bind(this);
        this.renderSettingsForm = this.renderSettingsForm.bind(this);
        this.state = {
            editMode: true,
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
        }
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
            console.warn(`Attempting a connection at ${this.state.urls.https}`);
            if (this.state.urls.https) {
                fetch(this.state.urls.https).then(() => {
                    this.setState({httpsServerIsOK: true});
                    clearInterval(this.intervals.checkHTTPSEndpointInterval);
                    clearInterval(this.intervals.timeElapsedInterval);
                });
            }
        }, 5 * 1000);

    }

    componentDidUpdate() {
        this.fetchData();
    }

    renderEditButton(show) {
        return (
            <div className={styles.editButtonContainer}>
                {show ? (
                    <button
                        style={{
                            'display': 'block',
                            'marginLeft': 'auto',
                            'marginRight': 'auto'
                        }}
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
            getSettings,
            initialize,
            previewTables,
            previewTableRequest,
            selectedTable,
            settingsRequest,
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

        // // get the settings to prefill the URL
        if (!settingsRequest.status) {
            getSettings();
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
            settingsRequest,
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

        const connectorUrl = this.state.urls.https;
        const {httpsServerIsOK, timeElapsed} = this.state;

        const plotlyUrl = (settingsRequest.status === 200 ?
            settingsRequest.content.PLOTLY_URL : 'https://plot.ly'
        );

        return (
            <div>
                <Tabs
                    connections={connections}
                    selectedTab={selectedTab}
                    newTab={newTab}
                    setTab={setTab}
                    deleteTab={deleteTab}
                />

                <div className={styles.openTab} style={{'padding': 30}}>

                    <h3>Step 1. Set Up Connections</h3>

                    {this.renderSettingsForm()}

                    {this.renderEditButton(!this.state.editMode)}

                    {this.props.connectRequest.status === 200 ? (
                    <div>
                        <h3>Step 2. Preview Database</h3>

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

                        <h3>Step 3. Wait for a SSL Certificate</h3>

                        {httpsServerIsOK ? (
                            <div>
                                <div>
                                    {'Step 3 is now complete, Plotly has generated a unique SSL certificate for you.'}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <p>
                                    {`Plotly is automatically initializing a
                                      unique SSL certificate and URL for you.
                                      This can take up to 10 minutes.`}
                                </p>
                                <p>
                                    {`It has been ${timeElapsed}`}.
                                </p>
                                <p>
                                    {`Once this is complete, you'll be able to
                                      query your databases from the `}&nbsp;
                                    <Link href={`${plotlyUrl}/create?upload=sql`}>
                                            Plotly Chart Creator
                                    </Link>
                                    {'.'}
                                </p>
                            </div>
                        )}

                        <div id="test-ssl-initialized">
                            <h3>Final Step. Query Data on Plotly</h3>

                            {httpsServerIsOK ? (
                                <div>
                                    <p>
                                        <Link href={`${plotlyUrl}/create?upload=sql&url=${connectorUrl}`}>
                                            Click to Open Query Editor
                                         </Link>
                                        &nbsp;
                                        {`in the Plotly Chart Creator.`}
                                    </p>

                                    <p>
                                        Plotly has generated this secure URL for you: <b>{connectorUrl}</b>
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {`Before you can query, wait until Plotly has
                                      finished Step 3 for you.`}
                                </div>
                            )
                            }
                        </div>

                    </div>
                    ) : null}

                    <hr style={{'marginTop': '60px'}}/>

                    <div>
                        <h3>FAQ</h3>

                        <div>
                            <ul>
                                <li>
                                    <strong>{`How does this app work?`}</strong>

                                    <p>
                                        {`The Plotly Database Connector is a local web server that
                                        listens for requests from your web browser in
                                        the`}
                                        &nbsp;
                                        <Link href={`${plotlyUrl}/create`}>Plotly Chart Creator</Link>
                                        &nbsp;
                                        {`This application makes queries against the databases that you have
                                          connected to and returns the results to the Plotly Chart Creator.`}
                                    </p>
                                </li>

                                <li>
                                    <strong>{`Do I need to keep this application open?`}</strong>

                                    <p>
                                        {`Keep this application open when you're making queries!
                                        The Plotly Chart Creator connects to your database through
                                        this application.`}
                                    </p>

                                </li>

                                <li>
                                    <strong>{`Do I need to expose my database to your servers?`}</strong>
                                    <p>
                                          {`Since these requests are made locally from your web browser
                                          to this application, you do not need to open up
                                          your database's network: you just need to make sure
                                          that you can connect to your database from this computer.`}
                                    </p>
                                </li>

                                <li>
                                    <strong>{`Where do I make SQL queries?`}</strong>
                                    <p>
                                        {`The`}
                                        &nbsp;
                                        <Link href={`${plotlyUrl}/create`}>Plotly Chart Creator</Link>
                                        &nbsp;
                                        {`includes a SQL editor that you can use
                                          to import data from your databases into Plotly.`}
                                    </p>

                                </li>

                                <li>
                                    <strong>{`Are these database credentials shared on the Plotly server?`}</strong>
                                    <p>
                                        {`Your database credentials are only stored on your
                                          computer (they are not saved on any plotly servers).`}
                                    </p>
                                </li>

                                <li>
                                    <strong>{`How do scheduled queries work?`}</strong>

                                    <p>
                                        {`You can run queries on a schedule (e.g. daily or hourly) in the`}
                                        &nbsp;
                                        <Link href={`${plotlyUrl}/create?upload=sql&url=${connectorUrl}`}>
                                            Plotly Chart Creator
                                         </Link>
                                         {`. Scheduled queries are saved and managed by this application,
                                         so keep this app open if you want your queries to run and your
                                         datasets to update. When you start the application, all of the
                                         scheduled queries will run automatically and their scheduling timer
                                         will reset.`}

                                    </p>
                                </li>

                                <li>
                                    <strong>{`What's a SSL certificate and why do I need it?`}</strong>

                                    <p>
                                        {`An SSL certificate is used to encrypt the requests between your
                                          web browser and this connector. Unencrypted requests are blocked by
                                          default in modern web browsers. We generate these certificates for you
                                          automatically through the `}
                                        &nbsp;
                                        <Link href="https://letsencrypt.org/">
                                            {`Let's Encrypt service`}
                                        </Link>
                                        {`. This certificate takes
                                          a several minutes to generate.`}
                                    </p>

                                </li>

                                <li>
                                    <strong>{`How do you generate certificates for a localhost web server?`}</strong>

                                    <p>
                                        {`This application runs a server on localhost:
                                          it is not exposed to the network.
                                          SSL certificates can not be issued for localhost servers,
                                          so we create a unique URL for you and a global DNS entry that points
                                          that URL to localhost. We use the Let's Encrypt service to
                                          generate certificates on that unique URL.`}
                                    </p>
                                </li>

                                <li>
                                    <strong>{`Is this app open source?`}</strong>
                                    <p>
                                        {`Yes! You can view the code in our GitHub repo: `}
                                        <Link href={'https://github.com/plotly/plotly-database-connector'}>
                                            {'https://github.com/plotly/plotly-database-connector'}
                                         </Link>
                                    </p>
                                </li>

                            </ul>
                        </div>
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
        settingsRequest,
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
    function boundGetSettings() {
        return dispatch(Actions.getSettings());
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
            getSettings: boundGetSettings,
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
