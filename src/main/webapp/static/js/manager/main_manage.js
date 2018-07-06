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
    
    var configMap = null;
    
    function loadAllConfig(callback) {
        $.get("manager.do?method=getAllConfig", function (data) {
            if (data.flag == 200) {
                configMap = data.configMap;
                callback(configMap);
            } else {
                configMap = {};
            }
        });
    }
    
    domReady(function () {

        // 提示吐司  設置
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "progressBar": false,
            "positionClass": "toast-bottom-left",
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "3500",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        $("#btn_reload_cache").click(function () {
            var modal = $("#modal_system_status");
            modal.find(".modal-title").text("重新初始化系统缓存");
            modal.find(".modal-confirm").text("你确定要从数据库重新加载文章、用户等资料以刷新缓存中的数据吗?");
            modal.find(".modal_btn_confirm").unbind("click").click(function () {
                $.post("manager.do?method=reload_cache", function (data) {
                    if (data.flag == 200) {
                        toastr.success("已重新初始化缓存");
                        modal.modal('hide');
                    } else {
                        toastr.error(data.info, "重新初始化失败");
                        console.warn("Error Code: " + data.flag);
                    }
                });
            });
            modal.modal();
        });

        $("#btn_reload_config").click(function () {
            var modal = $("#modal_system_status");
            modal.find(".modal-title").text("重新加载配置文件");
            modal.find(".modal-confirm").text("你确定要重新从文件加载配置吗?");
            modal.find(".modal_btn_confirm").unbind("click").click(function () {
                $.post("manager.do?method=reload_config", function (data) {
                    if (data.flag == 200) {
                        toastr.success("已重新读取配置文件");
                        modal.modal('hide');
                    } else {
                        toastr.error(data.info, "重新读取配失败");
                        console.warn("Error Code: " + data.flag);
                    }
                });
            });
            modal.modal();
        });

        $("#modal_update_config").find(".modal_btn_confirm").click(function () {
            var modal = $("#modal_update_config");
            var params = {};
            params.key = modal.find(".config_key").val();
            params.value = modal.find(".config_value").val().trim();
            if (params.key && params.value) {
                $.post("manager.do?method=update_config", params, function (data) {
                    if (data.flag == 200) {
                        configMap[params.key] = params.value;
                        toastr.success("已更新配置项：" + params.key);
                        modal.modal('hide');
                    } else {
                        toastr.error(data.info, "配置项更新失败");
                        console.warn("Error Code: " + data.flag);
                    }
                });
            } else {
                toastr.error("请输入值");
            }

        });

        $("#modal_update_config .config_key").change(function (e) {
            var key = $(this).val();
            $("#modal_update_config .config_value").val(configMap[key] || "");
        });

        $("#btn_update_config").click(function () {
            loadAllConfig(function (configMap) {
                if (configMap) {
                    var str = "";
                    var index = 0;
                    var firstKey = null;
                    $.each(configMap, function (key, value) {
                        if (index++ == 0) {
                            firstKey = key;
                        }
                        str += '<option value="' + key + '">' + key + '</option>';
                    });
                    $("#modal_update_config .config_key").html(str);
                    firstKey != null && $("#modal_update_config .config_value").val(configMap[firstKey] || "");
                    $("#modal_update_config").modal();
                }
            });
        });
        
    });
});
