import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';
import {baseUrl} from '../utils/utils';
import {Link} from './Link.react';

import * as styles from './Configuration.css';

const LINKS = {
    PLANS: 'http://plot.ly/plans/',
    DOCS: 'http://help.plot.ly/database-connectors/',
    TYPEFORM: 'https://plotly.typeform.com/to/KUiCSl'
};

export default class Configuration extends Component {
    constructor(props) {
        super(props);
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
                            {Link(LINKS.PLANS, 'Upgrade for Support')}
                            {Link(LINKS.DOCS, 'Documentation')}
                            {Link(LINKS.TYPEFORM, 'Request a Connector')}
                        </div>
                    </div>
                </div>

                <Settings/>

            </div>

        );
    }
}

Configuration.propTypes = {
    sessionsActions: PropTypes.object
};
