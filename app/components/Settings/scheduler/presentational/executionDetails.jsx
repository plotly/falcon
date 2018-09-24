import React from 'react';
import ReactToolTip from 'react-tooltip';
import ms from 'ms';
import moment from 'moment';
import pluralize from 'pluralize';

const ExecutionDetails = props => {
    return (
        <span style={{fontSize: 12}}>
            {pluralize('row', props.rowCount || 0, true)}
            {` in `}
            <span
                data-tip={
                    props.duration > 5 * 60 // 5 minutes
                        ? `completed execution at ${moment(props.completedAt).format('h:mm a')}`
                        : ``
                }
            >
                {ms(props.duration * 1000, {long: true})}
            </span>
            <ReactToolTip />
        </span>
    );
};

export default ExecutionDetails;
