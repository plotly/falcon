import React from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from '../../error.jsx';

function capitalize(s = '') {
  return s[0].toUpperCase() + s.slice(1);
}

function RequestError(props) {
  if (props.children.toLowerCase().includes('syntax')) {
    return (
      <ErrorMessage>
        {capitalize(props.children)}
        . Syntax errors are usually easy to fix. We recommend making
        sure your query is correct in the
        {' '}
        <a onClick={props.onClick}>
          preview editor
        </a>
        {' '}
        before scheduling it.
      </ErrorMessage>
    );
  }
  return <ErrorMessage>{props.children.slice(0, 100)}</ErrorMessage>;
}

RequestError.propTypes = {
  children: PropTypes.string,
  onClick: PropTypes.func
};

export default RequestError;
