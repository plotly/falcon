import path from 'path';

export default {
    module: {
        rules: [{
            test: /\.jsx?$/,
            use: [{
                loader: 'babel-loader'
            }],
            exclude: /node_modules/
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
            'ibm_db': 'commonjs ibm_db',
            'mysql': 'mysql',
            'pg': 'pg',
            'pg-native': 'pg-native',
            'pg-hstore': 'pg-hstore',
            'sqlite3': 'sqlite3',
            'restify': 'commonjs restify',
            'sequelize': 'commonjs sequelize',
            'bunyan': 'commonjs bunyan',
            'tedious': 'tedious',
            'csv-parse': 'commonjs csv-parse'
        }
    ]
};
