import React from 'react';
import PropTypes from 'prop-types';

const Error = props => <div className="errorMessage">{props.message}</div>;
Error.propTypes = {
    message: PropTypes.string.isRequired
};

export default Error;
