import React, { PropTypes } from 'react';
import {values} from 'ramda';
import * as styles from './DialectSelector.css';
import {
    DIALECTS, LOGOS
} from '../../../constants/constants';
import classnames from 'classnames';

export default function DialectSelector(props) {
    const {credentialObject, updateCredential} = props;

    const logos = values(DIALECTS).map(DIALECT => (
        <div
            key={DIALECT}
            className={classnames(
                styles.logo, {
                      [styles.logoSelected]:
                      credentialObject.dialect === DIALECT
                 }
            )}
            onClick={() => {
                updateCredential(
                    {dialect: DIALECT}
                );
            }}
            id={`test-logo-${DIALECT}`}
        >
            <img
                className={styles.logoImage}
                src={LOGOS[DIALECT]}
            />
        </div>
    ));

    return <div className={styles.logoContainer}>{logos}</div>;
}
