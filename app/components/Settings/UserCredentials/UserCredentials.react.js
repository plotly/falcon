import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import styles from './UserCredentials.css';
import classnames from 'classnames';
import {DIALECTS, USER_INPUT_FIELDS} from '../../../constants/constants';
const {dialog} = require('electron').remote;

/*
	Displays and alters user inputs for `configuration`
	username, password, and local port number.
*/

export default class UserCredentials extends Component {
    constructor(props) {
        super(props);
		this.getPlaceholder = this.getPlaceholder.bind(this);
		this.getInputType = this.getInputType.bind(this);
		this.getOnClick = this.getOnClick.bind(this);
		this.testClass = this.testClass.bind(this);
    }

	testClass() {
		/*
			No internal tests for now.
		*/

		return 'test-input-created';
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
					// result returned in an array
					const path = paths[0];
					// get the filename to use as username in the logs
					const splitPath = path.split('/');
					const fileName = splitPath.length - 1;
					this.props.configActions.update({
						[credential]: paths[0],
						'username': splitPath[fileName]
					});
				});
			}
		};
	}

	render() {
		const {configuration, configActions} = this.props;

		let inputs = USER_INPUT_FIELDS[configuration.get('dialect')]
			.map(credential => (
			<input className={this.testClass()}
				placeholder={this.getPlaceholder(credential)}
				type={this.getInputType(credential)}
				onChange={e => (
					configActions.update({[credential]: e.target.value})
				)}
				onClick={this.getOnClick(credential)}
				value={configuration.get(credential)}
				id={`test-input-${credential}`}
			/>
		));

		return (
			<div className={styles.inputContainer}>
				{inputs}
			</div>
		);
	}
}

UserCredentials.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    configActions: PropTypes.Object
};
