import React from 'react';
import PropTypes from 'prop-types';
import ReactToolTip from 'react-tooltip';
import moment from 'moment';

const toIso = timestamp => {
    const date = new Date(timestamp);

    return date.getTime() > 0 ? date.toISOString() : 'Invalid ISO';
};

const formatAbsolute = (timestamp, inline) => {
    const start = new Date();
    const end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const startOfToday = start.getTime();
    const endOfToday = end.getTime();

    const isToday = timestamp >= startOfToday && timestamp <= endOfToday;

    return isToday
        ? `${inline ? 't' : 'T'}oday at ${moment(timestamp).format('h:mm a')}`
        : `${moment(timestamp).format('h:mm a')} on ${moment(timestamp).format('MMM Do')}`;
};

const formatRelative = ({value, checkIfRunning}) => {
    if (checkIfRunning && value < Date.now()) {
        return 'currently running';
    }

    return moment(value).fromNow();
};

const Timestamp = props => {
    const {value, checkIfRunning, inline} = props;
    return (
        <React.Fragment>
            <span data-tip={formatAbsolute(value, inline)}>{formatRelative({value, checkIfRunning})}</span>
            <i style={{fontSize: '12px', color: 'grey', paddingLeft: '10px'}}>({toIso(props.value)})</i>
            <ReactToolTip />
        </React.Fragment>
    );
};

Timestamp.propTypes = {
    value: PropTypes.number,
    checkIfRunning: PropTypes.bool,
    inline: PropTypes.bool
};

export default Timestamp;
