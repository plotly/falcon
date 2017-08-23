import React, { Component, PropTypes } from 'react';
import * as styles from './Tabs.css';
import classnames from 'classnames';
import {LOGOS, DIALECTS} from '../../../constants/constants';

export default class ConnectionTab extends Component {
    constructor(props) {
        super(props);
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
        } else if (connectionObject.dialect === DIALECTS.ELASTICSEARCH) {
            label = `Elasticsearch (${connectionObject.host})`;
        } else if (connectionObject.dialect === DIALECTS.SQLITE) {
            label = connectionObject.storage;
        } else {
            label = `${connectionObject.database} (${connectionObject.username}@${connectionObject.host})`;
        }

        return (
            <div
                className={classnames(
                    styles.tabWrapper,
                    {[styles.tabWrapperSelected]: isSelected}
                )}
            >
                {isDeletable ?
                    <img
                        className={styles.tabDelete}
                        onClick={() => deleteTab(tabId)}
                        src="images/delete.png"
                        id={`test-tab-delete-${id}`}
                    >
                    </img> : null
                }

                <span onClick={() => setTab(tabId)}>
                    <img
                        className={styles.tabLogo}
                        src={LOGOS[dialect]}
                        id={`test-tab-id-${id}`}
                    >
                    </img>

                    <p className={styles.tabIdentifier}>
                        <span>
                            {label}
                        </span>
                    </p>
                </span>

            </div>

        );

    }
}
