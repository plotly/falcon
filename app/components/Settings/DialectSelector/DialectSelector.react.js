import React, { PropTypes } from 'react';
import {values} from 'ramda';
import {
    DIALECTS, LOGOS
} from '../../../constants/constants';
import classnames from 'classnames';

export default function DialectSelector(props) {
    const {connectionObject, updateConnection} = props;

    const logos = values(DIALECTS).map(DIALECT => (
        <div
            key={DIALECT}
            data-tip={DIALECT}
            className={classnames(
                'logo', {
                      ['logoSelected']:
                      connectionObject.dialect === DIALECT
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
}
