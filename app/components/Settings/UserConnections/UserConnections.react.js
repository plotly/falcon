import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './UserConnections.css';
import {contains, head, flatten, keys, values} from 'ramda';
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
            console.warn(link);
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

export default class UserConnections extends Component {
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

	getInputType (setting) {
		return (
            contains(setting, ['secretAccessKey', 'password']) ?
            'password' : 'text'
        );
	}

	getPlaceholder(setting) {
		switch (setting) {
			case 'port':
				return 'server port number (e.g. 3306)';
			case 'storage':
				return 'path to database';
            case 'host':
                return 'server name (e.g. localhost)';
			default:
				return setting;
		}
	}

	getOnClick(setting) {
        // sqlite requires a path
		return () => {
			if (setting === 'storage') {
				dialog.showOpenDialog({
					properties: ['openFile', 'openDirectory'],
					filters: [{name: 'databases', extensions: ['db']}]
				}, (paths) => {
					// result returned in an array
					// TODO: add length of paths === 0 check
					// TODO: add path non null check
					const path = head(paths);
					// get the filename to use as username in the logs
					const splitPath = path.split('/');
					const fileName = splitPath.length - 1;
					this.props.updateConnection({
						[setting]: paths[0],
						'username': splitPath[fileName]
					});
				});
			}
		};
	}

	render() {

		const {connectionObject, updateConnection} = this.props;

        const namesToDisplay = flatten([
            CONNECTION_CONFIG[connectionObject.dialect],
            values(head(CONNECTION_OPTIONS[connectionObject.dialect]))
        ]);
        let inputNames = namesToDisplay.map(connection => {
            return (
                <div key={connection}>
                    <span className ={styles.inputName}>{connection}</span>
                </div>
            );
        });

		let inputs = CONNECTION_CONFIG[connectionObject.dialect]
			.map(setting => (
            <div key={setting}>
                <input className={this.testClass()}
                    placeholder={this.getPlaceholder(setting)}
                    type={this.getInputType(setting)}
                    onChange={e => (
                        updateConnection({[setting]: e.target.value})
                    )}
                    onClick={this.getOnClick(setting)}
                    value={connectionObject[setting]}
                    id={`test-input-${setting}`}
                />
            </div>
		));

        let options = null;
        if (CONNECTION_OPTIONS[connectionObject.dialect].length !== 0) {
            options = CONNECTION_OPTIONS[connectionObject.dialect]
                .map(option => (
                <div
                    className={styles.options}
                    key={head(keys(option))}
                >
                    <label className={styles.label}><input
                        className={styles.checkbox}
                        type="checkbox"
                        onChange={() => {
                            updateConnection(
                                {[head(keys(option))]: !connectionObject.get(head(keys(option)))}
                            );
                        }}
                        id={`test-option-${head(keys(option))}`}
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
                            shell.openExternal(documentationLink(connectionObject.dialect));
                        }}
                        >
                            plotly &nbsp;{connectionObject.dialect}&nbsp; documentation
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

UserConnections.propTypes = {
    connectionObject: PropTypes.shape({
        dialect: PropTypes.string.required,
        username: PropTypes.string,
        port: PropTypes.string,
        host: PropTypes.string,
        ssl: PropTypes.bool,
        id: PropTypes.string,
        database: PropTypes.string
    }),
    updateConnection: PropTypes.func
};
