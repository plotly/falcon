import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './UserCredentials.css';
import {head} from 'ramda'; 
import {
    CONNECTION_CONFIG, CONNECTION_OPTIONS, DIALECTS, LOGOS
} from '../../../constants/constants';
import classnames from 'classnames';

let dialog;
let shell;
try {
    shell = require('electron').shell;
} catch (e) {
    const shell = {
        openExternal: function openExternal(link) {
            console.warn('opening link');
        }
    };
}
try {
    dialog = require('electron').remote.dialog;
} catch (e) {
    dialog = null;
}

/*
	Displays and alters user inputs for `configuration`
	username, password, and local port number.
*/

const documentationLink = (dialect) => {
    return `http://help.plot.ly/database-connectors/${dialect}/`;
};

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
				return 'server port number (e.g. 3306)';
			case 'storage':
				return 'path to database';
            case 'host':
                return 'server name (e.g. localhost)';
			default:
				return credential;
		}
	}

	getOnClick(credential) {
        // sqlite requires a path
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
					this.props.updateCredential({
						[credential]: paths[0],
						'username': splitPath[fileName]
					});
				});
			}
		};
	}

	render() {

		const {credentialObject, updateCredential} = this.props;

        let inputNames = CONNECTION_CONFIG[credentialObject.dialect].map(credential => {
            return (
                <div key={credential}>
                    <span className ={styles.inputName}>{credential}</span>
                </div>
            );
        });
		let inputs = CONNECTION_CONFIG[credentialObject.dialect]
			.map(credential => (
            <div key={credential}>
                <input className={this.testClass()}
                    placeholder={this.getPlaceholder(credential)}
                    type={this.getInputType(credential)}
                    onChange={e => (
                        updateCredential({[credential]: e.target.value})
                    )}
                    onClick={this.getOnClick(credential)}
                    value={credentialObject[credential]}
                    id={`test-input-${credential}`}
                />
            </div>
		));

        let options = null;
        if (CONNECTION_OPTIONS[credentialObject.dialect].length !== 0) {
            options = CONNECTION_OPTIONS[credentialObject.dialect]
                .map((option) => (
                <div
                    className={styles.options}
                    key={option}
                >
                    {option}
                    <label className={styles.label}><input
                        className={styles.checkbox}
                        type="checkbox"
                        onChange={() => {
                            updateCredential(
                                {[option]: !configuration.get(option)}
                            );
                        }}
                        id={`test-option-${option}`}
                    />
                    </label>
                </div>
            ));
        }

		return (
            <div>

            <div className={styles.inputContainer}>

                    <div className={styles.inputNamesContainer}>
                        <span className ={styles.inputName}>{'Documentation'}</span>
                        {inputNames}
                    </div>
                    <div className={styles.inputFieldsContainer}>
                        <a className={styles.documentationLink}
                            onClick={() => {
                            shell.openExternal(documentationLink(credentialObject.dialect));
                        }}
                        >
                            plotly &nbsp;{credentialObject.dialect}&nbsp; documentation
                        </a>
                        {inputs}
                        <div className={styles.optionsContainer}>
                            {options}
                        </div>
                    </div>
                </div>
            </div>
		);
	}
}

UserCredentials.propTypes = {
    credentialObject: PropTypes.shape({
        dialect: PropTypes.string.required,
        username: PropTypes.string,
        port: PropTypes.string,
        host: PropTypes.string,
        ssl: PropTypes.bool,
        id: PropTypes.string,
        database: PropTypes.string
    }),
    updateCredential: PropTypes.func
};
