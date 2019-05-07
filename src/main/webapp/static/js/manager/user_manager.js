/**
 * 用户管理
 * @author Jeffrey.deng
 * @date 2018/1/11
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

    function loadUserProfile(uid, call) {
        $.get("user.api?method=getUser", {"uid": uid}, function (response) {
            if (response.status == 200) {
                call && call(response.data.user);
            }
        });
    }

    function getIpLocation(ip) {
        $.get("tool.api?method=getIpLocation", {"ip": ip}, function (response) {
            if (response.status == 200 && response.data.location) {
                common_utils.notify({
                    "progressBar": false,
                    "iconClass": "toast-success-no-icon"
                }).success(response.data.location, "", "notify_ip_location");
            } else {
                toastr.error("出了一点小问题...", response.status);
            }
        });
    }

    function loadUserGroupList(call) {
        $.get("manager.api?method=getUserGroupList", function (response) {
            if (response.status == 200) {
                call && call(response.data.userGroups);
            } else {
                toastr.error(response.message, "获取组列表错误");
                console.warn("Error Code: " + response.status);
            }
        }).fail(function (XHR, TS) {
            toastr.error("获取组列表失败，错误：" + TS);
        });
    }

    function updateUserGroup(userGroup, call) {
        $.post("manager.api?method=updateUserGroup", userGroup, function (response) {
            if (response.status == 200) {
                call && call(response.data.userGroup);
            } else {
                toastr.error(response.message.replace(/\n/g, "<br>"), "错误");
                console.warn("Error Code: " + response.status);
            }
        }).fail(function (XHR, TS) {
            toastr.error("更换组失败，错误：" + TS);
        });
    }

    domReady(function () {

        loadUserGroupList(function (userGroupList) {
            var html = "";
            $.each(userGroupList, function (i, userGroup) {
                html += '<option value="' + userGroup.gid + '">' + userGroup.group_name + '</option>'
            });
            $('#userInfoModal').find('select[name="usergroup"]').html(html);
        });

        $("#user_tds").on("click", ".user-tr", function (e) {
            if ($(e.target).closest('a').length > 0) {
                return;
            }
            var uid = $(this).attr('data-uid');
            loadUserProfile(uid, function (user) {
                var userInfoModal = $('#userInfoModal');
                userInfoModal.find('img[name="head_photo"]').attr("src", user.head_photo);
                userInfoModal.find('span[name="uid"]').html(user.uid);
                userInfoModal.find('select[name="usergroup"]').val(user.userGroup.gid);
                userInfoModal.find('span[name="nickname"]').html(user.nickname);
                userInfoModal.find('span[name="email"]').html(user.email);
                userInfoModal.find('span[name="sex"]').html(user.sex);
                userInfoModal.find('span[name="description"]').html(user.description == "" ? "未填写" : user.description);
                userInfoModal.find('span[name="birthday"]').html(user.birthday == "" ? "未填写" : user.birthday);
                userInfoModal.find('span[name="address"]').html(user.address == "" ? "未填写" : user.address);
                userInfoModal.find('span[name="phone"]').html(user.phone == "" ? "未填写" : user.phone);
                userInfoModal.find('span[name="weibo"]').html(user.weibo == "" ? "未填写" : user.weibo);
                userInfoModal.find('span[name="site"]').html(user.site == "" ? "未填写" : ('<a href="' + user.site + '" target="_blank">' + user.site + '</a>'));
                userInfoModal.find('span[name="qq"]').html(user.qq == "" ? "未填写" : user.qq);
                userInfoModal.find('span[name="register_time"]').html(user.userStatus.register_time);
                userInfoModal.find('span[name="articleCount"]').html(user.userStats.articleCount);
                userInfoModal.find('span[name="followingCount"]').html(user.userStats.followingCount);
                userInfoModal.find('span[name="followerCount"]').html(user.userStats.followerCount);
                userInfoModal.find('span[name="says"]').html(user.says == "" ? "未填写" : user.says);
                userInfoModal.find('span[name="last_login_ip"]').html(user.userStatus.last_login_ip == "" ? "暂无IP" : user.userStatus.last_login_ip);
                userInfoModal.find('span[name="last_login_time"]').html(user.userStatus.last_login_time);
                userInfoModal.find('select[name="lock_status"]').val(user.userStatus.lock_status);
                userInfoModal.modal();
            });
        });

        $('#userInfoModal').find('button[name="updateUser_trigger"]').click(function (e) {
            var userInfoModal = $('#userInfoModal');
            var userGroup = {};
            userGroup.uid = userInfoModal.find('span[name="uid"]').text();
            userGroup.gid = parseInt(userInfoModal.find('select[name="usergroup"]').val());
            updateUserGroup(userGroup, function (newUserGroup) {
                $("#user_tds").find('.user-tr[data-uid="' + userGroup.uid + '"] .user-group-name').text(newUserGroup.group_name);
                toastr.success("用户 " + userGroup.uid + " 更换用户组成功~");
                userInfoModal.modal("hide");
            });
        });

        $('#userInfoModal').find('span[name="last_login_ip"]').click(function (e) {
            var ip = this.innerText;
            if (ip != "暂无IP") {
                getIpLocation(ip)
            }
        });


    });

});
