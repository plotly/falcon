import React, { Component, PropTypes } from 'react';
import * as styles from './SessionsManager.css';
import classnames from 'classnames';
import {LOGOS} from '../../constants/constants';

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
                    styles.sessionWrapper,
                    {[styles.sessionWrapperSelected]: isSelected}
                )}
                onClick={() => setTab(tabId)}
            >

                <img
                    className={styles.sessionDelete}
                    onClick={() => deleteTab(tabId)}
                    src="./images/delete.png"
                    id={`test-session-delete-${id}`}
                >
                </img>

                <p className={styles.sessionIdentifier}>
                    <span>
                        {username}@{host}
                    </span>
                </p>

                <img
                    className={styles.sessionLogo}
                    src={LOGOS[dialect]}
                    id={`test-session-id-${id}`}
                >
                </img>

            </div>

        );

    }
}
