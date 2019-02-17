(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'comment_plugin', 'album_photo_handle', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, comment_plugin, album_photo_handle, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, comment_plugin, album_photo_handle, websocket_util) {

    var config = {
        selector: {
            "firstHeaderArea": "#first",
            "mainArea": "#main",
            "photoNode": "#show-img",
            "photoDetailInfo": ".photo-detail-info",
            "openEditBtn": ".photo-detail-info .photo-detail-open-edit",
            "photoLikeArea": ".photo-detail-info .photo-detail-like"
        },
        path_params: {
            "basePath": $('#basePath').attr('href'),
            "staticPath": $('#staticPath').attr('href'),
            "cloudPath": $('#cloudPath').attr('href')
        },
        pagePhotoId: parseInt($(".photo-detail-info").attr("data-photo-id")) || 0,
        hostUserId: parseInt($("#first .photo-name").attr("hostUid")) || 0,
        hostUserNickname: $(".photo-detail-info .photo-detail-user-nickname a").text(),
        pageAlbumId: parseInt($("#first .photo-name").attr("albumId")) || 0,
        pageAlbumName: $(".photo-detail-info .photo-detail-album-name a").text()
    };

    var init = function () {
        switchPhotoShowSize();
        initPhotoHandleEvent();
        applyVideoInfoToPageIfHas();
    };

    var switchPhotoShowSize = function () {
        var switchElem = $(config.selector.photoDetailInfo).find(".photo-detail-show-size a");
        var imgElem = $(config.selector.photoNode);
        var switchFunc = function () {
            var currValue = switchElem.attr("data-show-size") || "default";
            if (currValue == "default") {
                imgElem.css("max-height", "initial");
                imgElem.css("width", "100%");
                switchElem.attr("data-show-size", "max").text("填充⬇");
            } else {
                imgElem.css("max-height", "");
                imgElem.css("width", "");
                switchElem.attr("data-show-size", "default").text("默认⬇");
                document.documentElement.scrollTop = 0;
            }
        };
        switchElem.click(switchFunc);
        imgElem.click(switchFunc);
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

    var initPhotoHandleEvent = function () {
        var photoDetailConfig = config;
        var openEditBtn = $(photoDetailConfig.selector.openEditBtn);
        if (openEditBtn.length > 0 && login_handle.getCurrentUserId() == photoDetailConfig.hostUserId) {
            // 相册处理模块初始化
            album_photo_handle.init({
                "albumId": photoDetailConfig.pageAlbumId,
                "selector": {
                    "uploadModal": "#uploadPhotoModal",
                    "updateModal": "#updatePhotoModal"
                },
                path_params: {
                    "basePath": $("#basePath").attr("href"),
                    "cloudPath": $("#cloudPath").attr("href"),
                    "staticPath": $("#staticPath").attr("href")
                },
                callback: {
                    "updateCompleted": function (context, photo) {
                        $(photoDetailConfig.selector.photoNode).attr(photoDetailConfig.path_params.cloudPath + photo.path);
                        var photoDetailInfoNode = $(photoDetailConfig.selector.photoDetailInfo);
                        photoDetailInfoNode.find(".photo-detail-name a").text(photo.name || "在相册内查看");
                        photoDetailInfoNode.find(".photo-detail-desc").html(formatDescArea(photo.description));
                        photoDetailInfoNode.find(".photo-detail-size").text(photo.size + "KB（" + photo.width + "×" + photo.height + "）");
                        photoDetailInfoNode.find(".photo-detail-refer a").text(photo.refer);
                        photoDetailInfoNode.find(".photo-detail-image-type").text(photo.image_type);
                        if (photo.tags != null && photo.tags.length > 0) {
                            var tagHtml = "";
                            $.each(photo.tags.split("#"), function (i, tag) {
                                if (tag) {
                                    tagHtml += '<a target="_blank" href="photo.do?method=dashboard&model=photo&tags=${tag}" data-photo-tag="' + tag + '">#' + tag + '</a>&nbsp;&nbsp';
                                }
                            });
                            photoDetailInfoNode.find(".photo-detail-tags").html(tagHtml);
                        }
                    },
                    "deleteCompleted": function (context, photo_id) {
                    },
                    "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {
                        var album_id = context.config.albumId;
                        // 传入的参数可以修改上传的相册ID
                        openUploadModal_callback(album_id);
                    },
                    "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {
                        // 如果图片为视频的封面，则添加视频链接
                        var video_id = 0;
                        if (video_id) {
                            var video_href_span = updateModal.find('span[name="video_id"]');
                            if (video_href_span.length == 0) {
                                updateModal.find('span[name="photo_id"]').parent().parent().after(
                                    '<div class="form-group"><label class="control-label">视频ID：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                    '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看关联视频" >' +
                                    '<span name="video_id" class="control-label"></span></a></div>'
                                );
                                video_href_span = updateModal.find('span[name="video_id"]');
                            } else {
                                video_href_span.parent().parent().show(0);
                            }
                            video_href_span.text(video_id).parent().attr("href", "video.do?method=user_videos&uid=" + photo.uid + "&check=" + photo.photo_id);
                        } else {
                            updateModal.find('span[name="video_id"]').parent().parent().hide(0);
                        }
                        // dashboard页 添加照片所属相册链接
                        if (updateModal.find('span[name="album_id"]').length == 0) {
                            updateModal.find('span[name="photo_id"]').parent().parent().after(
                                '<div class="form-group"><label class="control-label">所属簿：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看该相簿" >' +
                                '<span name="album_id" class="control-label"></span></a></div>'
                            );
                        }
                        // dashboard页 添加照片所有者主页链接
                        if (updateModal.find('span[name="user_id"]').length == 0) {
                            updateModal.find('span[name="album_id"]').parent().parent().after(
                                '<div class="form-group"><label class="control-label">所有者：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看用户主页" >' +
                                '<span name="user_id" class="control-label"></span></a></div>'
                            );
                        }
                        var album_url = "photo.do?method=album_detail&id=" + photo.album_id;
                        updateModal.find('span[name="album_id"]').text(photoDetailConfig.pageAlbumName).parent().attr("href", album_url);
                        var user_home_url = "user.do?method=home&uid=" + photo.uid;
                        updateModal.find('span[name="user_id"]').text(photoDetailConfig.hostUserNickname).parent().attr("href", user_home_url);
                        formatPhotoToModal_callback(photo);
                    }
                },
                "downloadType": /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? "url" : "ajax"
            });
            // 打开编辑照片按钮绑定
            openEditBtn.click(function (e) {
                album_photo_handle.loadPhoto(photoDetailConfig.pagePhotoId, function (data) {
                    if (data.flag == 200) {
                        var photo = data.photo;
                        if (photo.uid == photoDetailConfig.hostUserId) {
                            album_photo_handle.openUpdatePhotoModal(photo);
                        } else {
                            toastr.error(data.info, "加载失败");
                        }
                    }
                })
            });
        }
        // 点赞的小玩意
        $(photoDetailConfig.selector.photoLikeArea).click(function () {
            var valueNode = $(this).find(".photo-detail-like-count");
            valueNode.text((parseInt(valueNode.text()) || 0) + 1)
        });
    };

    var loadVideoByCover = function (cover_id, callback) {
        $.get("video.do?method=detailByAjax", {"cover_id": cover_id}, function (data) {
            if (data && data.flag == 200) {
                callback(data.video);
            }
        });
    };

    var applyVideoInfoToPageIfHas = function () {
        var pageDetailInfoNode = $(config.selector.photoDetailInfo);
        var imageType = pageDetailInfoNode.find(".photo-detail-image-type").text();
        if (imageType && imageType.indexOf("video") != -1) {
            loadVideoByCover(config.pagePhotoId, function (video) {
                pageDetailInfoNode.find(".photo-detail-video")
                    .show().find(".photo-detail-video-name a")
                    .text(video.name)
                    .attr("data-video-id", video.video_id)
                    .attr("title", video.name)
                    .attr("href", "video.do?method=user_videos&uid=" + video.user.uid + "&check=" + config.pagePhotoId);
                pageDetailInfoNode.find(".photo-detail-handle-area").css("margin-top", "5px");
            });
        }
    };

    /* ********** main ************* */

    // 评论模块初始化
    comment_plugin.init({
        mainType: 1, // 1代表照片评论
        mainIdVariableName: "mainId",
        mainId: config.pagePhotoId,
        hostUserId: config.hostUserId,
        autoScrollOnPageOpen: true, // 开启在页面打开时根据url的#hash值自动滚到对应位置
        path_params: {
            "basePath": $('#basePath').attr('href'),
            "staticPath": $('#staticPath').attr('href'),
            "cloudPath": $('#cloudPath').attr('href')
        }
    });

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
                                if (photo.photo_id == config.pagePhotoId) {   // 当前照片页就是这个照片的详情页
                                    comment_plugin.utils.scrollToSpecialComment(comment);
                                } else {
                                    window.open("photo.do?method=detail&id=" + photo.photo_id + "#comment_" + comment.cid);
                                }
                            }
                        });
                        if (photo.photo_id == config.pagePhotoId) {   // 当前照片页就是这个照片的详情页
                            // 直接显示
                            comment_plugin.utils.appendCommentInPage(comment);
                        }
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
                                window.open("video.do?method=detail&id=" + video.video_id + "#comment_" + comment.cid);
                            }
                        });
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

    $(config.selector.photoDetailInfo).find(".photo-detail-desc p").each(function (e) {
        this.innerHTML = formatDescArea(this.innerHTML, false);
    });

    domReady(function () {
        //
        init();

        // 注册监控服务器的未读评论消息推送
        initWsReceiveServerPush();
    });

});
