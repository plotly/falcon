import path from 'path';

export default {
    module: {
        rules: [{
            test: /\.jsx?$/,
            use: [{
                loader: 'babel-loader'
            }],
            exclude: /node_modules/
        }, {
            test: /\.json$/,
            use: [{
                loader: 'json-loader'
            }]
        }]
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        extensions: ['.js', '.jsx'],

        // I'm not sure about this option
        packageMains: [
            'webpack',
            'browser',
            'web',
            'browserify',
            ['jam', 'main'],
            'main'
        ]
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
            'electron-sudo': 'commonjs electron-sudo',
            'csv-parse': 'commonjs csv-parse'
        }
    ]
};
