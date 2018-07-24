import React from 'react';
import PropTypes from 'prop-types';

const style = {height: 'auto'};
const ErrorMessage = props => <div className="errorMessage" style={style}>{props.children}</div>;
ErrorMessage.propTypes = {
    children: PropTypes.node.isRequired
};

export default ErrorMessage;
