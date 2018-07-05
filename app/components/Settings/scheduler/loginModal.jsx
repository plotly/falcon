import React from 'react';
import PropTypes from 'prop-types';

import { Row, Column } from '../../layout.jsx';
import Modal from '../../modal.jsx';

const styles = {
    column: { width: '400px', background: '#F5F7FB', position: 'relative' },
    header: { marginBottom: '16px', padding: '0 32px' },
    button: {
        position: 'absolute',
        top: '16px',
        right: '16px',
        padding: '2px 4px'
    },
    detailsColumn: { padding: '0 32px' },
    p: { margin: '56px 0 8px', padding: '16px' },
    submit: {
        width: '100%',
        margin: '24px 32px 32px'
    },
    row: { justifyContent: 'flex-start' }
};

const PromptLoginModal = props => (
    <Modal
        open={props.open}
        onClickAway={props.onClickAway}
        className="scheduler"
    >
        <Column style={styles.column}>
            <button onClick={props.onClickAway} style={styles.button}>
                &times;
            </button>
            <Row style={styles.header}>
                <p style={styles.p}>
                    To create a scheduled query, you'll need to be logged into
                    Plotly.
                </p>
            </Row>
            <Row style={{ width: '50%', marginLeft: '25%' }}>
                <button
                    type="submit"
                    style={styles.submit}
                    onClick={props.onSubmit}
                >
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
