import React from 'react';

/*
 * We're sharing most of the same components for the web-app and the
 * electron interface. In the electron app, we walk the user through
 * setting up self-signed HTTPS certs but we don't show those instructions
 * in the web-app since it requires `electron` specific modules
 * (like sudo prompt).
 * This component is imported in both modules but only rendered in the
 * electron app. So, shim out the `electron` require so that this still
 * runs in the web.
 */
let shell;
try {
    shell = require('electron').shell;
} catch (e) {

}
import {getQuerystringParam} from '../../../utils/utils';
const tempHttpsPort = parseInt(getQuerystringParam('PORT'), 10) + 1;
const HTML_STATUS_PAGE = `https://${getQuerystringParam('CONNECTOR_HTTPS_DOMAIN')}:${tempHttpsPort}/status`;

const Instructions = () => (
    <div>

        <hr/>

        <div>
            We&#39;ve just generated a <i>self-signed certificate </i>
            for you to use with this app.
            This allows your data to be encrypted as it travels
            between your web browser and this connector.
            Here&#39;s how to install this certificate:

            <ol>
                <li>
                    Visit&nbsp;
                    <a onClick={() => {shell.openExternal(HTML_STATUS_PAGE);}}>
                        {HTML_STATUS_PAGE}
                    </a>
                </li>

                <li>
                    Download the certificate
                </li>
                <li>
                    Import the certificate into keychain
                </li>
                <li>
                    "Always trust" the certificate
                </li>
            </ol>

            <iframe width="560"
                    height="315"
                    src="https://www.youtube-nocookie.com/embed/diWxlh7kucc?rel=0&amp;showinfo=0"
                    frameBorder="0"
                    allowFullScreen
            ></iframe>

        </div>

    </div>
);

export default Instructions;
