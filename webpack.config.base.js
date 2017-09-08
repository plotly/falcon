import path from 'path';

var HappyPack = require('happypack');

export default {
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['happypack/loader?id=jsx'],
            exclude: /node_modules/,
            options: {
                cacheDirectory: true
            }
        }, {
            test: /\.json$/,
            loader: 'json-loader'
        }]
    },
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        extensions: ['', '.js', '.jsx'],
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
        new HappyPack({
            // loaders is the only required parameter:
            id: 'jsx',
            loaders: [ 'babel-loader' ],
            verbose: true,
            debug: true
            // More configuration @ https://github.com/amireh/happypack
        })
    ],
    externals: [
        {
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
