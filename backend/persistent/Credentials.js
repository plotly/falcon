import fs from 'fs';

export const CREDENTIALS_FILE = '/Users/chriddyp/Repos/plotly-database-connector/credentials.json';

export function lookUpCredentials(serializedConfiguration) {
    // Look up the password from a configuration file
    const requestedDBConfiguration = JSON.parse(serializedConfiguration);
    const savedDBCredentials = JSON.parse(
        fs.readFileSync(CREDENTIALS_FILE).toString()
    );
    const requestedDBCredentials = savedDBCredentials.find(savedCredential => {
        let credentialsMatch = false;
        Object.keys(requestedDBConfiguration).forEach(credKey => (
            credentialsMatch = (
                requestedDBConfiguration[credKey] === savedCredential[credKey]
            )
        ));
        return credentialsMatch;
    });
    return requestedDBCredentials;
}
