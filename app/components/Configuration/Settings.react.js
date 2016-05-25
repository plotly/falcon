import React, {Component, PropTypes} from 'react';
import styles from './Settings.css';
import classnames from 'classnames';
import Select from 'react-select';

const DB_CREDENTIALS = [
    'username',
    'password',
    'port'
];

const ENGINES = {
    MYSQL: 'MYSQL',
    SQLITE: 'SQLITE',
    POSTGRES: 'POSTGRES',
    MARIADB: 'MARIADB',
    MSSQL: 'MSSQL'
};

const LOGOS = {
    POSTGRES: 'https://www.joyent.com/content/02-public-cloud/02-benchmarks/03-postgresql/header.png?v=1433286515',
    MYSQL: './images/mysqlLogo.png',
    MARIADB: 'https://mariadb.org/wp-content/uploads/2015/10/mariadb-usa-inc.png',
    MSSQL: 'http://www.softwaresolutionsweb.com/images/sqlimage.png',
    SQLITE: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/SQLite370.svg/1280px-SQLite370.svg.png'
};

const DATABASES = [
    'none found'
];

export default class Settings extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selectedDB: ENGINES.MYSQL,
            status: 'INITIALIZED'
        };
        props.configActions.setValue({
            key: 'engine',
            value: ENGINES.MYSQL.toLowerCase()
        });
    }

    componentWillReceiveProps(nextProps) {
        let status;

        if (nextProps.ipc.hasIn(['error', 'message'])) {
            status = 'ERROR';
        } else if (nextProps.ipc.get('databases')) {
            console.log('DATABASES' + nextProps.ipc.has('databases'));
            status = 'SUCCESS';
        } else if (!nextProps.ipc.get('databases')) {
            status = 'DISCONNECTED';
        }
        if (status) {
            this.setState({status});
        }
    }

    render() {
        const {ipcActions, configActions, configuration, ipc} = this.props;
        const {setValue} = configActions;

        const logos = Object.keys(ENGINES).map(DB => (
            <div className={classnames(
                    styles.logo, {
                        [styles.logoSelected]: this.state.selectedDB === DB
                    }
                )}
                onClick={() => {
                    this.setState({selectedDB: DB});
                    configActions.setValue({
                        key: 'engine',
                        value: DB.toLowerCase()
                    });
                }}
            >
                <img
                    className={styles.logoImage}
                    src={LOGOS[DB]}
                />
            </div>
        ));

        const inputs = DB_CREDENTIALS.map(credential => (
            <input
                placeholder={credential}
                type={credential === 'password' ? 'password' : 'text'}
                onChange={e => (
                    setValue({key: credential, value: e.target.value})
                )}
            />
        ));

        const ipcDatabases = ipc.toJS().databases;
        let databases;
        if (ipcDatabases) {
            // databases = [{ value: 'Some', label: 'Some Found' }];
            databases = ipcDatabases.map(database => (
                { value: database.Database, label: database.Database }
            ));
        } else {
            databases = [{ value: 'None', label: 'None Found' }];
        }

        let successMessage = null;
        let errorMessage = null;
        let buttonMessage = 'Connect';
        if (this.state.status === 'ERROR') {
            errorMessage = (
                <pre>
                    {
                        'Hm... there was an error connecting: ' +
                        ipc.getIn(['error', 'message'])
                    }
                </pre>
            );
        } else if (this.state.status === 'SUCCESS') {
            successMessage = (
                <pre>
                    {ipc.toJS().log}
                </pre>
            );
            buttonMessage = 'Connected';
        } else if (this.state.status === 'LOADING') {
            buttonMessage = 'Connecting';
        } else if (this.state.status === 'DISCONNECTED') {
            buttonMessage = 'Connect';
        }

        const onClickDisconnect = () => {
            ipcActions.disconnect();
        };

        function onSelectDatabase(database) {
            setValue({key: 'database', value: database.value});
            ipcActions.useDatabase();
        }

        console.warn('this.state: ', this.state);

        return (
            <div style={{width: '100%'}}>
                <h2>Configuration</h2>

                <div>
                    <div>
                        {logos}
                    </div>
                </div>

                <div className={styles.inputContainer}>
                    {inputs}
                </div>

                <div className={styles.footer}>
                    <a className={styles.buttonPrimary}
                       onClick={() => {
                           this.setState({status: 'LOADING'});
                           ipcActions.connect(configuration);
                       }}
                    >
                        {buttonMessage}
                    </a>
                    <a className={styles.buttonSecondary}
                       onClick={onClickDisconnect}
                    >
                        disconnect
                    </a>
                </div>

                <div className={styles.dropdown}>
                    <Select
                        name="form-field-name"
                        placeholder="Select Your Database"
                        options={databases}
                        onChange={onSelectDatabase}
                    />
                </div>

                {errorMessage}
                {successMessage}

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

Component.propTypes = {
    queries: PropTypes.Array,
    responses: PropTypes.Array
};
