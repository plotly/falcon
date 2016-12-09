import React, { Component, PropTypes } from 'react';
import * as styles from './Tabs.css';
import classnames from 'classnames';
import {LOGOS} from '../../../constants/constants';

export default class Tab extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {tabId, isSelected, connectionObject, setTab, deleteTab} = this.props;
        const {dialect, id} = connectionObject;

        // Heads up - these should match the same labels in plot.ly/create
        let label;
        if (dialect === 's3') {
            label = `S3 - (${connectionObject.bucket})`;
        } else if (dialect === 'apache drill') {
            label = `Apache Drill (${connectionObject.host})`;
        } else if (connectionObject.dialect === 'elasticsearch') {
            label = `Elasticsearch (${connectionObject.host})`;
        } else if (connectionObject.dialect === 'sqlite') {
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
                onClick={() => setTab(tabId)}
            >

                <img
                    className={styles.tabDelete}
                    onClick={() => deleteTab(tabId)}
                    src="images/delete.png"
                    id={`test-tab-delete-${id}`}
                >
                </img>

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

            </div>

        );

    }
}
