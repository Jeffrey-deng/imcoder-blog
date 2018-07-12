/**
 * Created by Jeffrey.Deng on 2018/4/9.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr);
    }
})(function ($, bootstrap, domReady, toastr) {
    domReady(function () {
        $('#post_trigger').click(function () {
            var text = $("#post_val").val();
            if (text != "") {
                textToVoice(text);
            } else {
                toastr.error("请输入内容！");
            }
        });
        $("#post_val").focus();
    });

    function textToVoice(text) {
        /*var notify = common_utils.notify({"timeOut": 4000});
         notify.config({"timeOut": 0}).success("正在处理。。。", "", "notify_handle");
         common_utils.removeNotify("notify_handle");*/
        var notify_handle = toastr.success("正在处理。。。", "", {"timeOut": 0});
        var options = {};
        options.text = text;
        options.spd = "5";
        options.pit = "5";
        options.per = "4";
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

    function downloadFile(fileName, content) {
        var aLink = document.createElement('a');
        //var blob = new Blob([content]);
        var evt = document.createEvent("MouseEvents");
        evt.initEvent("click", true, true);
        if (fileName) {
            aLink.download = fileName;
        }
        aLink.target = "_blank";
        //aLink.href = URL.createObjectURL(blob);
        aLink.href = content;
        aLink.dispatchEvent(evt);
    }
});
