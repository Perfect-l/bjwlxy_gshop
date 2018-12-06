'use strict'
// 引入当前目录中的utils工具配置文件
// 请自行查看我博客中的utils.js的相关文章
const utils = require('./utils')
// 引入webpack来使用webpack内置插件
const webpack = require('webpack')
// 引入config目录中的index.js配置文件
const config = require('../config')
// 引入webpack-merge插件用来合并webpack配置对象，也就是说可以把webpack配置文件拆分成几个小的模块，然后合并
const merge = require('webpack-merge')
// 引入当前目录下的webpack.base.conf.js配置文件，主要配置的是打包各种文件类型的配置
const path = require('path')
const baseWebpackConfig = require('./webpack.base.conf')
// 下面是一个自动生成html的插件，能够把资源自动加载到html文件中
const CopyWebpackPlugin = require('copy-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
// 下面这个插件是用来把webpack的错误和日志收集起来，漂亮的展示给用户
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const portfinder = require('portfinder')//获取port

const HOST = process.env.HOST//process.env属性返回一个对象，包含了当前shell的所有环境变量。这句取其中的host文件？
const PORT = process.env.PORT && Number(process.env.PORT)//获取所有环境变量下的端口？
//合并模块，第一个参数是webpack基本配置文件webpack.base.conf.js中的配置
const devWebpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: config.dev.cssSourceMap, usePostCSS: true })//创建模块时匹配请求的规则数组,这里调用了utils中的配置模板styleLoaders
  },
  // cheap-module-eval-source-map is faster for development
  devtool: config.dev.devtool,//debtool是开发工具选项，用来指定如何生成sourcemap文件，cheap-module-eval-source-map此款soucemap文件性价比最高

  // these devServer options should be customized in /config/index.js
  devServer: {//webpack服务器配置
    clientLogLevel: 'warning',//使用内联模式时，在开发工具的控制台将显示消息，可取的值有none error warning info
    historyApiFallback: {//当使用h5 history api时，任意的404响应都可能需要被替代为index.html，通过historyApiFallback：true控制；通过传入一个对象，比如使用rewrites这个选项进一步控制
      rewrites: [
        { from: /.*/, to: path.posix.join(config.dev.assetsPublicPath, 'index.html') },
      ],
    },
    hot: true,//是否启用webpack的模块热替换特性。这个功能主要是用于开发过程中，对生产环境无帮助。效果上就是界面无刷新更新。
    contentBase: false, // since we use CopyWebpackPlugin.这里禁用了该功能。本来是告诉服务器从哪里提供内容，一半是本地静态资源。
    compress: true,//一切服务是否都启用gzip压缩
    host: HOST || config.dev.host,//指定一个host,默认是localhost。如果有全局host就用全局，否则就用index.js中的设置。
    port: PORT || config.dev.port,//指定端口
    open: config.dev.autoOpenBrowser,//是否在浏览器开启本dev server
    overlay: config.dev.errorOverlay//当有编译器错误时，是否在浏览器中显示全屏覆盖。
      ? { warnings: false, errors: true }
      : false,
    publicPath: config.dev.assetsPublicPath,//此路径下的打包文件可在浏览器中访问
    proxy: config.dev.proxyTable,//如果你有单独的后端开发服务器api,并且希望在同域名下发送api请求，那么代理某些URL会很有用。
    quiet: true, // necessary for FriendlyErrorsPlugin  启用 quiet 后，除了初始启动信息之外的任何内容都不会被打印到控制台。这也意味着来自 webpack 的错误或警告在控制台不可见。
    watchOptions: {//webpack 使用文件系统(file system)获取文件改动的通知。在某些情况下，不会正常工作。例如，当使用 Network File System (NFS) 时。Vagrant 也有很多问题。在这些情况下使用轮询。
      poll: config.dev.poll,//是否使用轮询
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env': require('../config/dev.env')
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NamedModulesPlugin(), // HMR shows correct file names in console on update.
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({//模块HtmlWebpackPlugin
      filename: 'index.html',//生成的文件的名称
      template: 'index.html',//可以指定模块html文件
      inject: true
    }),
    // copy custom static assets
    new CopyWebpackPlugin([//模块CopyWebpackPlugin  将单个文件或整个文件复制到构建目录
      {
        from: path.resolve(__dirname, '../static'),//将static文件夹及其子文件复制到
        to: config.dev.assetsSubDirectory,
        ignore: ['.*']
      }
    ])
  ]
})
//webpack将运行由配置文件导出的函数，并且等待promise返回，便于需要异步地加载所需的配置变量。
module.exports = new Promise((resolve, reject) => {
  portfinder.basePort = process.env.PORT || config.dev.port
  portfinder.getPort((err, port) => {
    if (err) {
      reject(err)
    } else {
      // publish the new Port, necessary for e2e tests
      process.env.PORT = port
      // add port to devServer config
      devWebpackConfig.devServer.port = port

      // Add FriendlyErrorsPlugin
      devWebpackConfig.plugins.push(new FriendlyErrorsPlugin({//出错友好处理插件
        compilationSuccessInfo: {//build成功的话会执行者块
          messages: [`Your application is running here: http://${devWebpackConfig.devServer.host}:${port}`],
        },
        onErrors: config.dev.notifyOnErrors//如果出错就执行这块,其实是utils里面配置好的提示信息
        ? utils.createNotifierCallback()
        : undefined
      }))

      resolve(devWebpackConfig)
    }
  })
})
