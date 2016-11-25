import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {RED_DOT, YELLOW_DOT, GREEN_DOT} from './Buttons.js';
import {contains} from 'ramda';
import {usesHttpsProtocol} from '../../../utils/utils';

let INTERVAL_HAS_CERTS;

export default class CreateCertificates extends Component {
    constructor(props) {
        super(props);
    }

    componentWillMount() {
        if (!usesHttpsProtocol()) {
            INTERVAL_HAS_CERTS = setInterval(() => {
                this.props.hasCerts();
            }, 1000);
        }
    }

    componentWillUnmount() {
        clearInterval(INTERVAL_HAS_CERTS);
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.hasCertsRequest.content) {
            clearInterval(INTERVAL_HAS_CERTS);
        }
    }

    render() {
        const {hasCertsRequest, createCertsRequest, redirectUrlRequest} = this.props;
        const hasCerts = hasCertsRequest.status === 200 && hasCertsRequest.content;
        const createdCerts = createCertsRequest.status === 200 && createCertsRequest.content;
        const redirectedUrl = redirectUrlRequest.status === 200 && redirectUrlRequest.content;

        console.warn('hasCerts', hasCertsRequest);
        console.warn('createCertsRequest', createCertsRequest);
        console.warn('redirectUrlRequest', redirectUrlRequest);

        let hasCertsMessage = null;
        if (hasCerts) {
            hasCertsMessage = (
                <div>{GREEN_DOT}{'You have successfully created HTTPS certificates. '}</div>
            );
        } else {
            hasCertsMessage = (
                <div>
                    {RED_DOT}{'This app is not running on a HTTPS server. '}
                    <a
                       onClick={() => {
                           this.props.createCerts();
                       }}
                    >
                        {'Click to generate HTTPS keys. '}
                    </a>
                </div>
            );
        }

        let redirectUrlMessage = null;
        if (redirectedUrl) {
            redirectUrlMessage = (
                <div>{GREEN_DOT}{'You have successfully redirected your secure domain. '}</div>
            );
        } else {
            redirectUrlMessage = (
                <div>
                    {RED_DOT}{'This app does not have a secure domain. '}
                    <a
                       onClick={() => {
                           this.props.redirectUrl();
                       }}
                    >
                        {'Click to redirect your secure domain. '}
                    </a>
                </div>
            );
        }

        return (
            <div>
                {hasCertsMessage}
                {redirectUrlMessage}
            </div>
        );

    }
}


CreateCertificates.propTypes = {

};
