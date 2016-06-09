import React, {Component, PropTypes} from 'react';
import styles from './UserCredentials.css';
import classnames from 'classnames';
import {ENGINES} from '../Constants/SupportedEngines.react';
const {dialog} = require('electron').remote;

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
		const {configuration, merge} = this.props;

		function getInputType (credential) {
			if (credential === 'password') {
				return 'password';
			} else if (credential === 'databasePath') {
				return 'text';
			} else {
				return 'text';
			}
		}

		function getPlaceholder(credential) {
			if (credential === 'portNumber') {
				return 'local port number';
			} else if (credential === 'databasePath') {
				return 'path to database';
			} else {
				return credential;
			}
		}

		function getOnClick(credential) {
			return () => {
				if (credential === 'databasePath') {
					dialog.showOpenDialog({
						properties: ['openFile', 'openDirectory']
					}, (paths) => {
						merge({
							[credential]: paths[0]
						});
					});
				}
			};
		}

		let inputs = USER_CREDENTIALS[configuration.get('engine')].map(credential => (
			<input
				placeholder={getPlaceholder(credential)}
				type={getInputType(credential)}
				onChange={e => (
					merge({[credential]: e.target.value})
				)}
				onClick={getOnClick(credential)}
				value={this.props.configuration.get(credential)}
			/>
		));

		return (
			<div className={styles.inputContainer}>
				{inputs}
			</div>
		);
	}
}
