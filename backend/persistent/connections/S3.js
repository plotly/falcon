import AWS from 'aws-sdk';

function createClient(connections) {
    AWS.config.update({
        accessKeyId: connections.accessKeyId,
        secretAccessKey: connections.secretAccessKey
    });
    return new AWS.S3();
}


export function connect(connections) {
    const {bucket} = connections;
    const client = createClient(connections);
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
export function query(key, connections) {
    const {bucket} = connections;
    const client = createClient(connections);
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
export function files(connections) {
    const {bucket} = connections;
    const client = createClient(connections);
    return new Promise((resolve, reject) => {
        client.listObjects({Bucket: bucket}, (err, data) => {
            if (err) {
                reject(err);
                return;
            } else {
                resolve(data.Contents);
            }
        });
    });
}

function parse(textData) {
    // TODO - use a more robust parsing algorithm
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
