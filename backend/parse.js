export default function (data) {
    let keys;
    let ncols;
    let rows;

    let nrows = data.length;

    // repsonse is 'command executed' if database callback is empty
    if (typeof nrows === 'undefined' || nrows === null) {
        keys = ['message'];
        nrows = 1;
        ncols = 1;
        rows = [['command executed']];
    } else {
        rows = [];
        ncols = Object.keys(data[0]).length;
        keys = Object.keys(data[0]);

        for (let i = 0; i < nrows; i++) {
            const row = [];
            for (let j = 0; j < ncols; j++) {
                row.push(data[i][keys[j]]);
            }
            rows.push(row);
        }
    }
    return { columnnames: keys, ncols, nrows, rows };
}
