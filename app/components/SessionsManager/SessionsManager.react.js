import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './SessionsManager.css';
import classnames from 'classnames';
import ReactTooltip from 'react-tooltip';


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
        const ID = (sessionKey) => {
            return (
                <span>
                    {sessions.getIn(
                        ['list', sessionKey, 'configuration', 'username']
                    )}
                    @
                    {sessions.getIn(
                        ['list', sessionKey, 'configuration', 'host']
                    ) || 'localhost'}
                    &nbsp;
                </span>
        );
        };

        const tooltip = (sessionKey) => {
            return (
                <ReactTooltip id={sessionKey} type="warning" effect="solid">
                    <span>
                        {ID(sessionKey)}
                    </span>
                </ReactTooltip>
            );
        };

        let sessionsIcons = null;

            sessionsIcons = Object.keys(sessions.get('list').toJS()).map(
                sessionKey => (
                    <div className={classnames(styles.connectionWrapper, {
                            [styles.connectionWrapperSelected]:
                                `${sessions.get('sessionSelected')}` === sessionKey
                            }
                        )}
                    >
                        <img
                            className={styles.connectionDelete}
                            onClick={() => {
                                const indexOfId = sessionsIds.indexOf(sessionKey);
                                // can't go into negative indexes
                                if (sessionKey !== '0') {
                                    sessionsActions.switchSession(
                                        sessionsIds[indexOfId - 1]
                                    );
                                } else {
                                    sessionsActions.switchSession(
                                        sessionsIds[indexOfId + 1]
                                    );
                                }
                                    sessionsActions.deleteSession(sessionKey);
                            }}
                            src="./images/delete.png"
                            id={`test-session-delete-${sessionKey}`}
                        >
                        </img>

                        <img
                            className={styles.connection}
                            onClick={() => {
                                sessionsActions.switchSession(sessionKey);
                            }}
                            src={LOGOS[sessions.getIn([
                                'list', sessionKey, 'configuration', 'dialect'
                            ])]}
                            id={`test-session-id-${sessionKey}`}
                        >
                        </img>

                        <p data-tip data-for={sessionKey}
                            className={styles.connectionIndex}
                            onClick={() => {
                                sessionsActions.switchSession(sessionKey);
                            }}
                        >
                            {ID(sessionKey)}
                            {tooltip(sessionKey)}
                        </p>

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
                            }}
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

SessionsManager.propTypes = {
    sessionsActions: PropTypes.object,
    sessions: ImmutablePropTypes.map.isRequired
};
