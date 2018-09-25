import React from 'react';
import PropTypes from 'prop-types';
import {COLORS} from '../../../../constants/constants';

const MAX_CALLS_PER_DAY = 10000;

const formatCallTotal = total => (total > MAX_CALLS_PER_DAY ? <span color={COLORS.red}>{total}</span> : total);

const formatUsageRatio = usage => {
    return (
        <span>
            {formatCallTotal(usage)} / {MAX_CALLS_PER_DAY}
        </span>
    );
};

export const AdditionalCallsPreview = props => {
    const {additionalCalls, currTotal} = props;
    const newTotal = additionalCalls + currTotal;

    return (
        <div>
            API usage: {additionalCalls} calls/day (new total: {formatUsageRatio(newTotal)})
        </div>
    );
};
AdditionalCallsPreview.propTypes = {
    additionalCalls: PropTypes.number.isRequired,
    currTotal: PropTypes.number.isRequired
};

export const IndividualCallCount = ({count}) => {
    return (
        <span style={{fontSize: '12px'}}>
            {count} API {count === 1 ? 'call' : 'calls'} per day
        </span>
    );
};
IndividualCallCount.propTypes = {
    count: PropTypes.number.isRequired
};

export const CallCountWidget = ({count}) => {
    return (
        <React.Fragment>
            <h4>API Usage</h4>
            <p style={{fontSize: '12px'}}>{formatUsageRatio(count)} API calls</p>
        </React.Fragment>
    );
};
CallCountWidget.propTypes = {
    count: PropTypes.number.isRequired
};
