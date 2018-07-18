import React from 'react';
import PropTypes from 'prop-types';

import {Column, Row} from '../../layout.jsx';

const style = {justifyContent: 'flex-start'};

const DetailsRow = props => (
    <Row style={style} className="cron-details">
        {props.children}
    </Row>
);

DetailsRow.propTypes = {
    children: PropTypes.node
};

const DetailsColumn = props => (
    <Column style={style} className="cron-details">
        {props.children}
    </Column>
);

DetailsColumn.propTypes = {
    children: PropTypes.node
};

export default {DetailsRow, DetailsColumn};
