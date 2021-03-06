(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'summernote', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, globals, common_utils, login_handle);
    }
})(function ($, bootstrap, domReady, toastr, summernote, globals, common_utils, login_handle) {

    function loadLogFile(type) {
        var params = {};
        params.type = type;
        globals.notify().progress('正在加载数据~', '', 'notify_log_loading');
        $.ajax({
            url: globals.api.manager.loadLogFile,
            data: params,
            type: "GET",
            complete: function (XHR, TS) {
                if (XHR.status == 200 || XHR.status == 304) {
                    if (XHR.getResponseHeader('Content-Length') !== '0') {
                        var data = XHR.responseText;
                        if (data) {
                            globals.getNotify('notify_log_loading').content('加载成功, 计算中~');
                            // 创建节点
                            var pre = document.createElement('pre');
                            pre.setAttribute('class', 'user-defined-code');
                            pre.setAttribute('style', 'word-wrap:normal');
                            var code = document.createElement('code');
                            code.setAttribute('style', 'white-space:pre;overflow-x:auto;word-wrap:normal');
                            // 得到编辑区的值 并转义
                            code.innerHTML = common_utils.encodeHTML(data);
                            pre.appendChild(code);
                            // 插入节点
                            $('#log_area').summernote('code', pre.outerHTML);
                        } else {
                            toastr.info('日志为空~');
                        }
                    } else {
                        toastr.error('需要登录');
                    }
                } else if (XHR.status == 400) {
                    toastr.error('请求参数错误');
                } else if (XHR.status == 401) {
                    toastr.error('需要登录');
                } else if (XHR.status == 403) {
                    toastr.error('你没有权限查看');
                } else if (XHR.status == 404) {
                    toastr.error('系统错误，日志文件不存在');
                } else {
                    toastr.error('服务器错误');
                }
                globals.removeNotify('notify_log_loading');
                if (XHR.status != 400) {
                    var params = common_utils.parseURL(document.location.href).params;
                    var search = '';
                    $.each(params, function (key, value) {
                        if (key != 'method' && key != 'type') {
                            search += '&' + key + '=' + value;
                        }
                    });
                    search += '&type=' + type;
                    search = (search ? ('?' + search.substring(1)) : '');
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

        //自定义的编辑器
        var editable = $('#log_area').summernote({
            lang: "zh-CN",
            //height: 600,
            toolbar: []
        });
        editable.summernote('disable');

        $('#btn_log_load').click(function () {
            var type = $('#log_type').val();
            if (type) {
                loadLogFile(type);
            } else {
                toastr.error('请选择值');
            }
        });

        $('#btn_log_download').click(function () {
            var type = $('#log_type').val();
            toastr.success('正在下载。。。');
            common_utils.downloadUrlFile(('manager/load_log?type=' + type).toURL());
        });

        var type = common_utils.parseURL(document.location.href).params.type;
        if (type) {
            loadLogFile(type);
            $('#log_type').val(type);
        }

    });
});

