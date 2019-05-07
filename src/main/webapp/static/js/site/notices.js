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
        var page = "";
        $.each(params, function (key, value) {
            if (key != "method" && key != "page") {
                page += "&" + key + "=" + value;
            }
        });
        $(".page-navigator").find(".page-trigger").each(function (i, a) {
            if (page) {
                a.href = document.location.pathname + "?" + page.substring(1) + "&page=" + a.getAttribute("page");
            } else {
                a.href = document.location.pathname + "?" + "page=" + a.getAttribute("page");
            }
        });
    };

    // 图片加载失败显示默认图片
    function replaceLoadErrorImgToDefault(parentNode) {
        $(parentNode).find("img").one("error", function (e) {
            $(this)
                .attr("src", $("#cloudPath").attr("href") + "res/img/img_load_error_default.jpg")
                .attr("title", "该图片加载失败~");
        });
    }

    replaceLoadErrorImgToDefault($("#main"));

    initPageJump();
});
