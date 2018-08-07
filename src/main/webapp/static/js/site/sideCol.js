/**
 * @desc: 侧边文章文章rank JS
 * @author dengchao
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'common_utils', 'login_handle', 'period_cache'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, $(document).ready, toastr, common_utils, login_handle, PeriodCache);
    }
})(function ($, domReady, toastr, common_utils, login_handle, PeriodCache) {

    var loadRankList = function (uid) {
        $.get("article.do?method=ranking_list", {"uid": uid}, function (data) {
            //热门文章
            if (data.clickRankList != null) {
                var rank_hot_html = "";
                $(data.clickRankList).each(function (i, article) {
                    rank_hot_html += '<li style="border-bottom: 1px solid #cfcfcf;margin-bottom:6px;"><a target="_blank" href="article.do?method=detail&aid=' + article.aid + '" title="点击量：' + article.click + ' 次">' + article.title + '(<span>' + article.click + '</span>)</a></li>';
                });
                $('#rank_hot').html(rank_hot_html);
            }
            //热门标签
            if (uid == 0 && data.hotTagList != null) {
                //alert(JSON.stringify(data.hotTagList));
                var tag = null;
                var count = null;
                var rank_hotTag_html = "";
                $(data.hotTagList).each(function (i, entry) {
                    //[{"大数据":22},{"学习笔记":21},{"Hadoop":4},{"测试":2},{"HDFS":2}]
                    //返回数据结构如此，只能遍历得到key名
                    $.each(entry, function (key, value) {
                        tag = key;
                        count = value;
                    });
                    rank_hotTag_html += '<li style="border-bottom: 1px solid #cfcfcf;margin-bottom:6px;"><a target="_blank" href="article.do?method=list&tags=' + tag + '" title="此标签下文章 ' + count + ' 篇以上" >' + tag + '(<span>' + count + '</span>)</a></li>';
                });
                $('#rank_hotTag').html(rank_hotTag_html);
            }
            //最新文章
            if (data.newestList != null) {
                var rank_newest_html = "";
                $(data.newestList).each(function (i, article) {
                    rank_newest_html += '<li style="border-bottom: 1px solid #cfcfcf;margin-bottom:6px;"><a target="_blank" href="article.do?method=detail&aid=' + article.aid + '" title="发表时间：' + article.create_time + '" >' + article.title + '</a></li>';
                    //rank_newest_html+='<li style="border-bottom: 1px solid #cfcfcf;margin-bottom:6px;"><a target="_blank" href="article.do?method=detail&aid='+article.aid+'" >'+article.title+'(<span>'+article.create_time.split(' ')[0]+'</span>)</a></li>';
                });
                $('#rank_newest').html(rank_newest_html);
            }
        });
    };

    var loadPhotosShow = function (uid) {
        var photoShowArea = $("#photos_show");
        var cloudPath = $("#cloudPath").attr("href");
        if (photoShowArea.length > 0) {
            var userAlbumsCacheConn = PeriodCache.getOrCreateGroup({ // 创建相册缓存读取器
                "groupName": "user_albums_cache",
                "version": "1.1",
                "timeOut": 900000,
                "reload": {
                    "url": "photo.do?method=albumListByAjax",
                    "type": "GET",
                    "dataType": undefined,
                    "params": function (groupName, key) {
                        if (isNaN(key)) {
                            key = 0;
                        }
                        return key == 0 ? null : {"user.uid": key};
                    },
                    "parse": function (cacheCtx, groupName, key, old_object_value, data) {
                        if (data.albums && data.albums.length > 0) {
                            $.each(data.albums, function (i, album) {
                                album.name = encodeURIComponent(encodeURIComponent(album.name));
                                album.description = encodeURIComponent(encodeURIComponent(album.description));
                                try {
                                    var coverJson = JSON.parse(album.cover);
                                    album.cover = coverJson;
                                } catch (e) {
                                    album.cover = {"path": album.cover};
                                }
                            });
                        }
                        return data.albums;
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
                var index = parseInt(dom.getAttribute("data-index"));
                if (direction == "left") {
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
                dom.querySelector("img").src = cloudPath + album.cover.path;
                dom.setAttribute("data-index", "" + index);
                dom.href = "photo.do?method=album_detail&id=" + album.album_id;
                common_utils.removeNotify("notify_album_show");
                common_utils.notify({
                    "showDuration": 0,
                    "hideDuration": 0,
                    "closeButton": false,
                    "progressBar": false,
                    "positionClass": isUserPage ? "toast-bottom-left" : "toast-bottom-right",
                    "iconClass": "toast-success-no-icon",
                    "onclick": function () {
                        window.open("photo.do?method=album_detail&id=" + album.album_id);
                    }
                }).success(album.description, album.name + " by " + album.user.nickname, "notify_album_show");
            };
            var loadUid = uid; // 加载谁的相册列表
            if (loadUid == 0 && login_handle.validateLogin()) {
                loadUid = "0_" + login_handle.getCurrentUserId(); // 防止登录新账号后，首页列表不刷新
            }
            userAlbumsCacheConn.get(loadUid, function (albums) { // 从缓存读取相册列表
                albums && $.each(albums, function (i, album) {
                    album.name = decodeURIComponent(decodeURIComponent(album.name));
                    album.description = decodeURIComponent(decodeURIComponent(album.description));
                });
                var html = null;
                if (albums && albums.length > 0) { // html
                    var first = albums[0];
                    html = '<a class="openAlbumByCover" data-index="0" href="photo.do?method=album_detail&id=' + first.album_id + '" target="_blank" title="左键切换、右键打开"><img src="' + cloudPath + first.cover.path + '" style="width: 100%"></a>'
                } else {
                    var userAlbumHref = "photo.do?method=user_albums" + (loadUid == 0 ? "" : ("&uid=" + loadUid));
                    html = '<a href="' + userAlbumHref + '" target="_blank" title="打开用户相册"><img src="' + cloudPath + 'res/img/album_default.jpg" style="width: 100%"></a>'
                }
                photoShowArea.find(".photos").html(html);
                photoShowArea.find(".openAlbumByCover").click(function (e) { // 点击切换事件
                    var a = e.currentTarget;
                    switchPhoto(a, albums, "right"); // 切换相册
                    if (albums.length == 1) {
                        return;
                    }
                    e.preventDefault();
                    return false;
                });
                photoShowArea.keydown(function (e) { //键盘事件
                    var theEvent = e || window.event;
                    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                    var a = e.currentTarget.querySelector(".openAlbumByCover");
                    if (code == 37) { // 方向左
                        switchPhoto(a, albums, "left"); //向左切换
                    } else if (code == 39) { // 方向右
                        switchPhoto(a, albums, "right"); // 向右切换
                    } else if (code == 13) {  // 回车
                        window.open(a.href); //直接打开
                    }
                });
            });
        }
    };

    /* ********** main ************* */

    //用户的主页和用户文章页则查找用户的rank
    var isUserPage = /^(.*method=detail.*|.*method=home.*)$/.test(document.location.href);
    var uid = (isUserPage ? $('#h_auid').attr('auid') : 0); // uid为0，则查找所有文章总rank

    // 加载文章rank列表
    loadRankList(uid);
    // 加载用户相册
    loadPhotosShow(uid);

});