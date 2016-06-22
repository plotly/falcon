import React, {Component, PropTypes} from 'react';
import styles from './UserCredentials.css';
import classnames from 'classnames';
import {DIALECTS} from '../Constants/SupportedDialects.react';
const {dialog} = require('electron').remote;

/*
	Displays and alters user inputs for `configuration`
	username, password, and local port number.
*/

const USER_CREDENTIALS = {
    [DIALECTS.MYSQL]: ['username', 'password', 'host', 'port'],
    [DIALECTS.MARIADB]: ['username', 'password', 'host', 'port'],
	[DIALECTS.MSSQL]: ['username', 'password', 'host', 'port'],
    [DIALECTS.POSTGRES]: ['username', 'password', 'host', 'port', 'database'],
    [DIALECTS.SQLITE]: ['storage']
};

export default class UserCredentials extends Component {
    constructor(props) {
        super(props);
		this.getPlaceholder = this.getPlaceholder.bind(this);
		this.getInputType = this.getInputType.bind(this);
		this.getOnClick = this.getOnClick.bind(this);
    }

	getInputType (credential) {
		if (credential === 'password') {
			return 'password';
		} else {
			return 'text';
		}
	}

	getPlaceholder(credential) {
		if (credential === 'port') {
			return 'local port number';
		} else if (credential === 'storage') {
			return 'path to database';
		} else {
			return credential;
		}
	}

	getOnClick(credential) {
		return () => {
			if (credential === 'storage') {
				dialog.showOpenDialog({
					properties: ['openFile', 'openDirectory']
				}, (paths) => {
					const lastItemIndicator = paths[0].split('/').length - 1;
					this.props.merge({
						[credential]: paths[0],
						/*
							set the username to database filename such that
							it appears in the logs for the user to notice
						*/
						'username': paths[0].split('/')[lastItemIndicator]
					});
				});
			}
		};
	}

	render() {
		const {configuration, merge} = this.props;

		let inputs = USER_CREDENTIALS[configuration.get('dialect')].map(credential => (
			<input
				placeholder={this.getPlaceholder(credential)}
				type={this.getInputType(credential)}
				onChange={e => (
					merge({[credential]: e.target.value})
				)}
				onClick={this.getOnClick(credential)}
				value={configuration.get(credential)}
			/>
		));

		return (
			<div className={styles.inputContainer}>
				{inputs}
			</div>
		);
	}
}
