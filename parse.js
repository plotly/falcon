export default function(data){

    var nrows = data.length;

    if (nrows === undefined || nrows === null){
        keys = ['message'];
        nrows = 1;
        ncols = 1;
        rows = [['command executed']];
    }else{
        var rows = [];
        var ncols = Object.keys(data[0]).length;
        var keys = Object.keys(data[0]);

        for (var i = 0; i < nrows; i++) {
            var row = [];
            for (var j = 0; j < ncols; j++) {
                row.push(data[i][keys[j]]);
            };
            rows.push(row);
        };
    };
    const data_formatted = { 'columnnames': keys, 'ncols': ncols, 'nrows': nrows, 'rows': rows };

    return data_formatted;
};
