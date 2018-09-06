import React from 'react';
import PropTypes from 'prop-types';

/* eslint-disable */
const Tag = ({title, color}) => (
    <span
        style={{
            display: 'inline-block',
            textAlign: 'center',
            backgroundColor: color,
            color: 'white',
            padding: '4px 12px',
            fontSize: 16,
            marginRight: '1rem',
            borderRadius: '2px'
        }}
    >
        {title}
    </span>
);

Tag.propTypes = {
    title: PropTypes.string.isRequired,
    color: PropTypes.string
};

export default Tag;
