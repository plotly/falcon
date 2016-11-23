import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Instructions from './Instructions.react';
import {baseUrl, usesHttpsProtocol} from '../../../utils/utils';
import {RED_DOT, YELLOW_DOT, GREEN_DOT} from './Buttons.js';

let INTERVAL_SERVER_STATUS;

export default class DetectCertificates extends Component {
    constructor(props) {
        super(props);
        this.state = {
            successfulFetch: false,
            expandInstructions: false
        };
    }

    componentWillMount() {
        if (usesHttpsProtocol()) {
            INTERVAL_SERVER_STATUS = setInterval(() => {
                fetch(
                    `${baseUrl()}/status`
                )
                .then(() => {
                    this.setState({successfulFetch: true});
                })
                .catch(err => {
                    this.setState({successfulFetch: false});
                });
            }, 1000);
        }
    }

    componentWillUnmount() {
        clearInterval(INTERVAL_SERVER_STATUS);
    }

    componentWillUpdate() {
        if (usesHttpsProtocol() && this.state.successfulFetch) {
            clearInterval(INTERVAL_SERVER_STATUS);
        }
    }

    render() {
        const {redirectUrlRequest} = this.props;
        let httpsServerStatus;
        if (this.state.successfulFetch && usesHttpsProtocol()) {
            httpsServerStatus = (
                <div>{GREEN_DOT}{'Your certificates are installed on this computer. '}</div>
            );
        } else if (redirectUrlRequest.status === 200 || usesHttpsProtocol()) {
            httpsServerStatus = (
                <div>
                    <div>
                        {YELLOW_DOT}{'Install your self-signed certificates. '}
                        <a onClick={() => {
                                this.setState({
                                    expandInstructions:
                                        !this.state.expandInstructions
                                });
                            }}
                        >
                            {
                                this.state.expandInstructions
                                ? 'Hide '
                                : 'View '
                            }
                            instructions.
                        </a>
                    </div>
                    {
                        this.state.expandInstructions
                        ? Instructions()
                        : null
                    }
                </div>
            );
        } else {
            httpsServerStatus = (
                <div>
                    {RED_DOT}{'This does not have a secure domain. '}
                    <a
                       onClick={() => {
                           this.props.redirectUrl();
                       }}
                    >
                        {'Click to redirect to your secure domain.'}
                    </a>
                </div>
            );
        }

        return (
            <div>
                {httpsServerStatus}
            </div>
        );
    }

}


DetectCertificates.propTypes = {

};
