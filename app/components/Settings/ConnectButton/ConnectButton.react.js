import React, {Component, PropTypes} from 'react';
import styles from './ConnectButton.css';
import Select from 'react-select';
import {APP_STATUS_CONSTANTS} from '../../../reducers/connection';

/*
	Displays a connect button and a disconnect button.
	Asks sequelize to create a new connection using credentials.
	Fires preset queries to show available databases/schemes
	inside the users' account using `ipcActions`.
	Displays errors and log messages using `ipc`.
*/

const BUTTON_MESSAGE = {
    INITIALIZED: 'connect',
    ERROR: 'try again',
    CONNECTED: 'connected',
    CONNECTING: 'connecting...',
    DISCONNECTED: 'connect'
};

export default class ConnectButton extends Component {
    constructor(props) {
        super(props);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.state = {
            hover: false
        };
    }


    connect() {
        this.props.connectionActions.merge({status: APP_STATUS_CONSTANTS.CONNECTING});
        this.props.ipcActions.connect(this.props.configuration);
    }

    disconnect() {
        this.props.ipcActions.disconnect();
    }

    onMouseOver() {
        this.setState({hover: true});
    }

    onMouseOut() {
        this.setState({hover: false});
    }

    componentWillReceiveProps(nextProps) {
        let status;
        // TODO: now that connection.status is in redux store, move this out.
        if (nextProps.ipc.hasIn(['error', 'message'])) {
            status = APP_STATUS_CONSTANTS.ERROR;
        } else if (nextProps.ipc.get('databases')) {
            status = APP_STATUS_CONSTANTS.CONNECTED;
        } else if (!nextProps.ipc.get('databases')) {
            status = APP_STATUS_CONSTANTS.DISCONNECTED;
        }
        if (status) {
            this.props.connectionActions.merge({status});
            this.setState({
                buttonMessage: BUTTON_MESSAGE[this.props.connection.get('status')]
            });
        }
    }

	render() {
		const {connection, configuration, ipc, ipcActions} = this.props;
        const status = connection.get('status');

        let errorMessage;
        let onButtonClick;
        let buttonMessage = BUTTON_MESSAGE[status];
        if (this.state.hover && status === APP_STATUS_CONSTANTS.CONNECTED) {
            buttonMessage = 'disconnect';
        }

        if (APP_STATUS_CONSTANTS.INITIALIZED === status) {
            onButtonClick = this.connect;
        }

		else if (APP_STATUS_CONSTANTS.ERROR === status) {
			errorMessage = (
				<pre className={styles.errorMessage}>
					{
						'Hm... there was an error connecting: ' +
						ipc.getIn(['error', 'message'])
					}
				</pre>
			);
            onButtonClick = this.connect;
		}

        else if (APP_STATUS_CONSTANTS.CONNECTED === status) {
            onButtonClick = this.disconnect;
        }

        else if (APP_STATUS_CONSTANTS.LOADING === status) {
            onButtonClick = () => {};
		}

        else if (APP_STATUS_CONSTANTS.DISCONNECTED === status) {
			onButtonClick = this.connect;
		}

		return (
			<div className={styles.footer}>
				<a className={styles.buttonPrimary}
					onClick={onButtonClick}
                    onMouseOut={() => {this.setState({hover: false});}}
                    onMouseOver={() => {this.setState({hover: true});}}
				>
					{buttonMessage}
				</a>
                {errorMessage}
			</div>
		);
	}
}
