'use strict';


if(__DEV__){
    require('html!html/demo.html');
}

require('sass/index.scss');

let dom = {};

const data = {};

let core = {
    initEvent: false,
    initDom: () => {
        dom.body = $('body');
    },
    bindEvent: () => {

        core.initEvent = true;
        dom.body.on('click', '.nav-item', e => {
            core.nav(e);
            return false;
        });
    },
    init: () => {

        console.log('this');
        core.initDom();
        core.initEvent || core.bindEvent();
    },
    nav: (e) => {
        var ele = $(e.currentTarget);
        ele.addClass('active').siblings().removeClass('active');

        console.log('this');

    }
};
core.init();
