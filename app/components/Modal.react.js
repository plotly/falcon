import React, {Component} from 'react';
import PropTypes from 'prop-types';

import enhanceWithClickOutside from 'react-click-outside';

const Modal = props => {
  const EnhancedClass = enhanceWithClickOutside(class extends Component {
    handleClickOutside() {
      // eslint-disable-next-line
      props.onClickAway();
    }
    render() {
      return props.children;
    }
  });

  return props.open
    ? (
      <div
        {...props}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100vw',
          height: '100vh',
          margin: '0 auto',
          position: 'fixed',
          background: 'rgba(0, 0, 0, 0.1)',
          top: 0,
          left: 0,
          zIndex: 9999
        }}
      >
        <EnhancedClass {...props}>{props.children}</EnhancedClass>
      </div>
    )
    : null;
};

Modal.propTypes = {
  children: PropTypes.node,
  onClickAway: PropTypes.func,
  open: PropTypes.bool
};

export default Modal;
