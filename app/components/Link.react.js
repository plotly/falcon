import R from 'ramda';
import React from 'react';
import {dynamicRequireElectron} from '../utils/utils';
import * as styles from './Link.css';


let shell = null;
try {
    shell = dynamicRequireElectron().shell;
} catch (e) {}

export function Link(props) {
    const {href} = props;
    if (shell) {
        return (
            <span
                className={`${styles.a} ${props.className}`}
                onClick={() => {shell.openExternal(href);}}
                {...R.omit(['className'], props)}
            />
        );
    } else {
        return <a href={href} target="_blank" {...props}/>
    }
}
