/**
 * Created by Jeffrey.Deng on 2017/6/7.
 * @desc: 好友页，关注页，粉丝页 JS
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.contact = factory(window.jQuery, $(document).ready, toastr, globals, common_utils, login_handle);
    }
})(function ($, domReady, toastr, globals, common_utils, login_handle) {

    var followList;
    var fansList;
    var friendList;

    function initContactTab(query_uid, isLoadFriend) {
        load_followings(query_uid, function (followList) {
            var html = buildContactAreaHtml(followList);
            $('#followings').html(html);
        });
        load_followers(query_uid, function (fansList) {
            var html = buildContactAreaHtml(fansList);
            $('#followers').html(html);
        });
        bindContactAreaEvent($('#followings'));
        bindContactAreaEvent($('#followers'));
        if (isLoadFriend === true) {
            load_friends(function (friendList) {
                var html = buildContactAreaHtml(friendList);
                $('#friends').html(html)
            });
            bindContactAreaEvent($('#friends'));
        }
    }


    function load_followings(query_uid, call) {
        console.log('加载关注列表...');
        $.ajax({
            url: globals.api.getUserFollowings,
            data: {
                'uid': query_uid
            },
            success: function (response) {
                if (response.status == 200) {
                    followList = response.data.users;
                    if (followList != null && followList.length > 0) {
                        call && call(followList);
                    }
                    console.log('加载关注列表成功！');
                } else {
                    toastr.error(response.message, '提示');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function () {
                toastr.warn('查询关注列表失败~');
                console.warn('加载关注列表失败~');
            }
        });
    }

    function load_followers(query_uid, call) {
        console.log('加载粉丝列表...');
        $.ajax({
            url: globals.api.getUserFollowers,
            data: {
                'uid': query_uid
            },
            success: function (response) {
                if (response.status == 200) {
                    fansList = response.data.users;
                    if (fansList != null && fansList.length > 0) {
                        call && call(fansList);
                    }
                    console.log('加载粉丝列表成功~');
                } else {
                    toastr.error(response.message, '提示');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function () {
                toastr.warn('查询粉丝列表失败~');
                console.warn('加载粉丝列表失败~');
            }
        });
    }

    function load_friends(call) {
        console.log('加载好友列表...');
        $.ajax({
            url: globals.api.getUserFriends,
            success: function (response) {
                if (response.status == 200) {
                    friendList = response.data.users;
                    if (friendList != null && friendList.length > 0) {
                        call && call(friendList);
                    }
                    console.log('加载好友列表成功~');
                } else {
                    toastr.error(response.message, '提示');
                    console.warn('Error Code: ' + response.status);
                }
            },
            error: function () {
                toastr.warn('加载好友列表失败！');
                console.warn('加载好友列表失败！');
            }
        });
    }

    function buildContactAreaHtml(userList) {
        var html = '<div class="wrapper wrapper-content animated fadeInRight">';
        $.each(userList, function (i, user) {
            html += '<div class="col-xs-12 col-sm-6 col-md-4 col-lg-3"><div class="contact-box">';
            html += '<a class="open-user-home-page" target="_blank" href="' + ('u/' + user.uid + '/home').toURL() + '">';
            html += '<div class="col-xs-12 col-sm-4"><div class="text-center">';
            html += '<img alt="image" class="img-circle img-responsive contact-head-photo" src="' + user.head_photo + '">';
            html += '<div class="contact-group-name">' + user.userGroup.group_name + '</div></div></div>';
            html += '<div class="col-xs-12 col-sm-8 contact-info-right"><h3 class="contact-nickname">' + user.nickname + '</h3>';
            html += '<p><i class="fa fa-map-marker"></i><span class="contact-address">' + (user.address || '&nbsp;') + '</span></p>';
            html += '<p><strong class="contact-description" title="' + common_utils.encodeHTML(user.description) + '">' + (user.description || '&nbsp;') + '</strong></p>';
            html += '<p><span class="contact-user-site-label">Site:</span><span class="contact-user-site">' + (user.site || '&nbsp;') + '</span></p>';
            html += '</div><div class="clearfix"></div></a></div></div>';
        });
        html += '</div>';
        return html;
    }

    function animationHover(o, e) {
        o = $(o), o.hover(function () {
            o.addClass('animated ' + e)
        }, function () {
            window.setTimeout(function () {
                o.removeClass('animated ' + e)
            }, 2e3)
        })
    }

    function bindContactAreaEvent(contactTab) {
        contactTab
            .on('click', '.open-user-home-page', function (e) {
                var _self = $(e.target);
                if (_self.hasClass('contact-user-site')) {
                    window.open(_self.text());
                    return false;
                } else {
                    return true;
                }
            })
            .on('mouseenter', '.contact-box', function () {
                $(this).addClass('animated ' + 'pulse');
                // $(this).toggleClass('animated ' + 'pulse');
            }).on('mouseleave', '.contact-box', function () {
            var _self = $(this);
            window.setTimeout(function () {
                _self.removeClass('animated ' + 'pulse')
            }, 2e3);
        });
    }


    domReady(function () {
        //
        var loginUid = login_handle.getCurrentUserId();
        var url = common_utils.parseURL(document.location.href);
        var params = url.params;

        var contact_tab_ul = $('#contact_tab_ul');
        // 改变地址栏随着切换tab
        contact_tab_ul.find('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var search = '';
            $.each(params, function (key, value) {
                if (key != 'method' && key != 'action') {
                    search += '&' + key + '=' + value;
                }
            });
            search = (search ? ('?' + search.substring(1)) : '');
            history.replaceState(
                null,
                e.target.innerText + "_联系人页 - ImCoder's 博客",
                location.pathname.replace(/\/contact.*$/, '/contact/') + $(e.target).attr('href').substring(1) + search
            );
            document.title = e.target.innerText + "_联系人页 - ImCoder's 博客";
        });

        // 打开时显示的tab
        var action = (document.location.href.match(/^.*\/u\/(\w+)\/contact\/?(\w+)?\??.*$/) ? RegExp.$2 : 'followings') || 'followings';
        var query_uid = RegExp.$1 || loginUid || undefined;
        if (action) {
            contact_tab_ul.find('a[href="#' + action + '"]').tab('show');
        }
        if (loginUid && ( query_uid == loginUid || !query_uid)) {
            initContactTab(query_uid, true);
        } else if (query_uid && query_uid != loginUid) {
            contact_tab_ul.find('a[href="#friends"]').parent().hide();
            initContactTab(query_uid, false);
        } else {
            // contact_tab_ul.find('a[href="#friends"]').parent().hide();
            login_handle.jumpLogin(document.location.href, false);
        }
    });

});