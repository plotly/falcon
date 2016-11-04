import React, { Component, PropTypes } from 'react';
import * as styles from './Tabs.css';
import classnames from 'classnames';
import {keys} from 'ramda';
import Tab from './Tab.react';

export default class Tabs extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {credentials, selectedTab, newTab, setTab, deleteTab} = this.props;
            return (
                <div className={classnames(styles.tabManagerWrapper, styles.Flipped)}>
                    <div className={styles.tabManagerContainer}>
                        {keys(credentials).map(tabId =>
                            <Tab
                                key={tabId}
                                tabId={tabId}
                                isSelected={tabId === selectedTab}
                                credentialObject={credentials[tabId]}
                                setTab={setTab}
                                deleteTab={deleteTab}
                            />
                        )}

                        <div className={styles.tabAddWrapper}>
                            <img
                                className={styles.tabAdd}
                                onClick={newTab}
                                src="./images/add.png"
                                id="test-session-add"
                            >
                            </img>
                        </div>
                    </div>
                </div>
            );
    }
}
