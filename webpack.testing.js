const { merge } = require('webpack-merge')
const common = require('./webpack.common')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = merge(common, {
    mode: 'development',
    devServer: {
        static: 'dist',
        historyApiFallback: true,
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { from: 'tests', to: 'tests' },
            ],
        })
    ]
})
