import React, { Component, PropTypes } from 'react';
import * as styles from './HttpsSetup.css';
import CreateCertificates from './CreateCertificates.react';
import DetectCertificates from './DetectCertificates.react';
import {
    canConfigureHTTPS, usesHttpsProtocol, baseUrl
} from '../../../utils/utils';

const httpVideoLink = 'https://www.youtube.com/embed/S4TXMMn9mh0?rel=0&amp;showinfo=0';
const httpVideo = (show) => {
    return show ? (
        <iframe
            width="560"
            height="315"
            src={httpVideoLink}
            frameBorder="0"
            allowFullScreen
        ></iframe>
    ) : null;
};
const httpVideoLinkWording = (show) => {
    return show ? 'Hide Video.' : 'Click to see how.';
};

export default class HttpsSetup extends Component {
    constructor(props) {
        super(props);
        this.state = {httpVideoShow: false};
    }

    renderCreateCertificates() {
        const {
            createCerts, createCertsRequest, hasCerts,
            hasCertsRequest, redirectUrl, redirectUrlRequest
        } = this.props;

        return (canConfigureHTTPS || !usesHttpsProtocol()) ? (
            <CreateCertificates
                createCerts={createCerts}
                createCertsRequest={createCertsRequest}
                hasCerts={hasCerts}
                hasCertsRequest={hasCertsRequest}
                redirectUrl={redirectUrl}
                redirectUrlRequest={redirectUrlRequest}
            />
        ) : null;
    }

    renderDetectCertificates() {
        return canConfigureHTTPS || !usesHttpsProtocol() ? (
            <DetectCertificates
                startTempHttpsServer={this.props.startTempHttpsServer}
                startTempHttpsServerRequest={this.props.startTempHttpsServerRequest}
            />
        ) : null;
    }

    render() {
        const httpNote = (
            <div style={{fontSize: '0.8em'}}>
                {'Alternatively, you can run the connector without ' +
                'HTTPS and allow your browser to make insecure ' +
                'requests. '}
                <a
                    onClick={() => {this.setState(
                        {httpVideoShow: !this.state.httpVideoShow}
                    );}}
                >
                    {httpVideoLinkWording(this.state.httpVideoShow)}
                </a>
                <div>
                    {httpVideo(this.state.httpVideoShow)}
                </div>
            </div>
        );

        return (
            <div className={styles.httpsSetupWrapper}>

                <div>
                    {canConfigureHTTPS && !usesHttpsProtocol() ? (
                        <div>
                            <div>{httpNote}</div>
                            <div>
                                {
                                    [this.renderCreateCertificates(), this.renderDetectCertificates()].map(
                                        step => step ? <div>{step}</div> : null
                                    )
                                }
                            </div>
                        </div>) : (
                            <div>
                                {"HTTPS is setup. Your connector's endpoint is: "}
                                <span className={styles.currentUrl}>
                                    {baseUrl()}
                                </span>
                            </div>
                        )}
                </div>

            </div>
        );
    }
}
