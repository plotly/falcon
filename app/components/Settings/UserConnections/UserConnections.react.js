import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {contains, head} from 'ramda';
import {CONNECTION_CONFIG, SAMPLE_DBS} from '../../../constants/constants';
import {dynamicRequireElectron} from '../../../utils/utils';

let dialog;
try {
    dialog = dynamicRequireElectron().remote.dialog;
} catch (e) {
    dialog = null;
}

/*
 *  Displays and alters user inputs for `configuration`
 *  username, password, and local port number.
*/


export default class UserConnections extends Component {
    constructor(props) {
        super(props);
        this.getStorageOnClick = this.getStorageOnClick.bind(this);
        this.testClass = this.testClass.bind(this);
        this.toggleSampleCredentials = this.toggleSampleCredentials.bind(this);

        this.state = {showSampleCredentials: false};
    }



    toggleSampleCredentials() {
        this.setState({showSampleCredentials: !this.state.showSampleCredentials});
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
            dialog.showOpenDialog({
                properties: ['openFile', 'openDirectory'],
                filters: [{
                    name: 'databases',
                    // pulled from https://stackoverflow.com/a/47096815/4142536
                    extensions: [
                        'db',
                        'sdb',
                        'sqlite',
                        'db3',
                        's3db',
                        'sqlite3',
                        'sl3',
                        'db2',
                        's2db',
                        'sqlite2',
                        'sl2'
                    ]
                }]
            }, (paths) => {
                // result returned in an array
                // TODO: add length of paths === 0 check
                // TODO: add path non null check

                // Surpressed ESLint cause see comments above
                // eslint-disable-next-line no-unused-vars
                const path = head(paths);
                this.props.updateConnection({
                    [setting.value]: paths[0]
                });
            });
        };
    }

    render() {

        const {connectionObject, updateConnection} = this.props;
        const sampleCredentialsStyle = {
            lineHeight: 1,
            textAlign: 'left',
            width: '100%',
            maxWidth: 200,
            overflowWrap: 'break-word',
            display: this.state.showSampleCredentials ? 'inline-block' : 'none'
        };

        const inputs = CONNECTION_CONFIG[connectionObject.dialect]
            .map(setting => {
                let input;
                const dialect = connectionObject.dialect;
                if (contains(setting.type, ['text', 'number', 'password'])) {
                    input = (
                        <div className={'inputContainer'}>
                            <label className={'label'}>
                                {setting.label}
                            </label>
                            <div className={'wrapInput'}>
                                <input className={this.testClass()}
                                    onChange={e => (updateConnection({
                                        [setting.value]: e.target.value
                                    }))}
                                    value={connectionObject[setting.value]}
                                    id={`test-input-${setting.value}`}
                                    placeholder={setting.placeholder}
                                    type={setting.type}
                                />
                                <div style={sampleCredentialsStyle}>
                                    <code>
                                        {(SAMPLE_DBS[dialect]) ? SAMPLE_DBS[dialect][setting.value] : null}
                                    </code>
                                </div>
                            </div>
                        </div>
                    );
                } else if (setting.type === 'path') {
                    input = (
                        <div className={'inputContainer'}>
                            <label className={'label'}>
                                {setting.label}
                            </label>
                            <div className={'wrapInput'}>
                                <input className={this.testClass()}
                                    onClick={this.getStorageOnClick(setting)}
                                    value={connectionObject[setting.value]}
                                    id={`test-input-${setting.value}`}
                                    placeholder={'Click to find a SQLite file'}
                                    type={'text'}
                                />
                            </div>
                        </div>
                    );
                } else if (setting.type === 'checkbox') {
                    input = (
                        <div className={'inputContainer'}>
                            <label className={'label'}>
                                {setting.label}
                            </label>
                            <div className={'wrapInput'}>
                                <input
                                    checked={connectionObject[setting.value]}
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
                                <div className={'description'}>
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
                {connectionObject.dialect !== 'sqlite' &&
                    <small className="sampleCredentials">
                        <a onClick={this.toggleSampleCredentials}>
                            {this.state.showSampleCredentials && 'Hide Sample Credentials'}
                            {!this.state.showSampleCredentials && 'Show Sample Credentials'}
                        </a>
                    </small>
                }
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
