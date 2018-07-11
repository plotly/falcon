import React from 'react';
import PropTypes from 'prop-types';

import {Row} from '../../layout.jsx';

const rowStyle = {justifyContent: 'flex-start'};

function DetailsRow(props) {
    return (
        <Row style={rowStyle} className="cron-details-row">
            {props.children}
        </Row>
    );
}

DetailsRow.propTypes = {
    children: PropTypes.node
};

export default DetailsRow;
