/**
 * 用户主页
 * @author Jeffrey.Deng
 * @date 2018/4/9
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils);
    }
})(function ($, bootstrap, domReady, toastr, common_utils) {

    var initPageJump = function () {
        var params = common_utils.parseURL(document.location.href).params;
        var page = "";
        $.each(params, function (key, value) {
            if (key != "method" && key != "page") {
                page += "&" + key + "=" + value;
            }
        });
        $(".page-navigator").find(".page-trigger").each(function (i, a) {
            if (page) {
                a.href = document.location.pathname + "?" + page.substring(1) + "&page=" + a.getAttribute("page");
            } else {
                a.href = document.location.pathname + "?" + "page=" + a.getAttribute("page");
            }
        });
    };

    // 图片加载失败显示默认图片
    function replaceLoadErrorImgToDefault(parentNode) {
        $(parentNode).find("img").one("error", function (e) {
            $(this)
                .attr("src", $("#cloudPath").attr("href") + "res/img/img_load_error_default.jpg")
                .attr("title", "该图片加载失败~");
        });
    }

    replaceLoadErrorImgToDefault($("#main"));

    domReady(function () {

        initPageJump();

        $('#userInfo_trigger').click(function () {
            var uid = $(this).attr('uid');
            $.get("user.api?method=getUser", {"uid": uid}, function (response) {
                if (response.status == 200) {
                    var user = response.data.user;
                    var userInfoModal = $('#userInfoModal');
                    userInfoModal.find('img[name="head_photo"]').attr("src", user.head_photo);
                    userInfoModal.find('span[name="usergroup"]').html(user.userGroup.group_name);
                    userInfoModal.find('span[name="nickname"]').html(user.nickname);
                    userInfoModal.find('span[name="sex"]').html(user.sex);
                    userInfoModal.find('span[name="description"]').html(user.description == "" ? "未填写" : user.description);
                    userInfoModal.find('span[name="birthday"]').html(user.birthday == "" ? "未填写" : user.birthday);
                    userInfoModal.find('span[name="address"]').html(user.address == "" ? "未填写" : user.address);
                    userInfoModal.find('span[name="weibo"]').html(user.weibo == "" ? "未填写" : user.weibo);
                    userInfoModal.find('span[name="site"]').html(user.site == "" ? "未填写" : ('<a href="' + user.site + '" target="_blank">' + user.site + '</a>'));
                    userInfoModal.find('span[name="qq"]').html(user.qq == "" ? "未填写" : user.qq);
                    userInfoModal.find('span[name="register_time"]').html(user.userStatus ? user.userStatus.register_time : "无权限");
                    userInfoModal.find('span[name="articleCount"]').html(user.userStats.articleCount);
                    userInfoModal.find('span[name="followingCount"]').html(user.userStats.followingCount);
                    userInfoModal.find('span[name="followerCount"]').html(user.userStats.followerCount);
                    userInfoModal.find('span[name="says"]').html(user.says == "" ? "未填写" : user.says);
                    userInfoModal.modal();
                } else {
                    toastr.error("用户信息获取失败", response.message);
                }
            });
        });
    });
});
