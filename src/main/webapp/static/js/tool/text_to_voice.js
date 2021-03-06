/**
 * @author Jeffrey.Deng
 * @date 2018/4/9
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, login_handle);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, login_handle) {

    function textToVoice(text, load_condition) {
        // var notify = globals.notify({"timeOut": 4000});
        // notify.config({"timeOut": 0}).success('正在处理。。。', '', 'notify_handle');
        // globals.removeNotify('notify_handle');
        var notify_handle = toastr.success('正在处理。。。', '', {"timeOut": 0});
        var options = {};
        options.text = text;
        options.spd = "5";
        options.pit = "5";
        options.per = "4";
        options.cuid = login_handle.getCurrentUserId() + '';
        if (load_condition) {
            $.extendNotNull(options, load_condition);
        }
        $.post(globals.api.runTextToVoice, options, function (response) {
            if (response.status == 200) {
                var data = response.data;
                toastr.remove(notify_handle, true);
                toastr.success('转制成功！');
                $('<audio controls="controls" style="width:100%"><source src="' + data.mp3_cdn_url + '" type="audio/mp3"></audio>').appendTo('#audio_div');
                // downloadFile(data.fileName, $('#cloudFromSite').attr('href') + data.mp3_url);
            } else {
                toastr.error(response.message, '失败！');
                console.warn('Error Code: ' + response.status);
            }
        });
    }

    domReady(function () {
        var params = common_utils.parseURL(document.location.href).params;
        var load_condition = {};
        $.each(params, function (key, value) {
            if (key != 'method') {
                load_condition[key] = value && decodeURIComponent(decodeURIComponent(value));
            }
        });
        $('#post_trigger').click(function () {
            var text = $('#post_val').val();
            if (text != '') {
                textToVoice(text, load_condition);
            } else {
                toastr.error('请输入内容！');
            }
        });
        $('#post_val').focus();
    });
});
