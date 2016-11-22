import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {RED_DOT, YELLOW_DOT, GREEN_DOT} from './Buttons.js';
const httpVideoLink = 'https://www.youtube.com/embed/S4TXMMn9mh0?rel=0&amp;showinfo=0';

export default class CreateCertificates extends Component {
    constructor(props) {
        super(props);
        this.state = {httpVideoShow: false};
    }

    render() {
        const {hasCertsRequest, createCertsRequest} = this.props;
        console.warn('hasCertsRequest', hasCertsRequest);
        console.warn('createCertsRequest', createCertsRequest);
        const createdCerts = createCertsRequest;
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
        if (hasCertsRequest.content.status === 200) {
            httpsServerStatus = (
                <div>{GREEN_DOT}{'The app is running using a secure HTTPS server. '}</div>
            );
        } else if (createdCerts) {
            httpsServerStatus = (
                <div>{YELLOW_DOT}{'You have successfully created HTTPS certificates. Please restart the app. '}</div>
            );
        } else {
            httpsServerStatus = (
                <div>
                    {RED_DOT}
                    {'This app is not running on a HTTPS server.'}
                    <a
                       onClick={() => this.props.createCerts()}
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
