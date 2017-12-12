import webpack from 'webpack';
import baseConfig from './webpack.config.base';
import path from 'path';

const AUTH_ENABLED = (process.env.PLOTLY_CONNECTOR_AUTH_ENABLED !== 'undefined' ?
                      JSON.parse(process.env.PLOTLY_CONNECTOR_AUTH_ENABLED): true);

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
        new webpack.DefinePlugin({
            __DEV__: false,
            'process.env.NODE_ENV': JSON.stringify('production')
        }),

        // This is used to pass environment variables to frontend
        new webpack.DefinePlugin({
            'PLOTLY_ENV': {
                'AUTH_ENABLED': AUTH_ENABLED
            }
        })
    ],

    target: 'web'
};

export default config;
