import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
// import AceEditor from 'react-ace';
import styles from './Configuration.css';
import Settings from './Configuration/Settings.react';
import Monitor from './Configuration/Monitor.react';

const tabs = {
    SETTINGS: 'SETTINGS',
    MONITOR: 'MONITOR'
};

export default class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            query: '',
            currentTab: tabs.SETTINGS
        };
    }

    render() {
        /*
        const onChangeQuery = query => {
            this.setState({query});
        };

        const onClickConnect = () => {
            this.props.ipcActions.connect(this.props.configuration);
        };

        const onClickDisconnect = () => {
            this.props.ipcActions.disconnect();
        };

        const onClickQuery = () => {
            this.props.ipcActions.query(this.state.query);
        };

        const onUpdateCredentials = key => e => {
            this.props.configActions.setValue({key, value: e.target.value});
        };

        const onSubmitDatabase = e => {
            this.props.ipcActions.useDatabase(this.props.configuration.get('database'));
        };
        */
        let content;
        if (this.state.currentTab === tabs.SETTINGS) {
            content = <Settings
                configuration={this.props.configuration}
                configActions={this.props.configActions}
                ipcActions={this.props.ipcActions}
                ipc={this.props.ipc}
            />;
        } else {
            content = <Monitor/>;
        }

        console.log('content: ', content);
        console.warn('styles: ', styles);
        return (
            <div className={styles.container}>
                {content}
            </div>
        );
        /*
            <div>
            <div className={{}}>

            <h5>Step 1: Choose Database</h5>
            <div className={styles.btnGroupEngines}>
            <button className={styles.btn} onClick={onUpdateCredentials('engine')} value="mysql">
            mysql
            </button>
            <button className={styles.btn} onClick={onUpdateCredentials('engine')} value="mariadb">
            mariadb
            </button>
            <button className={styles.btn} onClick={onUpdateCredentials('engine')} value="sqlite">
            sqlite
            </button>
            <button className={styles.btn} onClick={onUpdateCredentials('engine')} value="postgres">
            postgres
            </button>
            <button className={styles.btn} onClick={onUpdateCredentials('engine')} value="mssql">
            mssql
            </button>
            </div>

            <h5>Step 2: Enter Credentials</h5>
            <input
            onChange={onUpdateCredentials('portNumber')}
            placeholder="port number"
            />
            <input
            onChange={onUpdateCredentials('username')}
            placeholder="username"
            />
            <input
            onChange={onUpdateCredentials('password')}
            placeholder="password"
            />
            <div className={styles.btnGroupActions}>
            <button className={styles.btn} onClick={onClickConnect}>
            connect
            </button>
            <button className={styles.btn} onClick={onClickDisconnect}>
            disconnect
            </button>
            </div>

            <h5>Step 3: Choose Database</h5>
            <pre>
            {JSON.stringify(this.props.ipc.toJS().databases, null, 2)}
            </pre>
            <input
            onChange={onUpdateCredentials('database')}
            placeholder="database name"
            />
            <div className={styles.btnGroupActions}>
            <button className={styles.btn} onClick={onSubmitDatabase}>
            use this one
            </button>
            </div>

            <h5>Step 4: Preview Tables here</h5>
            available tables
            <pre>
            {JSON.stringify(this.props.ipc.toJS().tables, null, 2)}
            </pre>

            <h5>Step 5: Enter Query</h5>

            <AceEditor
            value={this.state.query}
            onChange={onChangeQuery}
            mode="sql"
            theme="tomorrow"
            height="50"
            />

            <div className={styles.btnGroupActions}>
            <button className={styles.btn} onClick={onClickQuery}>
            query
            </button>
            </div>

            <h5>Step 6: Preview Response</h5>

            <pre>
            {JSON.stringify(this.props.configuration.toJS())}
            </pre>

            <pre>
            {JSON.stringify(this.props.ipc.toJS().rows, null, 2)}
            </pre>

            <pre>
            {JSON.stringify(this.props.ipc.toJS().log, null, 2)}
            </pre>

            <pre>
            {JSON.stringify(this.props.ipc.toJS().metadata, null, 2)}
            </pre>

            <pre>
            {JSON.stringify(this.props.ipc.toJS().error, null, 2)}
            </pre>

            </div>
            </div>
        );
        */
    }
}

Configuration.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    setValue: PropTypes.func.isRequired,
    ipc: ImmutablePropTypes.map.isRequired,
    ipcActions: PropTypes.Object,
    configActions: PropTypes.Object
};
