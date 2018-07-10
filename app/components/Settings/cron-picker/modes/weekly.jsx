import React from 'react';
import PropTypes from 'prop-types';

import {DayInput, HourInput, MinuteInput, AmPmInput} from '../time-pickers.jsx';
import {mapHourToCronFormat} from '../cron-helpers.js';
import DetailsRow from '../details-row.jsx';

const id = 'WEEKLY';
const name = 'Run every week';

class component extends React.Component {
    static defaultProps = {
        initialTime: {
            day: 'MON',
            hour: 12,
            minute: 0,
            amPm: 'AM'
        }
    };

    static propTypes = {
        initialTime: PropTypes.object,
        onChange: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            time: props.initialTime
        };

        props.onChange(this.toCronExpression(props.initialTime));

        this.onChange = this.onChange.bind(this);
    }

    toCronExpression({day, hour, minute, amPm}) {
        // adjust hour to fit cron format if needed
        const normalizedHour = mapHourToCronFormat(hour, amPm);

        return `${minute} ${normalizedHour} * * ${day}`;
    }

    onChange(key, selectedOption) {
        const newValue = selectedOption.value;
        const time = this.state.time;

        time[key] = newValue;

        this.setState({time});
        this.props.onChange(this.toCronExpression(time));
    }

    render() {
        const dayInput = (
            <DayInput
                style={{width: '96px', marginLeft: 8, marginRight: 8}}
                value={this.state.time.day}
                onChange={this.onChange.bind(this, 'day')}
            />
        );
        const hourInput = (
            <HourInput
                style={{marginLeft: 8, marginRight: 2}}
                value={this.state.time.hour}
                onChange={this.onChange.bind(this, 'hour')}
            />
        );
        const minuteInput = (
            <MinuteInput
                style={{marginLeft: 2, marginRight: 12}}
                value={this.state.time.minute}
                onChange={this.onChange.bind(this, 'minute')}
            />
        );
        const amPmInput = (
            <AmPmInput
                value={this.state.time.amPm}
                onChange={this.onChange.bind(this, 'amPm')}
            />
        );

        return (
            <DetailsRow>
                on {dayInput} at {hourInput}:{minuteInput} {amPmInput}
            </DetailsRow>
        );
    }
}

export default {
    id,
    name,
    component
};
