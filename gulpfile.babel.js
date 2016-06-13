'use strict';

import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import path from 'path';
import yargs from 'yargs';
import config from './config/gulp.config';
// import webpackConfig from './webpack.config.babel';
// import webpack from 'webpack';


const ASSETS_PATH = config.ASSETS_PATH;

const argv = yargs.argv;

const G_PLUGINS = gulpLoadPlugins();

const build = argv.build || false;

const swigOpts = {

    defaults: {
        cache: false,
        locals: {
            title: '<!-- 默认在gulp里面配置 --> 全局title!!!'
        }
    },

    setup: (swig) => {
        //  swig helper
        swig.setFilter('formaturl', str => str);
        swig.setFilter('youfunction', str => str);
        swig.setFilter('myfunction', str => str);
    }
};

let gulpData = (file) => {
        file.data.path = file.path;
    },
    isJsp = (file) => ((file.data.extname || 'jsp') === 'jsp');

G_PLUGINS.del = require('del');

gulp.task('swig', () => {

    return gulp.src([ASSETS_PATH.pages + '/**/*.*', '!' + ASSETS_PATH.pages + '/_*.html'])
        .pipe(G_PLUGINS.frontMatter({
            property: 'data'
        }))
        .pipe(G_PLUGINS.swig(swigOpts))
        .pipe(G_PLUGINS.if(isJsp, G_PLUGINS.extname('.jsp')))
        .pipe(gulp.dest(ASSETS_PATH.html))
        .pipe(G_PLUGINS.data(gulpData))
        //  输出 pages页面的数据
        .pipe(G_PLUGINS.pluck('data', 'site-data.json'))
        //  搜集 pages页面的数据
        .pipe(G_PLUGINS.data((file) => {

            file.contents = new Buffer(JSON.stringify(file.data));
        }))
        //  美化输出json
        .pipe(G_PLUGINS.beautify())
        .pipe(gulp.dest(ASSETS_PATH.data));
});


// gulp.task('webpack-build', (callback) => {

//     webpack(webpackConfig, (err, stats) => {
//         if (err) {
//             throw new G_PLUGINS.util.PluginError('webpack:build', err);
//         }
//         callback();
//     });

// });

gulp.task('del', () => {
    return G_PLUGINS.del([
        ASSETS_PATH.dist,
        ASSETS_PATH.html
    ]);
});

gulp.task('del-pro', () => {
    return G_PLUGINS.del([
        ASSETS_PATH.dist,
        ASSETS_PATH.statics,
        ASSETS_PATH.html,
        ASSETS_PATH.sprites,
        ASSETS_PATH.images + '/sprites'
    ]);
});


gulp.task('build', gulp.series('del-pro', 'swig', (done) => {
    done();
}));

gulp.task('default', gulp.series('del', 'swig', (done) => {
    gulp.watch(
        [ASSETS_PATH.pages + '/**/*'],
        gulp.series('swig')
    );
}));
