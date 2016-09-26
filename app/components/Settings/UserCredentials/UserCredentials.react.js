import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './UserCredentials.css';
import {
    CONNETION_CONFIG, CONNETION_OPTIONS
} from '../../../constants/constants';
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
        this.state = {showOptions: false};
    }

	testClass() {
		/*
			No internal tests for now.
		*/

		return 'test-input-created';
	}

	getInputType (credential) {
		return (credential === 'password') ? 'password' : 'text';
	}

	getPlaceholder(credential) {
		switch (credential) {
			case 'port':
				return 'local port number';
			case 'storage':
				return 'path to database';
			default:
				return credential;
		}
	}

	getOnClick(credential) {
		return () => {
			if (credential === 'storage') {
				dialog.showOpenDialog({
					properties: ['openFile', 'openDirectory'],
					filters: [{name: 'databases', extensions: ['db']}]
				}, (paths) => {
					// result returned in an array
					// TODO: add length of paths === 0 check
					// TODO: add path non null check
					const path = paths[0];
					// get the filename to use as username in the logs
					const splitPath = path.split('/');
					const fileName = splitPath.length - 1;
					this.props.sessionsActions.updateConfiguration({
						[credential]: paths[0],
						'username': splitPath[fileName]
					});
				});
			}
		};
	}

	render() {
		const {configuration, sessionsActions} = this.props;

		let inputs = CONNETION_CONFIG[configuration.get('dialect')]
			.map(credential => (
			<input className={this.testClass()}
				placeholder={this.getPlaceholder(credential)}
				type={this.getInputType(credential)}
				onChange={e => (
					sessionsActions.updateConfiguration({[credential]: e.target.value})
				)}
				onClick={this.getOnClick(credential)}
				value={configuration.get(credential)}
				id={`test-input-${credential}`}
			/>
		));

        let options = CONNETION_OPTIONS[configuration.get('dialect')]
            .map(credential => (
            <div className={styles.options}>
                <label className={styles.label}><input
                    className={styles.checkbox}
                    type="checkbox"
                    onChange={() => {
                        sessionsActions.updateConfiguration(
                            {[credential]: !configuration.get(credential)}
                        );
                    }}
                    id={`test-option-${credential}`}
                />
                {credential}
                </label>
            </div>
        ));

        const databaseOptions = () => {
            if (this.state.showOptions) {
                return (
                    <div className={styles.databaseOptionsContainer}>
                        <a className={styles.databaseOptions}
                            onClick={() => {this.setState({showOptions: false});}}
                        >
                            Hide Database Options
                        </a>
                        {options}
                    </div>
                );
            } else {
                return (
                    <div className={styles.databaseOptionsContainer}>
                        <a className={styles.databaseOptions}
                            onClick={() => {this.setState({showOptions: true});}}
                        >
                            Show Database Options
                        </a>
                    </div>
                );
            }
        };


		return (
			<div className={styles.inputContainer}>
				{inputs}
                {databaseOptions()}
			</div>
		);
	}
}

UserCredentials.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    sessionsActions: PropTypes.object
};
