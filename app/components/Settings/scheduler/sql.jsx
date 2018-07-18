import React from 'react';
import PropTypes from 'prop-types';
import Highlight from 'react-highlight';

export const SQL = props => <Highlight className={`sql ${props.className || 'default'}`}>{props.children}</Highlight>;

SQL.propTypes = {
    children: PropTypes.string,
    className: PropTypes.string
};

export default SQL;
