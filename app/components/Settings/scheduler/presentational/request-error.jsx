import React from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from '../../../error';

const propTypes = {
    children: PropTypes.string,
    onClick: PropTypes.func
};

const outlineStyle = {outline: 'none'};

function capitalize(s = '') {
    return s[0].toUpperCase() + s.slice(1);
}

function FormattedMessage(props) {
    const content = capitalize(props.children);

    if (content.toLowerCase().includes('syntax')) {
        return (
            <React.Fragment>
                {capitalize(content.replace('QueryExecutionError: ', ''))}.<br />
                <br />
                Syntax errors are usually easy to fix. We recommend making sure the query is correct in the{' '}
                <a onClick={props.onClick}>preview editor</a> before scheduling it.
            </React.Fragment>
        );
    }

    if (content.startsWith('QueryExecutionError')) {
        return (
            <details style={outlineStyle}>
                <summary style={outlineStyle}>
                    An error occurred while executing the query. This is may be an issue with the query itself.
                </summary>
                <pre>{content}</pre>
            </details>
        );
    }

    if (content.startsWith('PlotlyApiError')) {
        return (
            <details style={outlineStyle}>
                <summary style={outlineStyle}>
                    An unexpected error occurred syncing the query to the Chart Studio. Please try again later.
                </summary>
                <pre>{content}</pre>
            </details>
        );
    }

    if (content.startsWith('MetadataError')) {
        return (
            <details style={outlineStyle}>
                <summary style={outlineStyle}>
                    An unexpected error occurred while uploading query metadata. Please try again now.
                </summary>
                <pre>{capitalize(content.replace('MetadataError: ', ''))}</pre>
            </details>
        );
    }

    return content.slice(0, 100);
}

FormattedMessage.propTypes = propTypes;

function RequestError(props) {
    return (
        <ErrorMessage>
            <FormattedMessage {...props} />
        </ErrorMessage>
    );
}

RequestError.propTypes = propTypes;

export default RequestError;
