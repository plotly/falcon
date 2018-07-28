/**
 * This module contains a collection of helpful primitive components
 * for layout purposes.
 */
import React from 'react';
import PropTypes from 'prop-types';

export const Row = props => (
    <div
        className="row"
        {...props}
        style={{
            display: 'flex',
            boxSizing: 'border-box',
            justifyContent: 'space-around',
            width: '100%',
            ...props.style
        }}
    >
        {props.children}
    </div>
);

Row.propTypes = {
    children: PropTypes.node,
    style: PropTypes.object
};

export const Column = props => (
    <Row
        className="column"
        {...props}
        style={{ flexDirection: 'column', ...props.style }}
    />
);

Column.propTypes = {
    style: PropTypes.object
};
