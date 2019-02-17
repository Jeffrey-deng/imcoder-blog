/**
 * Created by Jeffrey.Deng on 2017/6/7.
 * @desc: 好友页，关注页，粉丝页 JS
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.contact = factory(window.jQuery, $(document).ready, toastr, common_utils, login_handle);
    }
})(function ($, domReady, toastr, common_utils, login_handle) {

    var followList;

    function load_follows(query_uid) {
        console.log('加载关注列表...');
        $.ajax({
            url: 'user.do?method=listFollows',
            data: {
                'uid': query_uid
            },
            success: function (data) {
                followList = data;
                if (data != null && data.length > 0) {
                    var html = '<div class="wrapper wrapper-content animated fadeInRight">';
                    $(data).each(function (i, user) {
                        html += '<div class="col-sm-4"><div class="contact-box">';
                        html += '<a target="_blank" href="user.do?method=home&uid=' + user.uid + '">';
                        html += '<div class="col-sm-4"><div class="text-center">';
                        html += '<img alt="image" class="img-circle m-t-xs img-responsive" src="' + staticPath + user.head_photo + '">';
                        html += '<div class="m-t-xs font-bold">' + user.userGroup.group_name + '</div></div></div><div class="col-sm-8">';
                        html += '<h3><strong>' + user.nickname + '</strong></h3>';
                        html += '<p><i class="fa fa-map-marker"></i>' + user.address + '</p><address>';
                        html += '<strong>' + user.description + '</strong><br>';
                        html += 'Weibo:<a target="_blank" href="' + user.weibo + '">' + user.weibo + '</a><br>';
                        html += '</address></div><div class="clearfix"></div></a></div></div>';
                    });
                    html += '</div>';
                    $('#follows').html(html);
                    $(".contact-box").each(function () {
                        animationHover(this, "pulse")
                    });
                }
                console.log('加载关注列表成功！');
            },
            error: function () {
                toastr.info('查询关注列表失败！');
                console.log('加载关注列表失败！');
            }
        });
    }

    var fansList;

    function load_fans(query_uid) {
        console.log('加载粉丝列表...');
        $.ajax({
            url: 'user.do?method=listFans',
            data: {
                'uid': query_uid
            },
            success: function (data) {
                fansList = data;
                if (data != null && data.length > 0) {
                    var html = '<div class="wrapper wrapper-content animated fadeInRight">';
                    $(data).each(function (i, user) {
                        html += '<div class="col-sm-4"><div class="contact-box">';
                        html += '<a target="_blank" href="user.do?method=home&uid=' + user.uid + '">';
                        html += '<div class="col-sm-4"><div class="text-center">';
                        html += '<img alt="image" class="img-circle m-t-xs img-responsive" src="' + staticPath + user.head_photo + '">';
                        html += '<div class="m-t-xs font-bold">' + user.userGroup.group_name + '</div></div></div><div class="col-sm-8">';
                        html += '<h3><strong>' + user.nickname + '</strong></h3>';
                        html += '<p><i class="fa fa-map-marker"></i>' + user.address + '</p><address>';
                        html += '<strong>' + user.description + '</strong><br>';
                        html += 'Weibo:<a target="_blank" href="' + user.weibo + '">' + user.weibo + '</a><br>';
                        html += '</address></div><div class="clearfix"></div></a></div></div>';
                    });
                    html += '</div>';
                    $('#fans').html(html);
                    $(".contact-box").each(function () {
                        animationHover(this, "pulse")
                    });
                }
                console.log('加载粉丝列表成功！');
            },
            error: function () {
                toastr.info('查询粉丝列表失败！');
                console.log('加载粉丝列表失败！');
            }
        });
    }

    var friendList;

    function load_friends() {
        console.log('加载好友列表...');
        $.ajax({
            url: 'user.do?method=listFriends',
            success: function (data) {
                friendList = data;
                if (data != null && data.length > 0) {
                    var html = '<div class="wrapper wrapper-content animated fadeInRight">';
                    $(data).each(function (i, user) {
                        html += '<div class="col-sm-4"><div class="contact-box">';
                        html += '<a target="_blank" href="user.do?method=home&uid=' + user.uid + '">';
                        html += '<div class="col-sm-4"><div class="text-center">';
                        html += '<img alt="image" class="img-circle m-t-xs img-responsive" src="' + staticPath + user.head_photo + '">';
                        html += '<div class="m-t-xs font-bold">' + user.userGroup.group_name + '</div></div></div><div class="col-sm-8">';
                        html += '<h3><strong>' + user.nickname + '</strong></h3>';
                        html += '<p><i class="fa fa-map-marker"></i>' + user.address + '</p><address>';
                        html += '<strong>' + user.description + '</strong><br>';
                        html += 'Weibo:<a target="_blank" href="' + user.weibo + '">' + user.weibo + '</a><br>';
                        html += '</address></div><div class="clearfix"></div></a></div></div>';
                    });
                    html += '</div>';
                    $('#friends').html(html);
                    $(".contact-box").each(function () {
                        animationHover(this, "pulse")
                    });
                }
                console.log('加载好友列表成功！');
            },
            error: function () {
                toastr.info('加载好友列表失败！');
                console.log('加载好友列表失败！');
            }
        });
    }

    function animationHover(o, e) {
        o = $(o), o.hover(function () {
            o.addClass("animated " + e)
        }, function () {
            window.setTimeout(function () {
                o.removeClass("animated " + e)
            }, 2e3)
        })
    }

    domReady(function () {
        //
        var $uid = login_handle.getCurrentUserId();
        var url = common_utils.parseURL(document.location.href);
        var params = url.params;

        // 改变地址栏随着切换tab
        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
            var search = "?method=contact";
            $.each(params, function (key, value) {
                if (key != "method" && key != "action") {
                    search += "&" + key + "=" + value;
                }
            });
            search += "&action=" + $(e.target).attr('href').substring(1);
            history.replaceState(
                null,
                e.target.innerText + "_联系人页 - ImCoder's 博客",
                location.pathname + search
            );
            document.title = e.target.innerText + "_联系人页 - ImCoder's 博客";
        });

        // 打开时显示的tab
        var action = params['action'] || "follows";
        if (action !== undefined && action.length > 0) {
            $('a[href="#' + action + '"]').tab('show');
        }

        var query_uid = params['query_uid'];
        if (query_uid != undefined && query_uid > 0 && query_uid != $uid) {
            $('a[href="#friends"]').hide();
            load_follows(query_uid);
            load_fans(query_uid)
        } else if ($uid != "" && $uid != undefined && ( query_uid === $uid || query_uid === undefined )) {
            load_follows($uid);
            load_fans($uid);
            load_friends();
        } else {
            $('a[href="#friends"]').hide();
        }
    });

});