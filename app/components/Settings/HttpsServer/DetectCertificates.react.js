import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Instructions from './Instructions.react';
import {BACKEND} from '../../../constants/constants';

let INTERVAL_ID;

export default class DetectCertificates extends Component {
    constructor(props) {
        super(props);
        this.state = {
            successfulFetch: false,
            expandInstructions: false
        };
    }
    refreshState() {
        fetch(
            `https://${BACKEND.CONNECTOR_URL}:${BACKEND.OPTIONS.port}/status`
        )
        .then(() => {
            this.setState({successfulFetch: true});
        })
        .catch(err => {
            if (err.message === 'failed to fetch') {
                this.setState({successfulFetch: false});
            }
        });
    }

    componentWillUnmount() {
        clearInterval(INTERVAL_ID);
    }

    render() {
        let httpsServerStatus;
        if (this.state.successfulFetch) {
            httpsServerStatus = (
                <div>✓ Your certificates are installed on this computer.</div>
            );
        } else {
            httpsServerStatus = (
                <div>
                    <div>
                        Install your self-signed certificates.&nbsp;
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
                        <a onClick={() => this.refreshState()}>Click</a>
                    </div>
                    {
                        this.state.expandInstructions
                        ? Instructions()
                        : null
                    }
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
