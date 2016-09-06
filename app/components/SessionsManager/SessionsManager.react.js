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
        const sessionsIds = Object.keys(sessions.get('list').toJS());
        const sessionsNB = sessionsIds.length;

        let sessionsIcons = null;
        if (sessionsNB > 0) {

            sessionsIcons = Object.keys(sessions.get('list').toJS()).map(
                sessionKey => (
                    <div className={classnames(styles.connectionWrapper, {
                        [styles.connectionWrapperSelected]:
                            `${sessions.get('sessionSelected')}` === sessionKey
                        }
                    )}
            >
                        <img
                            className={styles.connection}

                            onClick={() => {
                                sessionsActions.switchSession(sessionKey);
                            }}

                            src={LOGOS[sessions.getIn([
                                'list', sessionKey, 'configuration', 'dialect'
                            ])]}
                        >
                        </img>
                        <img
                            className={styles.connectionDelete}
                            onClick={() => {
                                const indexOfId = sessionsIds.indexOf(sessionKey);
                                if (sessionKey !== '0') {
                                    sessionsActions.switchSession(sessionsIds[indexOfId - 1]);
                                } else {
                                    sessionsActions.switchSession(sessionsIds[indexOfId + 1]);
                                }
                                    sessionsActions.deleteSession(sessionKey);
                            }}
                            src="./images/delete.png"
                        >
                        </img>
                    </div>
                )
        );}

        return (
            <div className={styles.sessionsManagerContainer}>
                <div className={styles.sessionsManagerWrapper}>
                    {sessionsIcons}
                    <div className={styles.connectionAddWrapper}>
                        <img
                            className={styles.connectionAdd}
                            onClick={() => {
                                this.props.sessionsActions.newSession(
                                    {
                                        id: sessionsNB,
                                        configuration: NEW_SESSION.CONFIG,
                                        ipc: NEW_SESSION.IPC,
                                        connection: NEW_SESSION.CONNECTION
                                    }
                                );
                                sessionsActions.switchSession(sessionsNB);
                            }}
                            src="./images/add.png"
                        >
                        </img>
                    </div>
                </div>
            </div>
        );
    }
}

SessionsManager.propTypes = {
    sessionsActions: PropTypes.object,
    sessions: ImmutablePropTypes.map.isRequired
};
