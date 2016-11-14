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
            <CreateCertificates />
        ) : null;
    }

    renderDetectCertificates() {
        // return null;
        return canConfigureHTTPS ? (
            <DetectCertificates />
        ) : null;
    }

    render() {
        console.warn(canConfigureHTTPS);
        return (
            <div className={styles.step3Container}>
                https setup things
                {canConfigureHTTPS ? (
                    <h5>
                        <a>
                            Secure your connection with HTTPS
                        </a>
                    </h5>
                ) : null}

                <ul>
                    {
                        [
                            this.renderCreateCertificates(),
                            this.renderDetectCertificates()].map(
                            step => step ? <li>{step}</li> : null
                        )
                    }
                </ul>
            </div>
        );
    }
}
