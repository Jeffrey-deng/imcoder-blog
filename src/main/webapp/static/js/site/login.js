/**
 * 登录
 * @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'globals', 'common_utils', 'websocket_util'], factory);
    } else {
        // Browser globals
        window.login_handle = factory(window.jQuery, null, toastr, globals, common_utils, websocket_util);
    }
})(function ($, bootstrap, toastr, globals, common_utils, websocket_util) {

    var pointer = {
        /**
         * 回调函数
         * 用于执行弹出 登录框 前，用户要执行的操作
         * 在登录成功后，页面刷新前 执行
         */
        callback: null,
        login_form: null,
        login_modal: null
    };

    var config = {
        // 保存跳转链接 默认刷新本页面
        jumpUrl: window.location.href,
        selector: {
            "login_form": "#login_form",
            "login_modal": "#login_Modal",
            "loginModal_trigger": ".loginModal_trigger",
            "uid_element": "body"
        },
        uid: 0,
        cookie_path: (globals.path_params.basePath) && globals.path_params.basePath.replace(/https?:\/\/[a-z0-9.]+(:\d+)?/i, "").replace(/\/$/, "") || "/"
    };

    var replaceConfig = function (options) {
        init(options);
    };

    var init = function (options) {
        $.extendNotNull(true, config, options);
        pointer.login_form = $(config.selector.login_form);
        pointer.login_modal = $(config.selector.login_modal);
        var loginConfig = globals.getLocalConfig('login', {"remember_default_check": true});
        if (loginConfig.remember_default_check) {
            pointer.login_form.find('input[name="remember"]').prop('checked', true);
        } else {
            pointer.login_form.find('input[name="remember"]').prop('checked', false);
        }
        bindEvent();
        // 初始化JumpUrl
        initJumpUrl();
        // 初始化WebSocket
        initWebSocket();
    };

    /**
     * @deprecated
     * 自动登陆, 手动提交token
     * @param {Boolean} refresh - 自动登录后是否刷新页面，默认true
     * @param {Function} callback(isLogin) - callback为空时为ajax同步请求
     */
    var autoLogin = function (refresh, callback) {
        (refresh === undefined) && (refresh = true);
        var uid_ele = $(config.selector.uid_element).attr('uid');
        var need_login = common_utils.cookieUtil.get('login_status') == 'false' || uid_ele == undefined || uid_ele == "";
        if (need_login && window.location.href.indexOf('method=jumpLogin') == -1) {
            var postData = {};
            postData.identifier = common_utils.cookieUtil.get('identifier');
            postData.credential = common_utils.cookieUtil.get('credential');
            postData.identity_type = 4;
            globals.request.ajax({
                type: "POST",
                async: !!callback
            }, globals.api.login, postData).always(function () {
                globals.storage.setItem('check_login_last_time', new Date().getTime() + '');
            }).final(function (data) {
                // common_utils.cookieUtil.set('login_status', 'true', null, config.cookie_path, null, null);
                $(config.selector.uid_element).attr('uid', data.user.uid);
                callback && callback(true);
                if (refresh) {
                    window.location.reload(true)
                } else {
                    console.log('auto login success at : ' + common_utils.formatDate(new Date, 'yyyy-MM-dd hh:mm:ss'));
                }
            }, function (status, message, type) {
                if (type == 1) {
                    // common_utils.cookieUtil.set('login_status', 'false', null, config.cookie_path, null, null);
                    // common_utils.cookieUtil.delete('uid');
                    // common_utils.cookieUtil.delete('token');
                    console.log('auto login fail at : ' + common_utils.formatDate(new Date, 'yyyy-MM-dd hh:mm:ss'));
                    callback && callback(false);
                }
            });
        }
    };

    var bindEvent = function () {
        pointer.login_form.find('.login_submit').on('click', function () {
            var form = {};
            form.identifier = pointer.login_form.find('input[name="identifier"]').val();
            form.credential = pointer.login_form.find('input[name="credential"]').val();
            form.remember = pointer.login_form.find('input[name="remember"]').prop('checked');
            form.remember === undefined && (form.remember = true);
            login(form);
        });
        pointer.login_form.on('keydown', function (e) {
            var theEvent = e || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            if (code == 13) {//keyCode=13是回车键
                $(this).find('.login_submit').click();
                // 防止触发表单提交 返回false
                // e.preventDefault();
                return false;
            }
        });

        // 如果有登录框
        if (pointer.login_modal.length > 0) {

            $(config.selector.loginModal_trigger).click(function () {
                showLoginModal();
            });

            pointer.login_form.find('input[name="remember"]').click(function (e) {
                var remember = $(e.currentTarget).prop('checked');
                if (remember) {
                    // toastr.success('关闭记住密码请点击导航栏退出登录', {"timeOut": "8000"});
                    toastr.success('同一IP下会保持登录状态', '已开启自动登录', {"timeOut": "6000", "closeButton": false});
                } else {
                    toastr.success('登录后会清除本地的令牌', '将会关闭自动登录', {"timeOut": "5000", "closeButton": false});
                }
            });

            // 绑定动画
            pointer.login_modal.attr('class', 'modal').find('.modal-content').attr('class', 'modal-content');
            pointer.login_modal.on('animationend webkitAnimationEnd', function () {
                var _self = $(this);
                if (_self.hasClass('bounceOutRight')) {
                    _self.modal('hide');
                }
                _self.removeClass('animated bounceInLeft bounceOutRight');
            }).on('show.bs.modal', function () {
                $(this).css('animation-duration', '1s').removeClass('animated bounceInLeft').addClass('animated bounceInLeft');
            }).on('hide.bs.modal', function () {
                var _self = $(this);
                if (_self.hasClass('bounceOutRight')) {
                    return true;
                } else {
                    _self.css('animation-duration', '0.5s').addClass('animated bounceOutRight');
                    return false;
                }
            });
        }
    };

    /**
     * 初始化JumpUrl
     */
    var initJumpUrl = function () {
        config.jumpUrl = window.location.href;
        pointer.callback = null;
        var locationInfo = common_utils.parseURL(window.location.href);
        var params = locationInfo.params;
        // 如果是登录页面登录，且不是后端转发到登录页面的，则设置覆盖一个初始值
        if (pointer.login_form.find('.login_submit').attr('jumpUrl') && locationInfo.file == 'login') {
            config.jumpUrl = pointer.login_form.find('.login_submit').attr('jumpUrl');
        }
        // 如果地址中有跳转链接，则覆盖
        var continue_url = params['continue'];
        if (continue_url) {
            var decoderUrl = decodeURIComponent(decodeURIComponent(continue_url));
            config.jumpUrl = decoderUrl;
        }
    };

    /**
     * 跳转到登录
     * @param {String=} url - 跳转链接
     * @param {Boolean=} modalFirst - 是否以模式框登录为优先，默认true
     */
    var jumpLogin = function (url, modalFirst) {
        url = arguments[0] || window.location.href;
        modalFirst = (arguments[1] || arguments[1] === false) ? arguments[1] : true;
        if (modalFirst && pointer.login_modal.length > 0) {
            showLoginModal(url, null);
        } else {
            var encoderUrl = encodeURIComponent(encodeURIComponent(url));
            window.location.href = ('auth/login?continue=' + encoderUrl).toURL();
        }
    };

    /** 弹出登录框
     * @param {String=} url - 登录后跳转的链接，为最高优先级，可以不填
     * @param {Function=} call - 登录后执行的回调函数，可以不填
     */
    var showLoginModal = function (url, call) {
        // 再一次执行初始化，防止弹出登录框后不登陆直接关闭后，下次再弹出登陆框jumpUrl错误
        initJumpUrl();
        // 只有一个参数时判断为何物
        if (arguments.length == 1) {
            if (typeof(arguments[0]) == 'function') {
                pointer.callback = arguments[0];
            } else {
                config.jumpUrl = arguments[0];
                pointer.callback = null;
            }
        } else if (arguments.length == 2) {
            config.jumpUrl = arguments[0];
            pointer.callback = arguments[1];
        }

        // 等于空字符串清除hash
        if (url == '') {
            if (window.location.hash) {
                window.location.hash = '';
                config.jumpUrl = window.location.href;
            }
        }
        // isRememberLogin() && pointer.login_form.find('input[name="remember"]').prop('checked', true);
        if (pointer.login_modal.length > 0) {
            pointer.login_modal.modal({backdrop: 'static', keyboard: false});
        }
    };

    // 登录请求
    var login = function (formData) {
        if (utils.validateParams(formData.identifier, formData.credential)) {
            globals.request.ajax({
                type: "POST",
                dataType: 'json',
                // global: false,
            }, globals.api.login, formData).final(function (data) {
                let loginUser = data.user;
                if (pointer.login_modal.length > 0) {
                    pointer.login_modal.modal('hide');
                }
                toastr.success('正在跳转...');

                // 记住密码
                // if (formData.remember == false) {
                //     common_utils.cookieUtil.set('identifier', loginUser.uid, null, config.cookie_path, null, null);
                //     common_utils.cookieUtil.delete('credential');
                // } else {
                //     var date = new Date();
                //     var secure = common_utils.parseURL(document.location.href).protocol == "https";
                //     var remember_expires = globals.getLocalConfig('login', {"remember_expires": 31104000000}).remember_expires;
                //     common_utils.cookieUtil.set('identifier', loginUser.uid, date.getTime() + remember_expires, config.cookie_path, null, secure);
                //     common_utils.cookieUtil.set('credential', data.token, date.getTime() + remember_expires, config.cookie_path, null, secure);
                // }
                // common_utils.cookieUtil.set('login_status', 'true', null, config.cookie_path, null, null);

                $(config.selector.uid_element).attr('uid', loginUser.uid);
                localStorage.login_time = common_utils.formatDate(new Date(), 'yyyy-MM-dd hh:mm:ss');
                localStorage.checkLogin_lastTime = new Date().getTime() + '';

                // 如果有回调函数则执行
                if (pointer.callback) {
                    pointer.callback();
                    // 让页面跳转慢一点以显示回调函数执行结果给用户
                    setTimeout(function () {
                        utils.go(config.jumpUrl);
                    }, 1000);
                } else {
                    utils.go(config.jumpUrl);
                }
            }, function (status, message, type) {
                if (type == 1 && status == 403) {
                    toastr.error('账号被冻结，解封请找到\n[<b>本站的任何一封通知邮件</b>]\n写明理由回复之', "提示", {
                        "timeOut": 0, "onclick": function () {
                            return false;
                        }
                    });
                } else {
                    toastr.error(message, '登录失败');
                }
            });
        }
    };

    /**
     * 验证是否登陆 超过15分钟，强力登陆
     * @returns {Boolean}
     */
    var validateLogin = function () {
        if (window.navigator.cookieEnabled) {
            var e = common_utils.cookieUtil.get('login_status') == 'true';
            if (e) {
                $(config.selector.uid_element).attr('uid', common_utils.cookieUtil.get('identifier'));
            }
            return e;
        } else {
            var uid = $(config.selector.uid_element).attr('uid');
            return !!uid;
        }
    };

    /**
     * @deprecated
     * 登录后运行
     * @param {Function} callback(isLogin)
     * @param {Boolean} force - 严格模式
     */
    var runOnLogin = function (callback, force) {
        if (force) {
            checkLoginByRequest(function (isLogin) {
                callback(isLogin);
            });
        } else if (validateLogin()) {
            callback(true);
        } else {
            callback(false);
        }
    };

    /**
     * @deprecated
     * 发生请求检查登陆状态
     * @param {Function} callback(isLogin) - callback为空时为ajax同步请求
     */
    var checkLoginByRequest = function (callback) {
        return globals.request.ajax({
            type: "GET",
            async: !!callback,
        }, globals.api.getUser).always(function () {
            globals.storage.setItem('check_login_last_time', new Date().getTime() + '');
        }).final(function (data) {
            // common_utils.cookieUtil.set('login_status', 'true', null, config.cookie_path, null, null);
            $(config.selector.uid_element).attr('uid', data.user.uid);
            $.isFunction(callback) && callback(true);
        }, function (status, message, type) {
            if (type == 1) {
                // common_utils.cookieUtil.set('login_status', 'false', null, config.cookie_path, null, null);
                $(config.selector.uid_element).attr('uid', '');
                $.isFunction(callback) && callback(false);
            } else {
                $.isFunction(callback) && callback(null);
            }
        });
    };

    /**
     * 退出登录
     */
    var clearLoginStatus = function () {
        return globals.request.post(globals.api.logout).final(function (data) {
            toastr.success('正在退出...');
            // common_utils.cookieUtil.set('login_status', 'false', null, config.cookie_path, null, null);
            // common_utils.cookieUtil.delete('identifier');
            // common_utils.cookieUtil.delete('credential');
            window.location.reload(true);
        }, function (status, message, type) {
            toastr.error(message, '手动退出失败！');
            toastr.error('请尝试关闭浏览器退出！');
        });
    };

    /**
     * 当前登录用户id
     * @returns {String} uid - 用户id
     */
    var getCurrentUserId = function () {
        if (window.navigator.cookieEnabled) {
            return common_utils.cookieUtil.get('identifier');
        } else {
            return $(config.selector.uid_element).attr('uid');
        }
    };

    /**
     * 当前登录用户对象
     * @param {Function|Boolean} success - 获取成功回调，获取失败回调从fail()方法获取
     * @returns
     */
    var getCurrentUser = function (success) {
        return $.Deferred(function (dfd) {
            if (validateLogin()) {
                globals.request.get(globals.api.getUser, success, ['user'], success && '加载用户资料失败').final(function (user) {
                    dfd.resolveWith(this, arguments);
                }, function () {
                    dfd.rejectWith(this, arguments);
                });
            } else {
                globals.request.rejectedResp({'status': 401, 'message': '用户未登录', 'type': -1}, success && '加载用户资料失败', null, false, dfd);
            }
        });
    };

    /**
     * 用户是否记住了密码
     * @returns {boolean}
     */
    var isRememberLogin = function () {
        if (common_utils.cookieUtil.get('identifier') && common_utils.cookieUtil.get('credential')) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * 判断uid是否等于当前登录用户
     * @param {Integer | String} uid - 用户id
     * @returns {Boolean}
     */
    var equalsLoginUser = function (uid) {
        if (!uid) {
            return false;
        }
        return validateLogin() && getCurrentUserId() == uid;
    };

    var utils = {
        validateParams: function (identifier, credential) {
            var e = true;
            if (!identifier) {
                toastr.info('未填写账号~');
                e = false;
            }
            if (!credential) {
                toastr.info('未填写密码~');
                e = false;
            }
            return e;
        },
        //判断是否登录后刷新原来的页面
        isCurrentPageUrl: function (jumpUrl) {
            return (window.location.href == jumpUrl) || (jumpUrl.indexOf('#') === 0);
        },
        go: function (jumpUrl) {
            //如果是登录后刷新原来的页面，就reload页面，防止浏览器直接读取缓存而不刷新
            if (this.isCurrentPageUrl(jumpUrl)) {
                if (jumpUrl.indexOf('#') == 0) {
                    window.location.hash = jumpUrl;
                }
                window.location.reload(true);
            }
            window.location.href = jumpUrl;
        }
    };

    /**
     * 初始化WebSocket
     */
    var initWebSocket = function () {
        // 初始化
        setTimeout(function () {
            websocket_util.init({
                    heartbeat: {
                        pingTimeout: 15000,
                        pongTimeout: 10000,
                        reconnectInterval: 8000,
                        inactiveInterval: 300000,
                    }
                }
            );
        }, 100);
        // 连接开启或重连时
        websocket_util.on(websocket_util.config.event.connectionOpen, function () {
            // 注册页面信息
            websocket_util.pointer.tabId = new Date().getTime();
            websocket_util.post({
                "mapping": "register_page_meta",
                "metadata": {
                    "id": websocket_util.pointer.tabId, // 该页面标签id
                    "title": document.title,
                    "link": document.location.href,
                    "platform": /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? 'phone' : "pc",
                    "active": websocket_util.utils.isPageActive()
                }
            });
        });
        var notify_ws_opts = {
            "progressBar": false,
            "positionClass": "toast-top-right",
            "iconClass": "toast-success-no-icon",
            "timeOut": 0,
            "onclick": function (e) {
                if ($(e.target).closest('a').length > 0) {
                    e.preventDefault();
                    window.open(e.target.href);
                    return false;
                }
            },
            "onShown": function () {
                $(this).css('opacity', '1');
            },
            "onHidden": function (toastElement, closeType) {
                if (closeType != 0 && toastElement.hasClass('wsMessage') && !toastElement.hasClass('not-sync-ws-message')) {
                    websocket_util.post({
                        "mapping": "transfer_data_in_tabs",
                        "metadata": {
                            "handle": "remove_ws_message",
                            "from_tab_id": websocket_util.pointer.tabId,
                            "ws_message_id": parseInt(toastElement.attr('data-wsid'))
                        }
                    });
                }
            }
        };
        // 管理员通知
        websocket_util.onPush('push_manager_notify', function (e, wsMessage, wsEvent) {
            if (!wsMessage.metadata) {
                wsMessage.metadata = {};
            }
            if (wsMessage.metadata.type == 'withdraw' && wsMessage.metadata.withdraw_id) {
                // globals.removeNotify('push_manager_notify' + '_' + wsMessage.metadata.withdraw_id);
                $('#toast-container').find('.toast[data-wsid="' + wsMessage.metadata.withdraw_id + '"]').addClass('not-sync-ws-message').remove();
            } else {
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "onclick": function (e) {
                        if ($(e.target).closest('a').length > 0) {
                            e.preventDefault();
                            window.open(e.target.href);
                        } else {
                            window.open(('u/center/sendLetter?chatuid=' + wsMessage.metadata.currentManagerUid).toURL());
                        }
                        return false;
                    }
                }, wsMessage.metadata.notify);
                var text = common_utils.convertLinkToHtmlTag(wsMessage.text);
                globals.notify(notify_opts)
                    .success(text, '管理员 ' + (wsMessage.metadata.users ? '对你' : '') + '说：', 'push_manager_notify' + '_' + wsMessage.id)
                    .addClass('wsMessage push_manager_notify').attr('data-wsid', wsMessage.id)
                    .attr('title', '点击与当前推送消息的管理员建立对话');
            }
        });
        // 接收其他的消息需要登录
        if (validateLogin()) {
            // 通知管理员用户登录
            websocket_util.onPush('user_has_login', function (e, wsMessage, wsEvent) {
                var user = wsMessage.metadata.user;
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "onclick": function () {
                        window.open(('u/' + user.uid + '/home').toURL());
                    }
                });
                globals.notify(notify_opts)
                    .success('用户 <b>' + user.nickname + '</b> 刚刚登录~', '用户动态：', 'user_has_login' + '_' + wsMessage.id)
                    .addClass('wsMessage user_has_login').attr('data-wsid', wsMessage.id)
                    .attr('title', '登录时间：' + user.userStatus.last_login_time);
                console.log('用户 ' + user.nickname + ' 刚刚登录~，profile：', user);
            });
            // 通知管理员新用户注册
            websocket_util.onPush('new_register_user', function (e, wsMessage, wsEvent) {
                var user = wsMessage.metadata.user;
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "onclick": function () {
                        window.open(('u/' + user.uid + '/home').toURL());
                    }
                });
                globals.notify(notify_opts)
                    .success('“' + user.nickname + '”', '新用户注册：', 'new_register_user' + '_' + wsMessage.id)
                    .addClass('wsMessage new_register_user').attr('data-wsid', wsMessage.id)
                    .attr('title', '注册时间：' + user.userStatus.register_time);
            });
            // 提醒未读的历史消息
            websocket_util.onPush('unread_message_notify', function (e, wsMessage, wsEvent) {
                var letters = wsMessage.metadata.letters;
                var sysMsgs = wsMessage.metadata.sysMsgs;
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "onclick": function () {
                        return false;
                    }
                });
                if (letters.length > 0 || sysMsgs.length > 0) {
                    var html = '<div style="display: block;text-align: center;">';
                    if (letters.length > 0) {
                        html += '<div style="margin-top: 5px;margin-bottom: -4px;">' +
                            '<a href="' + ('u/center/messages').toURL() + '" target="_blank">未读私信消息 ' +
                            '<b style="text-decoration: underline;">' + letters.length + '条</a></b></div>';
                    }
                    if (sysMsgs.length > 0) {
                        html += '<div style="margin-top: 5px;margin-bottom: -4px;">' +
                            '<a href="' + ('u/center/messages').toURL() + '" target="_blank">未读系统消息 ' +
                            '<b style="text-decoration: underline;">' + sysMsgs.length + ' 条</b></a></div>';
                    }
                    html += '</div>';
                    globals.notify(notify_opts)
                        .success(html, '未读消息提醒：', 'unread_message_notify' + '_' + wsMessage.id)
                        .addClass('wsMessage unread_message_notify not-sync-ws-message').attr('data-wsid', wsMessage.id);
                }
            });
            // 新的关注者
            websocket_util.onPush('new_follower', function (e, wsMessage, wsEvent) {
                var user = wsMessage.metadata.user;
                var isFriend = wsMessage.metadata.isFriend;
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "onclick": function () {
                        window.open(('u/' + user.uid + '/home').toURL());
                    }
                });
                globals.notify(notify_opts)
                    .success('“' + user.nickname + '”', '新的粉丝：', 'new_follower' + '_' + wsMessage.id)
                    .addClass('wsMessage new_follower').attr('data-wsid', wsMessage.id);
                if (isFriend) {
                    globals.notify(notify_opts)
                        .success('由于相互关注，你与<br>“' + user.nickname + '”<br>成为好友', '新的好友：', 'new_friend' + '_' + wsMessage.id)
                        .addClass('wsMessage new_friend').attr('data-wsid', wsMessage.id);
                }
            });
            // 收到新私信
            websocket_util.onPush('receive_letter', function (e, wsMessage, wsEvent) {
                var user = wsMessage.metadata.user;
                var letter = wsMessage.metadata.letter;
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "onclick": function (e) {
                        // var getMessageTabHolder = function () {
                        //     var holder = null,
                        //         holder_cookie = common_utils.cookieUtil.get('message_tab_holder'),
                        //         holder_cookie_splits;
                        //     if (holder_cookie) {
                        //         holder_cookie_splits = holder_cookie.split(':');
                        //         holder = {
                        //             'tab_id': parseInt(holder_cookie_splits[0]),
                        //             'last_time': parseInt(holder_cookie_splits[1]),
                        //         };
                        //     }
                        //     return holder;
                        // }, openNewMessageTab = function (uid) {
                        //     common_utils.cookieUtil.set('message_tab_holder', `${websocket_util.pointer.tabId}:${new Date().getTime()}`);
                        //     websocket_util.pointer.chatPageWindow = window.open(('u/center/sendLetter?chatuid=' + uid).toURL());
                        //     if (!websocket_util.pointer.has_set_delete_mth_event) {
                        //         $(window).bind('beforeunload', function () {
                        //             var holder = getMessageTabHolder();
                        //             if (holder && holder.tab_id === websocket_util.pointer.tabId) {
                        //                 common_utils.cookieUtil.delete('message_tab_holder');
                        //             }
                        //         });
                        //         websocket_util.pointer.has_set_delete_mth_event = true;
                        //     }
                        // }, holder = getMessageTabHolder();
                        // if (holder) {
                        //     if (holder.tab_id === websocket_util.pointer.tabId) {
                        //         var chatPageWindow = websocket_util.pointer.chatPageWindow;
                        //         if (chatPageWindow && !chatPageWindow.closed) {
                        //             window.blur();
                        //             chatPageWindow.focus();
                        //             if (chatPageWindow.showChatModal) {
                        //                 chatPageWindow.showChatModal(user.uid);
                        //             }
                        //             common_utils.cookieUtil.set('message_tab_holder', `${websocket_util.pointer.tabId}:${new Date().getTime()}`);
                        //         }
                        //         return;
                        //     }
                        //     websocket_util.post({
                        //         "mapping": "transfer_data_in_tabs",
                        //         "metadata": {
                        //             "handle": "focus_message_tab",
                        //             "tabIds": [holder.tab_id],
                        //             "from_tab_id": websocket_util.pointer.tabId,
                        //             "chat_uid": user.uid
                        //         }
                        //     });
                        //     setTimeout(function () {
                        //         var newestHolder = getMessageTabHolder();
                        //         if (newestHolder && newestHolder.tab_id === holder.tab_id && newestHolder.last_time === holder.last_time) {
                        //             openNewMessageTab(user.uid);
                        //         }
                        //     }, 1200);
                        // } else {
                        //     openNewMessageTab(user.uid);
                        // }
                        ($(e.target).closest('a').length > 0) && e.preventDefault();
                        window.open(('u/center/sendLetter?chatuid=' + user.uid).toURL());
                    }
                });
                var text = common_utils.convertLinkToHtmlTag(letter.content);
                var toastElement = null;
                if (/<(img|iframe|video|embed|a|div)[\s\S]*?>/.test(text)) {
                    toastElement = globals.notify(notify_opts).success(text, user.nickname + ' 对你说：', 'receive_letter' + '_' + letter.leid);
                } else {
                    toastElement = globals.notify(notify_opts).success('<b>“' + text + '”</b>', user.nickname + ' 对你说：', 'receive_letter' + '_' + letter.leid);
                }
                toastElement.addClass('wsMessage receive_letter').attr('data-leid', letter.leid).attr('data-wsid', wsMessage.id);
                toastElement.on('contextmenu dragstart', 'img.forbidden-download,.image-widget.protect', function (e) {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return false;
                });
            });
            // 收到新评论
            websocket_util.onPush('receive_comment', function (e, wsMessage, wsEvent) {
                var comment = wsMessage.metadata.comment;
                var notify_opts = null;
                var msg = null;
                switch (comment.creationType) {
                    case 0:
                        var article = wsMessage.metadata.article;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                window.open(('a/detail/' + article.aid + '#comment_' + comment.cid).toURL());
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 在你的文章<br><b>“' + article.title + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        break;
                    case 1:
                        var photo = wsMessage.metadata.photo;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                window.open(('p/detail/' + photo.photo_id + '#comment_' + comment.cid).toURL());
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 对你的照片<br><b>“' + photo.photo_id + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        break;
                    case 2:
                        var video = wsMessage.metadata.video;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                window.open(('video/detail/' + video.video_id + '#comment_' + comment.cid).toURL());
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 对你的视频<br><b>“' + video.video_id + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        break;
                    case 3:
                        var album = wsMessage.metadata.album;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                window.open(('p/album/' + album.album_id + '#comment_' + comment.cid).toURL());
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 对你的相册<br><b>“' + album.name + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        break;
                    case 4:
                        var tagWrapper = wsMessage.metadata.tagWrapper;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                var link;
                                if (tagWrapper.topic == 0) {
                                    link = ('p/tag/' + tagWrapper.name + '?uid=' + tagWrapper.uid + '#comment_' + comment.cid).toURL();
                                } else {
                                    link = ('p/topic/' + tagWrapper.ptwid + '#comment_' + comment.cid).toURL();
                                }
                                window.open(link);
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 对你的照片合集<br><b>“' + tagWrapper.name + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        break;
                }
                if (msg) {
                    globals.notify(notify_opts)
                        .success(msg, '', 'receive_comment' + '_' + comment.cid)
                        .addClass('wsMessage receive_comment').attr('data-wsid', wsMessage.id).attr('data-cid', comment.cid)
                        .on('contextmenu dragstart', 'img.forbidden-download,.image-widget.protect', function (e) {
                            e.preventDefault();
                            e.stopImmediatePropagation();
                            return false;
                        });
                }
            });
            // 文章被收藏
            websocket_util.onPush('new_article_collected', function (e, wsMessage, wsEvent) {
                var user = wsMessage.metadata.user;
                var article = wsMessage.metadata.article;
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "onclick": function (e) {
                        if ($(e.target).closest('a').length == 0) {
                            window.open(('u/' + user.uid + '/home').toURL());
                        }
                    },
                    "timeOut": 70000
                });
                globals.notify(notify_opts)
                    .success('用户 <a style="text-decoration: underline;" href="' + ('u/' + user.uid + '/home').toURL() + '" target="_blank">' + user.nickname +
                        '</a><br>收藏了你的文章<br><b>“ <a style="text-decoration: underline;" href="' + ('a/detail/' + article.aid).toURL() + '" target="_blank">' + article.title + '</a> ”</b>',
                        '', 'new_article_collected' + '_' + wsMessage.id)
                    .addClass('wsMessage new_article_collected').attr('data-wsid', wsMessage.id);
            });
            // 当别的用户撤回私信消息
            websocket_util.onPush('withdraw_letter', function (e, wsMessage, wsEvent) {
                var user = wsMessage.metadata.user;
                var letter = wsMessage.metadata.letter; // 被撤回的私信
                if (letter) {
                    $('#toast-container').find('.toast.receive_letter[data-leid="' + letter.leid + '"]').remove();
                    var notify_opts = $.extend({}, notify_ws_opts, {
                        "timeOut": 10000,
                        "hideOnHover": false,
                        "onclick": function () {
                            window.open(('u/center/sendLetter?chatuid=' + user.uid).toURL()); // 打开聊天框
                        }
                    });
                    globals.notify(notify_opts)
                        .info(user.nickname + ' 撤回了一条消息.', '', 'withdraw_letter' + '_' + wsMessage.id)
                        .addClass('wsMessage withdraw_letter').attr('data-wsid', wsMessage.id);
                }
            });
            // 标签间通信
            websocket_util.onPush('transfer_data_in_tabs', function (e, wsMessage, wsEvent) {
                var tabMessage = wsMessage.metadata;
                if (tabMessage) {
                    switch (tabMessage.handle) {
                        case "remove_ws_message":
                            $('#toast-container').find('.toast[data-wsid="' + tabMessage.ws_message_id + '"]').addClass('not-sync-ws-message').remove();
                            break;
                        // case "focus_message_tab":
                        //     var chatPageWindow = websocket_util.pointer.chatPageWindow;
                        //     if (chatPageWindow && !chatPageWindow.closed) {
                        //         window.focus();
                        //         chatPageWindow.focus();
                        //         if (chatPageWindow.showChatModal) {
                        //             chatPageWindow.showChatModal(tabMessage.chat_uid);
                        //         }
                        //         common_utils.cookieUtil.set('message_tab_holder', `${websocket_util.pointer.tabId}:${new Date().getTime()}`);
                        //     }
                        //     break;
                        default:
                            break;
                    }
                }
            });
        }
    };

    var context = {
        "replaceConfig": replaceConfig,
        "init": init,
        "autoLogin": autoLogin,
        "jumpLogin": jumpLogin,
        "showLoginModal": showLoginModal,
        "validateLogin": validateLogin,
        "clearLoginStatus": clearLoginStatus,
        "getCurrentUserId": getCurrentUserId,
        "getCurrentUser": getCurrentUser,
        "isRememberLogin": isRememberLogin,
        "equalsLoginUser": equalsLoginUser,
        "runOnLogin": runOnLogin,
        "checkLoginByRequest": checkLoginByRequest
    };

    context.init();

    return context;
});
