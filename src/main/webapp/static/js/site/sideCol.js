/**
 * @desc: 侧边文章文章rank JS
 * @author dengchao
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle', 'period_cache'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, $(document).ready, toastr, globals, common_utils, login_handle, PeriodCache);
    }
})(function ($, domReady, toastr, globals, common_utils, login_handle, PeriodCache) {

    let selector = globals.extend(globals.selector, {
        sideCol: {
            'hotRankPanel': '#rank_hot',
            'hotTagRankPanel': '#rank_hotTag',
            'newestRankPanel': '#rank_newest',
            'photoShowPanel': '#photos_show'
        }
    }).sideCol;

    var loadRankList = function (uid) {
        globals.request.get(globals.api.getRankingList, {"uid": uid}, function (data) {
            // 热门文章
            if (data.clickRankList) {
                let rank_hot_html = '';
                $.each(data.clickRankList, function (i, article) {
                    rank_hot_html += '<li><a target="_blank" href="' + ('a/detail/' + article.aid).toURL() + '" title="点击量：' + article.click_count + ' 次">' + article.title + '(<span>' + article.click_count + '</span>)</a></li>';
                });
                $(selector.hotRankPanel).html(rank_hot_html).parent().find('.label a').url('href', 'a/list?' + (uid ? ('author.uid=' + uid + '&click_count=-1') : 'click_count=-1'));
            }
            // 热门标签
            if (data.hotTagList) {
                let tag = null, count = 0, rank_hotTag_html = '';
                $.each(data.hotTagList, function (i, entry) {
                    // [{"大数据":22},{"学习笔记":21},{"Hadoop":4},{"测试":2},{"HDFS":2}]
                    // 返回数据结构如此，只能遍历得到key名
                    tag = Object.keys(entry)[0];
                    count = Object.values(entry)[0];
                    rank_hotTag_html += '<li><a target="_blank" href="' + ('a/list?tags=' + tag + (uid ? ('&author.uid=' + uid) : '')).toURL() + '" title="此标签下文章 ' + count + ' 篇以上" >' + tag + '(<span>' + count + '</span>)</a></li>';
                });
                $(selector.hotTagRankPanel).html(rank_hotTag_html).parent().find('.label a').url('href', 'a/tags' + (uid ? ('?uid=' + uid) : ''));
            }
            // 最新文章
            if (data.newestList) {
                let rank_newest_html = '';
                $.each(data.newestList, function (i, article) {
                    rank_newest_html += '<li><a target="_blank" href="' + ('a/detail/' + article.aid).toURL() + '" title="发表时间：' + article.create_time + '" >' + article.title + '</a></li>';
                    //rank_newest_html+='<li><a target="_blank" href="' + ('a/detail/' + article.aid).toURL() + '" >'+article.title+'(<span>'+article.create_time.split(' ')[0]+'</span>)</a></li>';
                });
                $(selector.newestRankPanel).html(rank_newest_html).parent().find('.label a').url('href', 'a/archives' + (uid ? ('?uid=' + uid) : ''));
            }
        }, '获取文章rank列表失败');
    };

    var loadPhotosShow = function (uid) {
        var $photoShowArea = $(selector.photoShowPanel);
        var cloudPath = globals.path_params.cloudPath;
        if ($photoShowArea.length > 0) {
            var userAlbumsCacheConn = PeriodCache.getOrCreateGroup({ // 创建相册缓存读取器
                "groupName": "user_albums_cache",
                "version": "1.2",
                "timeOut": 60000,
                "reload": {
                    "url": globals.api.getAlbumList,
                    "type": "GET",
                    "dataType": undefined,
                    "params": function (groupName, key) {
                        if (isNaN(key)) {
                            key = 0;
                        }
                        return key == 0 ? null : {"user.uid": key};
                    },
                    "parse": function (cacheCtx, groupName, key, old_object_value, response) {
                        if (response.status == 200) {
                            var data = response.data;
                            if (data.albums && data.albums.length > 0) {
                                var preview_args = null;
                                if (data.cloud_photo_preview_args) {
                                    preview_args = data.cloud_photo_preview_args.replace('{col}', 4)
                                }
                                $.each(data.albums, function (i, album) {
                                    album.name = encodeURIComponent(encodeURIComponent(album.name));
                                    album.description = encodeURIComponent(encodeURIComponent(album.description));
                                    if (preview_args) {
                                        album.cover.path = album.cover.path + preview_args;
                                    }
                                });
                            }
                            return data.albums;
                        } else {
                            return [];
                        }
                    }
                }
            });
            /**
             * 切换相片
             * @param dom 相册元素
             * @param albums
             * @param direction 方向
             */
            var switchPhoto = function (dom, albums, direction) {
                var index = parseInt(dom.getAttribute('data-index'));
                if (direction == 'left') {
                    if (index - 1 < 0) {
                        index = albums.length - 1;
                    } else {
                        index--;
                    }
                } else {
                    if (index + 1 == albums.length) {
                        index = 0;
                    } else {
                        index++;
                    }
                }
                var album = albums[index];
                dom.querySelector('img').src = album.cover.path;
                dom.setAttribute('data-index', '' + index);
                dom.href = ('p/album/' + album.album_id).toURL();
                globals.removeNotify('notify_album_show');
                globals.notify({
                    "showDuration": 0,
                    "hideDuration": 0,
                    "showDuration": 0,
                    "closeButton": false,
                    "progressBar": false,
                    "positionClass": isUserPage ? 'toast-bottom-left' : "toast-bottom-right",
                    "iconClass": "toast-success-no-icon",
                    "onclick": function () {
                        window.open(('p/album/' + album.album_id).toURL());
                    }
                }).success(album.description, album.name + ' by ' + album.user.nickname, 'notify_album_show');
            };
            var loadUid = uid; // 加载谁的相册列表
            if (loadUid == 0 && login_handle.validateLogin()) {
                loadUid = '0_' + login_handle.getCurrentUserId(); // 防止登录新账号后，首页列表不刷新
            }
            userAlbumsCacheConn.get(loadUid, function (albums) { // 从缓存读取相册列表
                albums && $.each(albums, function (i, album) {
                    album.name = decodeURIComponent(decodeURIComponent(album.name));
                    album.description = decodeURIComponent(decodeURIComponent(album.description));
                });
                var html = null;
                if (albums && albums.length > 0) { // html
                    let first = albums[0];
                    html = '<a class="openAlbumByCover image-widget protect" data-index="0" href="' + ('p/album/' + first.album_id).toURL() + '" target="_blank" title="左键切换、右键打开"><img src="' + first.cover.path + '" style="width: 100%"></a>'
                } else {
                    let userAlbumHref = ('u/' + (uid == 0 ? '' : (uid + '/')) + 'albums').toURL();
                    html = '<a href="' + userAlbumHref + '" target="_blank" title="打开用户相册"><img src="' + cloudPath + 'res/img/album_default.jpg" style="width: 100%"></a>'
                }
                $photoShowArea.find('.photos').html(html);
                $photoShowArea.find('.openAlbumByCover').click(function (e) { // 点击切换事件
                    var a = e.currentTarget;
                    switchPhoto(a, albums, 'right'); // 切换相册
                    if (albums.length == 1) {
                        return;
                    }
                    e.preventDefault();
                    return false;
                });
                $photoShowArea.keydown(function (e) { //键盘事件
                    var theEvent = e || window.event;
                    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                    var a = e.currentTarget.querySelector('.openAlbumByCover');
                    if (code == 37) { // 方向左
                        switchPhoto(a, albums, 'left'); //向左切换
                    } else if (code == 39) { // 方向右
                        switchPhoto(a, albums, 'right'); // 向右切换
                    } else if (code == 13) {  // 回车
                        window.open(a.href.toURL()); //直接打开
                    }
                });
            });
        }
    };

    /* ********** main ************* */

    //用户的主页和用户文章页则查找用户的rank
    var isUserPage = /^.*(\/a\/detail\/.*|\/u\/\w+\/home).*$/.test(document.location.pathname);
    var uid = (isUserPage ? $(globals.selector.firstArea).find('.slogan-name').attr('data-user-id') : 0); // uid为0，则查找所有文章总rank

    // 加载文章rank列表
    loadRankList(uid);
    // 加载用户相册
    loadPhotosShow(uid);

});