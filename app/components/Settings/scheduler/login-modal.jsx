import React from 'react';
import PropTypes from 'prop-types';
import {CopyToClipboard} from 'react-copy-to-clipboard';

import {Row, Column} from '../../layout.jsx';
import Modal from '../../modal.jsx';

import './login-modal.css';

const containerOverrideStyle = {width: '400px'};

const PromptLoginModal = props => (
    <Modal open={props.open} onClickAway={props.onClickAway} className="scheduler login-modal">
        <Column style={containerOverrideStyle} className="container">
            <button onClick={props.onClickAway} className="button">
                &times;
            </button>
            <Row className="header">
                <p>
                    To create a scheduled query, you'll need to be logged into Plotly.<br />
                    <br />
                    Note: logging in will reset your query, click the button below to copy the query to your clipboard.
                </p>
            </Row>
            <Row className="actions">
                <button type="submit" onClick={props.onSubmit}>
                    Log In
                </button>
                <CopyToClipboard text={props.preview.code}>
                    <button className="btn-secondary">Copy Query</button>
                </CopyToClipboard>
            </Row>
        </Column>
    </Modal>
);

PromptLoginModal.propTypes = {
    open: PropTypes.bool.isRequired,
    preview: PropTypes.object.isRequired,
    onClickAway: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default PromptLoginModal;
