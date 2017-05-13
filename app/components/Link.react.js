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
            <a onClick={() => {shell.openExternal(href);}} {...props}/>
        );
    } else {
        return <a href={href} target="_blank" {...props}/>
    }
}
