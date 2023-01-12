const path = require('path')

module.exports = {
  entry: {
    main: './src/index.js',
    tests: './tests/index.js'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'production',
  optimization: {
    minimize: true
  }
}
