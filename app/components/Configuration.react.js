import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';
import SessionsManager from './SessionsManager/SessionsManager.react';
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
        const sessionSelected = sessions.getIn(
            ['list', `${this.props.sessions.get('sessionSelectedId')}`]
        );

        if (this.props.sessions.get('list').size > 0) {

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
                    src="./images/plotly-logo-no-name.png"
                    className={styles.plotlyLogo}
                >
                </img>

                <h4>
                    Plotly 2.0 Database Connector
                </h4>

                <SessionsManager
                    sessionsActions={this.props.sessionsActions}
                    sessions={this.props.sessions}
                />

                {settings}

            </div>

        );
    }
}

Configuration.propTypes = {
    sessionsActions: PropTypes.object,
    sessions: ImmutablePropTypes.map.isRequired
};
