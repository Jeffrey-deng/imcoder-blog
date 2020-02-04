(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'comment_plugin', 'album_photo_handle', 'websocket_util', 'blowup'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, comment_plugin, album_photo_handle, websocket_util, blowup);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, comment_plugin, album_photo_handle, websocket_util, blowup) {

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
        pagePhotoId: $(".photo-detail-info").attr("data-photo-id") || "0",
        hostUserId: $("#first .photo-name").attr("hostUid") || 0,
        hostUserNickname: $(".photo-detail-info .photo-detail-user-nickname .photo-detail-user-nickname-value").text(),
        pageAlbumId: $("#first .photo-name").attr("albumId") || "0",
        pageAlbumName: $(".photo-detail-info .photo-detail-album-name a.photo-source-album").attr("data-album-name"),
        img_load_error_default: "res/img/img_load_error_default.jpg",
        initTopic: null
    };

    var init = function () {
        if (/^.*（(\d+)×(\d+)）$/.test($(config.selector.photoDetailInfo).find(".photo-detail-size").text())) {
            config.photoWidth = parseInt(RegExp.$1);
            config.photoHeight = parseInt(RegExp.$2);
        }
        initPhotoHandleEvent();
        switchPhotoShowSize();
        bindPhotoTransform();
        bindBlowup();
        applyVideoInfoToPageIfHas();
        applyMountAlbumInfoToPageIfHas();
        bindPhotoTopicEvent();
    };

    var utils = {
        "findPhotoIndexInList": function (photos, photo_id) {
            var index = -1;
            $.each(photos, function (i, photo) {
                if (photo.photo_id == photo_id) {
                    index = i;
                    return false;
                }
            });
            return index;
        },
        "replaceLoadErrorImgToDefault": function (parentNode) { // 图片加载失败显示默认图片
            $(parentNode).find("img").one("error", function (e) {
                $(this)
                    .attr("src", config.path_params.cloudPath + config.img_load_error_default)
                    .attr("title", "该图片加载失败~");
            });
        }
    };

    var request = {
        "loadVideoByCover": function (cover_id, callback) {
            return $.get("video.api?method=getVideo", {"cover_id": cover_id}, function (response) {
                if (response && response.status == 200) {
                    callback && callback(response.data.video);
                }
            });
        },
        "loadPhotoTagWrappers": function (photo_id, callback) {
            return $.get("photo.api?method=getTagWrappersByPhoto", {"photo_id": photo_id}, function (response) {
                if (response.status == 200) {
                    callback && callback(response.data);
                }
            });
        },
        "loadPhotoList": function (condition, call) {
            return $.get("photo.api?method=getPhotoList", condition, function (response) {
                if (response.status == 200) {
                    call && call(response.data.photos);
                }
            });
        },
        "loadAlbumInfo": function (album_id, call) {
            return $.get("photo.api?method=getAlbum", {"id": album_id, "photos": false}, function (response) {
                if (response.status == 200) {
                    call && call(response.data.album, response);
                }
            });
        },
        "likePhoto": function (photo_id, undo, call) {
            var post_param = {};
            post_param.photo_id = photo_id;
            post_param.undo = undo;
            return $.post("photo.api?method=likePhoto", post_param, function (response) {
                if (response.status == 200) {
                    call && call(response.data.photo, response.data.type, response);
                } else if (call) {
                    toastr.error(response.message, "点赞失败");
                    console.warn("Error Code: " + response.status);
                }
            });
        }
    };

    // 切换显示模式功能
    var switchPhotoShowSize = function () {
        var switchElem = $(config.selector.photoDetailInfo).find(".photo-detail-show-size a");
        var imgElem = $(config.selector.photoNode);
        var switchFunc = function () {
            imgElem.parent().css({
                'height': '',
                'overflow': ''
            });
            imgElem.css({
                'width': '',
                'height': '',
                'margin-top': '',
                'transform': ''
            });
            var fromValue = switchElem.attr("data-show-size") || "fit";
            var toValue = "";
            switch (fromValue) {
                case "fit":
                    toValue = "tile";
                    break;
                case "tile":
                    toValue = "fill";
                    break;
                case "fill":
                    toValue = "fit";
                    break;
            }
            switch (toValue) {
                case "fit":
                    imgElem.css("max-height", "");
                    imgElem.css("max-width", "100%");
                    imgElem.css("width", "unset");
                    switchElem.attr("data-show-size", "fit").text("适应⬇").attr("title", "点击切换为`平铺`显示");
                    imgElem.attr("title", "点击切换为`平铺`显示");
                    document.documentElement.scrollTop = 0;
                    break;
                case "tile":
                    imgElem.css("max-height", "unset");
                    imgElem.css("max-width", "unset");
                    imgElem.css("width", "unset");
                    switchElem.attr("data-show-size", "tile").text("平铺⬇").attr("title", "点击切换为`填充`显示");
                    imgElem.attr("title", "点击切换为`填充`显示");
                    break;
                case "fill":
                    imgElem.css("max-height", "unset");
                    imgElem.css("max-width", "100%");
                    imgElem.css("width", "100%");
                    switchElem.attr("data-show-size", "fill").text("填充⬇").attr("title", "点击切换为`适应`显示");
                    imgElem.attr("title", "点击切换为`适应`显示");
                    break;
            }
        };
        switchElem.on('click', switchFunc);
        imgElem.on('click', switchFunc);
    };

    // 图片旋转功能、图片翻转功能
    var bindPhotoTransform = function () {
        var rotatePhoto = function (switch_angle) {
            var $img = $(config.selector.photoNode),
                $imgContainer = $img.parent(),
                photo = {'width': config.photoWidth, 'height': config.photoHeight},
                showMode = $(config.selector.photoDetailInfo).find(".photo-detail-show-size a").attr('data-show-size') || 'fit',
                computedStyle = getComputedStyle($img[0]),
                boxWidth = $imgContainer.width(),
                boxHeight = showMode == 'fit' ? parseFloat(computedStyle.maxHeight) : -1;
            var css = common_utils.calcElementRotateStyle(switch_angle, photo.width, photo.height, boxWidth, boxHeight, showMode == 'tile' ? false : true, $img.prop('style').transform);
            delete css['margin-left'];
            if (switch_angle == 90 || switch_angle == 270) {
                css['max-height'] = 'unset';
                $imgContainer.css({
                    'height': css.width,
                    'overflow': 'hidden'
                });
                if (showMode == 'tile') {
                    $imgContainer.css('overflow-x', 'auto');
                }
            } else {
                css['max-height'] = '';
                $imgContainer.css({
                    'height': '',
                    'overflow': ''
                });
                if (showMode == 'tile') {
                    css['max-width'] = 'unset';
                    css['width'] = 'unset';
                    css['max-height'] = 'unset';
                } else if (showMode == 'fill') {
                    css['max-width'] = '100%';
                    css['width'] = '100%';
                    css['max-height'] = 'unset';
                }
            }
            $img.css(css);
            $img.attr('data-rotate', switch_angle);
        };
        var flipPhoto = function (switch_horizontal, switch_vertical) {
            var $img = $(config.selector.photoNode),
                css_transform_value = $img.prop('style').transform ? $img.prop('style').transform.replace(/\s*rotate[XY]\([^)]*\)\s*/g, "") : "";
            if (switch_horizontal) {
                css_transform_value += " rotateY(180deg)"; // scaleX(-1)
            }
            if (switch_vertical) {
                css_transform_value += " rotateX(180deg)"; // scaleY(-1)
            }
            $img.css("transform", css_transform_value);
            $img.attr('data-flip-horizontal', switch_horizontal).attr('data-flip-vertical', switch_vertical);
        };
        // 图片变形快捷键事件
        $(document).off('keydown.img.transform').on('keydown.img.transform', function (e) {
            var theEvent = e || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            var tagName = e.target.tagName;
            if (!e.target.isContentEditable && tagName !== "INPUT" && tagName !== "TEXTAREA") { // S键或F键
                var $img;
                switch (code) {
                    case 81:    // Q键 - 向左旋转90°
                    case 69:    // E键 - 向右旋转90°
                        $img = $(config.selector.photoNode);
                        var before_angle = parseInt($img.attr('data-rotate') || '0'),
                            switch_angle = before_angle;
                        if (code === 81) {
                            switch_angle = Math.abs(before_angle + 270) % 360;
                        } else {
                            switch_angle = Math.abs(before_angle + 90) % 360;
                        }
                        rotatePhoto(switch_angle);
                        break;
                    case 72:    // H键 - 左右镜像
                    case 86:    // V键 - 上下镜像
                        $img = $(config.selector.photoNode);
                        var before_horizontal = ($img.attr('data-flip-horizontal') || 'false') === 'true' ? true : false,
                            before_vertical = ($img.attr('data-flip-vertical') || 'false') === 'true' ? true : false,
                            switch_horizontal = before_horizontal, switch_vertical = before_vertical;
                        if (code == 72) {
                            switch_horizontal = !before_horizontal;
                        } else {
                            switch_vertical = !before_vertical;
                        }
                        flipPhoto(switch_horizontal, switch_vertical);
                        break;
                }
            }
        });
    };

    // 放大镜功能
    var bindBlowup = function () {
        if (!/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            var blowupConfig = common_utils.getLocalConfig("album", {
                "photo_page": {
                    "blow_up": {
                        "width": 600,
                        "height": 600,
                        "scale": 1.6
                    }
                }
            }).photo_page.blow_up;
            var blowup = null;
            var isBlowup = false;
            blowupConfig.originScale = blowupConfig.scale;
            var switchBlowupBtn = function (open) {
                blowupConfig.scale = blowupConfig.originScale;
                if (open) {
                    blowup && blowup.destroy();
                    blowup = $.blowup({
                        selector: config.selector.photoNode,
                        width: blowupConfig.width,
                        height: blowupConfig.height,
                        scale: blowupConfig.scale
                    });
                    toastr.success("Z: 开关，X: 缩小，C: 放大", "已开启放大镜，热键如下", {"progressBar": false, "timeOut": 4200});
                } else {
                    blowup.destroy();
                    blowup = null;
                    toastr.success("已关闭放大镜", "", {"progressBar": false});
                }
                isBlowup = open;
            };
            $(document).on('keydown.img.blowup', function (e) {
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                var tagName = e.target.tagName;
                if (!e.target.isContentEditable && tagName !== "INPUT" && tagName !== "TEXTAREA") { // S键或F键
                    if (!isBlowup) {
                        switch (code) { // Z键 - 打开放大镜
                            case 90:
                                switchBlowupBtn(true);
                                break;
                        }
                    } else {
                        switch (code) { // Z键 - 关闭放大镜
                            case 90:
                                switchBlowupBtn(false);
                                break;
                            case 88: // X键 - 减小放大倍数
                                blowupConfig.scale = blowupConfig.scale - 0.1;
                                if (blowupConfig.scale < 1) {
                                    blowupConfig.scale = 1;
                                }
                                if (blowup) {
                                    blowup.options.scale = blowupConfig.scale;
                                    blowup.refresh();
                                }
                                break;
                            case 67: // C键 - 增加放大倍数
                                blowupConfig.scale = blowupConfig.scale + 0.1;
                                if (blowup) {
                                    blowup.options.scale = blowupConfig.scale;
                                    blowup.refresh();
                                }
                                break;
                        }
                    }
                }
            });
        }
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
                        comment_plugin.config.currentTopic = null;
                        applyPhotoInfoToPage(photo);
                        if (comment_plugin.pointer.topicPhotos) { // 同步到缓存
                            $.each(comment_plugin.pointer.topicPhotos, function (i, photos) {
                                if (!photos || photos.length == 0) {
                                    return;
                                }
                                var photo_source = null;
                                $.each(photos, function (i, p) {
                                    if (p.photo_id == photo.photo_id) {
                                        photo_source = p;
                                        return false;
                                    }
                                });
                                if (photo_source) {
                                    if (photo.topic && photo.topic.ptwid) {
                                        var isTopicPermissionUpdate = (!photo_source.topic || !photo_source.topic.ptwid || photo_source.topic.ptwid != photo.topic.ptwid ||
                                        (photo_source.topic.scope != photo.topic.scope || photo_source.topic.permission != photo.topic.permission));
                                        if (isTopicPermissionUpdate) {
                                            var update_ptwid = photo.topic.ptwid;
                                            $.each(photos, function (i, p) {
                                                if (p.topic && p.topic.ptwid && p.topic.ptwid == update_ptwid) {
                                                    p.topic = $.extend({}, photo.topic);
                                                }
                                            });
                                        }
                                    }
                                    common_utils.extendNonNull(photo_source, photo);
                                    if (!photo.topic || photo.topic.ptwid == null) {
                                        photo_source.topic = photo.topic;
                                    }
                                }
                            });
                        }
                    },
                    "deleteCompleted": function (context, params) {
                    },
                    "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {
                        var album_id = context.config.albumId;
                        // 传入的参数可以修改上传的相册ID
                        openUploadModal_callback(album_id);
                    },
                    "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {
                        const queue = new common_utils.TaskQueue(function (task) {
                            return task();
                        });
                        queue.append(function () {
                            // 如果图片为视频的封面，则添加视频链接
                            const video_id = 0;
                            if (video_id && video_id != "0") {
                                let $videoLinkText = updateModal.find('span[name="video_id"]');
                                if ($videoLinkText.length == 0) {
                                    updateModal.find('span[name="photo_id"]').closest('.form-group').after(
                                        '<div class="form-group"><label class="control-label">视频ID：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                        '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看关联视频" >' +
                                        '<span name="video_id" class="control-label"></span></a></div>'
                                    );
                                    $videoLinkText = updateModal.find('span[name="video_id"]');
                                } else {
                                    $videoLinkText.closest('.form-group').show(0);
                                }
                                $videoLinkText.text(video_id).parent().attr("href", "video/detail/" + video_id);
                            } else {
                                updateModal.find('span[name="video_id"]').closest('.form-group').hide(0);
                            }
                        });
                        queue.append(function () {
                            return $.Deferred(function (dfd) {  // 添加照片所属相册链接
                                let $albumLinkText = updateModal.find('span[name="album_id"]');
                                if ($albumLinkText.length == 0) {
                                    updateModal.find('span[name="photo_id"]').closest('.form-group').after(
                                        '<div class="form-group"><label class="control-label">所属簿：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                        '<a target="_blank" style="color: #666; cursor: pointer" title="在相簿中查看" >' +
                                        '<span name="album_id" class="control-label"></span></a></div>'
                                    );
                                    $albumLinkText = updateModal.find('span[name="album_id"]');
                                }
                                var album_url = "p/album/" + photo.album_id + "?check=" + photo.photo_id;
                                $albumLinkText.text(photoDetailConfig.pageAlbumName).parent().attr("href", album_url);
                                dfd.resolve();
                            });
                        });
                        queue.append(function () {
                            return $.Deferred(function (dfd) {  // 添加照片所有者主页链接
                                let $userLinkText = updateModal.find('span[name="user_id"]');
                                if ($userLinkText.length == 0) {
                                    updateModal.find('span[name="album_id"]').closest('.form-group').after(
                                        '<div class="form-group"><label class="control-label">所有者：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                        '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看用户主页" >' +
                                        '<span name="user_id" class="control-label"></span></a></div>'
                                    );
                                    $userLinkText = updateModal.find('span[name="user_id"]');
                                }
                                var user_home_url = "u/" + photo.uid + "/home";
                                $userLinkText.text(photoDetailConfig.hostUserNickname).parent().attr("href", user_home_url);
                                dfd.resolve();
                            });
                        });
                        queue.append(function () {
                            // 回调
                            formatPhotoToModal_callback(photo);
                        });
                    }
                },
                "downloadType": /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? "url" : "ajax"
            });
            // 绑定特殊标签的扩展点击反应事件
            album_photo_handle.on(album_photo_handle.config.event.tagExtendClick, function (_e, tag, photo_id, clickEvt, keyEvt) {
                switch (true) {
                    case /^#?mount@(.*)/i.test(tag): // 挂载
                        window.open("p/album/" + RegExp.$1 + "?check=" + photo_id);
                        break;
                    case /^#?weibo@(.*)/i.test(tag): // 微博用户
                        var weiboUserKey = RegExp.$1;
                        if (/\d{8,}/.test(weiboUserKey)) {
                            window.open("https://weibo.com/u/" + weiboUserKey);
                        } else {
                            window.open("https://weibo.com/" + weiboUserKey);
                        }
                        break;
                    case /^#?weibo-(.*)/i.test(tag): // 微博详情
                        window.open("https://m.weibo.cn/detail/" + RegExp.$1);
                        break;
                    case /^#?ytb-(.*)/i.test(tag): // Youtube
                        window.open("https://www.youtube.com/watch?v=" + RegExp.$1);
                        break;
                    default: // 默认打开当前相册的该标签
                        window.open("p/dashboard?model=photo&album_id=" + photoDetailConfig.pageAlbumId + "&tags=<" + tag + ">&from=album_detail");
                }
            });
            // 打开编辑照片按钮绑定
            openEditBtn.on('click', function (e) {
                album_photo_handle.loadPhoto(photoDetailConfig.pagePhotoId, function (photo) {
                    if (photo && photo.uid == photoDetailConfig.hostUserId) {
                        album_photo_handle.openUpdatePhotoModal(photo);
                    } else {
                        toastr.error("没有权限~");
                    }
                })
            });
        }
        // 点赞的小玩意
        $(photoDetailConfig.selector.photoLikeArea).on('click', function () {
            var $valueNode = $(this).find(".photo-detail-like-count");
            var undo = $valueNode.parent().hasClass("photo-has-liked");
            request.likePhoto(config.pagePhotoId, undo, function (photo, type, response) {
                var newValue = photo.like_count;
                if (type == 1) {
                    if (undo) {
                        toastr.success("已移除赞~");
                    } else {
                        if (login_handle.validateLogin()) {
                            toastr.success("点击查看赞过的列表", "已添加到赞", {
                                "timeOut": 12000,
                                "onclick": function () {
                                    window.open("u/likes/photos");
                                }
                            });
                        }
                    }
                } else {
                    toastr.success(response.message);
                }
                $valueNode.text(newValue).parent().toggleClass('photo-has-liked', !undo).toggleClass('like-wrapper-has-liked', !undo);
                if (comment_plugin.pointer.topicPhotos) {
                    $.each(comment_plugin.pointer.topicPhotos, function (i, photos) {
                        if (!photos || photos.length == 0) {
                            return;
                        }
                        $.each(photos, function (i, p) {
                            if (p.photo_id == config.pagePhotoId) {
                                p.like_count = newValue;
                                p.liked = !undo;
                                return false;
                            }
                        });
                    });
                }
            });
        });
        // 修改tag链接
        $(photoDetailConfig.selector.photoDetailInfo).on("click", ".photo-detail-tags a", function (e) {
            e.preventDefault();
            window.open(e.currentTarget.href + "?uid=" + photoDetailConfig.hostUserId);
        });
        // $(comment_plugin.config.selector.commentListArea).magnificPopup({
        //     type: 'image',
        //     delegate: 'img',
        //     callbacks: {
        //         elementParse: function (item) {
        //             var $el = item.$el = $(item.el[0]);
        //             item.src = $el.prop('src');
        //         }
        //     }
        // });
    };

    // 应用挂载的相册信息到当前页面
    var applyMountAlbumInfoToPageIfHas = function () {
        var pageDetailInfoNode = $(config.selector.photoDetailInfo);
        pageDetailInfoNode.find(".photo-detail-album-name a").each(function (i, node) {
            var $self = $(node);
            if (!$self.hasClass("photo-source-album")) {
                $self.remove();
            }
        });
        request.loadAlbumInfo(config.pageAlbumId, function (album) {
            config.pageAlbumName = album.name || ("album" + album.album_id);
            var $node = pageDetailInfoNode.find(".photo-detail-album-name a.photo-source-album");
            $node.attr("data-album-id", album.album_id);
            $node.attr("data-album-name", config.pageAlbumName);
            $node.attr("title", album.description || config.pageAlbumName);
            $node.attr("href", "p/album/" + album.album_id + "?check=" + config.pagePhotoId);
            $node.attr("target", "_blank");
            $node.text(config.pageAlbumName);
        });
        pageDetailInfoNode.find(".photo-detail-tags a").each(function (i, node) {
            var $self = $(node);
            var tag = $self.attr("data-photo-tag");
            if (/mount@(.+)/.test(tag)) {
                var album_id = RegExp.$1;
                if (album_id != config.pageAlbumId) {
                    request.loadAlbumInfo(album_id, function (album) {
                        var album_name = album.name || ("album" + album.album_id);
                        var $node = $(document.createElement('a'));
                        $node.attr("data-album-id", album.album_id);
                        $node.attr("data-album-name", album_name);
                        $node.attr("title", album.description || album_name);
                        $node.attr("href", "p/album/" + album.album_id + "?check=" + config.pagePhotoId);
                        $node.attr("target", "_blank");
                        $node.text(album_name);
                        pageDetailInfoNode.find(".photo-detail-album-name").append($node);
                    });
                }
            }
        });
    };

    // 应用视频信息到当前页面
    var applyVideoInfoToPageIfHas = function () {
        var pageDetailInfoNode = $(config.selector.photoDetailInfo);
        var imageType = pageDetailInfoNode.find(".photo-detail-image-type").text();
        pageDetailInfoNode.find(".photo-detail-video").hide()
            .find(".photo-detail-video-name a")
            .text("");
        if (imageType && imageType.indexOf("video") != -1) {
            request.loadVideoByCover(config.pagePhotoId, function (video) {
                pageDetailInfoNode.find(".photo-detail-video").show()
                    .find(".photo-detail-video-name a")
                    .text(video.name || ("video_" + video.video_id))
                    .attr("data-video-id", video.video_id)
                    .attr("title", video.name || ("video_" + video.video_id))
                    .attr("href", "video/detail/" + video.video_id);
                pageDetailInfoNode.find(".photo-detail-handle-area").css("margin-top", "5px");
            });
        }
    };

    // 应用照片信息到当前页面
    var applyPhotoInfoToPage = function (photo) {
        $(config.selector.photoNode)
            .attr("src", photo.path)
            .off("error").one("error", function (e) {
            $(this).attr("src", config.path_params.cloudPath + config.img_load_error_default);
        });
        var photoName = photo.name || ("photo_" + photo.photo_id);
        var photoDetailInfoNode = $(config.selector.photoDetailInfo);
        photoDetailInfoNode.find(".photo-detail-name a")
            .text(photoName)
            .attr("title", photoName)
            .attr("href", "p/detail/" + photo.photo_id);
        photoDetailInfoNode.find(".photo-detail-desc").html(common_utils.convertLinkToHtmlTag(photo.description));
        photoDetailInfoNode.find(".photo-detail-size").text(photo.size + "KB（" + photo.width + "×" + photo.height + "）");
        photoDetailInfoNode.find(".photo-detail-refer a").text(photo.refer).attr("href", photo.refer);
        photoDetailInfoNode.find(".photo-detail-image-type").text(photo.image_type);
        photoDetailInfoNode.find(".photo-detail-click-count-value").text(photo.click_count);
        photoDetailInfoNode.find(".photo-detail-like-count").text(photo.like_count)
            .parent().toggleClass('photo-has-liked', photo.liked).toggleClass('like-wrapper-has-liked', photo.liked);
        if (photo.tags != null && photo.tags.length > 0) {
            var tagHtml = "";
            $.each(photo.tags.split("#"), function (i, tag) {
                if (tag) {
                    tagHtml += '<a target="_blank" href="p/tag/' + encodeURIComponent(tag) + '" data-photo-tag="' + tag + '">#' + tag + '#</a>&nbsp;&nbsp;';
                }
            });
            photoDetailInfoNode.find(".photo-detail-tags").html(tagHtml);
        } else {
            photoDetailInfoNode.find(".photo-detail-tags").html("");
        }

        var albumNameNode = photoDetailInfoNode.find(".photo-detail-album-name a.photo-source-album");
        if (photo.album_id != albumNameNode.attr("data-album-id")) {
            config.pageAlbumName = "album_" + photo.album_id;
        } else {
            config.pageAlbumName = albumNameNode.attr("data-album-name");
        }
        albumNameNode
            .text(config.pageAlbumName)
            .attr("title", config.pageAlbumName)
            .attr("data-album-id", photo.album_id)
            .attr("data-album-name", config.pageAlbumName)
            .attr("href", "p/album/" + photo.album_id + "?check=" + photo.photo_id);
        if (photo.topic && photo.topic.ptwid) {
            if (photoDetailInfoNode.find(".photo-detail-topic").length == 0) {
                photoDetailInfoNode.find(".photo-detail-tags").after('<div class="form-group"><label class="col-sm-2 control-label">合&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;集</label>'
                    + '<div class="col-sm-10"><span class="help-block photo-detail-topic"><a target="_blank"></a>&nbsp;&nbsp;</span></div></div>');
            }
            photoDetailInfoNode.find(".photo-detail-topic a")
                .text("#" + photo.topic.name + "#")
                .attr("href", "p/topic/" + photo.topic.ptwid)
                .attr("title", photo.topic.description || photo.topic.name)
                .parent().parent().parent().show();
        } else {
            photoDetailInfoNode.find(".photo-detail-topic").parent().parent().hide();
        }
        config.pagePhotoId = photo.photo_id;
        config.pageAlbumId = photo.album_id;
        // 评论
        comment_plugin.config.mainId = config.pagePhotoId;
        config.tagWrappers = null;
        comment_plugin.pointer.topicTagWrappers = null;
        var commentLabelId = comment_plugin.config.currentTopic || config.pagePhotoId;
        $(comment_plugin.config.selector.commentListArea).find('.single-comment-label').attr("title", config.pagePhotoId).find("a").attr("data-topic", config.pagePhotoId);
        $(comment_plugin.config.selector.commentListArea).find('.photo-comment-bar a[data-topic="' + commentLabelId + '"]').parent().trigger("click");
        // 页面meta
        var tabTitle = config.pagePhotoId + (photo.name ? ("_" + photo.name) : "") + " | ImCoder博客's 相册";
        history.replaceState(
            null,
            tabTitle,
            document.location.href.replace(/\/[^/]+$/, "/" + config.pagePhotoId)
        );
        document.title = tabTitle;
        var headNode = $("head");
        headNode.find('meta[name="description"]').attr("content", photo.description);
        headNode.find('meta[name="keywords"]').attr("content", photo.tags);
        $(config.selector.firstHeaderArea).find(".photo-name").text(photoName);
        $("#navbar-collapse > ul:nth-child(1) > li.active > a").text(photo.photo_id);
        // 视频信息
        applyVideoInfoToPageIfHas();
        // 应用挂载的相册信息到当前页面
        applyMountAlbumInfoToPageIfHas();
    };

    // 合集中切换图片方法
    var switchTopicPhoto = function (direction) {
        var currentTopic = comment_plugin.config.currentTopic;
        if (!currentTopic) { // 当前未查看合集，不运行
            return;
        }
        var topicPhotos = comment_plugin.pointer.topicPhotos[currentTopic];
        if (!topicPhotos || topicPhotos.length == 0) { // 当前合集照片列表未加载，不运行
            return;
        }
        var index = utils.findPhotoIndexInList(topicPhotos, config.pagePhotoId);
        if (index == -1) {  // 当前合集照片列表中未找到该图片，不运行
            return
        }
        if (direction == "left") {
            (index - 1 < 0) ? (index = topicPhotos.length - 1) : (index--);
        } else {
            (index + 1 == topicPhotos.length) ? (index = 0) : (index++);
        }
        if (topicPhotos[index].photo_id == config.pagePhotoId) { // 当前要切换的图片就是当前图片，不运行
            return;
        }
        applyPhotoInfoToPage(topicPhotos[index]);
    };

    // 显示照片相关标签
    var buildPhotoRelationTagHtml = function (tagWrappers) {
        var groupNode = $(config.selector.photoDetailInfo).find(".form-group-relation-tags");
        if (groupNode.length == 0) {
            groupNode = $($.parseHTML('<div class="form-group form-group-relation-tags" style="display: none">' +
                '    <label class="col-sm-2 control-label">相关标签</label>' +
                '    <div class="col-sm-10">' +
                '        <span class="help-block photo-detail-relation-tags"></span>' +
                '    </div>' +
                '</div>'));
            $(config.selector.photoDetailInfo).find(".photo-detail-info-main .area-set-left").append(groupNode);
        }
        var isHas = false;
        if (tagWrappers && tagWrappers.length > 0) {
            var tagsHtml = "";
            tagWrappers.forEach(function (wrapper) {
                if (wrapper.type == 1) {
                    isHas = true;
                    var tag = wrapper.name;
                    var title = wrapper.description || wrapper.name;
                    var link = "p/tags_square?tags=<" + tag + ">&extend=true&uid=" + config.hostUserId + "&filter=" + tag;
                    tagsHtml += '<a target="_blank" href="' + link + '" data-photo-tag="' + tag + '" title="' + title + '">#' + tag + '#</a>&nbsp;&nbsp;';
                }
            });
            groupNode.find(".photo-detail-relation-tags").html(tagsHtml);
        }
        if (isHas) {
            groupNode.show();
        } else {
            groupNode.hide().find(".photo-detail-relation-tags").html("");
        }
    };

    // 构建合集名称显示栏
    var buildPhotoTopicCommentBarHtml = function (topicTagWrappers, topic, isTopic) {
        var photo_id = config.pagePhotoId;
        var $commentListArea = $(comment_plugin.config.selector.commentListArea);
        var html = '<ul class="post-meta photo-comment-bar-wrapper"><ol class="page-navigator photo-comment-bar">';
        var singleCommentLabelHtml = '单张评论：<li class="' + ( isTopic ? "" : "current " ) + 'single-comment-label comment-label" ' +
            'title="' + photo_id + '"><a data-topic="' + photo_id + '" href="p/detail/' + photo_id + '" target="_blank">' + photo_id + '</a></li>';
        var topicCommentLabelHtml = '合集评论：';
        $.each(topicTagWrappers, function (i, tagWrapper) {
            topicCommentLabelHtml += '<li class="' + ((isTopic && topic == tagWrapper.ptwid) ? "current " : "") +
                'topic-comment-label comment-label" title="右键打开' + tagWrapper.name + '">' +
                '<a data-topic="' + tagWrapper.ptwid + '" data-topic-name="' + tagWrapper.name + '" href="p/topic/' + tagWrapper.ptwid + '" target="_blank">' +
                tagWrapper.name + '</a></li>';
        });
        html = html + singleCommentLabelHtml + topicCommentLabelHtml;
        $commentListArea.prepend(html);
        // 修改地址栏
        if (!isTopic && config.initTopic) {
            $commentListArea.find('.photo-comment-bar a[data-topic="' + config.initTopic + '"]').parent().trigger("click");
            config.initTopic = null;
        } else {
            var link = document.location.href;
            if (isTopic) {
                link = common_utils.setParamForURL("from", "photo_topic", common_utils.setParamForURL("topic.ptwid", topic, link));
            } else {
                link = common_utils.removeParamForURL("from", common_utils.removeParamForURL("topic.ptwid", link));
            }
            history.replaceState(
                null,
                document.title,
                link
            );
            var notHashLink = link.replace(/#.*$/, "");
            $commentListArea.find('a[data-action-type^="comment_"]').each(function (i, node) { // hash锚点设置前缀
                node.href = notHashLink + '#' + node.getAttribute("data-action-type");
            });
        }
    };

    // 合集相关的事件
    var bindPhotoTopicEvent = function () {
        $(comment_plugin.config.selector.commentListArea).on("click", ".photo-comment-bar .comment-label", function (e) {
            e.preventDefault();
            var cache = comment_plugin.pointer;
            var commentLabel = $(this);
            var isTopic = commentLabel.hasClass("topic-comment-label");
            commentLabel.parent().children().removeClass("current");
            commentLabel.addClass("current");
            if (isTopic) {
                if (!comment_plugin.config.currentTopic) { // 备份好当前单张评论的数据
                    if (!cache.photoComments) {
                        cache.photoComments = {};
                    }
                    cache.photoComments[config.pagePhotoId] = cache.comments;
                }
                comment_plugin.config.currentTopic = commentLabel.find("a").attr("data-topic");
                comment_plugin.config.mainType = 3;
                comment_plugin.config.mainId = comment_plugin.config.currentTopic;
            } else {
                comment_plugin.config.currentTopic = null;
                comment_plugin.config.mainType = 1;
                comment_plugin.config.mainId = config.pagePhotoId;
            }
            var mainId = comment_plugin.config.mainId;
            if (isTopic) { // 合集
                // 加载合集评论
                if (!cache.topicComments) {
                    cache.topicComments = {};
                }
                if (cache.topicComments[mainId]) {
                    cache.comments = cache.topicComments[mainId];
                    comment_plugin.buildCommentAreaHtml();
                } else {
                    comment_plugin.loadCommentList(function (comments) {
                        cache.comments = comments;
                        cache.topicComments[mainId] = comments;
                        comment_plugin.buildCommentAreaHtml();
                    });
                }
                // 加载合集照片列表
                if (!cache.topicPhotos) {
                    cache.topicPhotos = {};
                }
                if (!cache.topicPhotos[mainId]) {
                    var topicName = commentLabel.find("a").attr("data-topic-name");
                    var condition = {
                        "uid": config.hostUserId,
                        "tags": "<" + topicName + ">", // 这里不能用topic.ptwid查询，因为一张图片只属于一个topic，所以查询出的列表不会包含当前照片
                        "query_start": -1,
                        "query_size": 0
                    };
                    request.loadPhotoList(condition, function (photos) {
                        cache.topicPhotos[mainId] = photos;
                        var nameDom = $(config.selector.photoDetailInfo).find(".photo-detail-name a");
                        var photoName = nameDom.attr("title");
                        nameDom.text("[ " + (utils.findPhotoIndexInList(cache.topicPhotos[mainId], config.pagePhotoId) + 1) + " / " + cache.topicPhotos[mainId].length + " ] " + photoName);
                    });
                } else {
                    var nameDom = $(config.selector.photoDetailInfo).find(".photo-detail-name a");
                    var photoName = nameDom.attr("title");
                    nameDom.text("[ " + (utils.findPhotoIndexInList(cache.topicPhotos[mainId], config.pagePhotoId) + 1) + " / " + cache.topicPhotos[mainId].length + " ] " + photoName);
                }
            } else { // 单张评论
                // 加载照片评论
                if (!cache.photoComments) {
                    cache.photoComments = {};
                }
                if (cache.photoComments[mainId]) {
                    cache.comments = cache.photoComments[mainId];
                    comment_plugin.buildCommentAreaHtml();
                } else {
                    comment_plugin.loadCommentList(function (comments) {
                        cache.comments = comments;
                        cache.photoComments[mainId] = comments;
                        comment_plugin.buildCommentAreaHtml();
                    });
                }
                var nameDom = $(config.selector.photoDetailInfo).find(".photo-detail-name a");
                var photoName = nameDom.attr("title");
                nameDom.text(photoName || "在相册内查看");
            }
        });
        // 照片切换按钮事件
        $(config.selector.photoNode).parent().on({
            "mouseenter": function () {
                if (comment_plugin.config.currentTopic
                    && comment_plugin.pointer.topicPhotos
                    && comment_plugin.pointer.topicPhotos[comment_plugin.config.currentTopic]
                    && comment_plugin.pointer.topicPhotos[comment_plugin.config.currentTopic].length > 1) {
                    $(this).find(".topic-arrow").css("display", "block");
                }
            },
            "mouseleave": function () {
                $(this).find(".topic-arrow").css("display", "none");
            }
        }).on("click", ".topic-arrow-left", function () {
            $(config.selector.photoNode).removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInLeft');
            switchTopicPhoto("left");
        }).on("click", ".topic-arrow-right", function () {
            $(config.selector.photoNode).removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInRight');
            switchTopicPhoto("right");
        }).on("animationend webkitAnimationEnd", config.selector.photoNode, function () {
            $(this).removeClass('animated bounceInLeft bounceInRight');
        });
    };

    // 注册监控服务器的未读评论消息推送
    function initWsReceiveServerPush() {
        if (!login_handle.validateLogin()) {
        } else {
            var notify_ws_opts = {
                "progressBar": false,
                "positionClass": "toast-top-right",
                "iconClass": "toast-success-no-icon",
                "timeOut": 0,
                "onclick": function (e) {
                    if ($(e.target).closest('a').length > 0) {
                        e.preventDefault();
                        window.open(e.target.href);
                        return false;
                    }
                },
                "onShown": function () {
                    $(this).css("opacity", "1");
                },
                "onHidden": function (toastElement, closeType) {
                    if (closeType != 0 && toastElement.hasClass("wsMessage") && !toastElement.hasClass("not-sync-ws-message")) {
                        websocket_util.post({
                            "mapping": "transfer_data_in_tabs",
                            "metadata": {
                                "handle": "remove_ws_message",
                                "ws_message_id": parseInt(toastElement.attr("data-wsid"))
                            }
                        });
                    }
                }
            };
            // 收到新评论，取消login.js中的默认处理
            websocket_util.onPush("receive_comment", function (e, wsMessage, wsEvent) {
                var comment = wsMessage.metadata.comment;
                var notify_opts = null;
                var msg = null;
                switch (comment.mainType) {
                    case 1:
                        var photo = wsMessage.metadata.photo;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function (e) {
                                ($(e.target).closest('a').length > 0) && e.preventDefault();
                                if (photo.photo_id == config.pagePhotoId) {   // 当前照片页就是这个照片的详情页
                                    comment_plugin.utils.scrollToSpecialComment(comment);
                                } else {
                                    window.open("p/detail/" + photo.photo_id + "#comment_" + comment.cid);
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
                        e.stopImmediatePropagation(); // 阻止login中绑定的事件, stopImmediatePropagation能阻止委托事件
                        break;
                    case 3:
                        var tagWrapper = wsMessage.metadata.tagWrapper;
                        var hasInsert = false;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                var topicLabelNode = $(comment_plugin.config.selector.commentListArea).find('.photo-comment-bar .topic-comment-label a[data-topic="' + tagWrapper.ptwid + '"]');
                                if (topicLabelNode.length > 0) {
                                    if (!hasInsert && comment_plugin.pointer.topicComments && comment_plugin.pointer.topicComments[tagWrapper.ptwid]) {
                                        comment_plugin.pointer.topicComments[tagWrapper.ptwid].push(comment);
                                    }
                                    comment_plugin.once(comment_plugin.config.event.commentHtmlBuildCompleted, function (e, list, pageIndex, buildReason) {
                                        comment_plugin.utils.scrollToSpecialComment(comment);
                                    });
                                    topicLabelNode.trigger('click');
                                } else {
                                    window.open("p/tag/" + tagWrapper.name + "#comment_" + comment.cid);
                                }
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + " 对你的照片合集<br><b>“" + tagWrapper.name + "”</b><br>发表了评论~";
                        } else {
                            msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                        }
                        if (comment_plugin.config.currentTopic == tagWrapper.ptwid) {
                            comment_plugin.utils.appendCommentInPage(comment);
                            hasInsert = true;
                        }
                        e.stopImmediatePropagation(); // 阻止login中绑定的事件, stopImmediatePropagation能阻止委托事件
                        break;
                }
                if (msg) {
                    common_utils.notify(notify_opts)
                        .success(msg, "", "receive_comment" + "_" + comment.cid)
                        .addClass("wsMessage receive_comment").attr("data-wsid", wsMessage.id).attr("data-cid", comment.cid);
                }
            }, true); // 插入到事件队列第一个
        }
    }

    /* ********** main ************* */

    // 评论列表构建完成后再构建合集名称显示栏
    comment_plugin.on(comment_plugin.config.event.commentHtmlBuildCompleted, function (e, list, pageIndex, buildReason) {
        if (list.length < 50 && (buildReason == 'init' || buildReason == 'refresh')) {
            if (!comment_plugin.config.currentTopic) {
                $(comment_plugin.config.selector.commentListArea).find('.comment-list').removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInLeft');
            } else {
                $(comment_plugin.config.selector.commentListArea).find('.comment-list').removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInRight');
            }
        }
        if (!comment_plugin.pointer.topicTagWrappers) {
            request.loadPhotoTagWrappers(config.pagePhotoId, function (data) {
                config.tagWrappers = data.tagWrappers;
                comment_plugin.pointer.topicTagWrappers = data.topicTagWrappers;
                buildPhotoTopicCommentBarHtml(comment_plugin.pointer.topicTagWrappers, comment_plugin.config.mainId, comment_plugin.config.currentTopic ? true : false);
                buildPhotoRelationTagHtml(config.tagWrappers);
            });
        } else {
            buildPhotoTopicCommentBarHtml(comment_plugin.pointer.topicTagWrappers, comment_plugin.config.mainId, comment_plugin.config.currentTopic ? true : false);
            buildPhotoRelationTagHtml(config.tagWrappers);
        }
    });
    // 评论模块初始化
    comment_plugin.init({
        currentTopic: undefined,
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

    var descNode = $(config.selector.photoDetailInfo).find(".photo-detail-desc");
    descNode.html(common_utils.convertLinkToHtmlTag(descNode.html(), false));

    domReady(function () {
        // init
        init();
        // mark
        if (/[&?]mark=([^&#]+)/.test(document.location.href)) {
            switch (RegExp.$1) {
                case "edit":
                    $(config.selector.openEditBtn).trigger('click');
                    break;
                case "meta":
                    setTimeout(function () {
                        var sh = $(config.selector.photoDetailInfo).offset().top - 100;
                        $('html,body').animate({scrollTop: sh}, 300);
                    }, 350);
                    break;
            }
            history.replaceState({"mark": "page"}, common_utils.removeParamForURL("mark"));
        }
        var params = common_utils.parseURL(document.location.href).params;
        if (params["from"] == "photo_topic" && params["topic.ptwid"]) {
            config.initTopic = params["topic.ptwid"];
        }
        // 注册监控服务器的未读评论消息推送
        initWsReceiveServerPush();
    });

});
