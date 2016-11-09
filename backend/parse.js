export function parseSQL(data) {
/*
        data is in the format

        [
            {
                firstColumn: 1,
                secondColumn: 1,
                thirdColumn: "one"
            },
            {
                firstColumn: 2,
                secondColumn: 2,
                thirdColumn: "two"
            },
            ...
        ]
    */
    if (data.length === 0) {
        return {
            columnnames: [],
            rows: [[]],
            nrows: 0,
            ncols: 0
        };
    }

    // get column names of the first object (repeated for all objects)
    const columnnames = Object.keys(data[0]);
    const ncols = columnnames.length;
    const nrows = data.length;

    // iterate over each object (each object becomes a row)
    // returns: a row of rows (table)
    const rows = data.map(row =>
        Object.keys(row).map(
            columnname => row[columnname]
        )
    );

    // plotly workspace requires keys (columnnames, ncols, nrows, rows)
    // and they should be in this format
    return {columnnames, ncols, nrows, rows};
}


export function parseElasticsearch(data) {

    /*
    recieves data as
    [
        {
            _index: 'indexName',
            _type: 'documentName',
            _id: '1234',
            _score: 1,
            _source:
                {
                    columnName1: 'blah',
                    columnName2: 'fiz',
                    columnName3: 'baz'
                }
        },
        {
            _index: 'indexName',
            _type: 'documentName',
            _id: '1235',
            _score: 1,
            _source:
                {
                    columnName1: 'beep',
                    columnName2: 'foo',
                    columnName3: 'bar'
                }
        }
    ]

    */

    const columnnames = Object.keys(data[0]._source);
    const ncols = columnnames.length;
    const nrows = data.length;

    const table = data.map((obj) => {
        // get the value for each column => put them into an array
        // returns: a row
        return Object.keys(obj._source).map((columnname) => {
            // returns: a column's values
            return obj._source[columnname];
        });
    });

    return {columnnames, ncols, nrows, rows: table};
}
