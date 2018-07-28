import React from 'react';
import PropTypes from 'prop-types';

import {DateInput, HourInput, MinuteInput, AmPmInput} from '../time-pickers.jsx';
import {mapHourToCronFormat} from '../cron-helpers.js';
import {DetailsRow} from '../details.jsx';

const id = 'MONTHLY';
const name = 'Run every month';

class component extends React.Component {
    static defaultProps = {
        initialTime: {
            date: 1,
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

    toCronExpression({date, hour, minute, amPm}) {
        // adjust hour to fit cron format if needed
        const normalizedHour = mapHourToCronFormat(hour, amPm);

        return `${minute} ${normalizedHour} ${date} * *`;
    }

    onChange(key, selectedOption) {
        const newValue = selectedOption.value;
        const time = this.state.time;

        time[key] = newValue;

        this.setState({time});
        this.props.onChange(this.toCronExpression(time));
    }

    render() {
        const dateInput = (
            <DateInput
                style={{marginLeft: 8, marginRight: 8}}
                value={this.state.time.date}
                onChange={this.onChange.bind(this, 'date')}
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
            <AmPmInput style={{width: 64}} value={this.state.time.amPm} onChange={this.onChange.bind(this, 'amPm')} />
        );

        return (
            <DetailsRow>
                on day
                {dateInput} at {hourInput}:{minuteInput} {amPmInput}
            </DetailsRow>
        );
    }
}

export default {
    id,
    name,
    component
};
