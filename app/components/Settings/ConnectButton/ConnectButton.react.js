import React, {Component, PropTypes} from 'react';
import * as styles from './ConnectButton.css';
import {has} from 'ramda';

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
            let errorMessage = 'Hm... had trouble connecting.';
            if (
               has('conent', connectRequest) &&
               has('error', connectRequest.content)
            ) {
               errorMessage = connectRequest.content.error;
            } else if (
               has('content', saveConnectionsRequest) &&
               has('error', saveConnectionsRequest.content) &&
               has('message', saveConnectionsRequest.content.error)
            ) {
               errorMessage = saveConnectionsRequest.content.error.message;
            }
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
                <div
                    className={styles.buttonPrimary}
                    onClick={buttonClick}
                >
                    {buttonText}
                </div>
                    {error}
            </div>
       );
    }
}
