import React from 'react';
import PropTypes from 'prop-types';

/* eslint-disable */
const Tag = ({name, color, style, className}) => (
    <span
        className={className}
        style={{
            display: 'inline-block',
            textAlign: 'center',
            backgroundColor: color,
            color: 'white',
            padding: '4px 12px',
            fontSize: 12,
            flexShrink: 0,
            marginRight: '1rem',
            borderRadius: '2px',
            ...style
        }}
    >
        {name}
    </span>
);

Tag.propTypes = {
    name: PropTypes.string.isRequired,
    color: PropTypes.string
};

export default Tag;
