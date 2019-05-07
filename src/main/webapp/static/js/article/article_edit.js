(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'toolbar', 'edit_tool', 'edit_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, toolbar, edit_tool, edit_handle);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, toolbar, edit_tool, edit_handle) {

    domReady(function () {
        var mark = "new", updateAid;
        // 如果是更新文章
        var params = common_utils.parseURL(document.location.href).params;
        if (params.mark == 'update') {
            mark = "update";
            updateAid = params.aid;
        }
        edit_handle.init({
            "mark": mark,
            "updateAid": updateAid,
            "selector":{
                "form": "#article_form",
                "successModal": "#resultTipsModal",
                "mainEditor": "#article_edit",
                "summaryEditor": "#article_summary",
                "copyArticleLinkBtn": "#resultTipsModal .copy_article_link_btn"
            },
            "path_params": {
                "basePath": $('#basePath').attr('href'),
                "staticPath": $('#staticPath').attr('href'),
                "cloudPath": $('#cloudPath').attr('href')
            }
        });
        // 初始化文章上传的配置
        edit_handle.initCreateConfigInfo().fail(function () {
            if (mark == "update") {
                common_utils.removeNotify("notify-no-allow-create");
                edit_handle.pointer.form.find(".article-edit-btn-submit").removeAttr("disabled");
            }
        });
        // 关闭搜索快捷键
        toolbar.rewriteSearch({"searchHotKey": false});
    });

});