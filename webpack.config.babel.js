'use strict';

import path from 'path';
import webpack from 'webpack';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import SpritesmithPlugin from 'webpack-spritesmith';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import HtmlWebpackHarddiskPlugin from 'html-webpack-harddisk-plugin';
import gulpConfig from './config/gulp.config';
import yargs from 'yargs';
import autoprefixer from 'autoprefixer';
import glob from 'glob';
import yamlFront from 'yaml-front-matter';
import utils from './tools/utils';

function Myplugin(options) {}
Myplugin.prototype.apply = function(compiler) {
    let self = this;
    compiler.plugin('compilation', function(compilation) {
        compilation.plugin('html-webpack-plugin-before-html-generation', function(htmlPluginData, callback) {
            let config = htmlPluginData.plugin.options;
            let results = yamlFront.loadFront(config.filePath);
            config = utils.extend(config, results);
            callback(null);
        });
    });
};

//  获取环境命令参数
const argv = yargs.argv;
//  判断命令参数-p
const ENV_FLAG = argv.p || false;
//  端口号
const PORT = 9996;
//  文件路径
const ASSETS_PATH = gulpConfig.ASSETS_PATH;
//  html模板路径
const pageFiles = glob.sync(ASSETS_PATH.pages + '/**/*.html');
//  入口文件
let W_ENTRIES = {};
//  webpack 插件
let W_PLUGINS = [];
//  文件hash的长度
const HASH_LENGTH = (hash) => {
    return ENV_FLAG ? ('?[' + hash + ':9]') : '';
};
//  发布路径 如:http://s.xiexie.com
let PUBLIC_PATH,
    //  打包完成后目标路径
    BUILD_PATH;

//  生产环境用的插件
let PUBLIC_PLUGINS = [
    new webpack.optimize.DedupePlugin(),
    new webpack.NoErrorsPlugin(),
    new webpack.optimize.UglifyJsPlugin({
        compress: {
            warnings: false,
            drop_console: true
        }
    })
];
//  雪碧图配置
let spritesmithOpts = (FOLDER) => ({
    src: {
        cwd: path.resolve(__dirname, ASSETS_PATH.src),
        glob: 'images/' + FOLDER + '/*.png'
    },
    target: {
        image: path.resolve(__dirname, ASSETS_PATH.images, 'sprites/' + FOLDER + '.png'),
        css: [
            [path.resolve(__dirname, ASSETS_PATH.sprites, FOLDER + '-sprites.scss'), {
                spritesheetName: FOLDER,
                format: 'scss'
            }]
        ]
    },
    apiOptions: {
        //  图标的命名方式 文件夹-文件名称 "FOLDER-fileName"
        //  如果有文件名以"-hover" 增加"FOLDER-fileName:hover"
        generateSpriteName: (fileName) => {
            let parsed = path.parse(fileName);
            let dir = parsed.dir.split(path.sep);
            let moduleName = dir[dir.length - 1];
            let NAME = '';
            NAME = FOLDER + '-' + parsed.name.replace(/(-hover)$/g, function(reg, contents, index, string) {
                return ':hover,.' + FOLDER + '-' + string;
            });
            return NAME;
        },
        cssImageRef: '~sprites/' + FOLDER + '.png',
    }
    // retina: '@2x'
});


//  公共js文件
W_ENTRIES.vendors = ['jquery'];

if (ENV_FLAG) {
    PUBLIC_PATH = 'http://s.xiexie.com/statics/';
    BUILD_PATH = path.join(__dirname, ASSETS_PATH.statics);
    W_PLUGINS = W_PLUGINS.concat(PUBLIC_PLUGINS);
} else {
    W_PLUGINS.push(new Myplugin());
    W_PLUGINS.push(new HtmlWebpackHarddiskPlugin());
    PUBLIC_PATH = '/';
    BUILD_PATH = path.join(__dirname, ASSETS_PATH.dist);
    if (argv.d) {
        W_PLUGINS = W_PLUGINS.concat(PUBLIC_PLUGINS);
    }
}


pageFiles.forEach((item) => {

    let config = {
            title:'驾车宝',
            inject: false,
            template: item,
            // filename: path.join(__dirname, ASSETS_PATH.dist, item.replace('src/', '')),
            filePath: item
        },
        results = yamlFront.loadFront(item);

    if (results.entry && typeof results.entry === 'string') {
        let entry = results.entry.replace('.js', '');
        //  当前文件加载的入口文件
        config.chunks = ['vendors', entry];
        //  入口文件
        W_ENTRIES[entry] = [path.join(__dirname, 'src/scripts', results.entry)];
    } else {
        config.chunks = [];
    }

    config.filename = path.join(item.replace('src/', ''));
    if (argv.dev) {
        //  webpack-dev-server 热替换
        config.devServer = 'http://localhost:9996';
        //  webpack-dev-server 生成html
        config.alwaysWriteToDisk = true;
        //  开发环境输出html的路径
        config.filename = path.join(__dirname, ASSETS_PATH.dist, config.filename);
    }

    if (results.ext) {
        //自定义文件后缀名
        config.filename = config.filename.split('.')[0] + '.' + results.ext;
    }

    //  压缩html
    if (ENV_FLAG) {
        config.minify = {
            collapseWhitespace: true,
            minifyCSS: true,
            minifyJS: true,
            quoteCharacter: '"',
            removeComments: true,
            removeScriptTypeAttributes: true,
            ignoreCustomFragments: [/<\/?\s*\w+:\w+[\s\S]*?>/gm]
        };
    }

    W_PLUGINS.push(new HtmlWebpackPlugin(config));

});



W_PLUGINS.push(
    new SpritesmithPlugin(spritesmithOpts('icon')),
    // new SpritesmithPlugin(spritesmithOpts('ico1')),
    new ExtractTextPlugin('styles/[name].css' + HASH_LENGTH('contenthash')),
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendors',
        filename: 'scripts/vendors.js' + HASH_LENGTH('chunkhash'),
        minChunks: 20
    }),
    new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery'
    }),
    new webpack.DefinePlugin({
        __DEV__: !!!(ENV_FLAG),
        __PRO__: !!(ENV_FLAG)
    })
);



export default {
    entry: W_ENTRIES,

    output: {
        path: BUILD_PATH,
        filename: 'scripts/[name].js' + HASH_LENGTH('chunkhash'),
        chunkFilename: 'scripts/[name].bundle.js' + HASH_LENGTH('chunkhash'),
        publicPath: PUBLIC_PATH //没把握的时候尽量不要设置这个变量！！！！！！！！
    },

    postcss: function() {
        return [
            autoprefixer({
                browsers: ['> 0%']
            })
        ];
    },

    module: {
        loaders: [{
            test: /\.(png|jpe?g|gif)$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'url-loader?limit=92&name=[path][name].[ext]' + HASH_LENGTH('hash') + '&context=./src',
            include: path.resolve(__dirname, ASSETS_PATH.images)
        }, {
            test: /\.(scss)$/,
            exclude: /(node_modules|bower_components)/,
            loader: ExtractTextPlugin.extract('style-loader', 'css-loader!postcss-loader!sass-loader'),
            include: path.resolve(__dirname, 'src')
        }, {
            test: /\.html$/,
            loader: 'ejs!swig'
                // include: path.resolve(__dirname, ASSETS_PATH.html)

        }, {
            test: path.join(__dirname, 'libs/jquery.min'),
            exclude: /(node_modules|bower_components)/,
            loader: 'expose?jQuery'
        }, {
            test: /\.(js|jsx)$/,
            exclude: /(node_modules|bower_components)/,
            loader: 'babel',
            query: {
                presets: ['es2015'],
            }
        }, {
            test: /\.tpl$/,
            loader: 'tmod',
            query: {
                // 编译输出目录设置
                output: './build',

                // 设置输出的运行时路径
                runtime: 'libs/template.js',

                // 定义模板采用哪种语法，内置可选：
                // simple: 默认语法，易于读写。可参看语法文档
                // native: 功能丰富，灵活多变。语法类似微型模板引擎 tmpl
                syntax: 'simple',

                // 模板文件后缀
                suffix: '.tpl'
            },
            exclude: /(node_modules|bower_components)/,
            include: path.resolve(__dirname, ASSETS_PATH.tpl)
        }]
    },


    resolve: {
        extensions: ['', '.js', '.scss', '.css', '.jpg', '.png', '.gif', '.tpl', '.es6', '.html'],
        modulesDirectories: ['node_modules', 'src/images'],
        root: [path.join(__dirname, 'src'), path.join(__dirname, 'node_modules')],
        alias: {
            tools: path.join(__dirname, 'tools'),
            libs: path.join(__dirname, 'libs'),
            jquery: path.join(__dirname, 'libs/jquery.min.js'),
            sass: path.join(__dirname, ASSETS_PATH.sass),
            styles: path.join(__dirname, ASSETS_PATH.styles),
            common: path.join(__dirname, ASSETS_PATH.scripts, 'common'),
            html: path.join(__dirname, ASSETS_PATH.pages),
            scripts: path.join(__dirname, ASSETS_PATH.scripts),
            partial: path.join(__dirname, ASSETS_PATH.partial)
        }
    },

    sassLoader: {
        //  import 路径
        includePaths: [
            path.resolve(__dirname, ASSETS_PATH.sass),
        ],
        //  注释
        sourceComments: true,
        //  小数点后几位数
        precision: 1,
        //  输出格式 nested, expanded, compact, compressed
        outputStyle: 'nested',
        indentWidth: 4,
        // indentedSyntax: 'sass'
    },

    devServer: {
        port: PORT,
        contentBase: ASSETS_PATH.dist
    },

    plugins: W_PLUGINS
};
