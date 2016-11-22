import React, { Component, PropTypes } from 'react';
import * as styles from './HttpsSetup.css';
import CreateCertificates from './CreateCertificates.react';
import DetectCertificates from './DetectCertificates.react';
import {canConfigureHTTPS} from '../../../utils/utils';

export default class HttpsSetup extends Component {
    constructor(props) {
        super(props);
    }

    renderCreateCertificates() {
        return canConfigureHTTPS ? (
            <CreateCertificates
                createCertsRequest={this.props.createCertsRequest}
                hasCertsRequest={this.props.hasCertsRequest}
                createCerts={this.props.createCerts}
            />
        ) : null;
    }

    renderDetectCertificates() {
        // return null;
        return canConfigureHTTPS ? (
            <DetectCertificates
                hasCertsRequest={this.props.hasCertsRequest}
            />
        ) : null;
    }

    render() {
        return (
            <div className={styles.step3Container}>
                {canConfigureHTTPS ? (
                    <h5>
                        <a>
                            Secure your connection with HTTPS
                        </a>
                    </h5>
                ) : null}

                <div>
                    {
                        [
                            this.renderCreateCertificates(),
                            this.renderDetectCertificates()].map(
                            step => step ? <div>{step}</div> : null
                        )
                    }
                </div>
            </div>
        );
    }
}
