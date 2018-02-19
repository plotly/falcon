import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {pathOr} from 'ramda';

const isLoading = (status) => status === 'loading';

/**
 * The following is the Connect Button which triggers the connection
 * @param {function} connect - Connect function
 * @param {object} connectRequest - Connection Request
 * @param {number || string} connectRequest.status -- 400 or loading
 * @param {object} saveConnectionsRequest - Saved Connection Request
 * @param {number || string } saveConnectionsRequest.status -- 400 or loading
 * @param {boolean} editMode  - Enabled if Editting credentials
 * @returns {ConnectButton}
 */
export default class ConnectButton extends Component {
    static propTypes = {
        connect: PropTypes.func,
        connectRequest: PropTypes.object,
        saveConnectionsRequest: PropTypes.object,
        editMode: PropTypes.bool
    }

    /**
    * Will check whether connection requests are equal to or greater then 400
    * @returns {boolean} true if connection error
    */
    isConnectionError() {
        return (this.props.connectRequest.status >= 400 || this.props.saveConnectionsRequest.status >= 400);
    }

    /**
     * Checks the connection requests to see if status is loading
     * @returns {boolean} true if status is loading
     */
    loadingStatus() {
        return (isLoading(this.props.connectRequest.status) || isLoading(this.props.saveConnectionsRequest.status));
    }

    /**
     * Checks whether the connection request status (HTTP) is greater or equal to 200 and less then 300
     * @returns {boolean} true if connection request status >=200 and <300
     */
    isValidConnection() {
        return (this.props.connectRequest.status >= 200 && this.props.connectRequest.status < 300);
    }

    /**
     * Checks whether connection status is defined
     * @returns {boolean} true if connection status is invalid
     */
    isInvalidConnectionStatus() {
        return (!this.props.connectRequest.status);
    }

    render() {
        const {
            connect,
            connectRequest,
            saveConnectionsRequest,
            editMode
        } = this.props;

        let buttonText;
        let buttonClick = () => {};
        let error = null;

        if (this.isConnectionError()) {
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
            error = <div className={'errorMessage'}>{errorMessage}</div>;
        } else if (this.loadingStatus()) {
            buttonText = 'Connecting...';
        } else if (this.isValidConnection()) {
            if (editMode) {
                buttonText = 'Save changes';
                buttonClick = connect;
            } else {
                buttonText = 'Connected';
            }
        } else if (this.isInvalidConnectionStatus()) {
            buttonText = 'Connect';
            buttonClick = connect;
        }
       return (
            <div className={'connectButtonContainer'}>
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