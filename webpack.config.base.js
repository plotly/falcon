import path from 'path';

export default {
    module: {
        noParse: [/alasql/],
        rules: [{
            test: /\.jsx?$/,
            use: [{
                loader: 'babel-loader'
            }],
            exclude: /node_modules/
        }, {
            test: /\.css$/,
            use: [{
                loader: 'style-loader'
            }, {
                loader: 'css-loader'
            }]
        }]
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        extensions: ['.js', '.jsx']
    },
    plugins: [
    ],
    externals: [
        {
            'csv-parse': 'commonjs csv-parse',
            'data-urls': 'commonjs data-urls',
            'font-awesome': 'font-awesome',
            'ibm_db': 'commonjs ibm_db',
            'mysql': 'mysql',
            'oracledb': 'commonjs oracledb',
            'pg': 'pg',
            'pg-hstore': 'pg-hstore',
            'restify': 'commonjs restify',
            'sequelize': 'commonjs sequelize',
            'source-map-support': 'source-map-support',
            'sqlite3': 'sqlite3',
            'tedious': 'tedious',
            'whatwg-encoding': 'commonjs whatwg-encoding'
        }
    ]
};
