import React from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from '../../error.jsx';

const propTypes = {
  children: PropTypes.string,
  onClick: PropTypes.func
};

function capitalize(s = '') {
  return s[0].toUpperCase() + s.slice(1);
}

function FormattedMessage(props) {
  const content = capitalize(props.children);

  if (content.toLowerCase().includes('syntax')) {
    return (
      <React.Fragment>
        {content}.
        <br />
        Syntax errors are usually easy to fix. We recommend making
        sure the query is correct in the
        {' '}
        <a onClick={props.onClick}>preview editor</a>
        {' '}
        before scheduling it.
      </React.Fragment>
    );
  }

  if (content.startsWith('QueryExecutionError')) {
    return (
      <React.Fragment>
        An error occurred while executing the query. This is may be an issue with the query itself.
        <br />
        <code>{content}</code>
      </React.Fragment>
    );
  }

  if (content.startsWith('PlotlyApiError')) {
    return 'An unexpected error occurred syncing the query to the Plotly Cloud. Please try again later.';
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
