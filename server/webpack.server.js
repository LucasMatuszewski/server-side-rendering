const path = require('path');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.js');
const webpackNodeExternals = require('webpack-node-externals');

const config = {
  // Inform Webpack that we're building a bundle for Node.js rather than for the browser
  target: 'node',

  // Tell webpack the root file of our server app (entry point)
  entry: './src/index.js',

  // Tell webpack where to put the generated output file
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'build')
  },

  // Tell webpack to not add to a bundle any external files from node_modules:
  externals: [webpackNodeExternals()]
};

module.exports = merge(baseConfig, config);
