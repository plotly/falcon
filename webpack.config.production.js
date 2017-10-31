import webpack from 'webpack';
import baseConfig from './webpack.config.base';

const config = {
    ...baseConfig,

    devtool: 'source-map',

    entry: './app/index',

    output: {
        ...baseConfig.output,

        publicPath: '../dist/'
    },

    plugins: [
        ...baseConfig.plugins,
        new webpack.DefinePlugin({
            __DEV__: false,
            'process.env.NODE_ENV': JSON.stringify('production')
        })
    ],

    target: 'electron-renderer'
};

export default config;
