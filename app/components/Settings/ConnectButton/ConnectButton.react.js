import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import classnames from 'classnames';
import * as styles from './ConnectButton.css';
import {APP_STATUS, BUTTON_MESSAGE} from '../../../constants/constants';

export default function ConnectButton(props) {
    const {
        credentialsHaveBeenSaved,
        connect,
        connectRequest,
        saveCredentialsRequest
    } = props;
    console.warn('Connect Button Props: ', props);

    let buttonText;
    let buttonClick = () => {};
    let error = null;

    if (!connectRequest.status) {
        buttonText = 'Connect';
    } else if (connectRequest.status === 'loading') {
        buttonText = 'Connecting...';
    } else if (connectRequest.status >= 200 && connectRequest.status < 300) {
        buttonText = 'Connected';
   } else if (connectRequest.status >= 400 || saveCredentialsRequest.status >= 400) {
       buttonText = 'Connect';
       // TODO - Try out bad credentials to verify this.
       // TODO - Try out locking the home folder and verifying this.
       let errorMessage = 'Hm... had trouble connecting.';
       if (connectRequest.content && connectRequest.content.error && connectRequest.content.error.message) {
           errorMessage = connectRequest.content.error.message;
       } else if (saveCredentialsRequest.content && saveCredentialsRequest.content.error && saveCredentialsRequest.content.error.message) {
           errorMessage = saveCredentialsRequest.content.error.message
       }
       error = <div className={styles.errorMessage}>{errorMessage}</div>;
   } 

   return (
        <div>
            <div
                className={styles.buttonPrimary}
                onClick={connect}>{buttonText}</div>
                {error}
        </div>
   );

}
