import React, {PropTypes} from 'react';

const Logger = props => {
    if (!props.logs || props.logs.length === 0) return null;

    const renderLogs = props.logs.map(log => (
        <div>{log.timestamp} - {log.message}</div>
    ));

    return (
        <div style={{}}>
            <h5>Logs</h5>
            <pre style={{maxHeight: 200, overflowY: 'scroll'}}>
                {renderLogs}
            </pre>
        </div>
    );
};

export default Logger;
