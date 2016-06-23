import React, {Component, PropTypes} from 'react';
import classnames from 'classnames';
import styles from './ConnectButton.css';
import Select from 'react-select';
import {APP_STATUS_CONSTANTS, BUTTON_MESSAGE} from '../../../constants/constants';

/*
	Displays a connect button and a disconnect button.
	Asks sequelize to create a new connection using credentials.
	Fires preset queries to show available databases/schemes
	inside the users' account using `ipcActions`.
	Displays errors and log messages using `ipc`.
*/

export default class ConnectButton extends Component {
    constructor(props) {
        super(props);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.testClass = this.testClass.bind(this);
        this.state = {
            hover: false
        };
    }

    testClass() {
        /*
            Return the connection state as class-status.
            Knowing this status and getting the errorMessage and buttonMessage
            from their respective className tags will suffice to test this
            comoponent.
        */
        return `test-${this.props.connection.get('status')}`;
    }

    connect() {
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
        const updateStatus = (status) => {
            if (status !== this.props.connection.get('status')) {
                this.props.connectionActions.update({status});
                this.setState({
                    buttonMessage: BUTTON_MESSAGE[status]
                });
            }
        };

        let status;
        // TODO: now that connection.status is in redux store, move this out.
        if (nextProps.ipc.hasIn(['error', 'message'])) {
            updateStatus(APP_STATUS_CONSTANTS.ERROR);
        } else if (nextProps.ipc.get('databases')) {
            updateStatus(APP_STATUS_CONSTANTS.CONNECTED);
        } else if (!nextProps.ipc.get('databases')) {
            updateStatus(APP_STATUS_CONSTANTS.DISCONNECTED);
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
				<a className={classnames(
                        styles.buttonPrimary,
                        [this.testClass()]
                    )}
					onClick={onButtonClick}
                    onMouseOut={() => {this.setState({hover: false});}}
                    onMouseOver={() => {this.setState({hover: true});}}
                    id={'test-connect-button'}
				>
					{buttonMessage}
				</a>
                <pre id={'test-error-message'}>
                    {errorMessage}
                </pre>
			</div>
		);
	}
}
