/**
 *  @desc: 处理关注与私信的action JS
 *  @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.contact_with = factory(window.jQuery, $(document).ready, toastr, globals, common_utils, login_handle);
    }
})(function ($, domReady, toastr, globals, common_utils, login_handle) {

    const pointer = {
        userProfileCache: null
    };

    const config = {
        selector: {
            'userProfileCard': '#userProfileCard',
        },
        initBindUserContact: null,
        initFollowBtnSelector: '.follow',
        initLetterBtnSelector: '.letter',
    };

    const request = globals.extend(globals.request, {
        contact_with: {
            "checkUserIsFollowing": function (host_uid, success) {
                let postData = {'uid': host_uid};
                return globals.request.post(globals.api.checkUserIsFollowing, postData, success, ['type'], false);
            },
            'follow': function (host_uid, toggleFollow, success) {
                let postData = {'uid': host_uid};
                if (toggleFollow) {
                    return globals.request.post(globals.api.followUser, postData, success, ['type'], success && '关注失败，代码{code}');
                } else {
                    return globals.request.post(globals.api.unfollowUser, postData, success, ['type'], success && '取消关注失败，代码{code}');
                }
            },
            'followUser': function (host_uid, success) {
                return this.follow(host_uid, true, success);
            },
            "unfollowUser": function (host_uid, success) {
                return this.follow(host_uid, false, success);
            }
        }
    }).contact_with;

    // todo 悬浮资料卡片
    let bindUserProfileCardPopup = function (options) {
        options = $.extend(true, {}, config, options);
    };

    let buildUserProfileCardHtml = function (user, options) {
        let $userProfileCard = $(options.selector.userProfileCard);
        if ($userProfileCard.length == 0) {

        }
        return $userProfileCard;
    };

    /**
     * 绑定{hostUser}的通讯事件
     * @param hostUser - 用户uid
     * @param {{followBtn: (String), letterBtn: (String)}} selector - 选择器
     */
    let bindUserContactEvent = function (hostUser, selector) {
        // 关注
        if (selector.followBtn) {
            let $followBtn = $(selector.followBtn), initFollowValue = $followBtn.attr('data-followed') === 'true';
            // 检查登录者是否关注了该作者
            if (!initFollowValue) {
                if (!login_handle.equalsLoginUser(hostUser)) {
                    request.checkUserIsFollowing(hostUser, function (type) {
                        if (type == 1) {
                            console.log('已关注作者' + hostUser);
                        }
                        utils.toggleFollowBtnShow($followBtn, type == 1);
                    });
                }
            }
            // 关注按钮事件
            $followBtn.on('click', function () {
                if (login_handle.validateLogin()) {
                    let toggleFollow = $followBtn.attr('data-followed') !== 'true';
                    if (toggleFollow || window.confirm('确定要取消关注吗？')) {
                        request.follow(hostUser, toggleFollow, function (type) {
                            let message = this.message;
                            if (toggleFollow) {
                                if (type == 0) {
                                    toastr.success('该用户你之前已关注过了~');
                                } else if (type == 1) {
                                    toastr.success('关注成功~');
                                } else if (type == 2) {
                                    toastr.success('关注成功~');
                                    toastr.info('你们由于互相关注，自动成为好友~');
                                }
                            } else {
                                if (type == 0) {
                                    toastr.success('该用户你并没有关注~');
                                } else if (type == 1) {
                                    toastr.success('取消关注成功~');
                                } else if (type == 2) {
                                    toastr.success('取消关注成功~');
                                    toastr.info('好友关系也自动取消~');
                                }
                            }
                            utils.toggleFollowBtnShow($followBtn, toggleFollow);
                        });
                    }
                } else {
                    // 弹出登陆框
                    login_handle.showLoginModal("", function () {
                        $followBtn.eq(0).click();
                    });
                }
            });
        }
        // 私信
        if (selector.letterBtn) {
            // 私信按钮事件
            $(selector.letterBtn).on('click', function () {
                let link = ('u/center/sendLetter?chatuid=' + hostUser).toURL();
                if (login_handle.validateLogin()) {
                    window.open(link);
                } else {
                    // 弹出登陆框
                    login_handle.showLoginModal(link);
                }
            });
        }
    };

    let utils = {
        'toggleFollowBtnShow': function ($btn, toggleFollow) {
            $btn instanceof ($ || jQuery) || ($btn = $($btn));
            let text = toggleFollow ? '已关注' : '关注';
            $btn.attr('data-followed', String(toggleFollow)).html('<i class="fa fa-thumbs-up"></i>' + text);
        }
    };

    const context = {
        pointer: pointer,
        config: config,
        request: request,
        bindUserContactEvent: bindUserContactEvent,
        utils: utils,
    };

    domReady(function () {

        let hostUser = config.initBindUserContact = $('#first').find('.slogan-name').attr('data-user-id');

        bindUserContactEvent(hostUser, {
            followBtn: config.initFollowBtnSelector,
            letterBtn: config.initLetterBtnSelector,
        });

    });

    return context;
});