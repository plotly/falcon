import React from 'react';
import PropTypes from 'prop-types';

import {MinuteInput} from '../time-pickers.jsx';

import {DetailsRow} from '../details.jsx';

const id = 'HOURLY';
const name = 'Run every hour';

class component extends React.Component {
    static defaultProps = {
        initialTime: {
            minute: 0
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

        props.onChange(this.toCronExpression(props.initialTime.minute));

        this.onChange = this.onChange.bind(this);
    }

    toCronExpression(minute) {
        return `${minute} * * * *`;
    }

    onChange(minuteOption) {
        const newMinute = minuteOption.value;
        this.setState({time: {minute: newMinute}});
        this.props.onChange(this.toCronExpression(newMinute));
    }

    render() {
        return (
            <DetailsRow>
                at minute
                <MinuteInput style={{marginLeft: '8px'}} value={this.state.time.minute} onChange={this.onChange} />
            </DetailsRow>
        );
    }
}

export default {
    id,
    name,
    component
};
