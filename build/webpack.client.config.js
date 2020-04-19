const path = require('path')
const resovePath = (pathStr) => path.resolve(__dirname, pathStr)

module.exports = {
  mode: 'development',
  entry: {
    index: ['react-hot-loader/patch', resovePath('../src/client/app/index.js')]
  },
  output: {
    filename: '[name].js',
    path: resovePath('../dist'),
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
        use: ['style-loader', {
          loader: 'css-loader',
          options: {
            modules: true
          }
        }]
      }
    ]
  }
}
