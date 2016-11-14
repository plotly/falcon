import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';

const httpVideoLink = 'https://www.youtube.com/embed/S4TXMMn9mh0?rel=0&amp;showinfo=0';

export default class CreateCertificates extends Component {
    constructor(props) {
        super(props);
        this.state = {httpVideoShow: false};
    }

    render() {

        const hasSelfSignedCert = false;

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
                Alternatively, you can run the connector without
                HTTPS and allow your browser to make insecure
                requests.&nbsp;
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
        if (hasSelfSignedCert) {
            httpsServerStatus = (
                <div>✓ This app is successfully running on HTTPS.</div>
            );
            // reset to null if user creates https certs during runtime
            httpNote = null;
        } else {
            httpsServerStatus = (
                <div>
                    This app is not running on HTTPS.&nbsp;
                    <a
                       onClick={() => console.warn('generate https')}
                    >
                        Click to generate HTTPS certificates.
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
