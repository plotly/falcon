import React from 'react';
import PropTypes from 'prop-types';

const style = {marginBottom: 16, fontSize: 16, color: '#00cc96'};
const SuccessMessage = (props) => (
  <em style={style}>
    {props.children}
  </em>
);

SuccessMessage.propTypes = {
  children: PropTypes.node
};

export default SuccessMessage;
