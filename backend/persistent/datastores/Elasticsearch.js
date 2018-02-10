import {parseElasticsearch} from '../../parse';
import fetch from 'node-fetch';

const KEEP_ALIVE_FOR = '1m'; // minutes
const MAX_RESULTS_SIZE = 10 * 1000;

function request(relativeUrl, connection, {body, method, queryStringParams = ''}) {
    const {host, port, username, password} = connection;
    let url;
    if (typeof port !== 'undefined' && port !== '') {
        url = `${host}:${port}/${relativeUrl}?format=json${queryStringParams}`;
    } else {
        url = `${host}/${relativeUrl}?format=json${queryStringParams}`;
    }
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (username && password) {
        headers.Authorization = 'Basic ' + new Buffer(
            username + ':' + password
        ).toString('base64');
    }
    return fetch(url, {
        headers,
        method,
        body: body ? JSON.stringify(body) : null
    });
}

export function connect(connection) {
    return request('_cat/indices/', connection, {method: 'GET'});
}

export function query(queryStmt, connection) {
    const queryObject = JSON.parse(queryStmt);
    const {body, index, type} = queryObject;
    /*
     * If size is not defined or smaller than 10K, keep scroll disabled and
     * let elasticsearch handle it, which it defaults right now to 10.
     * If it is, and it is higher than 10K then enable scroll.
     */
    const scrollEnabled = parseInt(body.size, 10) > MAX_RESULTS_SIZE;
    /*
     * In order to use scrolling, the initial search request should specify
     * the scroll parameter in the query string, which tells Elasticsearch
     * how long it should keep the “search context” alive.
     */
    const scrollParam = scrollEnabled ? `&scroll=${KEEP_ALIVE_FOR}` : '';

    return elasticsearchMappings(connection)
    .then(mappings => {
        const mapping = mappings[index].mappings[type].properties;
        return request(`${index}/${type}/_search`, connection, {
            body,
            method: 'POST',
            queryStringParams: scrollParam
        })
        .then(res => res.json().then(results => {
            if (res.status === 200) {
                return parseElasticsearch(body, results, mapping);
            }
            throw new Error(JSON.stringify(results));
        }));
    });
}

export function elasticsearchMappings(connection) {
    return request('_all/_mappings', connection, {method: 'GET'})
    .then(res => res.json());
}
