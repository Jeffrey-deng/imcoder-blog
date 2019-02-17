/**
 * Created by Jeffrey.Deng on 2018/4/9.
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
        var page = "user.do?method=home";
        $.each(params, function (key, value) {
            if (key != "method" && key != "jumpPage") {
                page += "&" + key + "=" + value;
            }
        });
        $(".page-navigator").find(".page-trigger").each(function (i, a) {
            a.href = page + "&jumpPage=" + a.getAttribute("page");
        });
    };

    domReady(function () {

        initPageJump();

        $('#userInfo_trigger').click(function () {
            var uid = $(this).attr('uid');
            $.get("user.do?method=profile", {"uid": uid}, function (user) {
                var userInfoModal = $('#userInfoModal');
                userInfoModal.find('img[name="head_photo"]').attr("src", $('#staticPath').attr('href') + user.head_photo);
                userInfoModal.find('span[name="usergroup"]').html(user.userGroup.group_name);
                userInfoModal.find('span[name="nickname"]').html(user.nickname);
                userInfoModal.find('span[name="sex"]').html(user.sex);
                userInfoModal.find('span[name="description"]').html(user.description == "" ? "未填写" : user.description);
                userInfoModal.find('span[name="birthday"]').html(user.birthday == "" ? "未填写" : user.birthday);
                userInfoModal.find('span[name="address"]').html(user.address == "" ? "未填写" : user.address);
                userInfoModal.find('span[name="weibo"]').html(user.weibo == "" ? "未填写" : user.weibo);
                userInfoModal.find('span[name="site"]').html(user.site == "" ? "未填写" : user.site);
                userInfoModal.find('span[name="qq"]').html(user.qq == "" ? "未填写" : user.qq);
                userInfoModal.find('span[name="register_time"]').html(user.userStatus.register_time);
                userInfoModal.find('span[name="articleCount"]').html(user.userStatus.articleCount);
                userInfoModal.find('span[name="followCount"]').html(user.userStatus.followCount);
                userInfoModal.find('span[name="fansCount"]').html(user.userStatus.fansCount);
                userInfoModal.find('span[name="says"]').html(user.says == "" ? "未填写" : user.says);
                userInfoModal.modal();
            });
        });
    });
});
