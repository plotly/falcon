import React from 'react';
import PropTypes from 'prop-types';

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
                    To create a scheduled query, you'll need to be logged into Plotly. Logging in will reset your query,
                    so please save it elsewhere before doing so.
                </p>
            </Row>
            <Row>
                <button type="submit" className="submit" onClick={props.onSubmit}>
                    Log In
                </button>
            </Row>
        </Column>
    </Modal>
);

PromptLoginModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClickAway: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired
};

export default PromptLoginModal;
