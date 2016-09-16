import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './SessionsManager.css';
import classnames from 'classnames';
import ReactTooltip from 'react-tooltip';
import {last, contains} from 'ramda';

const timestamp = () => Math.floor(Date.now() / 1000);

const getNewId = (sessionsIds) => {
    let tries = 0;
    let newId = null;
    while (
        !newId || contains(newId, sessionsIds)
    ) {
        newId = timestamp();
        tries += 1;
        if (tries > 10) {
            debugger;
        }
    }
    return `${newId}`;
};

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
        const numberOfActiveSessions = sessionsIds.length;
        const newId = getNewId(sessionsIds);

        const ID = (sessionId) => {
            return (
                <span>
                    {sessions.getIn(
                        ['list', sessionId, 'configuration', 'username']
                    )}
                    @
                    {sessions.getIn(
                        ['list', sessionId, 'configuration', 'host']
                    ) || 'localhost'}
                    &nbsp;
                </span>
        );
        };

        // display the full `username@host` identifier
        const tooltip = (sessionId) => {
            return (
                <ReactTooltip id={sessionId} type="warning" effect="solid">
                    <span>
                        {ID(sessionId)}
                    </span>
                </ReactTooltip>
            );
        };

        // deletes upon click the session from this.props.sessions.list
        const sessionDeleteIcon = (sessionId) => {
            return (
                <img
                    className={styles.connectionDelete}
                    onClick={() => {
                        const indexOfId = sessionsIds.indexOf(
                            sessions.get('sessionSelected')
                        );
                        // are we deleting currently open session?
                        if (sessionId === sessions.get('sessionSelected')) {
                            // have to switch before deleting
                            if (indexOfId === '0') {
                                // cant have a negative index in an array
                                sessionsActions.switchSession(
                                    sessionsIds[indexOfId + 1]
                                );
                            } else {
                                // if its not the first index, switch to next
                                sessionsActions.switchSession(
                                    sessionsIds[indexOfId + 1]
                                );
                            }
                        }
                        // delete it
                        sessionsActions.deleteSession(sessionId);
                    }}
                    src="./images/delete.png"
                    id={`test-session-delete-${sessionId}`}
                >
                </img>
            );
        };

        // displays that sessions currently selected database logo
        const sessionLogoIcon = (sessionId) => {
            return (
                <img
                    className={styles.connection}
                    onClick={() => {
                        sessionsActions.switchSession(sessionId);
                    }}
                    src={LOGOS[sessions.getIn([
                        'list', sessionId, 'configuration', 'dialect'
                    ])]}
                    id={`test-session-id-${sessionId}`}
                >
                </img>
            );
        };

        // displays (shortened if too long) session identifier `username@host`
        const sessionIdentifierText = (sessionId) => {
            return (
                <p data-tip data-for={sessionId}
                    className={styles.connectionIndex}
                    onClick={() => {
                        sessionsActions.switchSession(sessionId);
                    }}
                >
                    {ID(sessionId)}
                    {tooltip(sessionId)}
                </p>
            );
        };

        // displays a (+) icon and creates a new session upon click
        const connectionAddIcon = () => {
            return (
                <img
                    className={styles.connectionAdd}
                    onClick={() => {
                        sessionsActions.newSession(newId);
                        sessionsActions.switchSession(newId);
                    }}
                    src="./images/add.png"
                    id="test-session-add"
                >
                </img>
            );
        };

        let sessionsIcons = null;
        if (numberOfActiveSessions > 0) {
            sessionsIcons = Object.keys(sessions.get('list').toJS()).map(
                /*
                    returns three UI items for each session
                    a delete (x) icon, a database logo,
                    and sessionIdentifierText (`username@host`)
                */
                sessionId => (
                    <div className={classnames(styles.connectionWrapper, {
                            [styles.connectionWrapperSelected]:
                                sessions.get('sessionSelected') === sessionId
                            }
                        )}
                    >
                        {sessionDeleteIcon(sessionId)}
                        {sessionLogoIcon(sessionId)}
                        {sessionIdentifierText(sessionId)}

                    </div>
                )
        );}

        return (
            <div className={styles.sessionsManagerContainer}>
                <div className={styles.sessionsManagerWrapper}>
                    {sessionsIcons}
                    <div className={styles.connectionAddWrapper}>
                        {connectionAddIcon()}
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
