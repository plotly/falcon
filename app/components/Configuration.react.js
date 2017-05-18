import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';
import {baseUrl} from '../utils/utils';
import {Link} from './Link.react';
import {contains} from 'ramda';

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
                    <span className={styles.logoAndTitle}>
                        <img className={styles.plotlyLogo}
                            src="images/plotly-connector-logo.svg"
                        >
                        </img>
                        <h5 className={styles.applicationTitle}>
                            Plotly Database Connector
                        </h5>
                    </span>

                    <span className={styles.supportLinksContainer}>
                        <div className={styles.externalLinkContainer}>
                            {/* Hide Upgrade button for on-prem */}
                            {
                                contains(
                                    'external-data-connector',
                                    window.location.href
                                ) ?
                                null : <Link className={styles.supportLinks} href={LINKS.PLANS}>Plans and Pricing</Link>
                            }
                            {/* TODO - Template in ONPREM */}
                            {
                                contains(
                                    'external-data-connector',
                                    window.location.href
                                ) ?
                                null : <Link className={styles.supportLinks} href={'https://plot.ly/create'}>Chart Creator and SQL Editor</Link>
                            }
                            <Link className={styles.supportLinks} href={LINKS.DOCS}>Documentation</Link>
                            <Link className={styles.supportLinks} href={LINKS.TYPEFORM}>Request a Connector</Link>
                        </div>
                    </span>
                </div>

                <Settings/>

            </div>

        );
    }
}

Configuration.propTypes = {
    sessionsActions: PropTypes.object
};
