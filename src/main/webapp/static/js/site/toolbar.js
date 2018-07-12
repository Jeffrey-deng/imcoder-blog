(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'stickUp', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.toolbar = factory(window.jQuery, $(document).ready, toastr, jQuery.fn.stickUp, common_utils, login_handle);
    }
})(function ($, domReady, toastr, stickUp, common_utils, login_handle) {

    var _self = $('#header');

    var config = {
        "location_info": common_utils.parseURL(window.location.href),
        "callback": {
            "action_search": function (key) {
                if (this.config.location_info.file == "photo.do") {
                    if (key == "") {
                        window.open("photo.do?method=dashboard&mode=photo");
                    } else if (/^[\d]+$/.test(key)) {
                        window.open("photo.do?method=dashboard&mode=photo&photo_id=" + key + "&name=" + key + "&description=" + key + "&tags=" + key + "&logic_conn=or");
                    } else {
                        window.open("photo.do?method=dashboard&mode=photo&name=" + key + "&description=" + key + "&tags=" + key + "&logic_conn=or");
                    }
                } else {
                    window.open("article.do?method=list&title=" + key);
                }
            }
        },
        "placeholder": (common_utils.parseURL(window.location.href).file == "photo.do" ? "输入关键字搜索照片" : "输入关键字搜索" )
    };

    var rewriteSearch = function (action_search, placeholder) {
        action_search && (config.callback.action_search = action_search);
        placeholder && _self.find('.toolbar_search_input').attr("placeholder", placeholder);
    };

    // bind toolbar always on top
    function bind_always_top() {
        $("#header").stickUp({
            parts: {
                0: 'header'
            }
            /* itemClass: 'menuItem',
             itemHover: 'active',
             topMargin: 'auto' */
        });
    }

    //回到顶部
    function bind_goTop() {
        if ($('#goTop').length > 0) {
            $('#goTop').css("bottom", "-40px");
            $('#goTop').click(function (event) {
                event.preventDefault();
                $('html,body').animate({scrollTop: 0}, 500);
            });
        }
        if ($('#goBottom').length <= 0) {
            $("body").append(
                '<div id="goBottom" class="goBottom" style="bottom: 25px;"><div class="stick"></div><div class="arrow"></div>'
            );
        }
        $('#goBottom').click(function (event) {
            event.preventDefault();
            var h = $(document).height() - $(window).height();
            $('html,body').animate({scrollTop: h}, 750);
        });
        $(window).scroll(function () {
            if ($(this).scrollTop() > 150) {
                $('#goTop').stop().animate({bottom: '70px'}, 300);
                $('#goBottom').stop().animate({bottom: '25px'}, 300);
            } else {
                $('#goTop').stop().animate({bottom: '-40px'}, 300);
                $('#goBottom').stop().animate({bottom: '-40px'}, 300);
            }
        });
    }

    //
    function init_toolbar_href() {
        // init tag a href
        _self.find('.toolbar_user_setting').attr('href', "user.do?method=profilecenter&action=settings");

        // bind_click
        _self.find('.toolbar_jump_writeblog').click(function () {
            jump_writeblog();
        });
        _self.find('.toolbar_jump_login').click(function () {
            login_handle.jumpLogin(window.location.href, true);
        });
        _self.find('.toolbar_user_logout').click(function () {
            logout();
        });

        _self.find('.toolbar_jump_albums').attr("href", "photo.do?method=dashboard&mode=photo");
    }

    // bind search btn
    function bind_search() {
        _self.find('.toolbar_search_input').attr("placeholder", config.placeholder);
        _self.find('.toolbar_search_trigger').click(function () {
            var key = _self.find('.toolbar_search_input').val();
            config.callback.action_search.call(context, key);
        });
        _self.find('.toolbar_search_input').parent().parent().keydown(function (e) {
            e.defaultPrevented;
            var theEvent = e || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            if (code == "13") {//keyCode=13是回车键
                _self.find('.toolbar_search_trigger').click();
                //防止触发表单提交 返回false
                return false;
            }
        });
    }

    //写博客
    function jump_writeblog() {
        if (!login_handle.validateLogin()) {
            //弹出登陆框
            login_handle.jumpLogin("article.do?method=edit&flag=new", true);
        } else {
            //跳转
            window.open("article.do?method=edit&flag=new");
        }
    }

    //安全退出
    function logout() {
        login_handle.clearLoginStatus();
    }

    domReady(function () {
        bind_always_top();
        bind_goTop();
        init_toolbar_href();
        bind_search();
    });

    var context = {
        "view": _self,
        "config": config,
        "rewriteSearch": rewriteSearch
    };

    return context;
});