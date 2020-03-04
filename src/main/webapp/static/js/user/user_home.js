/**
 * 用户主页
 * @author Jeffrey.Deng
 * @date 2018/4/9
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'globals', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, globals, common_utils);
    }
})(function ($, bootstrap, domReady, toastr, globals, globals, common_utils) {

    let selector = globals.extend(globals.selector, {
        user_home: {
            'pageNavigator': '.page-navigator',
            'openUserProfileModal': '#btn_user_profile_modal_open',
            'userProfileModal': '#userProfileModal',
        }
    }).user_home;

    var initPageJump = function () {
        var params = common_utils.parseURL(document.location.href).params;
        var page = '';
        $.each(params, function (key, value) {
            if (key != 'method' && key != 'page') {
                page += key + '=' + value + '&';
            }
        });
        $(selector.pageNavigator).find('.page-trigger').each(function (i, a) {
            a.href = document.location.pathname + '?' + page + 'page=' + a.getAttribute('page');
        });
    };

    // 图片加载失败显示默认图片
    common_utils.bindImgErrorHandler($(globals.selector.mainArea).find('img'), globals.path_params.cloudPath + 'res/img/img_load_error_default.jpg');

    domReady(function () {

        initPageJump();

        $(selector.openUserProfileModal).on('click', function () {
            let uid = $(this).attr('data-uid');
            globals.request.getUser(uid, function (user) {
                let $userProfileModal = $(selector.userProfileModal);
                $userProfileModal.find('.form-user-head-photo').attr('src', user.head_photo);
                $userProfileModal.find('.form-user-group').html(user.userGroup.group_name);
                $userProfileModal.find('.form-user-nickname').html(user.nickname);
                $userProfileModal.find('.form-user-sex').html(user.sex);
                $userProfileModal.find('.form-user-description').html(user.description == '' ? '未填写' : user.description);
                $userProfileModal.find('.form-user-birthday').html(user.birthday == '' ? '未填写' : user.birthday);
                $userProfileModal.find('.form-user-address').html(user.address == '' ? '未填写' : user.address);
                $userProfileModal.find('.form-user-weibo').html(user.weibo == '' ? '未填写' : user.weibo);
                $userProfileModal.find('.form-user-site').html(user.site == '' ? '未填写' : ('<a href="' + user.site + '" target="_blank">' + user.site + '</a>'));
                $userProfileModal.find('.form-user-qq').html(user.qq == '' ? '未填写' : user.qq);
                $userProfileModal.find('.form-user-register-time').html(user.userStatus ? user.userStatus.register_time : '无权限');
                $userProfileModal.find('.form-user-article-count').html(user.userStats.articleCount);
                $userProfileModal.find('.form-user-following-count').html(user.userStats.followingCount);
                $userProfileModal.find('.form-user-follower-count').html(user.userStats.followerCount);
                $userProfileModal.find('.form-user-says').html(user.says == '' ? '未填写' : user.says);
                $userProfileModal.modal();
            });
        });
    });
});
