import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './SessionsManager.css';
import classnames from 'classnames';
import {NEW_SESSION} from '../../constants/constants';

const LOGOS = {
    postgres: './images/postgres-logo.png',
    mysql: './images/mysql-logo.png',
    mariadb: './images/mariadb-logo.png',
    mssql: './images/mssql-logo.png',
    sqlite: './images/sqlite-logo.png',
    redshift: './images/redshift-logo.png'
};

export default class SessionsManager extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {sessions, sessionsActions} = this.props;
        const sessionsNB = sessions.get('list').size;

        let sessionsIcons = null;
        // debugger;
        if (sessionsNB > 0) {

            sessionsIcons = Object.keys(sessions.get('list').toJS()).map(
                sessionKey => (
                    <img
                        className={classnames(
                            styles.connection, {
                                [styles.connectionSelected]:
                                    `${sessions.get('sessionSelected')}` === sessionKey
                            }
                        )}

                        onClick={() => {
                            console.warn(`change to session ${sessionKey}`);
                            sessionsActions.switchSession(sessionKey);
                        }}

                        src={LOGOS[sessions.getIn([
                            'list', sessionKey, 'configuration', 'dialect'
                        ])]}
                    >
                    </img>
                )
        );}

        return (
            <div className={styles.sessionsManagerContainer}>
                {sessionsIcons}
                <img
                    className={styles.connectionPlus}
                    onClick={() => {

                        this.props.sessionsActions.newSession(
                            {
                                id: sessionsNB,
                                configuration: NEW_SESSION.CONFIG,
                                ipc: NEW_SESSION.IPC,
                                connection: NEW_SESSION.CONNECTION
                            }
                        );

                    }}
                    src="./images/add.png"
                >
                </img>
            </div>
        );
    }
}

SessionsManager.propTypes = {
    sessionsActions: PropTypes.object,
    sessions: ImmutablePropTypes.map.isRequired
};
