/**
 * Created by Jeffrey.Deng on 2018/4/9.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, websocket_util) {

    var configMap = null;
    var statusWsMessage = null;

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

    // 注册监控服务器的消息推送
    function initWsReceiveServerPush() {
        websocket_util.on(websocket_util.config.event.messageReceive + "." + "status", function (e, wsMessage, wsEvent) {
            statusWsMessage = wsMessage;
            $("#btn_ws_pv button").text("pv：" + wsMessage.metadata.pv);
            $("#btn_ws_uv button").text("uv：" + wsMessage.metadata.uv);
        });
        var postQueryWs = function () {
            websocket_util.post({"mapping": "status"});
        };
        postQueryWs();
        setInterval(postQueryWs, 30000);
    }

    domReady(function () {

        /* --------- system status --------*/

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
                toastr.error("请输入值", "可输入 \"" + configMap.empty + "\" 表示空 ");
            }

        });

        /* --------- WebSocket status --------*/

        $("#btn_push_message").click(function () {
            var wsMessage = $.extend(true, {"metadata": {"users": []}}, statusWsMessage);
            wsMessage.metadata.users.unshift({"uid": 0, "nickname": "全部"});
            var str = "";
            $.each(wsMessage.metadata.users, function (key, user) {
                str += '<option value="' + user.uid + '">' + user.nickname + '</option>';
            });
            $("#modal_push_message .push_users").html(str).val(0);
            $("#modal_push_message").modal();
        });

        // 管理员消息推送
        $("#modal_push_message").find(".modal_btn_confirm").click(function () {
            var modal = $("#modal_push_message");
            var postWsMessage = {"mapping": "push_manager_notify", "metadata": {}};
            postWsMessage.metadata.users = modal.find(".push_users").val();
            if (postWsMessage.metadata.users.indexOf("0") != -1) {
                postWsMessage.metadata.users = null;
            } else {
                $.each(postWsMessage.metadata.users, function (i, uid) {
                    postWsMessage.metadata.users[i] = parseInt(uid);
                })
            }
            try {
                postWsMessage.metadata.notify = JSON.parse(modal.find(".push_notify_opts").val() || "{}");
            } catch (e) {
                toastr.error("显示选项JSON格式不正确");
                return;
            }
            postWsMessage.content = modal.find(".push_content").val();
            if (!postWsMessage.content) {
                toastr.error("请输入内容");
                return;
            }
            websocket_util.ready(function () {
                websocket_util.post(postWsMessage);
                toastr.success("已" + (postWsMessage.metadata.users ? ("向 " + postWsMessage.metadata.users.toString() + " ") : "") + "推送消息");
            });
        });

        // 注册监控服务器的消息推送
        initWsReceiveServerPush();

    });
});
