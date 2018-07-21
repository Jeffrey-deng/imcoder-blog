/**
 * Created by Jeffrey.Deng on 2018/4/9.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle) {

    function textToVoice(text, load_condition) {
        /*var notify = common_utils.notify({"timeOut": 4000});
         notify.config({"timeOut": 0}).success("正在处理。。。", "", "notify_handle");
         common_utils.removeNotify("notify_handle");*/
        var notify_handle = toastr.success("正在处理。。。", "", {"timeOut": 0});
        var options = {};
        options.text = text;
        options.spd = "5";
        options.pit = "5";
        options.per = "4";
        options.cuid = login_handle.getCurrentUserId() + "";
        if (load_condition) {
            $.extend(options, load_condition);
        }
        $.post("site.do?method=runTextToVoice", options, function (data) {
            if (data.flag == 200) {
                toastr.remove(notify_handle, true);
                toastr.success("转制成功！");
                var mp3_html = '<audio controls="controls" style="width:100%">';
                mp3_html += '<source src="' + $("#cloudFromSite").attr("href") + data.mp3_url + '" type="audio/mpeg"></audio>';
                $('#audio_div').append(mp3_html);
                //downloadFile(data.fileName, $("#cloudFromSite").attr("href") + data.mp3_url);
            } else {
                toastr.error(data.info, "失败！");
                console.warn("Error Code: " + data.flag);
            }
        });
    }

    domReady(function () {
        var params = common_utils.parseURL(document.location.href).params;
        var load_condition = {};
        $.each(params, function (key, value) {
            if (key != "method") {
                load_condition[key] = value && decodeURIComponent(decodeURIComponent(value));
            }
        });
        $('#post_trigger').click(function () {
            var text = $("#post_val").val();
            if (text != "") {
                textToVoice(text, load_condition);
            } else {
                toastr.error("请输入内容！");
            }
        });
        $("#post_val").focus();
    });
});
