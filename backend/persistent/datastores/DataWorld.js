import AWS from 'aws-sdk';
import {parseCSV} from '../../parse.js';
import fetch from 'node-fetch';

function createClient(connection) {
    AWS.config.update({
        accessKeyId: connection.accessKeyId,
        secretAccessKey: connection.secretAccessKey
    });
    return new AWS.S3();
}


export function connect(connection) {
    return new Promise((resolve, reject) => {
      fetch(`https://api.data.world/v0/datasets/${connection.owner}/${connection.id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${connection.token}` }
      })
      .then(res => res.json())
      .then(json => {
        // json.code is defined only when there is an error
        if (json.code) {
          reject(json);
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
export function query(key, connection) {
    const {bucket} = connection;
    const client = createClient(connection);
    return new Promise((resolve, reject) => {
        client.getObject({Bucket: bucket, Key: key}, (err, response) => {
            if (err) {
                reject(err);
                return;
            }
            const textData = response.Body.toString();
            // TODO ^ handle binary files too
            parseCSV(textData).then(resolve);
        });
    });
}

/*
 * List all of the files in an S3 bucket
 */
export function files(connection) {
    const {bucket} = connection;
    const client = createClient(connection);
    return new Promise((resolve, reject) => {
        client.listObjects({Bucket: bucket}, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data.Contents);
        });
    });
}
