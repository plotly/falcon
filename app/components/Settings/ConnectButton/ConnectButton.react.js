import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {pathOr} from 'ramda';

export default class ConnectButton extends Component {
    /**
     * Component props
     * @type     {object}          props
     * @property {function}        props.connect - Connect function
     * @property {object}          props.connectRequest - Connection Request
     * @property {(number|string)} props.connectRequest.status - 400 or loading
     * @property {Error}           props.connectRequest.error
     * @property {object}          props.saveConnectionsRequest - Saved Connection Request
     * @property {(number|string)} props.saveConnectionsRequest.status - 400 or loading
     * @property {Error}           props.saveConnectionsRequest.error
     * @property {boolean}         props.editMode  - Enabled if editing credentials
     */
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
        return (status >= 200 && status < 300);
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
        return (status >= 200 && status < 300);
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

        if (!editMode) {
            buttonText = 'Connected';

        } else if (this.isConnecting() || this.isSaving()) {
            buttonText = 'Connecting...';

        } else if (this.connectionFailed() || this.saveFailed()) {
            buttonText = 'Connect';
            buttonClick = connect;

            const connectErrorMessage = pathOr(
                null, ['content', 'error', 'message'], connectRequest
            );
            const saveErrorMessage = pathOr(
                null, ['content', 'error', 'message'], saveConnectionsRequest
            );
            const genericErrorMessage = 'Hm... had trouble connecting.';
            const errorMessage = String(connectErrorMessage || saveErrorMessage || genericErrorMessage);
            error = <div className={'errorMessage'}>{errorMessage}</div>;

        } else if (this.isConnected() && this.isSaved()) {
            buttonText = 'Save changes';
            buttonClick = connect;

        } else {
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
