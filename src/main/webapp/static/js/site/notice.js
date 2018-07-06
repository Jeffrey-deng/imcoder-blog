/**
 * Created by Jeffrey.Deng on 2018/4/9.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, toastr, common_utils);
    }
})(function ($, bootstrap, toastr, common_utils) {
    window.page_jump = function(pagenum){
        document.location.href = "site.do?method=list&jumpPage="+pagenum;
    };
});
