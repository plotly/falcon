import React from 'react';
import {shell} from 'electron';

const HTML_STATUS_PAGE = 'https://connector.plot.ly:5001/status';

const HttpsInstructions = () => (
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
                    <a onClick={() => {
                        shell.openExternal(HTML_STATUS_PAGE);
                    }}
                    >
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

export default HttpsInstructions;
