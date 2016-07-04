import path from 'path';

export default {
    module: {
        loaders: [{
            test: /\.jsx?$/,
            loaders: ['babel-loader'],
            exclude: /node_modules/
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
        packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']
    },
    plugins: [

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
        'tedious': 'tedious'
        }
    ]
};
