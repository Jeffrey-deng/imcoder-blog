/**
 * requireJs配置
 */
(function () {
    var require_node = document.getElementById("require_node");
    var url_prefix = require_node.getAttribute("baseUrl") || "https://static.imcoder.site/blog/";
    var urlArgs = require_node.getAttribute("urlArgs") || null;
    if (urlArgs && urlArgs != "?") {
        urlArgs = urlArgs.replace(/^\?/, "");
    } else {
        urlArgs = false;
    }
    require.config({
        baseUrl: url_prefix,
        paths: {
            "jquery": ["lib/jquery/jquery.min"],
            "bootstrap": ["lib/bootstrap/bootstrap.min"],
            "cityselect": ["lib/cityselect/jquery.cityselect"],
            "birthday": ["lib/birthday/birthday"],
            "toastr": ["lib/toastr/toastr.min"],
            "stickUp": ["lib/stickup/stickUp.min"],
            "summernote": ["lib/summernote/summernote.min"],
            "store2": ["lib/store/store2.min"],
            "niftymodals": ["lib/niftymodals/jquery.niftymodals.min"],
            "macy": ["lib/macy/macy"],
            "magnificPopup": ["lib/magnific-popup/jquery.magnific-popup.min"],
            "clipboard": ["lib/clipboard/clipboard.min"],
            "jszip": ["lib/jszip/jszip.min"],
            "domReady": ["lib/requirejs/module/domReady.min"],
            "jquery_steps": ["lib/steps/jquery.steps.min"],
            "jquery_validate": ["lib/validate/jquery.validate.min"],
            "jquery_validate_messages_zh": ["lib/validate/messages_zh"],
            "aliyun-oss-sdk": ["lib/aliyun/aliyun-oss-sdk.min"],

            "album_photo_handle": ["js/album/module/album_photo_handle"],
            "album_photo_page_handle": ["js/album/module/album_photo_page_handle"],
            "album_page_handle": ["js/album/module/album_page_handle"],
            "album_handle": ["js/album/module/album_handle"],
            "album_photo_dashboard": ["js/album/album_photo_dashboard"],
            "album_photo_detail": ["js/album/album_photo_detail"],
            "album_dashboard": ["js/album/album_dashboard"],
            "album_list": ["js/album/album_list"],
            "album_tags_square": ["js/album/album_tags_square"],
            "video_list": ["js/video/video_list"],
            "video_handle": ["js/video/module/video_handle"],
            "album_video_plugin": ["js/video/module/album_video_plugin"],
            "article_detail": ["js/article/article_detail"],
            "article_edit": ["js/article/article_edit"],
            "edit_tool": ["js/article/edit_tool"],
            "edit_tool_plugin": ["js/article/edit_tool_plugin"],
            "article_archives": ["js/article/article_archives"],
            "article_manager": ["js/manager/article_manager"],
            "user_manager": ["js/manager/user_manager"],
            "article_modify": ["js/manager/article_modify"],
            "log_view": ["js/manager/log_view"],
            "main_manage": ["js/manager/main_manage"],
            "blowup": ["js/site/blowup"],
            "common_utils": ["js/site/common_utils"],
            "period_cache": ["js/site/period_cache"],
            "results_cache": ["js/site/results_cache"],
            "index": ["js/site/index"],
            "register": ["js/site/register"],
            "login_handle": ["js/site/login"],
            "notice": ["js/site/notice"],
            "sideCol": ["js/site/sideCol"],
            "toolbar": ["js/site/toolbar"],
            "text_to_voice": ["js/tool/text_to_voice"],
            "contact_with": ["js/user/contact_with"],
            "contacts": ["js/user/contacts"],
            "profilecenter": ["js/user/profilecenter"],
            "user_home": ["js/user/user_home"],
            "cloud_share": ["js/cloud/cloud_share"],
        },
        shim: {
            bootstrap: {
                deps: ['jquery']
            },
            niftymodals: {
                deps: ['jquery'],
                exports: 'jQuery.fn.niftyModal'
            },
            jquery_steps: {
                deps: ['jquery'],
                exports: 'jQuery.fn.jquery_steps'
            }
        },
        waitSeconds: 10,
        urlArgs: urlArgs || false
    });

    require(["jquery", "toastr"], function ($, toastr) {
        try {
            var page = document.getElementById("require_node").getAttribute("page");
            var require_modules_node = document.getElementById("require_modules");
            if (require_modules_node && require_modules_node.innerHTML) {
                var require_modules_str = require_modules_node.innerHTML;
                var require_modules = null;
                try {
                    require_modules = JSON.parse(require_modules_str);
                } catch (e) {
                    console.warn("warn: require_modules配置填写错误，应该使用双引号！");
                    require_modules_str = require_modules_str.replace(/\"/gm, "_*&^_").replace(/\'/gm, "\"").replace(/_\*\&\^_/gm, "\'");
                    require_modules = JSON.parse(require_modules_str);
                    console.log("require_modules：", require_modules);
                }
                require(require_modules);
            } else {
                if (page == "index") {

                    require(["jquery", "bootstrap", "domReady", "toastr", "stickUp", "common_utils", "login_handle", "toolbar", "index", "sideCol"]);

                } else if (page == "register") {

                    require(['jquery', 'bootstrap', 'toastr', 'jquery_steps', 'jquery_validate', 'jquery_validate_messages_zh', 'register']);

                } else if (page == "user_home") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar", "sideCol", "contact_with", "user_home"]);

                } else if (page == "profilecenter") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "birthday", "cityselect", "common_utils", "login_handle", "toolbar", "profilecenter"]);

                } else if (page == "contact") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar", "contacts"]);

                } else if (page == "login") {

                    require(["jquery", "bootstrap", "toastr", "common_utils", "login_handle"]);

                } else if (page == "lockscreen") {

                    require(["jquery", "bootstrap", "toastr", "common_utils", "login_handle"]);

                } else if (page == "register") {

                } else if (page == "notice") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar", "notice"]);

                } else if (page == "about") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "magnificPopup", "common_utils", "login_handle", "toolbar", "article_detail", "sideCol", "contact_with"]);

                } else if (page == "article_detail") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "magnificPopup", "common_utils", "login_handle", "toolbar", "article_detail", "sideCol", "contact_with"]);

                } else if (page == "article_edit") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "store2", "clipboard", "summernote", "niftymodals", "common_utils", "login_handle", "toolbar", "edit_tool_plugin", "edit_tool", "article_edit"]);

                } else if (page == "album_list") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "macy", "common_utils", "login_handle", "toolbar", "period_cache", "album_handle", "album_page_handle", "album_list"]);

                } else if (page == "album_detail") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "macy", "clipboard",
                        "magnificPopup", "common_utils", "login_handle", "toolbar", "blowup", "jszip", "period_cache", "album_photo_handle", "album_photo_page_handle", "album_photo_detail", "album_handle"]);

                } else if (page == "album_photo_dashboard") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "macy", "clipboard",
                        "magnificPopup", "common_utils", "login_handle", "toolbar", "blowup", "jszip", "period_cache", "results_cache", "album_photo_handle", "album_photo_page_handle", "album_photo_dashboard"]);

                } else if (page == "album_dashboard") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "macy", "clipboard",
                        "common_utils", "login_handle", "toolbar", "jszip", "period_cache", "album_handle", "album_page_handle", "album_dashboard"]);

                } else if (page == "album_tags_square") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "macy", "common_utils", "login_handle", "toolbar", "album_page_handle", "album_tags_square"]);

                } else if (page == "video_list") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "macy", "common_utils", "login_handle", "toolbar", "period_cache", "video_handle", "video_list", "album_photo_page_handle", "album_video_plugin"]);

                } else if (page == "main_manager") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar", "main_manage"]);

                } else if (page == "article_manager") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar", "article_manager"]);

                } else if (page == "user_manager") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar", "user_manager"]);

                } else if (page == "log_view") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "summernote", "common_utils", "login_handle", "toolbar", "log_view"]);

                } else if (page == "manager_article_modify") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "store2", "clipboard", "summernote", "niftymodals", "common_utils", "login_handle", "toolbar", "edit_tool_plugin", "edit_tool", "article_modify"]);

                } else if (page == "403") {

                    require(["jquery", "bootstrap", "domReady", "toastr", "common_utils", "login_handle"]);

                } else if (page == "text_to_voice") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar", "text_to_voice"]);

                } else if (page == "article_archives") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar", "article_archives"]);

                } else if (page == "article_tags") {

                    require(["jquery", "bootstrap", "domReady", "stickUp", "toastr", "common_utils", "login_handle", "toolbar"]);

                }
            }
        } catch (e) {
            console.warn(e);
            toastr.error("出现error，请刷新！");
        }
    });
})();

