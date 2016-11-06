import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';

let shell;
try {
    shell = require('electron').shell;
} catch(e) {
    const shell = {
        openExternal: function openExternal(link) {
            console.warn('opening link');
        }
    }
}

import * as styles from './Configuration.css';

export default class Configuration extends Component {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        // this.props.sessionsActions.initializeSessions();
    }

    render() {

        return (
            <div className={styles.fullApp}>
                <div className={styles.header}>
                    <div className={styles.logoAndTitle}>
                        <img className={styles.plotlyLogo}
                            src="./images/plotly-connector-logo.svg"
                        >
                        </img>
                        <h5 className={styles.applicationTitle}>
                            Plotly Database Connector
                        </h5>
                    </div>

                    <div className={styles.supportLinks}>
                        <div className={styles.externalLinkContainer}>
                            <span className={styles.externalLink}
                                onClick={() => {
                                shell.openExternal('http://plot.ly/plans/');
                            }}
                            >
                            Upgrade&nbsp;for&nbsp;Support
                            </span>

                            <span className={styles.externalLink}
                                onClick={() => {
                                shell.openExternal('http://help.plot.ly/database-connectors/');
                            }}
                            >
                            Documentation
                            </span>

                            <span className={styles.externalLink}
                                onClick={() => {
                                shell.openExternal('https://plotly.typeform.com/to/KUiCSl');
                            }}
                            >
                            Request&nbsp;a&nbsp;Connector
                            </span>
                        </div>
                    </div>
                </div>

                <Settings/>

            </div>

        );
    }
}

Configuration.propTypes = {
    sessionsActions: PropTypes.object,
    sessions: ImmutablePropTypes.map.isRequired
};
