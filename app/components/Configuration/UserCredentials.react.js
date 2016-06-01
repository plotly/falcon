import React, {Component, PropTypes} from 'react';
import styles from './UserCredentials.css';
import classnames from 'classnames';

/*
	Displays and alters user inputs for `configuration`
	username, password, and local port number.
*/

const USER_CREDENTIALS = [
    'username',
    'password',
    'portNumber'
];

export default class UserCredentials extends Component {
    constructor(props) {
        super(props);
    }

	render() {
		const {configuration, merge} = this.props;

		let inputs;
		if (configuration.get('engine') === 'sqlite') {
			inputs =
				<input
					placeholder="path to database"
					type="text"
					onChange={e => (
						merge({databasePath: e.target.value})
					)}
				/>;
		} else {
			inputs = USER_CREDENTIALS.map(credential => (
				<input
					placeholder={
						credential === 'portNumber' ? 'local port' : credential
					}
					type={
						credential === 'password' ? 'password' : 'text'
					}
					onChange={e => (
						merge({[credential]: e.target.value})
					)}
				/>
			));
		}

		return (
			<div className={styles.inputContainer}>
				{inputs}
			</div>
		);
	}
}
