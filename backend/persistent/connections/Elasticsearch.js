import {parseElasticsearch} from '../../parse';
import fetch from 'node-fetch';
import elasticsearch from 'elasticsearch';
import {keys} from 'ramda';

function request(relativeUrl, connections, {body, method}) {
    const {host, port, username, password} = connections;
    const url = `${host}:${port}/${relativeUrl}?format=json`;
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    if (username && password) {
        headers['Authorization'] = 'Basic ' + new Buffer(
            username + ':' + password
        ).toString('base64');
    }
    return fetch(url, {
        headers,
        method,
        body: body ? JSON.stringify(body) : null
    });
}

export function connect(connections) {
    const {index} = connections;
    return request(`_cat/indices/${index}`, connections, {method: 'GET'});
}

export function query(query, connections) {
    const queryObject = JSON.parse(query);
    const {body, index, type} = queryObject;
    return request(`${index}/${type}/_search`, connections, {
        body,
        method: 'POST'
    })
    .then(res => res.json().then(results => {
        if (res.status === 200) {
            return parseElasticsearch(queryObject.body, results);
        } else {
            throw new Error(JSON.stringify(results));
        }
    }));
}

export function elasticsearchMappings(connections) {
    return request('_all/_mappings', connections, {method: 'GET'})
    .then(res => res.json());
}
