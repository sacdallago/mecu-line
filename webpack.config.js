const webpack = require('webpack');
const path = require('path');

module.exports = {
    entry: ['babel-polyfill', path.resolve(__dirname + '/lib/index.js')],
    output: {
        path: __dirname + '/build',
        filename: 'mecu-line.js',
        libraryTarget: 'var',
        library: 'MecuLine'
    },
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                loader: 'babel-loader',
                query: {
                    presets: ["es2016"]
                }
            },
            {
                test: /\.png$/,
                loader: "url-loader",
                query: {
                    mimetype: "image/png"
                }
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({minimize: true})
    ]
};