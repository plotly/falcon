import React, {Component, PropTypes} from 'react';
import * as styles from './ConnectButton.css';
import {has, pathOr} from 'ramda';

const isLoading = (status) => status === 'loading';

export default class ConnectButton extends Component {

    render() {
        const {
            connectionsHaveBeenSaved,
            connect,
            connectRequest,
            saveConnectionsRequest,
            editMode
        } = this.props;

        let buttonText;
        let buttonClick = () => {};
        let error = null;

        if (connectRequest.status >= 400 || saveConnectionsRequest.status >= 400) {
            buttonText = 'Connect';
            buttonClick = connect;
            // TODO - Try out locking the home folder and verifying this.

            // Possible errors.
            const connectErrorMessage = pathOr(
                null, ['content', 'error'], connectRequest
            );
            const saveErrorMessage = pathOr(
                null, ['content', 'error', 'message'], saveConnectionsRequest
            );
            const genericErrorMessage = 'Hm... had trouble connecting.';
            const errorMessage = connectErrorMessage || saveErrorMessage || genericErrorMessage;
            error = <div className={styles.errorMessage}>{errorMessage}</div>;
        } else if (
            isLoading(connectRequest.status) ||
            isLoading(saveConnectionsRequest.status)
        ) {
            buttonText = 'Connecting...';
        } else if (
            connectRequest.status >= 200 &&
            connectRequest.status < 300
        ) {
            if (editMode) {
                buttonText = 'Save changes';
                buttonClick = connect;
            } else {
                buttonText = 'Connected';
            }
        } else if (!connectRequest.status) {
            buttonText = 'Connect';
            buttonClick = connect;
        }
       return (
            <div className={styles.connectButtonContainer}>
                <button
                    id="test-connect-button"
                    onClick={buttonClick}
                >
                    {buttonText}
                </button>
                {error}
            </div>
       );
    }
}
