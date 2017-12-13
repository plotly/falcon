import webpack from 'webpack';
import baseConfig from './webpack.config.base';
import path from 'path';

const AUTH_ENABLED = process.env.PLOTLY_CONNECTOR_AUTH_ENABLED ?
                     JSON.parse(process.env.PLOTLY_CONNECTOR_AUTH_ENABLED) : true;

const OAUTH2_CLIENT_ID = process.env.PLOTLY_CONNECTOR_OAUTH2_CLIENT_ID ?
    JSON.stringify(process.env.PLOTLY_CONNECTOR_OAUTH2_CLIENT_ID) :
    JSON.stringify('isFcew9naom2f1khSiMeAtzuOvHXHuLwhPsM7oPt');

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
        // detailed discussions on this ticket:
        // https://github.com/plotly/streambed/issues/10436
        new webpack.DefinePlugin({
            'PLOTLY_ENV': {
                'AUTH_ENABLED': AUTH_ENABLED,
                'OAUTH2_CLIENT_ID': OAUTH2_CLIENT_ID
            }
        })
    ],

    target: 'web'
};

export default config;
