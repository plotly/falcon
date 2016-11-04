import React, { Component, PropTypes } from 'react';
import * as styles from './Tabs.css';
import classnames from 'classnames';
import {LOGOS} from '../../../constants/constants';

export default class Tab extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {tabId, isSelected, credentialObject, setTab, deleteTab} = this.props;
        const {username, host, dialect, id} = credentialObject;
        return (
            <div
                className={classnames(
                    styles.tabWrapper,
                    {[styles.tabWrapperSelected]: isSelected}
                )}
                onClick={() => setTab(tabId)}
            >

                <p className={styles.tabIdentifier}>
                    <span>
                        {username}@{host}
                    </span>
                </p>

                <img
                    className={styles.tabLogo}
                    src={LOGOS[dialect]}
                    id={`test-tab-id-${id}`}
                >
                </img>

                <img
                    className={styles.tabDelete}
                    onClick={() => deleteTab(tabId)}
                    src="./images/delete.png"
                    id={`test-tab-delete-${id}`}
                >
                </img>

            </div>

        );

    }
}
