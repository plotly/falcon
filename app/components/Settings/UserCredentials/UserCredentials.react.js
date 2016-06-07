import React, {Component, PropTypes} from 'react';
import styles from './UserCredentials.css';
import classnames from 'classnames';
import {ENGINES} from '../Constants/SupportedEngines.react';

/*
	Displays and alters user inputs for `configuration`
	username, password, and local port number.
*/

const USER_CREDENTIALS = {
    [ENGINES.MYSQL]: ['username', 'password', 'server', 'portNumber'],
    [ENGINES.MARIADB]: ['username', 'password', 'server', 'portNumber'],
	[ENGINES.MSSQL]: ['username', 'password', 'server', 'portNumber'],
    [ENGINES.POSTGRES]: ['username', 'password', 'server', 'portNumber', 'database'],
    [ENGINES.SQLITE]: ['databasePath']
};

export default class UserCredentials extends Component {
    constructor(props) {
        super(props);
    }

	render() {
		function getPlaceholder(credential) {
			if (credential === 'portNumber') {
				return 'local port number';
			} else if (credential === 'databasePath') {
				return 'path to database';
			} else {
				return credential;
			}
		}

		const {configuration, merge} = this.props;
		let inputs = USER_CREDENTIALS[configuration.get('engine')].map(credential => (
			<input
				placeholder={getPlaceholder(credential)}
				type={
					credential === 'password' ? 'password' : 'text'
				}
				onChange={e => (
					merge({[credential]: e.target.value})
				)}
			/>
		));

		return (
			<div className={styles.inputContainer}>
				{inputs}
			</div>
		);
	}
}
