const ModuleFederationPlugin = require('@module-federation/webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const packageJson = require('./package.json');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    mode: argv.mode || 'development',
    entry: './src/index.js',
    target: 'web',
    devServer: {
      port: 3001,
      historyApiFallback: true,
      hot: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
    },
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader', 'postcss-loader'],
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'taskMfe',
        filename: 'remoteEntry.js',
        exposes: {
          './TaskList': './src/components/TaskList',
          './TaskForm': './src/components/TaskForm',
          './TaskDetail': './src/components/TaskDetail',
          './TaskBoard': './src/components/TaskBoard',
        },
        remotes: {
          shell: isProduction
            ? 'shell@https://shell.your-domain.com/remoteEntry.js'
            : 'shell@http://localhost:3000/remoteEntry.js',
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: packageJson.dependencies.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: packageJson.dependencies['react-dom'],
          },
          'react-router-dom': {
            singleton: true,
          },
          '@reduxjs/toolkit': {
            singleton: true,
          },
          'react-redux': {
            singleton: true,
          },
        },
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
    ],
    optimization: {
      splitChunks: false,
    },
  };
};