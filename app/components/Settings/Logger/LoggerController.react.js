import React, {Component} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Logger from './Logger.react';

export default class LoggerController extends Component {
    constructor(props) {
        super(props);
        this.state = {logs: []};
    }

    componentWillReceiveProps(nextProps) {

        if (nextProps.ipc.has('log') &&
            nextProps.ipc.get('log') !== this.props.ipc.get('log')) {
            this.state.logs.unshift(nextProps.ipc.get('log').toJS());
            this.setState({logs: this.state.logs});
        }

        const errorPath = ['error', 'message'];
        if (nextProps.ipc.hasIn(errorPath) &&
            nextProps.ipc.getIn(errorPath) !==
            this.props.ipc.getIn(errorPath)) {

            this.state.logs.unshift({
                logEntry: nextProps.ipc.getIn(errorPath),
                timestamp: nextProps.ipc.getIn(['error', 'timestamp'])
            });

            this.setState({logs: this.state.logs});
        }
    }

    render() {
        return <Logger logs={this.state.logs}/>;
    }
}

LoggerController.propTypes = {
    ipc: ImmutablePropTypes.map.isRequired
};
