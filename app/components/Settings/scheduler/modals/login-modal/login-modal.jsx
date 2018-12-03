import React from 'react';
import PropTypes from 'prop-types';
import {CopyToClipboard} from 'react-copy-to-clipboard';

import {Row, Column} from '../../../../layout';
import Modal from '../../../../modal';

import './login-modal.css';

const containerOverrideStyle = {width: '400px'};
const successTextStyle = {color: '#00cc96'};

class PromptLoginModal extends React.Component {
    static propTypes = {
        open: PropTypes.bool.isRequired,
        preview: PropTypes.object,
        onClickAway: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired
    };

    constructor() {
        super();
        this.state = {
            copyCoolingDown: false
        };

        this.onCopy = this.onCopy.bind(this);
    }

    onCopy() {
        if (!this.state.copyCoolingDown) {
            this.setState({copyCoolingDown: true});
            setTimeout(() => this.setState({copyCoolingDown: false}), 2000);
        }
    }

    render() {
        return (
            <Modal open={this.props.open} onClickAway={this.props.onClickAway} className="scheduler login-modal">
                <Column style={containerOverrideStyle} className="container">
                    <button onClick={this.props.onClickAway} className="button">
                        &times;
                    </button>
                    <Row className="header">
                        <p>
                            To create a scheduled query, you'll need to be logged into Chart Studio.
                            <br />
                            <br />
                            Note: logging in will reset your query, click the button below to copy the query to your
                            clipboard.
                        </p>
                    </Row>
                    <Row className="actions">
                        <button type="submit" onClick={this.props.onSubmit}>
                            Log In
                        </button>
                        <CopyToClipboard text={this.props.preview ? this.props.preview.code : ''} onCopy={this.onCopy}>
                            <button className="btn-secondary">
                                {this.state.copyCoolingDown ? (
                                    <span style={successTextStyle}>Copied!</span>
                                ) : (
                                    'Copy Query'
                                )}
                            </button>
                        </CopyToClipboard>
                    </Row>
                </Column>
            </Modal>
        );
    }
}

export default PromptLoginModal;
