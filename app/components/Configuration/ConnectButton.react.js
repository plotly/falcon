import React, {Component, PropTypes} from 'react';
import styles from './ConnectButton.css';
import Select from 'react-select';

/*
	Displays a connect button and a disconnect button.
	Asks sequelize to create a new connection using credentials.
	Fires preset queries to show available databases/schemes
	inside the users' account using `ipcActions`.
	Displays errors and log messages using `ipc`.
*/

const APP_STATUS = {
    INITIALIZED: 'INITIALIZED',
    ERROR: 'ERROR',
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED'
};

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
        this.state = {
            status: APP_STATUS.INITIALIZED
        };
    }

    componentWillReceiveProps(nextProps) {
        let status;

        if (nextProps.ipc.hasIn(['error', 'message'])) {
            status = APP_STATUS.ERROR;
        } else if (nextProps.ipc.get('databases')) {
            status = APP_STATUS.CONNECTED;
        } else if (!nextProps.ipc.get('databases')) {
            status = APP_STATUS.DISCONNECTED;
        }
        if (status) {
            this.setState({status});
        }
    }

	render() {
		const {configuration, ipc, ipcActions} = this.props;

		let successMessage = null;
		let errorMessage = null;
		let buttonMessage = BUTTON_MESSAGE[this.state.status];
		if (this.state.status === APP_STATUS.ERROR) {
			errorMessage = (
				<pre>
					{
						'Hm... there was an error connecting: ' +
						ipc.getIn(['error', 'message'])
					}
				</pre>
			);
			buttonMessage = BUTTON_MESSAGE[this.state.status];
		} else if (this.state.status === APP_STATUS.CONNECTED) {
			successMessage = (
				<pre>
					{ipc.toJS().log}
				</pre>
			);
			buttonMessage = BUTTON_MESSAGE[this.state.status];
		} else if (this.state.status === APP_STATUS.LOADING) {
			buttonMessage = BUTTON_MESSAGE[this.state.status];
		} else if (this.state.status === APP_STATUS.DISCONNECTED) {
			successMessage = (
				<pre>
					{ipc.toJS().log}
				</pre>
			);
			buttonMessage = BUTTON_MESSAGE[this.state.status];
		}

		const onClickDisconnect = () => {
			ipcActions.disconnect();
		};

		return (
			<div className={styles.footer}>
				<a className={styles.buttonPrimary}
					onClick={() => {
						this.setState({status: APP_STATUS.CONNECTING});
						ipcActions.connect(configuration);
					}}
				>
					{buttonMessage}
				</a>
				<a className={styles.buttonSecondary}
					onClick={onClickDisconnect}
				>
					disconnect
				</a>

				{errorMessage}
				{successMessage}
			</div>

		);
	}
}
