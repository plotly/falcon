import React from 'react';
import PropTypes from 'prop-types';

import {HourInput, MinuteInput, AmPmInput} from '../time-pickers.jsx';

import { DetailsRow } from '../details.jsx';
import {mapHourToCronFormat} from '../cron-helpers.js';

const id = 'DAILY';
const name = 'Run every day';

class component extends React.Component {
    static defaultProps = {
        initialTime: {
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

    toCronExpression({hour, minute, amPm}) {
        // adjust hour to fit cron format if needed
        const normalizedHour = mapHourToCronFormat(hour, amPm);
        return `${minute} ${normalizedHour} * * *`;
    }

    onChange(key, selectedOption) {
        const newValue = selectedOption.value;
        const time = this.state.time;

        time[key] = newValue;

        this.setState({time});
        this.props.onChange(this.toCronExpression(time));
    }

    render() {
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
                style={{marginRight: 8, width: 64}}
                value={this.state.time.amPm}
                onChange={this.onChange.bind(this, 'amPm')}
            />
        );

        return (
            <DetailsRow>
                at
                {hourInput}:{minuteInput} {amPmInput}
            </DetailsRow>
        );
    }
}

export default {
    id,
    name,
    component
};
