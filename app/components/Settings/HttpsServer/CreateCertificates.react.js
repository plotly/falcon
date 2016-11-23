import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {RED_DOT, YELLOW_DOT, GREEN_DOT} from './Buttons.js';
import {contains} from 'ramda';
import {usesHttpsProtocol} from '../../../utils/utils';

const httpVideoLink = 'https://www.youtube.com/embed/S4TXMMn9mh0?rel=0&amp;showinfo=0';
let INTERVAL_HAS_CERTS;

export default class CreateCertificates extends Component {
    constructor(props) {
        super(props);
        this.state = {httpVideoShow: false};
    }

    componentWillMount() {
        console.warn(usesHttpsProtocol());
        if (!usesHttpsProtocol()) {
            INTERVAL_HAS_CERTS = setInterval(() => {
                console.warn('hasCerts call');
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
        console.warn('hasCertsRequest', hasCertsRequest);
        console.warn('createCertsRequest', createCertsRequest);
        console.warn('redirectUrlRequest', redirectUrlRequest);
        console.warn('usesHttpsProtocol', usesHttpsProtocol());

        const hasCerts = hasCertsRequest.status === 200 && hasCertsRequest.content;
        const createdCerts = createCertsRequest.status === 200 && createCertsRequest.content;

        let httpVideo;
        let httpVideoLinkWording;
        if (this.state.httpVideoShow) {
            httpVideo =
                <iframe
                    width="560"
                    height="315"
                    src={httpVideoLink}
                    frameBorder="0"
                    allowFullScreen
                ></iframe>;
            httpVideoLinkWording = 'Hide Video.';
        } else {
            httpVideo = null;
            httpVideoLinkWording = 'Click to see how.';
        }

        let httpNote = null;
        httpNote = (
            <div style={{fontSize: '0.8em'}}>
                {'Alternatively, you can run the connector without ' +
                'HTTPS and allow your browser to make insecure ' +
                'requests. '}
                <a
                    onClick={() => {this.setState(
                        {httpVideoShow: !this.state.httpVideoShow}
                    );}}
                >
                    {httpVideoLinkWording}
                </a>
                <div>
                    {httpVideo}
                </div>
            </div>
        );

        let httpsServerStatus = null;
        if (usesHttpsProtocol()) {
            httpsServerStatus = (
                <div>{GREEN_DOT}{'The app is running using a secure HTTPS server. '}</div>
            );
        } else if (!usesHttpsProtocol() && hasCerts) {
            httpsServerStatus = (
                <div>{YELLOW_DOT}{'You have successfully created HTTPS certificates. '}</div>
            );
        } else {
            httpsServerStatus = (
                <div>
                    {RED_DOT}{'This app is not running on a HTTPS server.'}
                    <a
                       onClick={() => {
                           console.log('createCerts()');
                           this.props.createCerts();
                       }}
                    >
                        {'Click to generate HTTPS certificates.'}
                    </a>
                </div>
            );
        }

        return (
            <div>
                {httpsServerStatus}
                {httpNote}
            </div>
        );

    }
}


CreateCertificates.propTypes = {

};
