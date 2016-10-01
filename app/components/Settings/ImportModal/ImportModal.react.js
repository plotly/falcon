import React from 'react';
import {shell} from 'electron';
import * as styles from './ImportModal.css';

const httpsGithubIssueLink = 'https://github.com/plotly/' +
                         'plotly-database-connector/issues/51';

const plotlyWorkspaceLink = 'https://plot.ly/alpha/workspace';

const importDataScreenShot = (secure) => {
    if (secure) {
        return (
            <img
                 src="./images/import-modal-https.png"
                 className={styles.workspace}
            >
            </img>
        );
    } else {
        return (
            <img
                 src="./images/import-modal-http.png"
                 className={styles.workspace}
            >
            </img>
        );
    }
};

const ImportModal = (secure) => (

    <div className={styles.futureDirections}>
        Query data by clicking on 'import data' from
        <a onClick={() => {
            shell.openExternal(plotlyWorkspaceLink);
        }}
        >
        &nbsp;<u>plotly workspace</u>&nbsp;
        </a>
        and choose the SQL option.<br/>
        Remember to keep this app running
        while you are making queries!
        {importDataScreenShot(secure)}
    </div>
);

export default ImportModal;
