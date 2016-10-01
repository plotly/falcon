import React, {Component} from 'react';
import Instructions from './Instructions.react';
import {BACKEND} from '../../../constants/constants';

const httpVideoLink = 'https://www.youtube.com/embed/S4TXMMn9mh0?rel=0&amp;showinfo=0';

class Https extends Component {
    constructor(props) {
        super(props);
        this.state = {httpVideoShow: false};
    }

    render() {

        const hasSelfSignedCert = ipc.has('hasSelfSignedCert') &&
            ipc.get('hasSelfSignedCert');

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

        let step3HTTPSServerStatus = null;
        let httpNote = null;

        if (hasSelfSignedCert) {

            step3HTTPSServerStatus = (
                <div>✓ This app is successfully running on HTTPS.</div>
            );

            // reset to null if user creates https certs during runtime
            httpNote = null;

        } else {
            step3HTTPSServerStatus = (
                <div>
                    This app is not running on HTTPS.&nbsp;
                    <a
                       onClick={sessionsActions.setupHttpsServer}
                    >
                        Click to generate HTTPS certificates.
                    </a>
                </div>
            );
        }

        return (
            <div>
            {step3HTTPSServerStatus}
            </div>
        );

    }
}
