const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  entry: './src/index.ts', // 入口文件路径，假设是 TypeScript 文件
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'canvas-labeler.min.js', // 输出文件名
    library: 'CanvasLabeler', // UMD 模块的名称
    libraryTarget: 'umd', // UMD 模块的格式
    umdNamedDefine: true, // 使用命名的 AMD 模块
  },
  resolve: {
    extensions: ['.ts', '.js'], // 告诉 webpack 解析 TypeScript 文件
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'ts-loader', // 使用 ts-loader 来编译 TypeScript 文件
        },
      },
    ],
  },
  optimization: {
    minimizer: [new TerserPlugin()], // 使用 TerserPlugin 来压缩代码
  },
};
