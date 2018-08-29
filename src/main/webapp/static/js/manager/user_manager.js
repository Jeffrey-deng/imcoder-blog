/**
 * 用户管理
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, null, common_utils);
    }
})(function ($, bootstrap, domReady, toastr, common_utils) {
    domReady(function () {
        $('#user_tds').find('tr').each(function (index, tr) {
            if (index == 0) return;
            $(tr).click(function () {
                var uid = $(this).attr('uid');
                $.get("user.do?method=profile", {"uid": uid}, function (user) {
                    var userInfoModal = $('#userInfoModal');
                    userInfoModal.find('img[name="head_photo"]').attr("src", $('#staticPath').attr('href') + user.head_photo);
                    userInfoModal.find('span[name="uid"]').html(user.uid);
                    userInfoModal.find('span[name="usergroup"]').html(user.userGroup.group_name);
                    userInfoModal.find('span[name="nickname"]').html(user.nickname);
                    userInfoModal.find('span[name="username"]').html(user.username);
                    userInfoModal.find('span[name="email"]').html(user.email);
                    userInfoModal.find('span[name="sex"]').html(user.sex);
                    userInfoModal.find('span[name="description"]').html(user.description == "" ? "未填写" : user.description);
                    userInfoModal.find('span[name="birthday"]').html(user.birthday == "" ? "未填写" : user.birthday);
                    userInfoModal.find('span[name="address"]').html(user.address == "" ? "未填写" : user.address);
                    userInfoModal.find('span[name="phone"]').html(user.phone == "" ? "未填写" : user.phone);
                    userInfoModal.find('span[name="weibo"]').html(user.weibo == "" ? "未填写" : user.weibo);
                    userInfoModal.find('span[name="qq"]').html(user.qq == "" ? "未填写" : user.qq);
                    userInfoModal.find('span[name="register_time"]').html(user.register_time);
                    userInfoModal.find('span[name="articleCount"]').html(user.articleCount);
                    userInfoModal.find('span[name="followCount"]').html(user.followCount);
                    userInfoModal.find('span[name="fansCount"]').html(user.fansCount);
                    userInfoModal.find('span[name="says"]').html(user.says == "" ? "未填写" : user.says);
                    userInfoModal.find('span[name="loginIP"]').html(user.loginIP == "" ? "暂无IP" : user.loginIP);
                    userInfoModal.find('span[name="lock_status"]').html(user.lock_status == 0 ? "可用" : "冻结");
                    userInfoModal.modal();
                });
            });
        });

        $('#userInfoModal').find('span[name="loginIP"]').click(function (e) {
            var ip = this.innerText;
            if (ip != "暂无IP") {
                getIpLocation(ip)
            }
        });
    });

    function getIpLocation(ip) {
        $.get("site.do?method=ipLocation", {"ip": ip}, function (data) {
            if (data && data.flag == 200 && data.location) {
                common_utils.notify({
                    "progressBar": false,
                    "iconClass": "toast-success-no-icon"
                }).success(data.location, "", "notify_ip_location");
            } else {
                toastr.error("出了一点小问题...", data.flag);
            }
        });
    }
});
