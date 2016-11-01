import webpack from 'webpack';
import baseConfig from './webpack.config.base';
import {merge} from 'ramda';

export default {
    ...baseConfig,

    devtool: 'source-map',

    entry: './backend/headlessServer.js',

    output: {
        path: __dirname,
        filename: './backend/headlessBundle.js'
    },

    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            compressor: {
                warnings: false
            }
        }),
        new webpack.BannerPlugin(
            'require("source-map-support").install();',
            { raw: true, entryOnly: false }
        ),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        // https://github.com/felixge/node-formidable/issues/337
        new webpack.DefinePlugin({ 'global.GENTLY': false })
    ],

    target: 'node',

    node: {
        // https://github.com/automation-stack/electron-sudo#usage-with-webpack
        __dirname: false,
        __filename: false
    },

    externals: [
        merge(
        ...baseConfig.externals,
        {'font-awesome': 'font-awesome',
        'source-map-support': 'source-map-support'}
        )
    ]
};
