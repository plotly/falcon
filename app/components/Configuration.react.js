import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';
import * as utils from '../utils/utils';

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

        /*
         * TODO - oauth needs to be part of on-prem and this
         * app needs to somehow get the client_id from on-prem
         */
        const baseURL = 'https://local.plot.ly';
        const resource = '/o/authorize/';
        const client_id = 'LX4A5wifVDc06WIU1uWmIm0KgqN9Bs0qsEb1GW3n';
        const redirect_uri = utils.baseUrl() + '/oauth';
        const queryString = `?response_type=token&client_id=${client_id}&redirect_uri=${redirect_uri}`;
        const oauthURL = (
            'https://local.plot.ly/o/authorize' + queryString
        );

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

                            {/* TODO - This needs to be part of the sign-in flow */}
                            <span className={styles.externalLink}
                                onClick={() => {
                                shell.openExternal(oauthURL);
                            }}
                            >
                            Login
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
