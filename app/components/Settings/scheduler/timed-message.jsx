import React from 'react';
import PropTypes from 'prop-types';

class TimedMessage extends React.Component {
    static propTypes = {
        children: PropTypes.node,
        timeout: PropTypes.number.isRequired
    };
    static defaultProps = {
        timeout: 5000
    };

    constructor(props) {
        super(props);

        this.state = {
            show: false
        };

        const component = this;
        this.timer = setTimeout(function() {
            component.setState({show: true});
        }, this.props.timeout);
    }

    componentWillUnmount() {
        clearTimeout(this.timer);
    }

    render() {
        if (this.state.show) {
            return this.props.children;
        }

        return null;
    }
}

export default TimedMessage;
