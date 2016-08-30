import React, { Component, PropTypes } from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Settings from './Settings/Settings.react';


export default class Configuration extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        let settings = null;
        const {
            sessionsActions,
            sessions
        } = this.props;
        // debugger;
        const sessionSelected = sessions.getIn(
            ['list', `${this.props.sessions.get('sessionSelected')}`]
        );
        console.warn(sessionSelected);

        if (this.props.sessions.get('list').size > 0) {
            console.warn('rendering settings');

            settings = (
                <Settings
                    configuration={sessionSelected.get('configuration')}
                    connection={sessionSelected.get('connection')}
                    ipc={sessionSelected.get('ipc')}

                    sessionsActions={sessionsActions}
                />
            );
        }

        return (
            <div>
            </div>

        );
    }
}

Configuration.propTypes = {
    sessionsActions: PropTypes.object,
    sessions: ImmutablePropTypes.map.isRequired
};
