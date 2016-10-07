import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './SessionsManager.css';
import classnames from 'classnames';
import ReactTooltip from 'react-tooltip';
import {contains} from 'ramda';

const timestamp = () => Math.floor(Date.now() / 1000);

const getNewId = (sessionsIds) => {
    let tries = 0;
    let newId = null;
    while (
        !newId || contains(newId, sessionsIds)
    ) {
        newId = timestamp();
        tries += 1;
    }
    return `${newId}`;
};

const LOGOS = {
    postgres: './images/postgres-logo.png',
    mysql: './images/mysql-logo.png',
    mariadb: './images/mariadb-logo.png',
    mssql: './images/mssql-logo.png',
    sqlite: './images/sqlite-logo.png',
    elasticsearch: './images/elastic-logo.png',
    redshift: './images/redshift-logo.png'
};

export default class SessionsManager extends Component {
    constructor(props) {
        super(props);
        this.state = {
            showOnPremDomainInput: false,
            onPremDomain: ''
        };
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
                <ReactTooltip
                    className={styles.reactTooltip}
                    id={sessionId}
                    type="warning"
                    effect="solid"
                    place="bottom"
                    offset="{'bottom': 15, 'right': 20}"
                >
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
                    className={styles.sessionDelete}
                    onClick={() => {
                        const indexOfId = sessionsIds.indexOf(
                            sessions.get('sessionSelected')
                        );
                        // are we deleting currently open session?
                        if (sessionId === sessions.get('sessionSelected')) {
                            // have to switch before deleting
                            if (indexOfId === 0) {
                                // cant have a negative index in an array
                                sessionsActions.switchSession(
                                    sessionsIds[indexOfId + 1]
                                );
                            } else {
                                // if its not the first index, switch to next
                                sessionsActions.switchSession(
                                    sessionsIds[indexOfId - 1]
                                );
                            }
                        }
                        // delete it
                        // TODO: this should probably be a single action?
                        sessionsActions.deleteSession(sessionId); // for backend
                        sessionsActions.forgetSession(sessionId);
                    }}
                    src="./images/delete.png"
                    id={`test-session-delete-${sessionsIds.indexOf(sessionId)}`}
                >
                </img>
            );
        };

        // displays that sessions currently selected database logo
        const sessionLogoIcon = (sessionId) => {
            return (
                <img
                    className={styles.sessionLogo}
                    onClick={() => {
                        sessionsActions.switchSession(sessionId);
                    }}
                    src={LOGOS[sessions.getIn([
                        'list', sessionId, 'configuration', 'dialect'
                    ])]}
                    id={`test-session-id-${sessionsIds.indexOf(sessionId)}`}
                >
                </img>
            );
        };

        // displays (shortened if too long) session identifier `username@host`
        const sessionIdentifierText = (sessionId) => {
            return (
                <p data-tip data-for={sessionId}
                    className={styles.sessionIdentifier}
                    onClick={() => {
                        sessionsActions.switchSession(sessionId);
                    }}
                >
                    {ID(sessionId)}
                </p>
            );
        };

        // displays a (+) icon and creates a new session upon click
        let sessionAddIcon = null;
        if (numberOfActiveSessions > 0) {
            sessionAddIcon = (
                <div className={styles.sessionAddWrapper}>
                    <img
                        className={styles.sessionAdd}
                        onClick={() => {
                            sessionsActions.newSession(newId);
                            sessionsActions.switchSession(newId);
                        }}
                        src="./images/add.png"
                        id="test-session-add"
                    >
                    </img>
                </div>
            );
        }

        let onPremDomainInput = null;
        if (this.state.showOnPremDomainInput) {
            onPremDomainInput = (
                <div className={styles.onPremForm}>
                    <input
                        className={styles.onPremDomainInput}
                        type="text"
                        placeholder="Your On-Prem Domain (ex. mycompany.plot.ly)"
                        onChange={e => (
                            this.setState({onPremDomain: e.target.value})
                        )}
                    >
                    </input>
                    <br></br>
                    <a
                        className={styles.addOnPremLink}
                        onClick={() => {
                            sessionsActions.newOnPremSession(this.state.onPremDomain);
                            sessionsActions.newSession(newId);
                            sessionsActions.switchSession(newId);
                            this.setState({showOnPremDomainInput: false});
                        }}
                    >
                        Click here to submit the domain
                    </a>
                </div>
            );
        }

        let sessionAddText = (
            <div>
                <div>
                    <a className={styles.sessionAddText}
                        onClick={() => {
                            sessionsActions.newSession(newId);
                            sessionsActions.switchSession(newId);
                        }}
                        id="test-session-open"
                    >
                    Open Session
                    </a>
                </div>
                <div>
                    <a className={styles.sessionAddText}
                        onClick={() => {
                            this.setState({showOnPremDomainInput: true});
                        }}
                    >
                        Open On-Premise Session
                    </a>
                </div>
            </div>
           );
        if (numberOfActiveSessions > 0 || this.state.showOnPremDomainInput) {
            sessionAddText = null;
        }

        let sessionsIcons = null;
        if (numberOfActiveSessions > 0) {
            sessionsIcons = Object.keys(sessions.get('list').toJS()).map(
                /*
                    returns three UI items for each session
                    a delete (x) icon, a database logo,
                    and sessionIdentifierText (`username@host`)
                */
                sessionId => (
                    <div className={classnames(styles.sessionWrapper, {
                            [styles.sessionWrapperSelected]:
                                sessions.get('sessionSelected') === sessionId
                            }
                        )}
                    >
                        {sessionDeleteIcon(sessionId)}
                        {sessionLogoIcon(sessionId)}
                        {sessionIdentifierText(sessionId)}
                    </div>
                )
            );
        }

        return (
            <div className={styles.sessionsManagerContainer}>
                {sessionAddText}
                {onPremDomainInput}
                <div
                    className={classnames(
                        styles.sessionsManagerWrapper, styles.Flipped
                    )}
                >
                    {sessionsIcons}
                    {sessionAddIcon}
                </div>

            </div>
        );
    }
}

SessionsManager.propTypes = {
    sessionsActions: PropTypes.object,
    sessions: ImmutablePropTypes.map.isRequired
};
