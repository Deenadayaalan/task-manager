// webpack.optimization.js
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: process.env.NODE_ENV === 'production',
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info']
          },
          mangle: true,
          format: {
            comments: false
          }
        },
        extractComments: false
      })
    ],
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
          priority: 10
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          priority: 5,
          reuseExistingChunk: true
        },
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20
        },
        aws: {
          test: /[\\/]node_modules[\\/](@aws-sdk|aws-sdk)[\\/]/,
          name: 'aws',
          chunks: 'all',
          priority: 15
        }
      }
    },
    runtimeChunk: {
      name: 'runtime'
    }
  },
  plugins: [
    new CompressionPlugin({
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 8192,
      minRatio: 0.8
    }),
    ...(process.env.ANALYZE_BUNDLE ? [new BundleAnalyzerPlugin()] : [])
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react-dom$': 'react-dom/profiling',
      'scheduler/tracing': 'scheduler/tracing-profiling'
    }
  }
};