import AWS from 'aws-sdk';

function createClient(credentials) {
    AWS.config.update({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
    });
    return new AWS.S3();
}


export function connect(credentials) {
    const {bucket} = credentials;
    const client = createClient(credentials);
    return new Promise((resolve, reject) => {
        client.listObjects({Bucket: bucket}, err => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
}

/*
 * Download a (csv) file from S3, parse it
 * and return the results.
 */
export function query(key, credentials) {
    const {bucket} = credentials;
    const client = createClient(credentials);
    return new Promise((resolve, reject) => {
        client.getObject({Bucket: bucket, Key: key}, (err, response) => {
            if (err) {
                reject(err);
                return;
            }
            const textData = response.Body.toString();
            // TODO ^ handle binary files too
            resolve(parse(textData));
        });
    });
}

/*
 * List all of the files in an S3 bucket
 */
export function files(credentials) {
    const {bucket} = credentials;
    const client = createClient(credentials);
    return new Promise((resolve, reject) => {
        client.listObjects({Bucket: bucket}, (err, data) => {
            if (err) {
                reject(err);
                return;
            } else {
                resolve(data.Content);
            }
        });
    });
}

function parse(textData) {
    // TODO - use the same parsing routines as the front-end
    const allRows = textData.split('\n').map(row => row.split(','));
    const columnnames = allRows[0];
    const rows = allRows.slice(1);
    return {
        columnnames,
        rows,
        nrows: rows.length,
        ncols: columnnames.length
    };
}
