import React, {PropTypes} from 'react';
import classnames from 'classnames';
import * as styles from './Logger.css';

const Logger = props => {
    if (!props.logs || props.logs.length === 0) return null;

    const renderLogs = props.logs.map(log => (
        <div>{log.timestamp} - {log.description}</div>
    ));

    const testClass = () => {
        /*
            Return the number of logs to easily track updates when testing
        */
        return `test-${props.logs.length}-entries`;
    };

    return (
        <div>
            <h5>Logs</h5>
            <pre className={classnames(styles.renderLogs, testClass())}
                id="test-logs"
            >
                {renderLogs}
            </pre>
        </div>
    );
};

export default Logger;
