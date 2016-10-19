import {parseElasticsearch} from '../../parse';
import elasticsearch from 'elasticsearch';

function createClient(credentials) {
    const {host, port, username, password} = credentials;
    return new elasticsearch.Client({
        host: `${host}:${port}`,
        auth: `${username}:${password}`
    });
}


export function connect(credentials) {
    const client = createClient(credentials);

    return new Promise(function(resolve, reject) {
        client.ping({
            requestTimeout: 10 * 1000,
            hello: 'hello elasticsearch'
        }, error => {
            if (error) {
                reject(`An error occured when connecting
                        to elasticsearch: ${error}`);
                // TODO ^ Are we sure that error is a string?
            } else {
                resolve();
            }
        });
    });

}

export function query(queryObject, credentials) {
    const client = createClient(credentials);
    return client.search(queryObject).then(
        results => parseElasticsearch(results.hits.hits)
    );
}
