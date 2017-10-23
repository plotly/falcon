import React from 'react';
import PropTypes from 'prop-types';
import {values} from 'ramda';
import {
    DIALECTS, LOGOS
} from '../../../constants/constants';
import classnames from 'classnames';

const DialectSelector = function DialectSelector(props) {
    const {connectionObject, updateConnection} = props;

    const logos = values(DIALECTS).map(DIALECT => (
        <div
            key={DIALECT}
            className={classnames(
                'logo', {
                    ['logoSelected']: connectionObject.dialect === DIALECT
                }
            )}
            onClick={() => {
                updateConnection(
                    {dialect: DIALECT}
                );
            }}
            id={`test-logo-${DIALECT}`}
        >
            <img
                className={'logoImage'}
                src={LOGOS[DIALECT]}
            />
        </div>
    ));

    return <div className={'logoContainer'}>{logos}</div>;
};

DialectSelector.propTypes = {
    connectionObject: PropTypes.object,
    updateConnection: PropTypes.func
};

export default DialectSelector;
