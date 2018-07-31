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

    var initPageJump = function () {
        var params = common_utils.parseURL(document.location.href).params;
        var page = "site.do?method=list";
        $.each(params, function (key, value) {
            if (key != "method" && key != "jumpPage") {
                page += "&" + key + "=" + value;
            }
        });
        $(".page-navigator").find(".page-trigger").each(function (i, a) {
            a.href = page + "&jumpPage=" + a.getAttribute("page");
        });
    };

    initPageJump();
});
