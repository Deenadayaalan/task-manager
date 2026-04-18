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
      port: 3000,
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
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new ModuleFederationPlugin({
        name: 'shell',
        filename: 'remoteEntry.js',
        remotes: {
          taskMfe: isProduction 
            ? 'taskMfe@https://task-mfe.your-domain.com/remoteEntry.js'
            : 'taskMfe@http://localhost:3001/remoteEntry.js',
          dashboardMfe: isProduction
            ? 'dashboardMfe@https://dashboard-mfe.your-domain.com/remoteEntry.js'
            : 'dashboardMfe@http://localhost:3002/remoteEntry.js',
          authMfe: isProduction
            ? 'authMfe@https://auth-mfe.your-domain.com/remoteEntry.js'
            : 'authMfe@http://localhost:3003/remoteEntry.js',
        },
        exposes: {
          './App': './src/App',
          './store': './src/store/store',
          './hooks': './src/hooks/index',
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
            requiredVersion: packageJson.dependencies['react-router-dom'],
          },
          '@reduxjs/toolkit': {
            singleton: true,
            requiredVersion: packageJson.dependencies['@reduxjs/toolkit'],
          },
          'react-redux': {
            singleton: true,
            requiredVersion: packageJson.dependencies['react-redux'],
          },
        },
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.ico',
      }),
    ],
    optimization: {
      splitChunks: false,
    },
  };
};