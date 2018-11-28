import React, {Component} from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {LOGOS, DIALECTS} from '../../../constants/constants';
import {getPathNames} from '../../../utils/utils';

export default class ConnectionTab extends Component {
    constructor(props) {
        super(props);
    }

    static propTypes = {
        tabId: PropTypes.string,
        isSelected: PropTypes.bool,
        connectionObject: PropTypes.object,
        setTab: PropTypes.func,
        deleteTab: PropTypes.func,
        isDeletable: PropTypes.bool
    }

    render() {
        const {tabId, isSelected, connectionObject, setTab, deleteTab, isDeletable} = this.props;
        const {dialect, id} = connectionObject;

        // Heads up - these should match the same labels in plot.ly/create
        let label;
        if (dialect === DIALECTS.S3) {
            label = `S3 - (${connectionObject.bucket})`;
        } else if (dialect === DIALECTS.APACHE_DRILL) {
            label = `Apache Drill (${connectionObject.host})`;
        } else if (dialect === DIALECTS.APACHE_IMPALA) {
              label = `Apache Impala (${connectionObject.host}:${connectionObject.port})`;
        } else if (dialect === DIALECTS.APACHE_SPARK) {
            label = `Apache Spark (${connectionObject.host}:${connectionObject.port})`;
        } else if (connectionObject.dialect === DIALECTS.CSV) {
            label = connectionObject.label || connectionObject.id || connectionObject.database;
        } else if (connectionObject.dialect === DIALECTS.ELASTICSEARCH) {
            label = `Elasticsearch (${connectionObject.host})`;
        } else if (connectionObject.dialect === DIALECTS.ATHENA) {
            label = `Athena (${connectionObject.database})`;
        } else if (connectionObject.dialect === DIALECTS.ORACLE) {
            label = `${connectionObject.connectionString}`;
        } else if (connectionObject.dialect === DIALECTS.SQLITE) {
            label = connectionObject.storage;
        } else if (connectionObject.dialect === DIALECTS.BIGQUERY) {
            label = `Big Query ${connectionObject.database}`;
        } else if(connectionObject.dialect === DIALECTS.CLICKHOUSE) {
            label = `ClickHouse ${connectionObject.database}`;
        } else if (connectionObject.dialect === DIALECTS.DATA_WORLD) {
            const pathNames = getPathNames(connectionObject.url);
            if (pathNames.length >= 3) {
                label = `data.world (${pathNames[1]}/${pathNames[2]})`;
            } else {
                label = 'data.world (/)';
            }
        } else {
            label = `${connectionObject.database} (${connectionObject.username}@${connectionObject.host})`;
        }

        return (
            <div
                className={classnames(
                    'tabWrapper',
                    {['tabWrapperSelected']: isSelected}
                )}
            >
                {isDeletable ?
                    <img
                        className={'tabDelete'}
                        onClick={() => deleteTab(tabId)}
                        src="images/delete.png"
                        id={`test-tab-delete-${id}`}
                    >
                    </img> : null
                }

                <span onClick={() => setTab(tabId)}>
                    <img
                        className={'tabLogo'}
                        src={LOGOS[dialect]}
                        id={`test-tab-id-${id}`}
                    >
                    </img>

                    <p className={'tabIdentifier'}>
                        <span>
                            {label}
                        </span>
                    </p>
                </span>

            </div>

        );

    }
}
