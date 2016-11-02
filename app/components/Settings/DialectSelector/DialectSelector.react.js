import React, { PropTypes } from 'react';
import * as DialectStyles from './DialectSelector.css';
import {
    DIALECTS, LOGOS
} from '../../../constants/constants';
import classnames from 'classnames';

export default function DialectSelector(props) {
    const {credentialObject, updateCredential} = props;

    const logos = Object.keys(DIALECTS).map(DIALECT => (
        <div
            key={DIALECT}
            className={classnames(
                DialectStyles.logo, {
                      [DialectStyles.logoSelected]:
                      credentialObject.dialect === DIALECTS[DIALECT]
                 }
            )}
            onClick={() => {
                updateCredential(
                    {dialect: DIALECTS[DIALECT]}
                );
            }}
            id={`test-logo-${DIALECTS[DIALECT]}`}
        >
            <img
                className={DialectStyles.logoImage}
                src={LOGOS[DIALECT]}
            />
        </div>
    ));

    return <div className={DialectStyles.logoContainer}>{logos}</div>;
}
