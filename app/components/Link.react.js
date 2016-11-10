import React from 'react';
import * as styles from './Configuration.css';

export function Link(href, text) {
    try {
        const shell = require('electron').shell;

        return (
            <span className={styles.externalLink}
                onClick={() => {
                shell.openExternal(href);
            }}
            >
                {text}
            </span>
        );
    } catch (e) {
        return <a href={href} target="_blank">{text}</a>;
    }
}
