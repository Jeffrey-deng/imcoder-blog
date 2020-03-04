/**
 * 后台管理主页
 * @author Jeffrey.deng
 * @date 2018/4/9
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, websocket_util) {

    var pointer = {
        configMap: null,
        statusWsMessage: null
    };
    var config = {
        "event": {
            "ws_status_load": "ws.status.load",
            "config_load": "config.load"
        }
    };
    var context = {
        "config": config,
        "on": globals.on,
        "once": globals.once,
        "trigger": globals.trigger,
        "off": globals.off
    };

    var utils = {
        "getFormatPages": function (statusWsMessage, uid, ip) {
            var wsMessage = $.extendNotNull(true, {"metadata": {"pages": []}}, statusWsMessage);
            var pages = wsMessage.metadata.pages;
            var isFilter = (uid || ip) ? true : false
            pages = pages.filter(function (page) {
                var v = true;
                if (isFilter) {
                    if (uid && uid > 0) {
                        if (!(page.user && page.user.uid && page.user.uid > 0 && uid == page.user.uid)) {
                            v = false;
                        }
                    } else if (ip) {
                        if ((page.user && page.user.uid && page.user.uid > 0) || page.ip != ip) {
                            v = false;
                        }
                    }
                }
                if (v) {
                    page.user = page.user ? page.user.nickname : "游客（" + page.ip + '）';
                    page.link = decodeURI(page.link);
                }
                return v;
            }).sort(function (a, b) {
                if (a.user == b.user) {
                    return a.open_time > b.open_time ? 1 : -1;
                } else {
                    return a.user > b.user ? 1 : -1;
                }
            });
            return pages;
        },
        "getFormatUsers": function (statusWsMessage, loadNotLogin) {
            var wsMessage = $.extendNotNull(true, {"metadata": {"users": [], "pages": []}}, statusWsMessage);
            var loadUsers = wsMessage.metadata.users;
            var users = [];
            for (var i in loadUsers) {
                var loadUser = loadUsers[i];
                var user = {
                    "uid": loadUser.uid,
                    "nickname": loadUser.nickname,
                    "email": loadUser.email,
                    "last_login_time": loadUser.userStatus.last_login_time,
                    "last_login_ip": loadUser.userStatus.last_login_ip,
                };
                users.push(user);
            }
            var flag_str = '';
            loadNotLogin && wsMessage.metadata.pages.forEach(function (page) {
                if (!(page.user && page.user.uid && page.user.uid > 0)) {
                    var nickname = (page.user.nickname || ('游客（' + page.ip + '）'));
                    if (flag_str.indexOf(nickname) == -1) {
                        users.push({
                            "uid": 0,
                            "nickname": nickname,
                            "email": "",
                            "last_login_time": page.ip,
                            "last_login_ip": page.ip
                        });
                        flag_str += '#' + nickname + '#';
                    }
                }
            });
            return users;
        },
        "buildScriptHtml": function (jsText, tabId, wsMessageId, scriptId) {
            var scriptHtml =
                '<script id="' + scriptId + '">' +
                '    try {' +
                '        require(["toastr", "globals", "common_utils", "websocket_util"], function(toastr, globals, common_utils, websocket_util){' +
                '            var wsMessageId = "' + wsMessageId + '";' +
                '            var scriptId = "' + scriptId + '";' +
                '            var tabId = websocket_util.pointer.tabId;' +
                '            if (tabId == "' + tabId + '") {' +
                '               \n' + jsText + '\n' +
                '            }' +
                '        });' +
                '    } catch (e) {' +
                '        console.log(e);' +
                '    }' +
                '</script>';
            return scriptHtml;
        }
    };

    function loadAllConfig(callback) {
        $.get(globals.api.manager.getAllConfig, function (response) {
            if (response.status == 200) {
                pointer.configMap = response.data.configMap;
                callback(pointer.configMap);
            } else {
                pointer.configMap = {};
            }
            context.trigger(config.event.config_load, pointer.configMap);
        });
    }

    var postQueryWsStatus = function () {
        websocket_util.post({"mapping": "status"});
    };

    // 注册监控服务器的消息推送
    function initWsReceiveServerPush() {
        websocket_util.on(websocket_util.config.event.messageReceive + '.' + 'status', function (e, wsMessage, wsEvent) {
            pointer.statusWsMessage = wsMessage;
            context.trigger(config.event.ws_status_load, pointer.statusWsMessage);
        });
        postQueryWsStatus();
        setInterval(postQueryWsStatus, 30000);
    }

    domReady(function () {

        /* --------- system status --------*/

        $('#btn_reload_cache').click(function () {
            var modal = $('#modal_system_status');
            modal.find('.modal-title').text('重新初始化系统缓存');
            modal.find('.modal-confirm').text('你确定要从数据库重新加载文章、用户等资料以刷新缓存中的数据吗?');
            modal.find('.modal_btn_confirm').off('click').on('click', function () {
                $.post(globals.api.manager.reloadCache, function (response) {
                    if (response.status == 200) {
                        toastr.success('已重新初始化缓存');
                        modal.modal('hide');
                    } else {
                        toastr.error(response.status, '重新初始化缓存失败');
                        console.warn('Error Code: ' + response.status);
                    }
                });
            });
            modal.modal();
        });

        $('#btn_reload_config').on('click', function () {
            var modal = $('#modal_system_status');
            modal.find('.modal-title').text('重新加载配置文件');
            modal.find('.modal-confirm').text('你确定要重新从文件加载配置吗?');
            modal.find('.modal_btn_confirm').off('click').on('click', function () {
                $.post(globals.api.manager.reloadConfig, function (response) {
                    if (response.status == 200) {
                        toastr.success('已重新读取配置文件');
                        modal.modal('hide');
                    } else {
                        toastr.error(response.status, '重新读取配失败');
                        console.warn('Error Code: ' + response.status);
                    }
                });
            });
            modal.modal();
        });

        $('#modal_update_config .config_key').change(function (e) {
            var key = $(this).val();
            $('#modal_update_config .config_value').val(pointer.configMap[key] || '');
        });

        $('#btn_update_config').on('click', function () {
            loadAllConfig(function (configMap) {
                if (configMap) {
                    var str = '';
                    var index = 0;
                    var firstKey = null;
                    $.each(configMap, function (key, value) {
                        if (index++ == 0) {
                            firstKey = key;
                        }
                        str += '<option value="' + key + '">' + key + '</option>';
                    });
                    var $config_key = $('#modal_update_config .config_key');
                    var before_select_config_key = $config_key.val();
                    $config_key.html(str);
                    if (before_select_config_key && configMap.hasOwnProperty(before_select_config_key)) {
                        $config_key.val(before_select_config_key).trigger('change');
                    } else if (firstKey != null) {
                        $config_key.val(firstKey).trigger('change');
                    } else {
                        $('#modal_update_config .config_value').val('');
                    }
                    $('#modal_update_config').modal();
                }
            });
        });

        $('#modal_update_config').find('.modal_btn_confirm').on('click', function () {
            var modal = $('#modal_update_config');
            var params = {};
            params.key = modal.find('.config_key').val();
            params.value = modal.find('.config_value').val().trim();
            if (params.key && params.value) {
                $.post(globals.api.manager.updateConfig, params, function (response) {
                    if (response.status == 200) {
                        pointer.configMap[params.key] = params.value;
                        toastr.success(params.key, '已更新配置项：');
                        modal.modal('hide');
                    } else {
                        toastr.error(response.message, '配置项更新失败');
                        console.warn('Error Code: ' + response.status);
                    }
                });
            } else {
                toastr.error('请输入值', '可输入 "' + pointer.configMap.empty + '" 表示空 ');
            }

        });

        /* --------- WebSocket status --------*/

        var pushMessageModal = $('#modal_push_message');

        config.pushContentMinHeight = 140;
        pushMessageModal.find('.push_content').autoTextareaHeight({
            maxHeight: 600,
            minHeight: config.pushContentMinHeight
        });

        context.on(config.event.ws_status_load, function (e, statusWsMessage) {
            // message
            var messageUsers = utils.getFormatUsers(statusWsMessage);
            messageUsers.unshift({"uid": 0, "nickname": "全部"});
            var message_users_html = '';
            $.each(messageUsers, function (key, user) {
                message_users_html += '<option value="' + user.uid + '" title="uid: ' + user.uid + '">' + user.nickname + '</option>';
            });
            var beforeSelectMessageUsersValue = pushMessageModal.find('.push_users').val();
            if (!beforeSelectMessageUsersValue || beforeSelectMessageUsersValue.length == 0) {
                beforeSelectMessageUsersValue = ["0"];
            }
            pushMessageModal.find('.push_users').html(message_users_html).val(beforeSelectMessageUsersValue);
            // script
            var handleUsers = utils.getFormatUsers(statusWsMessage, true);
            var handle_users_html = '';
            $.each(handleUsers, function (key, user) {
                handle_users_html += '<option value="' + (user.uid + '_' + user.last_login_ip) + '" title="uid: ' + user.uid + '">' + user.nickname + '</option>';
            });
            var $push_user = pushMessageModal.find('.push_user');
            var beforeSelectScriptUserValue = $push_user.val();
            $push_user.html(handle_users_html);
            if ((!beforeSelectScriptUserValue || $push_user.find('option[value="' + beforeSelectScriptUserValue + '"]').length == 0) && handleUsers.length > 0) {
                $push_user.children(0).prop('selected', true);
                beforeSelectScriptUserValue = $push_user.val();
            }
            $push_user.val(beforeSelectScriptUserValue).trigger('change');
            $('#btn_ws_pv button').text('pv：' + statusWsMessage.metadata.pv);
            $('#btn_ws_uv button').text('uv：' + handleUsers.length + ' / ' + statusWsMessage.metadata.uv);
        });

        pushMessageModal.find('.push_type').change(function (e) {
            var key = $(this).val();
            if (key == 'push_message') {
                pushMessageModal.find('.push_user_group').hide();
                pushMessageModal.find('.push_users_group').show();
                pushMessageModal.find('.push_page_group').hide();
                pushMessageModal.find('.push_handle_impl_group').hide();
                pushMessageModal.find('.push_notify_opts_group').show();
            } else {
                pushMessageModal.find('.push_user_group').show();
                pushMessageModal.find('.push_users_group').hide();
                pushMessageModal.find('.push_page_group').show();
                pushMessageModal.find('.push_handle_impl_group').show();
                pushMessageModal.find('.push_notify_opts_group').hide();
            }
        });

        pushMessageModal.find('.push_user').change(function (e) {
            var value = $(this).val();
            if (!value) {
                return;
            }
            var keySplits = value.split('_');
            var uid = keySplits[0], ip = keySplits[1];
            var pages = utils.getFormatPages(pointer.statusWsMessage, uid, ip);
            var pageSelectHtml = '';
            $.each(pages, function (i, page) {
                var enTitle = common_utils.encodeHTML(page.title);
                var enlink = common_utils.encodeHTML(page.link);
                pageSelectHtml += '<option value="' + page.id + '" ' +
                    'title="title: ' + enTitle + '\nlink: ' + enlink + '\ntab: ' + page.id + '\ntime: ' + page.open_time + '\nactive: ' + page.active + '">'
                    + enTitle + '</option>';
            });
            var $push_page = pushMessageModal.find('.push_page');
            var beforeSelectValue = $push_page.val();
            $push_page.html(pageSelectHtml);
            if (beforeSelectValue && $push_page.find('option[value="' + beforeSelectValue + '"]').length > 0) {
                $push_page.val(beforeSelectValue);
            }
        });

        pushMessageModal.find('.push_handle_impl').change(function (e) {
            var key = $(this).val();
            var content;
            switch (key) {
                case 'user_defined':
                    content = '';
                    break;
                case 'close_tab':
                    content = 'document.location.replace(\'https://imcoder.site\');';
                    break;
                case 'open_tab':
                    content = 'window.open(\'https://imcoder.site\');';
                    break;
                case 'scroll_tab':
                    content =
                        'var nodeSelector = \'#article_content\';\n' +
                        '$(\'html, body\').animate({scrollTop: $(nodeSelector).offset().top - 120}, 400);';
                    break;
                case 'zip_photos_token':
                    content =
                        'require([\'album_photo_page_handle\'], function(album_photo_page_handle){\n' +
                        '   album_photo_page_handle.config.allowZipPhotos = true;\n' +
                        '   album_photo_page_handle.config.allowZipPhotosMaxLength = 0;\n' +
                        '   toastr.success(\'权限刷新页面失效~\', \'已打开打包下载权限\', {\'timeOut\': 0});\n' +
                        '});';
                    break;
                default:
                    content = '';
            }
            if (content) {
                pushMessageModal.find('.push_content')
                    .val(content)
                    .autoTextareaHeight({
                        maxHeight: 600,
                        minHeight: config.pushContentMinHeight,
                        runOnce: true
                    });
            }
        });

        $('#btn_push_message').on('click', function () {
            context.once(config.event.ws_status_load, function (e, statusWsMessage) {
                pushMessageModal.find('.push_type').trigger('change');
                $('#modal_push_message').modal();
            });
            postQueryWsStatus();
        });

        $('#btn_ws_pv').on('click', function () {
            context.once(config.event.ws_status_load, function (e, statusWsMessage) {
                var pages = utils.getFormatPages(statusWsMessage);
                console.table(pages, ["id", "user", "title", "link", "open_time", "active"]);
            });
            postQueryWsStatus();
        });

        $('#btn_ws_uv').on('click', function () {
            context.once(config.event.ws_status_load, function (e, statusWsMessage) {
                var users = utils.getFormatUsers(statusWsMessage);
                console.table(users, ["uid", "nickname", "email", "description", "last_login_time", "last_login_ip"]);
            });
            postQueryWsStatus();
        });

        // 管理员消息推送
        pushMessageModal.find('.modal_btn_confirm').on('click', function () {
            var modal = $('#modal_push_message');
            var postWsMessage = {"id": new Date().getTime(), "mapping": "push_manager_notify", "metadata": {}};
            var push_type = pushMessageModal.find('.push_type').val();
            if (push_type == 'push_message') {
                postWsMessage.metadata.users = modal.find('.push_users').val();
                if (!postWsMessage.metadata.users || postWsMessage.metadata.users.length == 0) {
                    toastr.error('请选择用户~');
                    return;
                }
                if (postWsMessage.metadata.users.indexOf('0') != -1) {
                    postWsMessage.metadata.users = null;
                } else {
                    // $.each(postWsMessage.metadata.users, function (i, uid) {
                    //     postWsMessage.metadata.users[i] = uid;
                    // })
                }
                try {
                    postWsMessage.metadata.notify = JSON.parse(modal.find('.push_notify_opts').val() || '{}');
                } catch (e) {
                    toastr.error('显示选项JSON格式不正确');
                    return;
                }
                postWsMessage.text = modal.find('.push_content').val();
                if (!postWsMessage.text) {
                    toastr.error('请输入内容');
                    return;
                } else if (/^[\s\n]?@del:(\d+)[\s\n]?$/.test(postWsMessage.text)) {
                    postWsMessage.metadata.type = "withdraw";
                    postWsMessage.metadata.withdraw_id = RegExp.$1;
                } else {
                    postWsMessage.metadata.type = "push_message";
                    // 将图片链接转化为img标签
                    postWsMessage.text = common_utils.convertImageLinkToHtmlTag(postWsMessage.text, '', true);
                }
            } else {
                postWsMessage.metadata.type = "push_script";
                var scriptText = modal.find('.push_content').val();
                if (!scriptText) {
                    toastr.error('请输入内容');
                    return;
                }
                var uid = modal.find('.push_user').val().split('_')[0];
                if (uid == '0') {
                    postWsMessage.metadata.users = null;
                } else {
                    postWsMessage.metadata.users = [uid];
                }
                var tabId = modal.find('.push_page').val();
                var script_type = modal.find('.push_handle_impl').val();
                var scriptId = 'manager_push_' + script_type + '_script';
                postWsMessage.text = utils.buildScriptHtml(scriptText, tabId, postWsMessage.id, scriptId);
                postWsMessage.metadata.push_page = tabId;
                postWsMessage.metadata.push_script_tag_id = scriptId;
                postWsMessage.metadata.push_script_type = script_type;
                postWsMessage.metadata.notify = {"timeOut": 1};
            }
            websocket_util.ready(function () {
                websocket_util.post(postWsMessage);
                var notify_opts = {
                    "progressBar": false,
                    "iconClass": "toast-success-no-icon",
                    "timeOut": 0,
                    "onclick": function () {
                        return false;
                    },
                    "onShown": function () {
                        $(this).css('opacity', '1');
                    }
                };
                if (postWsMessage.metadata.type != 'withdraw') {
                    globals.notify(notify_opts)
                        .success('已' + (postWsMessage.metadata.users ? ('向 ' + postWsMessage.metadata.users.toString()) : '全部用户') + ' 推送消息，' +
                            "<br><a class='withdrawTrigger' data-wsid='" + postWsMessage.id + "' style='color: #f8ac59'>点我撤回</a>", '消息ID: ' + postWsMessage.id,
                            "push_manager_notify_success_" + postWsMessage.id)
                        .find('.withdrawTrigger').on('click', function () {
                        modal.find('.push_content').val('@del:' + this.getAttribute('data-wsid'));
                        modal.find('.push_type').val('push_message').trigger('change');
                        modal.find('.push_users').val('0');
                    });
                    console.log('已' + (postWsMessage.metadata.users ? ('向 ' + postWsMessage.metadata.users.toString()) : '全部用户') + ' 推送消息' + '\n' + '撤回消息输入：@del:' + postWsMessage.id);
                } else {
                    globals.notify({"iconClass": "toast-success-no-icon"}).success('已' + (postWsMessage.metadata.users ? ('向 ' + postWsMessage.metadata.users.toString()) : '全部用户') + ' 撤回消息：<br>' + postWsMessage.metadata.withdraw_id);
                    console.log('已' + (postWsMessage.metadata.users ? ('向 ' + postWsMessage.metadata.users.toString()) : '全部用户') + ' 撤回消息：' + postWsMessage.metadata.withdraw_id);
                    globals.removeNotify('push_manager_notify_success_' + postWsMessage.metadata.withdraw_id);
                }
            });
        });

        // 注册监控服务器的消息推送
        initWsReceiveServerPush();

    });
});
