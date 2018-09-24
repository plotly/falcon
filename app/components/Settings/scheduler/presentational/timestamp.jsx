import React from 'react';
import PropTypes from 'prop-types';
import ReactToolTip from 'react-tooltip';
import moment from 'moment';

const ONE_MINUTE = 60 * 1000;

const formatAbsolute = (timestamp, inline) => {
    const now = Date.now();
    const start = new Date();
    const end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const startOfToday = start.getTime();
    const endOfToday = end.getTime();

    const isToday = timestamp >= startOfToday && timestamp <= endOfToday;
    const isInthePast = now > timestamp;

    if (isInthePast && now - timestamp < ONE_MINUTE) {
        return 'moments ago';
    }

    return isToday
        ? `${inline ? 't' : 'T'}oday at ${moment(timestamp).format('h:mm a')}`
        : `${moment(timestamp).format('h:mm a')} on ${moment(timestamp).format('MMM Do')}`;
};

const Timestamp = props => {
    return (
        <React.Fragment>
            <span data-tip={formatAbsolute(props.value, props.inline)}>{moment(props.value).fromNow()}</span>
            <ReactToolTip />
        </React.Fragment>
    );
};

Timestamp.propTypes = {
    value: PropTypes.number,
    inline: PropTypes.bool
};

export default Timestamp;
