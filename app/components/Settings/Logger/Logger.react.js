import React, {PropTypes} from 'react';
import styles from './Logger.css';

const Logger = props => {
    if (!props.logs || props.logs.length === 0) return null;

    const renderLogs = props.logs.map(log => (
        <div>{log.timestamp} - {log.message}</div>
    ));

    return (
        <div>
            <h5>Logs</h5>
            <pre className={styles.renderLogs}>
                {renderLogs}
            </pre>
        </div>
    );
};

export default Logger;
