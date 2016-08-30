import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';
import Rolladex from './Rolladex/Rolladex.react';
import * as styles from './Configuration.css';

export default class Configuration extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let settings = null;
        const {
            sessionsActions,
            sessions
        } = this.props;
        // debugger;
        const sessionSelected = sessions.getIn(
            ['list', `${this.props.sessions.get('sessionSelected')}`]
        );
        console.warn(sessionSelected);

        if (this.props.sessions.get('list').size > 0) {
            console.warn('rendering settings');

            settings = (
                <Settings
                    configuration={sessionSelected.get('configuration')}
                    connection={sessionSelected.get('connection')}
                    ipc={sessionSelected.get('ipc')}

                    sessionsActions={sessionsActions}
                />
            );
        }

        return (
            <div>

                <img
                    src="./images/plotly-logo.png"
                    className={styles.plotlyLogo}
                >
                </img>

                <h4>
                    Plotly 2.0 Database Connector
                </h4>
                {settings}

            </div>

        );
    }
}

Configuration.propTypes = {
    sessionsActions: PropTypes.object,
    sessions: ImmutablePropTypes.map.isRequired
};
