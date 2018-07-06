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
        if (login_handle.validateLogin()) {
            if ($('.follow').attr('followed') == "false") {
                $.ajax({
                    url: 'user.do?method=follow',
                    type: "POST",
                    data: {'uid': hostUser},
                    success: function (data) {
                        if (data.flag == 200) {
                            toastr.success('关注成功！');
                            $('.follow').attr('followed', 'true').html('<i class="fa fa-thumbs-up"></i>已关注');
                        } else if (data.flag == 204) {
                            toastr.success(data.info);
                            $('.follow').attr('followed', 'true').html('<i class="fa fa-thumbs-up"></i>已关注');
                        } else if (data.flag == 201) {
                            toastr.success('关注成功！');
                            toastr.info('你们由于互相关注，自动成为好友！');
                            $('.follow').attr('followed', 'true').html('<i class="fa fa-thumbs-up"></i>已关注');
                        } else {
                            toastr.error(data.info, '关注失败！');
                            console.warn("Error Code: " + data.flag);
                        }

                    },
                    error: function () {
                        toastr.error('关注失败，服务器错误！');
                    }
                });
            } else if (window.confirm("确定要取消关注吗？")) {
                $.ajax({
                    url: 'user.do?method=unFollow',
                    type: "POST",
                    data: {'uid': hostUser},
                    success: function (data) {
                        if (data.flag == 200) {
                            toastr.success('取消关注成功！');
                            $('.follow').attr('followed', 'false').html('<i class="fa fa-thumbs-up"></i>关注');
                        } else if (data.flag == 201) {
                            toastr.success('取消关注成功！');
                            toastr.info('好友关系也自动取消！');
                            $('.follow').attr('followed', 'false').html('<i class="fa fa-thumbs-up"></i>关注');
                        } else {
                            toastr.error(data.info, '取消关注失败！');
                            console.warn("Error Code: " + data.flag);
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
                $('.follow').eq(0).click();
            });
        }

    }

    function letter(hostUser) {
        if (login_handle.validateLogin()) {
            window.open("user.do?method=profilecenter&action=sendLetter&chatuid=" + hostUser);
        } else {
            //弹出登陆框
            login_handle.showLoginModal("user.do?method=profilecenter&action=sendLetter&chatuid=" + hostUser);
        }
    }

    /**
     * 检查登录者是否关注了该作者
     */
    function checkFollow(hostUser) {
        if (!login_handle.equalsLoginUser(hostUser)) {
            $.ajax({
                url: 'user.do?method=checkFollow',
                data: {'uid': hostUser},
                success: function (data) {
                    if (data.flag == 200) {
                        console.log("已关注该作者");
                        $('.follow').attr('followed', 'true').html('<i class="fa fa-thumbs-up"></i>已关注');
                    }
                }
            });
        }
    }

    domReady(function () {

        var hostUser = $('#h_auid').attr('auid');

        $('.follow').click(function () {
            follow(hostUser);
        });
        $('.letter').click(function () {
            letter(hostUser);
        });

        checkFollow(hostUser);
    });

});