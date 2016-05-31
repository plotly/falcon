import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
// import AceEditor from 'react-ace';
import styles from './Configuration.css';
import Settings from './Configuration/Settings.react';
import Monitor from './Configuration/Monitor.react';

const TABS = {
    SETTINGS: 'SETTINGS',
    MONITOR: 'MONITOR'
};

export default class Configuration extends Component {
    constructor(props) {
        super(props);
        this.state = {
            query: '',
            currentTab: TABS.SETTINGS
        };
    }

    render() {

        let content;
        if (this.state.currentTab === TABS.SETTINGS) {
            content = <Settings
                configuration={this.props.configuration}
                configActions={this.props.configActions}
                ipcActions={this.props.ipcActions}
                ipc={this.props.ipc}
            />;
        } else {
            content = <Monitor/>;
        }

        return (
            <div className={styles.container}>
                {content}
            </div>
        );

        /*
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
