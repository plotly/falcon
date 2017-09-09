import webpack from 'webpack';
import baseConfig from './webpack.config.base';
import {merge} from 'ramda';

const config = {
    ...baseConfig,

    devtool: 'source-map',

    entry: './app/index',

    output: {
        ...baseConfig.output,

        publicPath: '../dist/'
    },

    module: {
        ...baseConfig.module,

        loaders: [
            ...baseConfig.module.rules,
        ]
    },

    plugins: [
        ...baseConfig.plugins,
        new webpack.DefinePlugin({
            __DEV__: false,
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                screw_ie8: true,
                warnings: false
            }
        }),
    ],

    target: 'electron-renderer'
};

export default config;
