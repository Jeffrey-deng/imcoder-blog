(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'comment_plugin', 'video_handle', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, comment_plugin, video_handle, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, comment_plugin, video_handle, websocket_util) {

    var config = {
        selector: {
            "firstHeaderArea": "#first",
            "mainArea": "#main",
            "videoNode": "#show-video",
            "videoDetailInfo": ".video-detail-info",
            "openEditBtn": ".video-detail-info .video-detail-open-edit",
            "videoLikeArea": ".video-detail-info .video-detail-like"
        },
        path_params: {
            "basePath": $('#basePath').attr('href'),
            "staticPath": $('#staticPath').attr('href'),
            "cloudPath": $('#cloudPath').attr('href')
        },
        pageVideoId: parseInt($(".video-detail-info").attr("data-video-id")) || 0,
        hostUserId: parseInt($("#first .video-name").attr("hostUid")) || 0,
        hostUserNickname: $(".video-detail-info .video-detail-user-nickname a").text(),
        pageAlbumId: parseInt($(".video-detail-info .video-detail-album-name a").attr("data-album-id")) || 0,
        pageAlbumName: $(".video-detail-info .video-detail-album-name a").text()
    };

    var init = function () {
        if (/^.*（(\d+)×(\d+)）$/.test($(config.selector.videoDetailInfo).find(".video-detail-size").text())) {
            config.videoWidth = parseInt(RegExp.$1);
            config.videoHeight = parseInt(RegExp.$2);
        }
        switchVideoShowSize();
        initVideoHandleEvent();
        applyAlbumInfoToPageIfHas();
    };

    var switchVideoShowSize = function () {
        var switchElem = $(config.selector.videoDetailInfo).find(".video-detail-show-size a");
        var videoElem = $(config.selector.videoNode);
        var switchFunc = function () {
            var currValue = switchElem.attr("data-show-size") || "default";
            if (currValue == "default") {
                var scala = 9 / 16;
                if (config.videoWidth && config.videoHeight) {
                    scala = config.videoHeight / config.videoWidth;
                }
                videoElem.css("max-height", "");
                videoElem.height(videoElem.width() * scala);
                switchElem.attr("data-show-size", "max").text("填充⬇");
            } else {
                videoElem.css("max-height", "");
                videoElem.css("height", "");
                switchElem.attr("data-show-size", "default").text("默认⬇");
                document.documentElement.scrollTop = 0;
            }
        };
        switchElem.click(switchFunc);
    };

    var formatDescArea = function (desc, needWrap) {
        (needWrap === undefined || needWrap === null) && (needWrap = true);
        if (!desc) {
            return desc;
        }
        // 补全标签
        desc = $("<div/>").html(desc).html();
        // 将图片链接转化为img标签
        var reMap = {};
        var replacementIndex = 0;
        desc = desc.replace(/<(a|img|iframe|embed|video).*?>/, function (match) {
            var key = "【$RE_(*&$_MATCH_^_REPACEMENT_%$_" + (replacementIndex++) + "】"; // 首尾中文符号，避开[\x21-\x7e]更合适
            reMap[key] = match;
            return key;
        });
        desc = desc.replace(/(https?:\/\/[a-z0-9\.]+\/[\x21-\x7e]*(\?[\x21-\x7e]*)?)/gi, function (match, url) {
            return '<a target="_blank" href="' + url + '">' + url + '</a>';
        });
        for (var reKey in reMap) {
            desc = desc.replace(reKey, reMap[reKey]);
        }
        if (needWrap) {
            desc = "<p>" + desc.replace(/\n/g, "</p><p>") + "</p>"
        }
        return desc;
    };

    var initVideoHandleEvent = function () {
        var videoDetailConfig = config;
        var openEditBtn = $(videoDetailConfig.selector.openEditBtn);
        if (openEditBtn.length > 0 && login_handle.getCurrentUserId() == videoDetailConfig.hostUserId) {
            // 视频处理模块初始化
            video_handle.init({
                "selector": {
                    "uploadModal": "#uploadVideoModal",
                    "updateModal": "#updateVideoModal"
                },
                "path_params": {
                    "basePath": $("#basePath").attr("href"),
                    "cloudPath": $("#cloudPath").attr("href"),
                    "staticPath": $("#staticPath").attr("href")
                },
                "callback": {
                    "updateCompleted": function (context, video) {  // 更新完成后回调
                        $(videoDetailConfig.selector.videoNode).prop("src", "video.do?method=embed&video_id=" + video.video_id);
                        var videoDetailInfoNode = $(videoDetailConfig.selector.videoDetailInfo);
                        videoDetailInfoNode.find(".video-detail-name a").text(video.name || "在相册内查看");
                        videoDetailInfoNode.find(".video-detail-desc").html(formatDescArea(video.description));
                        videoDetailInfoNode.find(".video-detail-size").text(video.size + "MB（" + video.width + "×" + video.height + "）");
                        videoDetailInfoNode.find(".video-detail-refer a").text(video.refer);
                        videoDetailInfoNode.find(".video-detail-video-type").text(video.video_type);
                        if (video.tags != null && video.tags.length > 0) {
                            var tagHtml = "";
                            $.each(video.tags.split("#"), function (i, tag) {
                                if (tag) {
                                    tagHtml += '<a target="_blank" href="photo.do?method=dashboard&model=photo&tags=${tag}" data-video-tag="' + tag + '">#' + tag + '</a>&nbsp;&nbsp';
                                }
                            });
                            videoDetailInfoNode.find(".video-detail-tags").html(tagHtml);
                        }
                        if (videoDetailConfig.pageAlbumId != video.cover.album_id) {
                            applyAlbumInfoToPageIfHas();
                        }
                    }
                },
                "hostUser": videoDetailConfig.hostUserId
            });
            openEditBtn.click(function () {
                video_handle.openUpdateVideoModal(config.pageVideoId);
            });
        }
        // 点赞的小玩意
        $(videoDetailConfig.selector.videoLikeArea).click(function () {
            var valueNode = $(this).find(".video-detail-like-count");
            valueNode.text((parseInt(valueNode.text()) || 0) + 1)
        });
    };

    var loadAlbum = function (album_id, success) {
        $.get("photo.do?method=albumByAjax", {"id": album_id, "photos": false}, function (data) {
            if (data.flag == 200) {
                success(data.album);
            }
        });
    };

    var applyAlbumInfoToPageIfHas = function () {
        var pageDetailInfoNode = $(config.selector.videoDetailInfo);
        loadAlbum(config.pageAlbumId, function (album) {
            pageDetailInfoNode.find(".video-detail-album-name a").text(album.name).attr("title", album.name);
        });
    };

    /* ********** main ************* */

    // 注册监控服务器的未读评论消息推送
    function initWsReceiveServerPush() {
        if (login_handle.validateLogin()) {
            var eventPrefix = websocket_util.config.event.messageReceive + ".";
            var notify_ws_opts = {
                "progressBar": false,
                "positionClass": "toast-top-right",
                "iconClass": "toast-success-no-icon",
                "timeOut": 0,
                "onclick": function () {

                },
                "onShown": function () {
                    $(this).css("opacity", "1");
                }
            };
            // 收到新评论，unbind取消login.js中的默认处理
            websocket_util.unbind(eventPrefix + "receive_comment").bind(eventPrefix + "receive_comment", function (e, wsMessage, wsEvent) {
                var comment = wsMessage.metadata.comment;
                var notify_opts = null;
                var msg = null;
                switch (comment.mainType) {
                    case 0:
                        var article = wsMessage.metadata.article;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                window.open("article.do?method=detail&aid=" + article.aid + "#comment_" + comment.cid);
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + " 在你的文章<br><b>“" + article.title + "”</b><br>发表了评论~";
                        } else {
                            msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                        }
                        break;
                    case 1:
                        var photo = wsMessage.metadata.photo;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                window.open("photo.do?method=detail&id=" + photo.photo_id + "#comment_" + comment.cid);
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + " 对你的照片<br><b>“" + photo.photo_id + "”</b><br>发表了评论~";
                        } else {
                            msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                        }
                        break;
                    case 2:
                        var video = wsMessage.metadata.video;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                if (video.video_id == config.pageVideoId) {   // 当前视频页就是这个视频的详情页
                                    comment_plugin.utils.scrollToSpecialComment(comment);
                                } else {
                                    window.open("video.do?method=detail&id=" + video.video_id + "#comment_" + comment.cid);
                                }
                            }
                        });
                        if (video.video_id == config.pageVideoId) {   // 当前视频页就是这个视频的详情页
                            // 直接显示
                            comment_plugin.utils.appendCommentInPage(comment);
                        }
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + " 对你的视频<br><b>“" + video.video_id + "”</b><br>发表了评论~";
                        } else {
                            msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                        }
                        break;
                }
                if (msg) {
                    common_utils.notify(notify_opts)
                        .success(msg, "", "receive_comment" + "_" + comment.cid)
                        .addClass("wsMessage receive_comment").attr("data-wsid", wsMessage.id).attr("data-cid", comment.cid);
                }
            });
        }
    }

    $(config.selector.videoDetailInfo).find(".video-detail-desc p").each(function (e) {
        this.innerHTML = formatDescArea(this.innerHTML, false);
    });

    // 评论模块初始化
    comment_plugin.init({
        mainType: 2, // 2代表视频评论
        mainIdVariableName: "mainId",
        mainId: config.pageVideoId,
        hostUserId: config.hostUserId,
        autoScrollOnPageOpen: true, // 开启在页面打开时根据url的#hash值自动滚到对应位置
        path_params: {
            "basePath": $('#basePath').attr('href'),
            "staticPath": $('#staticPath').attr('href'),
            "cloudPath": $('#cloudPath').attr('href')
        }
    });

    domReady(function () {
        //
        init();
        // 注册监控服务器的未读评论消息推送
        initWsReceiveServerPush();
    });
});
