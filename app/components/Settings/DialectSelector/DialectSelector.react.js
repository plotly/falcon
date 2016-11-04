import React, { PropTypes } from 'react';
import * as styles from './DialectSelector.css';
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
                styles.logo, {
                      [styles.logoSelected]:
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
                className={styles.logoImage}
                src={LOGOS[DIALECT]}
            />
        </div>
    ));

    return <div className={styles.logoContainer}>{logos}</div>;
}
