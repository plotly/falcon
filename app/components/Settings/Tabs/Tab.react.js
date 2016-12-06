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
        const {username, host, dialect, id} = connectionObject;

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
                        {username}@{host}
                    </span>
                </p>

            </div>

        );

    }
}
