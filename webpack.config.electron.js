import webpack from 'webpack';
import baseConfig from './webpack.config.base';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

export default {
    ...baseConfig,

    devtool: 'source-map',

    entry: './backend/main.development',

    output: {
        path: __dirname,
        filename: './backend/main.js'
    },

    plugins: [
        ...baseConfig.plugins,

        new UglifyJsPlugin({
            sourceMap: false
        }),
        new webpack.BannerPlugin(
            {banner: 'require("source-map-support").install();',
             raw: true, entryOnly: false }
        ),
        new webpack.DefinePlugin({
            __DEV__: false,
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        // https://github.com/felixge/node-formidable/issues/337
        new webpack.DefinePlugin({ 'global.GENTLY': false }),

        new webpack.LoaderOptionsPlugin({
            minimize: true
        })
    ],

    target: 'electron-main',

    node: {
        __dirname: false,
        __filename: false
    }
};
