import R from 'ramda';
import React from 'react';
import {dynamicRequireElectron} from '../utils/utils';


let shell = null;
try {
    shell = dynamicRequireElectron().shell;
} catch (e) {}

export function Link(props) {
    const {href} = props;
    if (shell) {
        return (
            <span
                className={`${props.className}`}
                onClick={() => {shell.openExternal(href);}}
                {...R.omit(['className'], props)}
            />
        );
    }
    return <a href={href} target="_blank" {...props}/>;
}
