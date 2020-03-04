/**
 * 用户管理
 * @author Jeffrey.deng
 * @date 2018/1/11
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, null, globals, common_utils);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils) {

    function loadUserProfile(uid, call) {
        $.get(globals.api.getUser, {"uid": uid}, function (response) {
            if (response.status == 200) {
                call && call(response.data.user);
            }
        });
    }

    function getIpLocation(ip) {
        $.get(globals.api.getIpLocation, {"ip": ip}, function (response) {
            if (response.status == 200 && response.data.location) {
                globals.notify({
                    "progressBar": false,
                    "iconClass": "toast-success-no-icon"
                }).success(response.data.location, '', 'notify_ip_location');
            } else {
                toastr.error('出了一点小问题...', response.status);
            }
        });
    }

    function loadUserGroupList(call) {
        $.get(globals.api.manager.getUserGroupList, function (response) {
            if (response.status == 200) {
                call && call(response.data.userGroups);
            } else {
                toastr.error(response.message, '获取组列表错误');
                console.warn('Error Code: ' + response.status);
            }
        }).fail(function (XHR, TS) {
            toastr.error('获取组列表失败，错误：' + TS);
        });
    }

    function updateUserGroup(userGroup, call) {
        $.post(globals.api.manager.updateUserGroup, userGroup, function (response) {
            if (response.status == 200) {
                call && call(response.data.userGroup);
            } else {
                toastr.error(response.message.replace(/\n/g, '<br>'), '错误');
                console.warn('Error Code: ' + response.status);
            }
        }).fail(function (XHR, TS) {
            toastr.error('更换组失败，错误：' + TS);
        });
    }

    domReady(function () {

        loadUserGroupList(function (userGroupList) {
            var html = '';
            $.each(userGroupList, function (i, userGroup) {
                html += '<option value="' + userGroup.gid + '">' + userGroup.group_name + '</option>'
            });
            $('#userProfileModal').find('select[name="usergroup"]').html(html);
        });

        $('#user_tds').on('click', '.user-tr', function (e) {
            if ($(e.target).closest('a').length > 0) {
                return;
            }
            var uid = $(this).attr('data-uid');
            loadUserProfile(uid, function (user) {
                var userProfileModal = $('#userProfileModal');
                userProfileModal.find('img[name="head_photo"]').attr('src', user.head_photo);
                userProfileModal.find('span[name="uid"]').html(user.uid);
                userProfileModal.find('select[name="usergroup"]').val(user.userGroup.gid);
                userProfileModal.find('span[name="nickname"]').html(user.nickname);
                userProfileModal.find('span[name="email"]').html(user.email);
                userProfileModal.find('span[name="sex"]').html(user.sex);
                userProfileModal.find('span[name="description"]').html(user.description == '' ? '未填写' : user.description);
                userProfileModal.find('span[name="birthday"]').html(user.birthday == '' ? '未填写' : user.birthday);
                userProfileModal.find('span[name="address"]').html(user.address == '' ? '未填写' : user.address);
                userProfileModal.find('span[name="phone"]').html(user.phone == '' ? '未填写' : user.phone);
                userProfileModal.find('span[name="weibo"]').html(user.weibo == '' ? '未填写' : user.weibo);
                userProfileModal.find('span[name="site"]').html(user.site == '' ? '未填写' : ('<a href="' + user.site + '" target="_blank">' + user.site + '</a>'));
                userProfileModal.find('span[name="qq"]').html(user.qq == '' ? '未填写' : user.qq);
                userProfileModal.find('span[name="register_time"]').html(user.userStatus.register_time);
                userProfileModal.find('span[name="articleCount"]').html(user.userStats.articleCount);
                userProfileModal.find('span[name="followingCount"]').html(user.userStats.followingCount);
                userProfileModal.find('span[name="followerCount"]').html(user.userStats.followerCount);
                userProfileModal.find('span[name="says"]').html(user.says == '' ? '未填写' : user.says);
                userProfileModal.find('span[name="last_login_ip"]').html(user.userStatus.last_login_ip == '' ? '暂无IP' : user.userStatus.last_login_ip);
                userProfileModal.find('span[name="last_login_time"]').html(user.userStatus.last_login_time);
                userProfileModal.find('select[name="lock_status"]').val(user.userStatus.lock_status);
                userProfileModal.modal();
            });
        });

        $('#userProfileModal').find('button[name="updateUser_trigger"]').click(function (e) {
            var userProfileModal = $('#userProfileModal');
            var userGroup = {};
            userGroup.uid = userProfileModal.find('span[name="uid"]').text();
            userGroup.gid = parseInt(userProfileModal.find('select[name="usergroup"]').val());
            updateUserGroup(userGroup, function (newUserGroup) {
                $('#user_tds').find('.user-tr[data-uid="' + userGroup.uid + '"] .user-group-name').text(newUserGroup.group_name);
                toastr.success('用户 ' + userGroup.uid + ' 更换用户组成功~');
                userProfileModal.modal('hide');
            });
        });

        $('#userProfileModal').find('span[name="last_login_ip"]').click(function (e) {
            var ip = this.innerText;
            if (ip != '暂无IP') {
                getIpLocation(ip)
            }
        });

    });

});
