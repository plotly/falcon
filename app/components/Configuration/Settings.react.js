import React, {Component, PropTypes} from 'react';
import styles from './Settings.css';
import classnames from 'classnames';
import DatabaseDropdown from './DatabaseDropdown.react';
import ConnectButton from './ConnectButton.react';

const DB_CREDENTIALS = [
    'username',
    'password',
    'portNumber'
];

const ENGINES = {
    MYSQL: 'mysql',
    SQLITE: 'sqlite',
    POSTGRES: 'postgres',
    MARIADB: 'mariadb',
    MSSQL: 'mssql'
};

const LOGOS = {
    POSTGRES: './images/postgresqlLogo.png',
    MYSQL: './images/mysqlLogo.png',
    MARIADB: './images/mariadbLogo.png',
    MSSQL: './images/mssqlLogo.png',
    SQLITE: './images/sqliteLogo.png'
};

export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedEngine: null
        };
    }

    render() {
        const {configuration, configActions, ipc, ipcActions} = this.props;
        const {merge} = configActions;

        let messageChooseEngine;
        if (this.state.selectedEngine === null) {
            messageChooseEngine =
            <h5>Please select a database engine</h5>;
        } else {
            messageChooseEngine = <h5></h5>;
        }

        const logos = Object.keys(ENGINES).map(ENGINE => (
            <div className={classnames(
                    styles.logo, {
                        [styles.logoSelected]:
                            this.state.selectedEngine === ENGINES[ENGINE]
                    }
                )}
                onClick={() => {
                    this.setState({selectedEngine: ENGINES[ENGINE]});
                    merge({engine: ENGINES[ENGINE]});
                }}
            >
                <img
                    className={styles.logoImage}
                    src={LOGOS[ENGINE]}
                />
            </div>
        ));

        let inputs;
        if (this.state.selectedEngine === ENGINES.SQLITE) {
            inputs =
                <input
                    placeholder="path to database"
                    type="text"
                    onChange={e => (
                        merge({databasePath: e.target.value})
                    )}
                />;
        } else {
            inputs = DB_CREDENTIALS.map(credential => (
                <input
                    placeholder={credential}
                    type={credential === 'password' ? 'password' : 'text'}
                    onChange={e => (
                        merge({[credential]: e.target.value})
                    )}
                />
            ));
        }

        return (
            <div style={{width: '100%'}}>
                <h2>Configuration</h2>

                <div>
                    <div>
                        {messageChooseEngine}
                        {logos}
                    </div>
                </div>

                <div className={styles.inputContainer}>
                    {inputs}
                </div>

                <ConnectButton
                    configuration={configuration}
                    ipc={ipc}
                    ipcActions={ipcActions}
                />

                <DatabaseDropdown
                    configuration={configuration}
                    merge={merge}
                    ipcActions={ipcActions}
                    ipc={ipc}
                />

                <hr/>
                log
                <pre>
                    {JSON.stringify(this.props.configuration.toJS())}
                </pre>
                tables
                <pre>
                    {JSON.stringify(this.props.ipc.toJS().tables, null, 2)}
                </pre>
                rows
                <pre>
                    {JSON.stringify(this.props.ipc.toJS().rows, null, 2)}
                </pre>

            </div>
        );
    }
}
