import {
    PlotlyAPIRequest
} from '../../backend/persistent/PlotlyAPI.js';
import {dissoc} from 'ramda';

export const names = [
    'country', 'month', 'year', 'lat', 'lon', 'value'
];
export const columns = [
    ['a', 'b', 'c'],    // 'country'
    [1, 2, 3],          // 'month'
    [4, 5, 6],          // 'year'
    [7, 8, 9],           // 'lat'
    [10, 11, 12],       // 'lon'
    [13, 14, 15]        // 'value'

];

export function createGrid(filename) {
    const cols = {};
    names.forEach((name, i) => {
        cols[name] = {'data': columns[i], order: i};
    });
    const grid = {cols};
    return PlotlyAPIRequest('grids', {
        data: grid,
        world_readable: true,
        parent: -1,
        filename: `${filename} - ${Math.random().toString(36).substr(2, 5)}`
    });

}

export const credentials = {
    'username': 'masteruser',
    'password': 'connecttoplotly',
    'database': 'plotly_datasets',
    'port': 5432,
    'host': 'readonly-test-postgres.cwwxgcilxwxw.us-west-2.rds.amazonaws.com',
    'dialect': 'postgres'
};

export const configuration = dissoc('password', credentials);
