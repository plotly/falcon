import R from 'ramda';
import React from 'react';
import PropTypes from 'prop-types';
import {dynamicRequireElectron} from '../utils/utils';


let shell;
try {
    shell = dynamicRequireElectron().shell;
} catch (e) {
    shell = null;
}

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

Link.propTypes = {
    href: PropTypes.string,
    className: PropTypes.string
};
