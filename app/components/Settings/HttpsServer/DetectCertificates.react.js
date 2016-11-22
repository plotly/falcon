import React, {Component, PropTypes} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import Instructions from './Instructions.react';
import {baseUrl} from '../../../utils/utils';
import {RED_DOT, YELLOW_DOT, GREEN_DOT} from './Buttons.js';

export default class DetectCertificates extends Component {
    constructor(props) {
        super(props);
        this.state = {
            successfulFetch: false,
            expandInstructions: false
        };
    }

    fetchStatusHTTPS() {
        fetch(
            `${baseUrl}/status`
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

    render() {
        let httpsServerStatus;
        if (this.state.successfulFetch) {
            httpsServerStatus = (
                <div>{GREEN_DOT}{'Your certificates are installed on this computer. '}</div>
            );
        } else {
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
                        <a onClick={() => this.fetchStatusHTTPS()}>Click</a>
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
