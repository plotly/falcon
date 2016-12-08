import React from 'react';
import * as styles from './Configuration.css';

function dynamicRequire(module) {
    return require(module);
}

let shell = null;
try {
    shell = require('electron').shell;
} catch (e) {

}

export function Link(href, text) {

        return (
            <span>
                {shell ? (
                    <span className={styles.externalLink}
                        onClick={() => {
                            shell.openExternal(href);
                    }}
                    >
                        {text}
                    </span>
                ) : <a className={styles.externalLink} href={href} target="_blank">{text}</a>}
            </span>

        );
}
