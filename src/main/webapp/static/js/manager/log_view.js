(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'summernote', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, common_utils, login_handle);
    }
})(function ($, bootstrap, domReady, toastr, summernote, common_utils, login_handle) {

    function loadConfig(type) {
        var params = {};
        params.type = type;
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("正在加载数据", "", "notify_log_loading");
        $.ajax({
            url: "manager.do?method=load_log",
            data: params,
            type: "GET",
            complete: function (XHR, TS) {
                common_utils.removeNotify("notify_log_loading");
                if (XHR.status == 200 || XHR.status == 304) {
                    if (XHR.getResponseHeader('Content-Length') !== "0") {
                        var data = XHR.responseText;
                        if (data) {
                            toastr.success("加载成功！");
                            //创建节点
                            var pre = document.createElement('pre');
                            pre.setAttribute('class', "user-defined-code");
                            pre.setAttribute('style', 'word-wrap:normal');
                            var code = document.createElement('code');
                            code.setAttribute('style', 'white-space:pre;overflow-x:auto;word-wrap:normal');
                            //得到编辑区的值 并转义
                            code.innerHTML = common_utils.encodeHTML(data);
                            pre.appendChild(code);
                            //插入节点
                            $('#log_area').summernote('code', pre.outerHTML);
                        } else {
                            toastr.info("日志为空！");
                        }
                    } else {
                        toastr.error("需要登录");
                    }
                } else if (XHR.status == 400) {
                    toastr.error("请求参数错误");
                } else if (XHR.status == 401) {
                    toastr.error("需要登录");
                } else if (XHR.status == 403) {
                    toastr.error("你没有权限查看");
                } else if (XHR.status == 404) {
                    toastr.error("系统错误，日志文件不存在");
                } else {
                    toastr.error("服务器错误");
                }

                if (XHR.status != 400) {
                    var params = common_utils.parseURL(document.location.href).params;
                    var search = "?method=log_view";
                    $.each(params, function (key, value) {
                        if (key != "method" && key != "type") {
                            search += "&" + key + "=" + value;
                        }
                    });
                    search += "&type=" + type;
                    history.replaceState(
                        null,
                        document.title,
                        location.pathname + search
                    );
                }
            }
        });
    }

    /**
     * my code
     */
    domReady(function () {

        toastr.options = {
            "closeButton": true,
            "debug": false,
            "progressBar": false,
            "positionClass": "toast-bottom-left",
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "4500",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        //自定义的编辑器
        var editable = $("#log_area").summernote({
            lang: "zh-CN",
            //height: 600,
            toolbar: []
        });
        editable.summernote('disable');

        $("#btn_log_load").click(function () {
            var type = $("#log_type").val();
            if (type) {
                loadConfig(type);
            } else {
                toastr.error("请选择值");
            }
        });

        $("#btn_log_download").click(function () {
            var type = $("#log_type").val();
            toastr.success("正在下载。。。");
            common_utils.downloadUrlFile("manager.do?method=load_log&type=" + type);
        });

        var type = common_utils.parseURL(document.location.href).params.type;
        if (type) {
            loadConfig(type);
            $("#log_type").val(type);
        }
    });
});

