import queryString from 'query-string';
import fetch from 'isomorphic-fetch';

const params = queryString.parse(location.hash);
const {access_token} = params;

fetch('/save-oauth')
