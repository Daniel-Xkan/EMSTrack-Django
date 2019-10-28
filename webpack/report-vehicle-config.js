var path = require('path');
var webpack = require('webpack');
var BundleTracker = require('webpack-bundle-tracker');

module.exports = {
    context: __dirname,
    entry: '../static/js/report-vehicle',
    mode: 'development',
    output: {
        path: path.resolve('./static/bundles/report-vehicle'),
        filename: "[name]-[hash].js"
    },
    node: {
        fs: "empty"
    },

    plugins: [
        new BundleTracker({filename: './webpack/report-vehicle-stats.json'})
    ],
    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader'],
            },
            {
                test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2)$/,
                loader: 'url-loader',
                options: {
                    limit: 10000,
                },
            },
        ],
    },
};
