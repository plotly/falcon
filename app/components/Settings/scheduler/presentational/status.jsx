/* eslint-disable max-len */
import React from 'react';
import PropTypes from 'prop-types';

import {EXE_STATUS} from '../../../../../shared/constants.js';

const Status = ({status, size}) => {
    if (status === EXE_STATUS.ok) {
        return <img width={size} height={size} src="images/checkmark.png" />;
    }

    return <img width={size} height={size} src="images/x.png" />;
};

Status.propTypes = {
    status: PropTypes.string,
    size: PropTypes.number
};

Status.defaultProps = {
    status: EXE_STATUS.ok
};

export default Status;
