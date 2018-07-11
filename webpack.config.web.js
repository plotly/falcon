import webpack from 'webpack';
import baseConfig from './webpack.config.base';
import path from 'path';

const config = {
    ...baseConfig,

    devtool: 'source-map',

    entry: {
        'web': './app/index'
    },

    output: {
        ...baseConfig.output,
        path: path.join(__dirname, 'static'),
        filename: '[name]-bundle.min.js',
        libraryTarget: 'var'
    },

    plugins: [
        ...baseConfig.plugins,
        // This is to get `prettycron` to work in 'browser'. See this issue:
        // https://github.com/bunkat/later/issues/155 for details.
        new webpack.DefinePlugin({ 'process.env.LATER_COV': false }),
        new webpack.DefinePlugin({
            __DEV__: false,
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    ],

    target: 'web'
};

export default config;
