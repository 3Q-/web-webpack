'use strict';


if (__DEV__) {
    // require('html!html/index.html');
}
require('sass/index.scss');

// var Slider = require('libs/slider');

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

            // return false;
        });
    },
    init: () => {
        core.initDom();
        core.initEvent || core.bindEvent();

        core.notice_banner();
    },



    notice_banner: function() {


        // var bannerSlider = new Slider($('#banner_tabs'), {
        //     time: 5000,
        //     delay: 400,
        //     event: 'hover',
        //     auto: true,
        //     mode: 'fade',
        //     controller: $('#bannerCtrl'),
        //     activeControllerCls: 'active'
        // });
        // $('#banner_tabs .flex-prev').click(function() {
        //     bannerSlider.prev();
        // });
        // $('#banner_tabs .flex-next').click(function() {
        //     bannerSlider.next();
        // });


    }

};
core.init();
