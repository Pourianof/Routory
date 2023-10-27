// Generated using webpack-cli https://github.com/webpack/webpack-cli
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
var DeclarationBundlerPlugin = require('types-webpack-bundler');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');

const isProduction = process.env.NODE_ENV == 'production';
const config = {
  entry: { routory: path.join(__dirname, '..', 'src', 'routory.ts') },
  output: {
    library: 'routory',
    chunkFilename: '[name].js',
    filename: '[name].js',
    path: path.join(__dirname, '..', 'dist'),
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [{ from: '../src/package.json', to: './package.json' }],
    }),
    new DeclarationBundlerPlugin({
      moduleName: 'routory',
      out: './@types/index.d.ts',
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: 'ts-loader',
        exclude: ['/node_modules/'],
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg|gif)$/i,
        type: 'asset',
      },

      // Add your rules for custom modules here
      // Learn more about loaders from https://webpack.js.org/loaders/
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '...'],
  },
};

module.exports = () => {
  if (isProduction) {
    config.mode = 'production';
  } else {
    config.mode = 'development';
  }
  return config;
};
