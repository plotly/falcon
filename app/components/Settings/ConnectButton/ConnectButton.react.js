import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import classnames from 'classnames';
import * as styles from './ConnectButton.css';
import {APP_STATUS, BUTTON_MESSAGE} from '../../../constants/constants';

/*
	Displays a connect button and a disconnect button.
	Asks sequelize to create a new connection using credentials.
	Fires preset queries to show available databases/schemes
	inside the users' account using `sessionsActions`.
	Displays errors and log messages using `ipc`.
*/

export default class ConnectButton extends Component {
    constructor(props) {
        super(props);
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.testClass = this.testClass.bind(this);
        this.updateStatus = this.updateStatus.bind(this);
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
        this.updateStatus(APP_STATUS.CONNECTING);
        this.props.sessionsActions.connect();
    }

    disconnect() {
        this.props.sessionsActions.disconnect();
    }

    onMouseOver() {
        this.setState({hover: true});
    }

    onMouseOut() {
        this.setState({hover: false});
    }

    updateStatus(status) {
        if (status !== this.props.connection.get('status')) {
            this.props.sessionsActions.updateConnection({status});
            this.setState({
                buttonMessage: BUTTON_MESSAGE[status]
            });
        }
    }

    componentWillReceiveProps(nextProps) {
        const status = this.props.connection.get('status');
            if (!nextProps.ipc.get('error')) {
                if (
                    nextProps.ipc.has('databases') &&
                    !nextProps.ipc.get('databases')
                ) {
                    this.updateStatus(APP_STATUS.DISCONNECTED);
                } else if (nextProps.ipc.get('databases')) {
                    this.updateStatus(APP_STATUS.CONNECTED);
                }
            } else {
                if (nextProps.ipc.getIn(['error', 'type']) === 'connection') {
                    this.updateStatus(APP_STATUS.CON_ERROR);
                } else if (status !== APP_STATUS.CON_ERROR) {
                    this.updateStatus(APP_STATUS.ERROR);
                }
            }
    }

	render() {
		const {connection, ipc} = this.props;
        const status = connection.get('status');

        let errorMessage;
        let onButtonClick;

        let buttonMessage = BUTTON_MESSAGE[status];
        if (this.state.hover &&
            (status === APP_STATUS.CONNECTED || status === APP_STATUS.ERROR)) {
            buttonMessage = 'disconnect';
        }

        // what should the button onClick do depending on the app status
        switch (status) {

            case APP_STATUS.INITIALIZED:
                onButtonClick = this.connect;
                break;

            case APP_STATUS.CON_ERROR:
                errorMessage = (
                    <pre className={styles.errorMessage}>
                        {
                            'Hm... an error occured: ' +
                            ipc.getIn(['error', 'message'])
                        }
                    </pre>
                );
                onButtonClick = this.connect;
                break;

            case APP_STATUS.ERROR:
                errorMessage = (
                    <pre className={styles.errorMessage}>
                        {
                            'Hm... there was an error connecting: ' +
                            ipc.getIn(['error', 'message'])
                        }
                    </pre>
                );
                onButtonClick = this.disconnect;
                break;

            case APP_STATUS.CONNECTED:
                onButtonClick = this.disconnect;
                break;

            case APP_STATUS.CONNECTING:
                onButtonClick = () => {};
                break;

            case APP_STATUS.DISCONNECTED:
                onButtonClick = this.connect;
                break;

            default:
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

ConnectButton.propTypes = {
    configuration: ImmutablePropTypes.map.isRequired,
    connection: ImmutablePropTypes.map.isRequired,
    sessionsActions: PropTypes.object,
    ipc: ImmutablePropTypes.map.isRequired
};
