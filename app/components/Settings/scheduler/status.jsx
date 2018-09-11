/* eslint-disable max-len */
import React from 'react';
import PropTypes from 'prop-types';

const Status = ({status, size}) => {
    if (status === 'OK') {
        return <img width={size} height={size} src="images/checkmark.png" />;
    }

    return <img width={size} height={size} src="images/x.png" />;
};

Status.propTypes = {
    status: PropTypes.string,
    size: PropTypes.number
};

Status.defaultProps = {
    status: 'OK'
};

export default Status;
