import React, {Component} from 'react';
import PropTypes from 'prop-types';

import enhanceWithClickOutside from 'react-click-outside';

const ClickAway = enhanceWithClickOutside(
    class extends Component {
        static propTypes = {
          onClickAway: PropTypes.func,
          children: PropTypes.node
        }
        handleClickOutside() {
            this.props.onClickAway();
        }
        render() {
            return this.props.children;
        }
    }
);

const Modal = props =>
    props.open ? (
        <div
            className={props.className}
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100vw',
                height: '100vh',
                margin: '0 auto',
                position: 'fixed',
                background: 'rgba(0, 0, 0, 0.2)',
                top: 0,
                left: 0,
                zIndex: 9999
            }}
        >
            <ClickAway onClickAway={props.onClickAway}>
                {props.children}
            </ClickAway>
        </div>
    ) : null;

Modal.propTypes = {
    children: PropTypes.node,
    onClickAway: PropTypes.func,
    open: PropTypes.bool,
    className: PropTypes.string
};

export default Modal;
