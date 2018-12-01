import React from 'react';
import PropTypes from 'prop-types';

const style = {fontSize: 16};
const SuccessMessage = (props) => (
  <div style={{ padding: '8px 16px', borderLeft: '4px solid #00cc96', background: 'white'}}>
    <div style={style}>{props.message}</div>
    {props.children}
  </div>
);

SuccessMessage.propTypes = {
  children: PropTypes.node,
  message: PropTypes.string
};

export default SuccessMessage;
