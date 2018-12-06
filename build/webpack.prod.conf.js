'use strict'
const path = require('path')
const utils = require('./utils')
// 下面是utils工具配置文件，主要用来处理css类文件的loader
const webpack = require('webpack')
const config = require('../config')
const merge = require('webpack-merge')
// 用merge的方式继承base.conf里面的配置
const baseWebpackConfig = require('./webpack.base.conf')
const CopyWebpackPlugin = require('copy-webpack-plugin')
// copy-webpack-plugin使用来复制文件或者文件夹到指定的目录的
const HtmlWebpackPlugin = require('html-webpack-plugin')
// html-webpack-plugin是生成html文件，可以设置模板
const ExtractTextPlugin = require('extract-text-webpack-plugin')
// extract-text-webpack-plugin这个插件是用来将bundle中的css等文件生成单独的文件，比如我们看到的app.css
const OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
//压缩css代码的，还能去掉extract-text-webpack-plugin插件抽离文件产生的重复代码，因为同一个css可能在多个模块中出现所以会导致重复代码，一般都是配合使用
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
// 如果当前环境变量NODE_ENV的值是testing，则导入 test.env.js配置文，设置env为"testing"
// 如果当前环境变量NODE_ENV的值不是testing，则设置env为"production"
const env = process.env.NODE_ENV === 'testing'
  ? require('../config/test.env')
  : require('../config/prod.env')
// 把当前的配置对象和base.conf基础的配置对象合并
const webpackConfig = merge(baseWebpackConfig, {
  module: {
        // 下面就是把utils配置好的处理各种css类型的配置拿过来，和dev设置一样，就是这里多了个extract: true，此项是自定义项，设置为true表示，生成独立的文件
    rules: utils.styleLoaders({
      sourceMap: config.build.productionSourceMap,
      extract: true,
      usePostCSS: true
    })
  },
  // devtool开发工具，用来生成个sourcemap方便调试，只用于生产环境
  devtool: config.build.productionSourceMap ? config.build.devtool : false,
  output: {
        // 和base.conf中一致，输出文件的路径：config目录下的index.js，path.resolve(__dirname, '../dist')
    path: config.build.assetsRoot,
    // 有区别，输出文件加上的chunkhash
    filename: utils.assetsPath('js/[name].[chunkhash].js'),
    // 非入扣文件配置，异步加载的模块，输出文件加上的chunkhash
    chunkFilename: utils.assetsPath('js/[id].[chunkhash].js')
  },
  plugins: [
    // http://vuejs.github.io/vue-loader/en/workflow/production.html
    new webpack.DefinePlugin({
      'process.env': env// line-21 下面是利用DefinePlugin插件，定义process.env环境变量为env
    }),
    new UglifyJsPlugin({
      uglifyOptions: {
        compress: {
          warnings: false// 禁止压缩时候的警告信息
        }
      },
      sourceMap: config.build.productionSourceMap,// 压缩后生成map文件
      parallel: true
    }),
    // extract css into its own file已经很清楚了就是独立css文件，文件名和hash
    new ExtractTextPlugin({
      filename: utils.assetsPath('css/[name].[contenthash].css'),
      // Setting the following option to `false` will not extract CSS from codesplit chunks.
      // Their CSS will instead be inserted dynamically with style-loader when the codesplit chunk has been loaded by webpack.
      // It's currently set to `true` because we are seeing that sourcemaps are included in the codesplit bundle as well when it's `false`, 
      // increasing file size: https://github.com/vuejs-templates/webpack/issues/1110
      allChunks: true,
    }),
    // Compress extracted CSS. We are using this plugin so that possible
    // duplicated CSS from different components can be deduped.
    new OptimizeCSSPlugin({
      cssProcessorOptions: config.build.productionSourceMap
        ? { safe: true, map: { inline: false } }
        : { safe: true }
    }),
    // generate dist index.html with correct asset hash for caching.
    // you can customize output by editing /index.html
    // see https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: process.env.NODE_ENV === 'testing'
        ? 'index.html'
        : config.build.index,
      template: 'index.html',// 模板是index.html加不加无所谓
      inject: true,// 将js文件注入到body标签的结尾
      minify: {// 压缩html页面
        removeComments: true,// 去掉注释
        collapseWhitespace: true,// 去除无用空格
        removeAttributeQuotes: true// 去除无用的双引号
        // more options:
        // https://github.com/kangax/html-minifier#options-quick-reference
      },
      // necessary to consistently work with multiple chunks via CommonsChunkPlugin
      chunksSortMode: 'dependency'// 可以对页面中引用的chunk进行排序，保证页面的引用顺序
    }),
    // keep module.id stable when vendor modules does not change
    new webpack.HashedModuleIdsPlugin(),
    // enable scope hoisting
    new webpack.optimize.ModuleConcatenationPlugin(),
    // 公共模块插件，便于浏览器缓存，提高程序的运行速度（哪些需要打包进公共模块需要取舍）
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',// 公共模块的名称，对应打包出来的js是vendor.js
      minChunks (module) {
// 存在资源，且以js结尾，且路径在node_node_modules下的都打包进来（这里可以根据项目的时机情况做调整）
        return (
          module.resource &&
          /\.js$/.test(module.resource) &&
          module.resource.indexOf(
            path.join(__dirname, '../node_modules')
          ) === 0
        )
      }
    }),
    // extract webpack runtime and module manifest to its own file in order to
    // prevent vendor hash from being updated whenever app bundle is updated
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      minChunks: Infinity
    }),
    // This instance extracts shared chunks from code splitted chunks and bundles them
    // in a separate chunk, similar to the vendor chunk
    // see: https://webpack.js.org/plugins/commons-chunk-plugin/#extra-async-commons-chunk
    // 把webpack的runtime代码和module manifest代码提取到manifest.js文件中，防止修改了代码但是没有修改第三方库文件导致第三方库文件也打包的问题
    new webpack.optimize.CommonsChunkPlugin({
      name: 'app',
      async: 'vendor-async',
      children: true,
      minChunks: 3
    }),

    // 复制项目中的静态文件，忽略.开头的文件
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../static'),
        to: config.build.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})
// Gzip压缩插件
if (config.build.productionGzip) {// 修改config里面的配置才能开启
  const CompressionWebpackPlugin = require('compression-webpack-plugin')// Gzip插件

  webpackConfig.plugins.push(
    new CompressionWebpackPlugin({
      asset: '[path].gz[query]',
      algorithm: 'gzip',
      test: new RegExp(
        '\\.(' +
        config.build.productionGzipExtensions.join('|') +
        ')$'
      ),
      threshold: 10240,
      minRatio: 0.8
    })
  )
} 
// 模块化分析插件
// 文档好像没有提档说明如何使用，看config/index.js中的注释，npm run build --report 可以看到，或者修改config里面的配置
if (config.build.bundleAnalyzerReport) {// 模块分析，会在127.0.0.1：8080生成模块打包分析结果
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  webpackConfig.plugins.push(new BundleAnalyzerPlugin())
}

module.exports = webpackConfig// 导出所有配置
