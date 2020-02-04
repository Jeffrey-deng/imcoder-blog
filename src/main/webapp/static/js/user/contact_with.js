/**
 *  @desc: 处理关注与私信的action JS
 *  @author dengchao
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'login_handle'], factory);
    } else {
        // Browser globals
        window.contact_with = factory(window.jQuery, $(document).ready, toastr, login_handle);
    }
})(function ($, domReady, toastr, login_handle) {

    function follow(hostUser) {
        var $followBtn = $('.follow');
        if (login_handle.validateLogin()) {
            if ($followBtn.attr('followed') == "false") {
                $.ajax({
                    url: 'user.api?method=follow',
                    type: "POST",
                    data: {'uid': hostUser},
                    success: function (response) {
                        if (response.status == 200) {
                            var data = response.data;
                            if (data.type == 1) {
                                toastr.success('关注成功~');
                                $followBtn.attr('followed', 'true').html('<i class="fa fa-thumbs-up"></i>已关注');
                            } else if (data.type == 0) {
                                toastr.success(data.info);
                                $followBtn.attr('followed', 'true').html('<i class="fa fa-thumbs-up"></i>已关注');
                            } else if (data.type == 2) {
                                toastr.success('关注成功~');
                                toastr.info('你们由于互相关注，自动成为好友~');
                                $followBtn.attr('followed', 'true').html('<i class="fa fa-thumbs-up"></i>已关注');
                            }
                        } else {
                            toastr.error(response.message, '关注失败！');
                            console.warn("Error Code: " + response.status);
                        }

                    },
                    error: function () {
                        toastr.error('关注失败，服务器错误！');
                    }
                });
            } else if (window.confirm("确定要取消关注吗？")) {
                $.ajax({
                    url: 'user.api?method=removeFollow',
                    type: "POST",
                    data: {'uid': hostUser},
                    success: function (response) {
                        if (response.status == 200) {
                            var data = response.data;
                            if (data.type == 1) {
                                toastr.success('取消关注成功~');
                                $followBtn.attr('followed', 'false').html('<i class="fa fa-thumbs-up"></i>关注');
                            } else if (data.type == 2) {
                                toastr.success('取消关注成功~');
                                toastr.info('好友关系也自动取消~');
                                $followBtn.attr('followed', 'false').html('<i class="fa fa-thumbs-up"></i>关注');
                            }
                        } else {
                            toastr.error(response.message, '取消关注失败~');
                            console.warn("Error Code: " + response.status);
                        }

                    },
                    error: function () {
                        toastr.error('取消关注失败，服务器错误！');
                    }
                });
            }
        } else {
            //弹出登陆框
            login_handle.showLoginModal("", function () {
                $followBtn.eq(0).click();
            });
        }

    }

    function letter(hostUser) {
        if (login_handle.validateLogin()) {
            window.open("u/center/sendLetter?chatuid=" + hostUser);
        } else {
            //弹出登陆框
            login_handle.showLoginModal("u/center/sendLetter?chatuid=" + hostUser);
        }
    }

    /**
     * 检查登录者是否关注了该作者
     */
    function checkFollow(hostUser) {
        if (!login_handle.equalsLoginUser(hostUser)) {
            $.ajax({
                url: 'user.api?method=checkFollow',
                data: {'uid': hostUser},
                success: function (reponse) {
                    if (reponse.status == 200 && reponse.data.type == 1) {
                        console.debug("已关注该作者");
                        $('.follow').attr('followed', 'true').html('<i class="fa fa-thumbs-up"></i>已关注');
                    }
                }
            });
        }
    }

    domReady(function () {

        var hostUser = $("#first").find(".slogan_name").attr("data-user-id");

        $('.follow').click(function () {
            follow(hostUser);
        });
        $('.letter').click(function () {
            letter(hostUser);
        });

        checkFollow(hostUser);
    });

});