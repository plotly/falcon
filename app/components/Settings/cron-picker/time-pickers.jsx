import React from 'react';
import PropTypes from 'prop-types';
import {range} from 'ramda';

import Select from 'react-select';

// base input params for Select component
const baseParams = {
    searchable: false,
    clearable: false
};

function formatOptions(optionsList) {
    return optionsList.map(option => {
        if (typeof option === 'number') return {label: option, value: option};

        return option;
    });
}

const HOUR_OPTIONS = formatOptions([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
const AM_PM_OPTIONS = [
    {label: 'A.M.', value: 'AM'},
    {label: 'P.M.', value: 'PM'}
];
const MINUTE_OPTIONS = formatOptions([{label: '00', value: 0}, 15, 30, 45]);
const DATE_OPTIONS = formatOptions(range(1, 29));
const DAY_OPTIONS = [
    {label: 'Sunday', value: 'SUN'},
    {label: 'Monday', value: 'MON'},
    {label: 'Tuesday', value: 'TUE'},
    {label: 'Wednesday', value: 'WED'},
    {label: 'Thursday', value: 'THU'},
    {label: 'Friday', value: 'FRI'},
    {label: 'Saturday', value: 'SAT'}
];

export const HourInput = props => (
    <Select
        className="time-picker"
        {...baseParams}
        options={HOUR_OPTIONS}
        {...props}
    />
);
HourInput.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export const MinuteInput = props => (
    <Select
        className="time-picker"
        {...baseParams}
        options={MINUTE_OPTIONS}
        {...props}
    />
);
MinuteInput.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export const DayInput = props => (
    <Select
        className="time-picker"
        {...baseParams}
        options={DAY_OPTIONS}
        {...props}
    />
);
DayInput.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export const AmPmInput = props => (
    <Select
        className="time-picker"
        {...baseParams}
        options={AM_PM_OPTIONS}
        {...props}
    />
);
AmPmInput.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
};

export const DateInput = props => (
    <Select
        className="time-picker"
        {...baseParams}
        options={DATE_OPTIONS}
        {...props}
    />
);
DateInput.propTypes = {
    value: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};
