import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {pathOr} from 'ramda';

/**
 * The following is the Connect Button which triggers the connection
 * @param {function} connect - Connect function
 * @param {object} connectRequest - Connection Request
 * @param {number || string} connectRequest.status -- 400 or loading
 * @param {object} saveConnectionsRequest - Saved Connection Request
 * @param {number || string } saveConnectionsRequest.status -- 400 or loading
 * @param {boolean} editMode  - Enabled if Editting credentials
 * @param {Error} [connectRequest.error]
 * @param {Error} [saveConnectionsRequest.error]
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
    * @returns {boolean} true if waiting for a response to a connection request
    */
   isConnecting() {
    return this.props.connectRequest.status === 'loading';
    }

    /**
    * @returns {boolean} true if successfully connected to database
    */
    isConnected() {
        const status = Number(this.props.connectRequest.status);
        return (status >= 200 || status < 300);
    }

    /**
    * @returns {boolean} true if successfully connected to database
    */
    connectionFailed() {
        return Number(this.props.connectRequest.status) >= 400;
    }

    /**
    * @returns {boolean} true if waiting for a response to a save request
    */
    isSaving() {
        return this.props.saveConnectionsRequest.status === 'loading';
    }

    /**
    * @returns {boolean} true if connection has been saved
    */
    isSaved() {
        const status = Number(this.props.saveConnectionsRequest.status);
        return (status >= 200 || status < 300);
    }

    /**
    * @returns {boolean} true if successfully connected to database
    */
    saveFailed() {
        return Number(this.props.saveConnectionsRequest.status) >= 400;
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

        if (this.isConnecting() || this.isSaving()) {
            buttonText = 'Connecting...';

        } else if (this.connectionFailed() || this.saveFailed()) {
            buttonText = 'Connect';
            buttonClick = connect;

            const connectErrorMessage = pathOr(
                null, ['content', 'error'], connectRequest
            );
            const saveErrorMessage = pathOr(
                null, ['content', 'error', 'message'], saveConnectionsRequest
            );
            const genericErrorMessage = 'Hm... had trouble connecting.';
            const errorMessage = connectErrorMessage || saveErrorMessage || genericErrorMessage;
            error = <div className={'errorMessage'}>{errorMessage}</div>;

        } else if (this.isConnected()) {
            buttonText = 'Save changes';
            buttonClick = connect;
        } else {
            buttonClick = connect;
            if (!editMode) {
                buttonText = 'Connected';
            } else {
                buttonText = 'Connect';
            }
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