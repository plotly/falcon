import React from 'react';
import PropTypes from 'prop-types';

const style = {height: 'auto'};
const ErrorMessage = props => <div className="errorMessage" style={style}>{props.message}</div>;
ErrorMessage.propTypes = {
    message: PropTypes.string.isRequired
};

export default ErrorMessage;
