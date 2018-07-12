/**
 * 登录
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'common_utils'], factory);
    } else {
        // Browser globals
        window.login_handle = factory(window.jQuery, null, toastr, common_utils);
    }
})(function ($, bootstrap, toastr, common_utils) {

    $(document).ajaxError(function () {
        toastr.error("An error occurred!", "执行Ajax请求时发生错误");
    });

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
        //保存跳转链接 默认刷新本页面
        jumpUrl: window.location.href,
        selector: {
            "login_form": "#login_form",
            "login_modal": "#login_Modal",
            "loginModal_trigger": ".loginModal_trigger",
            "uid_element": "body"
        },
        uid: 0
    };

    var replaceConfig = function (options) {
        init(options);
    };

    var init = function (options) {
        $.extend(true, config, options);
        if (!$(config.selector.uid_element).attr("uid") && common_utils.cookieUtil.get("login_status") == "true") {
            common_utils.cookieUtil.set("login_status", "false");
            common_utils.cookieUtil.delete("uid");
        }
        pointer.login_form = $(config.selector.login_form);
        pointer.login_modal = $(config.selector.login_modal);
        pointer.login_form.find('input[name="remember"]').prop("checked", true);
        bindEvent();
        //初始化JumpUrl
        initJumpUrl();
    };

    /**
     * 自动登陆, 手动提交token
     * @param {Boolean} refresh - 自动登录后是否刷新页面，默认true
     * @param {Function} callback(isLogin) - callback为空时为ajax同步请求
     */
    var autoLogin = function (refresh, callback) {
        (refresh === undefined) && (refresh = true);
        var uid_ele = $(config.selector.uid_element).attr("uid");
        var need_login = common_utils.cookieUtil.get("login_status") == "false" || uid_ele == undefined || uid_ele == "";
        if (need_login && window.location.href.indexOf("method=jumpLogin") == -1) {
            var data = {};
            data.uid = common_utils.cookieUtil.get("uid");
            data.token = common_utils.cookieUtil.get("token");
            $.ajax({
                url: 'user.do?method=login',
                type: "POST",
                async: callback ? true : false,
                data: data,
                success: function (data) {
                    localStorage.setItem("checkLogin_lastTime", JSON.stringify({"time": new Date().getTime()}));
                    if (data.flag == 200) {
                        common_utils.cookieUtil.set("login_status", "true");
                        $(config.selector.uid_element).attr("uid", data.loginUser.uid);
                        callback && callback(true);
                        if (refresh) {
                            window.location.reload(true)
                        } else {
                            console.log("auto login success at : " + common_utils.formatDate(new Date, "yyyy-MM-dd hh:mm:ss"));
                        }
                    } else {
                        common_utils.cookieUtil.set("login_status", "false");
                        common_utils.cookieUtil.delete("uid");
                        common_utils.cookieUtil.delete("token");
                        console.log("auto login fail at : " + common_utils.formatDate(new Date, "yyyy-MM-dd hh:mm:ss"));
                        console.log("Error Code: " + data.flag);
                        callback && callback(false);
                    }
                }
            });
        }
    };

    var bindEvent = function () {
        pointer.login_form.find('.login_submit').click(function () {
            var form = {};
            form.username = pointer.login_form.find('input[name="username"]').val();
            form.password = pointer.login_form.find('input[name="password"]').val();
            form.remember = pointer.login_form.find('input[name="remember"]').prop('checked');
            form.remember === undefined && (form.remember = true);
            login(form);
        });
        pointer.login_form.keydown(function (e) {
            e.defaultPrevented;
            var theEvent = e || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            if (code == "13") {//keyCode=13是回车键
                $(this).find('.login_submit').click();
                //防止触发表单提交 返回false
                return false;
            }
        });
        $(config.selector.loginModal_trigger).click(function () {
            showLoginModal();
        });
        if (pointer.login_modal.length > 0) {
            pointer.login_form.find('input[name="remember"]').click(function (e) {
                var remember = $(e.currentTarget).prop('checked');
                if (remember) {
                    //toastr.success("关闭记住密码请点击导航栏退出登录", {"timeOut": "8000"});
                    toastr.success("同一IP下会保持登录状态", "已开启自动登录", {"timeOut": "6000"});
                } else {
                    toastr.success("登录后会清除之前的令牌", "将会关闭自动登录", {"timeOut": "5000"});
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
        var params = common_utils.parseURL(window.location.href).params;
        //如果是登录页面登录，且不是后端转发到登录页面的，则设置覆盖一个初始值
        if (pointer.login_form.find('.login_submit').attr('jumpUrl') && params['method'] == 'jumpLogin') {
            config.jumpUrl = pointer.login_form.find('.login_submit').attr('jumpUrl');
        }
        //如果地址中有跳转链接，则覆盖
        var continue_url = params['continue'];
        if (continue_url) {
            var decoderUrl = decodeURIComponent(decodeURIComponent(continue_url));
            config.jumpUrl = decoderUrl;
        }
    };

    /**
     * 跳转到登录
     * @param {String} url - 跳转链接
     * @param {Boolean} modalFirst - 是否以模式框登录为优先，默认true
     */
    var jumpLogin = function (url, modalFirst) {
        url = arguments[0] || window.location.href;
        modalFirst = (arguments[1] || arguments[1] === false) ? arguments[1] : true;
        if (modalFirst && pointer.login_modal.length > 0) {
            showLoginModal(url);
        } else {
            var encoderUrl = encodeURIComponent(encodeURIComponent(url));
            window.location.href = "user.do?method=jumpLogin&continue=" + encoderUrl;
        }
    };

    /** 弹出登录框
     * @param {String} url - 登录后跳转的链接，为最高优先级，可以不填
     * @param {Function} call - 登录后执行的回调函数，可以不填
     */
    var showLoginModal = function (url, call) {
        //再一次执行初始化，防止弹出登录框后不登陆直接关闭后，下次再弹出登陆框jumpUrl错误
        initJumpUrl();
        //只有一个参数时判断为何物
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

        //等于空字符串清除hash
        if (url == "") {
            if (window.location.hash) {
                window.location.hash = '';
                config.jumpUrl = window.location.href;
            }
        }
        isRememberLogin() && pointer.login_form.find('input[name="remember"]').prop("checked", true);
        pointer.login_modal.modal({backdrop: 'static', keyboard: false});
    };

    //登录请求
    var login = function (form) {
        if (utils.validateParams(form.username, form.password)) {
            $.ajax({
                url: 'user.do?method=login',
                type: "POST",
                data: form,
                dataType: 'json',
                success: function (data) {
                    if (data.flag == 200) {
                        if (pointer.login_modal.length > 0) {
                            pointer.login_modal.modal('hide');
                        }
                        toastr.success('正在跳转...');

                        //记住密码
                        if (form.remember == false) {
                            common_utils.cookieUtil.set("uid", data.loginUser.uid);
                            common_utils.cookieUtil.delete("token");
                        } else {
                            var date = new Date();
                            var secure = common_utils.parseURL(document.location.href).protocol == "https" ? true : false;
                            common_utils.cookieUtil.set("uid", data.loginUser.uid, date.getTime() + 31104000000, null, null, secure);
                            common_utils.cookieUtil.set("token", data.token, date.getTime() + 31104000000, null, null, secure);
                        }
                        common_utils.cookieUtil.set("login_status", "true");
                        $(config.selector.uid_element).attr('uid', data.loginUser.uid);
                        localStorage.login_time = common_utils.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss");
                        localStorage.checkLogin_lastTime = JSON.stringify({"time": new Date().getTime()});

                        //如果有回调函数则执行
                        if (pointer.callback) {
                            pointer.callback();
                            //让页面跳转慢一点以显示回调函数执行结果给用户
                            setTimeout(function () {
                                utils.go(config.jumpUrl);
                            }, 1000);
                        } else {
                            utils.go(config.jumpUrl);
                        }
                    } else if (data.flag == 403) {
                        toastr.error("账号被冻结，详情联系 chao.devin@gmail.com！", "提示",
                            {
                                "timeOut": 0,
                                onclick: function () {
                                    window.open("mailto:chao.devin@gmail.com");
                                }
                            });
                    } else {
                        toastr.error(data.info, "提示");
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {
                    toastr.error("出现错误,可能服务器出问题了！", "提示");
                }
            });
        }
    };

    /**
     * 验证是否登陆 超过15分钟，强力登陆
     * @returns {Boolean}
     */
    var validateLogin = function () {
        /*var loginAgain = true;
         var checkLoginLastTime = localStorage.getItem("checkLogin_lastTime");
         if (checkLoginLastTime) {
         checkLoginLastTime = JSON.parse(checkLoginLastTime);
         if (checkLoginLastTime.time) {
         var interval = new Date().getTime() - parseInt(checkLoginLastTime.time);
         if (interval < 900000) {
         loginAgain = false;
         }
         }
         } else {
         localStorage.setItem("checkLogin_lastTime", JSON.stringify({"time": new Date().getTime()}));
         loginAgain = false;
         }
         if (loginAgain) {
         if (isRememberLogin()) {
         common_utils.cookieUtil.set("login_status", "false");
         autoLogin(false);
         } else {
         checkLoginByRequest();
         }
         }*/
        if (window.navigator.cookieEnabled) {
            var e = common_utils.cookieUtil.get("login_status") == "true";
            if (e) {
                $(config.selector.uid_element).attr("uid", common_utils.cookieUtil.get("uid"));
            }
            return e;
        } else {
            var uid = $(config.selector.uid_element).attr('uid');
            return uid ? true : false;
        }
    };

    /**
     * 登录后运行
     * @param {Function} callback(isLogin)
     * @param {Boolean} force - 严格模式
     */
    var runOnLogin = function (callback, force) {
        if (force) {
            checkLoginByRequest(function (isLogin) {
                if (isLogin) {
                    callback(true);
                } else {
                    callback(false);
                }
            });
        } else if (validateLogin()) {
            callback(true);
        } else {
            callback(false);
        }
    };

    /**
     * 发生请求检查登陆状态
     * @param {Function} callback(isLogin) - callback为空时为ajax同步请求
     */
    var checkLoginByRequest = function (callback) {
        $.ajax({
            url: 'user.do?method=profile',
            type: "GET",
            async: callback ? true : false,
            success: function (user) {
                localStorage.setItem("checkLogin_lastTime", JSON.stringify({"time": new Date().getTime()}));
                var isLogin = user ? true : false;
                if (isLogin) {
                    common_utils.cookieUtil.set("login_status", "true");
                } else {
                    common_utils.cookieUtil.set("login_status", "false");
                }
                callback && callback(isLogin);
            }
        });
    };

    /**
     * 退出登录
     */
    var clearLoginStatus = function () {
        $.post('user.do?method=logout', function (data) {
            if (data.flag == 200) {
                toastr.success('正在退出...');
                common_utils.cookieUtil.set("login_status", "false");
                common_utils.cookieUtil.delete("uid");
                common_utils.cookieUtil.delete("token");
                window.location.reload(true);
            } else {
                toastr.error(data.info, "手动退出失败！");
                toastr.error('请尝试关闭浏览器退出！');
                console.log("Error Code: " + data.flag);
            }
        });
    };

    /**
     * 当前登录用户id
     * @returns {String} uid - 用户id
     */
    var getCurrentUserId = function () {
        if (window.navigator.cookieEnabled) {
            return common_utils.cookieUtil.get("uid");
        } else {
            return $(config.selector.uid_element).attr('uid');
        }
    };

    /**
     * 用户是否记住了密码
     * @returns {boolean}
     */
    var isRememberLogin = function () {
        if (common_utils.cookieUtil.get("uid") && common_utils.cookieUtil.get("token")) {
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
        validateParams: function (username, password) {
            var e = true;
            if (username == "") {
                toastr.info("未填写账号！");
                e = false;
            }
            if (password == "") {
                toastr.info("未填写密码！");
                e = false;
            }
            return e;
        },
        //判断是否登录后刷新原来的页面
        IsCurrentPage: function (jumpUrl) {
            return (window.location.href == jumpUrl) || (jumpUrl.indexOf('#') === 0);
        },
        go: function (jumpUrl) {
            //如果是登录后刷新原来的页面，就reload页面，防止浏览器直接读取缓存而不刷新
            if (utils.IsCurrentPage(jumpUrl)) {
                window.location.reload(true);
            }
            window.location.href = jumpUrl;
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
        "isRememberLogin": isRememberLogin,
        "equalsLoginUser": equalsLoginUser,
        "runOnLogin": runOnLogin,
        "checkLoginByRequest": checkLoginByRequest
    };

    context.init();

    return context;
});
