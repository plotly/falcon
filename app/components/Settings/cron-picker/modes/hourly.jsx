import React from 'react';
import PropTypes from 'prop-types';

import {MinuteInput} from '../time-pickers.jsx';

import { DetailsRow } from '../details.jsx';

const id = 'HOURLY';
const name = 'Run every hour';

class component extends React.Component {
    static defaultProps = {
        initialMinute: 0
    };

    static propTypes = {
        initialMinute: PropTypes.object,
        onChange: PropTypes.func.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            minute: props.initialMinute
        };

        props.onChange(this.toCronExpression(props.initialMinute));

        this.onChange = this.onChange.bind(this);
    }

    toCronExpression(minute) {
        return `${minute} * * * *`;
    }

    onChange(minuteOption) {
        const newMinute = minuteOption.value;
        this.setState({minute: newMinute});
        this.props.onChange(this.toCronExpression(newMinute));
    }

    render() {
        return (
            <DetailsRow>
                at minute
                <MinuteInput
                    style={{marginLeft: '8px'}}
                    value={this.state.minute}
                    onChange={this.onChange}
                />
            </DetailsRow>
        );
    }
}

export default {
    id,
    name,
    component
};
