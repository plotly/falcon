import webpack from 'webpack';
import baseConfig from './webpack.config.base';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

export default {
    ...baseConfig,

    devtool: 'source-map',

    entry: './backend/headless.development.js',

    output: {
        path: __dirname,
        filename: './dist/headless-bundle.js'
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
            'process.env.NODE_ENV': JSON.stringify('production')
        }),
        // https://github.com/felixge/node-formidable/issues/337
        new webpack.DefinePlugin({ 'global.GENTLY': false })
    ],

    target: 'electron',

    node: {
        __dirname: false,
        __filename: false
    }
};
