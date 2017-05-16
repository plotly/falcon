import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import * as styles from './UserConnections.css';
import {contains, head, flatten, keys, values} from 'ramda';
import {
    CONNECTION_CONFIG, CONNECTION_OPTIONS, DIALECTS, LOGOS
} from '../../../constants/constants';
import {dynamicRequireElectron} from '../../../utils/utils';
import classnames from 'classnames';

let dialog;
try {
    dialog = dynamicRequireElectron().remote.dialog;
} catch (e) {
    dialog = null;
}

/*
 *	Displays and alters user inputs for `configuration`
 *	username, password, and local port number.
*/


export default class UserConnections extends Component {
    constructor(props) {
        super(props);
		this.getStorageOnClick = this.getStorageOnClick.bind(this);
		this.testClass = this.testClass.bind(this);
    }

	testClass() {
		/*
			No internal tests for now.
		*/

		return 'test-input-created';
	}

	getStorageOnClick(setting) {
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
		const inputs = CONNECTION_CONFIG[connectionObject.dialect]
			.map(setting => {
                let input;
                if (contains(setting.type, ['text', 'number', 'password'])) {
                    input = (
                        <div className={styles.inputContainer}>
                            <label className={styles.label}>
                                {setting.label}
                            </label>
                            <div className={styles.wrapInput}>
                                <input className={this.testClass()}
                                    onChange={e => (updateConnection({
                                        [setting.value]: e.target.value
                                    }))}
                                    value={connectionObject[setting.value]}
                                    id={`test-input-${setting.value}`}
                                    placeholder={setting.placeholder}
                                    type={setting.type}
                                />
                            </div>
                        </div>
                    );
                } else if (setting.type === 'path') {
                    input = (
                        <div className={styles.inputContainer}>
                            <label className={styles.label}>
                                {setting.label}
                            </label>
                            <div className={styles.wrapInput}>
                                <input className={this.testClass()}
                                    onClick={this.getStorageOnClick()}
                                    value={connectionObject[setting]}
                                    id={`test-input-${setting.value}`}
                                    placeholder={setting.placeholder}
                                    type={'text'}
                                />
                            </div>
                        </div>
                    );
                } else if (setting.type === 'checkbox') {
                    input = (
                        <div className={styles.inputContainer}>
                            <label className={styles.label}>
                                {setting.label}
                            </label>
                            <div className={styles.wrapInput}>
                                <input
                                    type="checkbox"
                                    onChange={() => {
                                        updateConnection({
                                            [setting.value]: (
                                                !connectionObject[setting.value]
                                            )
                                        });
                                    }}
                                    id={`test-option-${setting.value}`}
                                />
                            </div>
                        </div>
                    );
                }

                return (
                    <div>
                        {input}
                        {
                            setting.description ? (
                                <div className={styles.description}>
                                    {setting.description}
                                </div>
                            ) : null
                        }
                    </div>
                );
        });

		return (
            <div>
                {inputs}
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
