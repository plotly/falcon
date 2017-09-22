import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import baseConfig from './webpack.config.base';
import path from 'path';

const config = {
    ...baseConfig,

    devtool: 'source-map',

    entry: {
        'web': './app/index',
        'oauth': './app/oauth/index',
        'login': './app/login/index'
    },

    output: {
        ...baseConfig.output,
        path: path.join(__dirname, 'static'),
        filename: '[name]-bundle.min.js',
        libraryTarget: 'var'
    },

    plugins: [
        ...baseConfig.plugins,
        new webpack.DefinePlugin({
            __DEV__: false,
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
    ],

    target: 'web'
};

export default config;
