import React, {Component} from 'react';
import ImmutablePropTypes from 'react-immutable-proptypes';
import {shell} from 'electron';
import * as styles from './ImportModal.css';

const httpsGithubIssueLink = 'https://github.com/plotly/' +
                         'plotly-database-connector/issues/51';

const plotlyWorkspaceLink = 'https://plot.ly/alpha/workspace/?upload=sql';

const connectorURL = (secured) => {
    if (secured) {
        return 'Enter \'https://connector.plot.ly:5000\' into the input box as shown below.';
    } else {
        return 'Enter \'http://localhost:5000\' into the input box as shown below.';
    }
};

const importDataScreenShot = (secured) => {
    if (secured) {
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

export default class ImportModal extends Component {
    constructor(props) {
        super(props);
    }

    render() {
        const {ipc} = this.props;

        const secured = ipc.has('hasSelfSignedCert') &&
            ipc.get('hasSelfSignedCert');

        return (
            <div className={styles.futureDirections}>
                Query data by clicking on 'import data' from
                <a onClick={() => {
                    shell.openExternal(plotlyWorkspaceLink);
                }}
                >
                &nbsp;<u>plotly workspace</u>&nbsp;
                </a>
                and choose the SQL option.<br/>
                {connectorURL(secured)}<br/>
                Remember to keep this app running
                while you are making queries!
                {importDataScreenShot(secured)}
            </div>
        );
    }
}

ImportModal.propTypes = {
    ipc: ImmutablePropTypes.map.isRequired
};
