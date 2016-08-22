import React from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import classnames from 'classnames';
import * as styles from './Logger.css';

const Logger = props => {
    if (!props.logs || props.logs.length === 0) return null;

    const renderLogs = props.logs.map(log => (
        <div>{log.timestamp} - {log.logEntry.toString()}</div>
    ));

    const testClass = () => {
        /*
            Return the number of logs to easily track updates when testing
        */
        return `test-${props.logs.length}-entries`;
    };

    return (
        <div
            className={classnames(styles.renderLogs, testClass())}
            id="test-logs"
        >
            <h5>Logs</h5>
            <pre>
                {renderLogs}
            </pre>
        </div>
    );
};

Logger.propTypes = {
    logs: ImmutablePropTypes.map.isRequired
};

export default Logger;
