import React from 'react';
import PropTypes from 'prop-types';

import {Row} from '../../../layout.jsx';
import {DayInput, HourInput, MinuteInput, AmPmInput} from '../time-pickers.jsx';
import {mapHourToCronFormat} from '../cron-helpers.js';
import {DetailsColumn} from '../details.jsx';

const id = 'WEEKLY';
const name = 'Run every week';

const rowStyle = {justifyContent: 'flex-start'};

class component extends React.Component {
    static defaultProps = {
        initialTime: {
            days: ['MON'],
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

    toCronExpression({days, hour, minute, amPm}) {
        // adjust hour to fit cron format if needed
        const normalizedHour = mapHourToCronFormat(hour, amPm);

        return `${minute} ${normalizedHour} * * ${days.join(',')}`;
    }

    onChange(key, selectedOption) {
        const newValue = Array.isArray(selectedOption) ? selectedOption.map(item => item.value) : selectedOption.value;

        if (Array.isArray(newValue) && !newValue.length) {
            // then the days multi-select is empty.
            // This would be an invalid state, so
            // don't allow the update
            return;
        }

        const time = this.state.time;

        time[key] = newValue;

        this.setState({time});
        this.props.onChange(this.toCronExpression(time));
    }

    render() {
        const dayInput = (
            <DayInput
                style={{width: '100%', marginLeft: 8, marginRight: 8}}
                value={this.state.time.days}
                multi={true}
                onChange={this.onChange.bind(this, 'days')}
            />
        );
        const hourInput = (
            <HourInput
                style={{marginLeft: 13, marginRight: 2}}
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
        const amPmInput = <AmPmInput value={this.state.time.amPm} onChange={this.onChange.bind(this, 'amPm')} />;

        return (
            <DetailsColumn style={{justifyContent: 'start'}}>
                <Row style={{marginBottom: '8px', ...rowStyle}}>on {dayInput}</Row>
                <Row style={rowStyle}>
                    at {hourInput}:{minuteInput} {amPmInput}
                </Row>
            </DetailsColumn>
        );
    }
}

export default {
    id,
    name,
    component
};
