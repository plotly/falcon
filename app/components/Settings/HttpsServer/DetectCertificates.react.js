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
        const {startTempHttpsServerRequest} = this.props;
        let installCertsMessage;
        if (startTempHttpsServerRequest.status === 200 && startTempHttpsServerRequest.content) {
            installCertsMessage = (
                <div>
                    <div>
                        {YELLOW_DOT}{'Install your certificate from the browser. '}
                        <a
                            onClick={() => {
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
                            {'instructions. '}
                        </a>
                        {'When done, Restart the app.'}
                    </div>
                    {
                        this.state.expandInstructions
                        ? Instructions()
                        : null
                    }
                </div>
            );
        } else {
            installCertsMessage = (
                <div>
                    {RED_DOT}{'Create a browser certificate from your self-signed keys. '}
                    <a
                       onClick={() => {
                           console.warn('spin temp server');
                           this.props.startTempHttpsServer();
                       }}
                    >
                        {'Click to create your certificate. '}
                    </a>
                </div>
            );
        }

        return (
            <div>
                {installCertsMessage}
            </div>
        );
    }

}


DetectCertificates.propTypes = {

};
