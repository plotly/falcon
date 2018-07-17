import React from 'react';
import PropTypes from 'prop-types';
import ErrorMessage from '../../error.jsx';

function capitalize(s = '') {
  return s[0].toUpperCase() + s.slice(1);
}

function RequestError(props) {
  let content;
  if (props.children.toLowerCase().includes('syntax')) {
    content = (
      <React.Fragment>
        {capitalize(props.children)}.
        <br />
        Syntax errors are usually easy to fix. We recommend making
        sure your query is correct in the
        {' '}
        <a onClick={props.onClick}>preview editor</a>
        {' '}
        before scheduling it.
      </React.Fragment>
    );
  } else {
    content = capitalize(props.children.slice(0, 100));
  }

  return <ErrorMessage>{content}</ErrorMessage>;
}

RequestError.propTypes = {
  children: PropTypes.string,
  onClick: PropTypes.func
};

export default RequestError;
