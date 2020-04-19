const path = require('path');
const nodeExternals = require('webpack-node-externals');

process.env.BABEL_ENV = 'node';
const resolvePath = (pathStr) => path.resolve(__dirname, pathStr);

module.exports = {
  mode: 'development',
  target: 'node',
  externals: [nodeExternals()],
  entry: resolvePath('../src/server/index.js'),
  output: {
    filename: 'bundle.js',
    path: resolvePath('../dist'),
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css?$/,
        use: ['isomorphic-style-loader', {
          loader: 'css-loader',
          options: {
            modules: true
          }
        }]
      }
    ]
  },
}
