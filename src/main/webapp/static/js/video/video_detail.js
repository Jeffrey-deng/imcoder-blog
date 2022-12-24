(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle', 'comment_plugin', 'video_handle', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, login_handle, comment_plugin, video_handle, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, login_handle, comment_plugin, video_handle, websocket_util) {

    var selector = globals.extend(globals.selector, {
        'video_detail': {
            "firstHeaderArea": "#first",
            "mainArea": "#main",
            "videoNode": "#show-video",
            "videoDetailInfo": ".video-detail-info",
            "openEditBtn": ".video-detail-info .video-detail-open-edit",
            "videoLikeArea": ".video-detail-info .video-detail-like"
        }
    }).video_detail;

    var config = {
        selector: selector,
        path_params: globals.path_params,
        pageVideoId: $(selector.videoDetailInfo).attr('data-video-id') || '0',
        hostUserId: $(selector.firstHeaderArea).find('.video-name').attr('data-user-id') || '0',
        hostUserNickname: $(selector.videoDetailInfo).find('.video-detail-user-nickname .video-detail-user-nickname-value').text(),
        pageAlbumId: $(selector.videoDetailInfo).find('.video-detail-album-name a.photo-source-album').attr('data-album-id') || '0',
        pageAlbumName: $(selector.videoDetailInfo).find('.video-detail-album-name a.photo-source-album').text(),
        pageCoverId: $(selector.videoDetailInfo).find('.video-detail-album-name a.photo-source-album').attr('data-cover-id') || '0',
        initTopic: null
    };

    var init = function () {
        if (/^.*（(\d+)×(\d+)）$/.test($(config.selector.videoDetailInfo).find('.video-detail-size').text())) {
            config.videoWidth = parseInt(RegExp.$1);
            config.videoHeight = parseInt(RegExp.$2);
        }
        initSwitchVideoShowSize();
        initVideoHandleEvent();
        applyAlbumInfoToPageIfHas();
        bindVideoTopicEvent();
    };

    var utils = {};

    const request = globals.extend(globals.request, {
        video_detail: {
            'loadAlbumInfo': function (album_id, success) {
                let postData = {"id": album_id, "photos": false};
                return globals.request.get(globals.api.getAlbum, postData, success, ['album'], false);
            },
            'loadPhotoList': function (condition, success) {
                return globals.request.get(globals.api.getPhotoList, condition, success, ['photos'], false);
            },
            'loadVideoByCover': function (cover_id, success) {
                let postData = {"cover_id": cover_id};
                return globals.request.get(globals.api.getVideo, postData, success, ['video'], false);
            },
            'likeVideo': function (video_id, undo, success) {
                let postData = {"video_id": video_id, 'undo': undo};
                return globals.request.post(globals.api.likeVideo, postData, success, ['video', 'type'], success && '点赞失败');
            },
            'loadPhotoTagWrapperList': function (photo_id, success) {
                let postData = {"photo_id": photo_id};
                return globals.request.get(globals.api.getTagWrapperListByPhoto, postData, success, ['tagWrappers', 'topicTagWrappers'], false);
            },
        }
    }).video_detail;

    var initSwitchVideoShowSize = function () {
        var switchElem = $(config.selector.videoDetailInfo).find('.video-detail-show-size a');
        var videoElem = $(config.selector.videoNode);
        config.eyeRawWidth = config.videoWidth;
        config.eyeRawHeight = config.videoHeight;
        var switchFunc = function () {
            var fromValue = switchElem.attr('data-show-size') || 'fit';
            var toValue = '';
            switch (fromValue) {
                case "fit":
                    toValue = "fill";
                    break;
                case "fill":
                    toValue = "fit";
                    break;
            }
            switch (toValue) {
                case "fit":
                    videoElem.css('max-height', '');
                    videoElem.css('height', '');
                    videoElem.toggleClass('video-show-fill', false).toggleClass('video-show-fit', true);
                    switchElem.attr('data-show-size', 'fit').text('适应⬇').attr('title', '点击切换为`填充`显示');
                    document.documentElement.scrollTop = 0;
                    break;
                case "fill":
                    var scala = 9 / 16;
                    if (config.eyeRawWidth && config.eyeRawHeight) {
                        scala = config.eyeRawHeight / config.eyeRawWidth;
                    }
                    videoElem.css('max-height', 'unset');
                    videoElem.height(videoElem.width() * scala);
                    videoElem.toggleClass('video-show-fit', false).toggleClass('video-show-fill', true);
                    switchElem.attr('data-show-size', 'fill').text('填充⬇').attr('title', '点击切换为`适应`显示');
                    break;
            }
        };
        switchElem.on('click', switchFunc);
        $(window).resize(function () {
            var currValue = switchElem.attr('data-show-size') || 'fit';
            if (currValue == 'fill') {
                switchElem.attr('data-show-size', 'fit');
                switchFunc();
            }
        });
        if (videoElem.width() / config.videoWidth * config.videoHeight < videoElem.height()) {
            switchElem.trigger('click');
        }
        var insertFrameEvent = function (childWindow) {
            var searchFuncInter = window.setInterval(function () {
                if (childWindow.onRatioChange) {
                    searchFuncInter && window.clearInterval(searchFuncInter);
                    childWindow.onRatioChange(function (eyeRawWidth, eyeRawHeight, angle) {
                        var currentVideo = this;
                        if (currentVideo.source_type != 2) {
                            config.eyeRawWidth = eyeRawWidth;
                            config.eyeRawHeight = eyeRawHeight;
                            var currValue = switchElem.attr('data-show-size') || 'fit';
                            if (currValue == 'fill') {
                                switchElem.attr('data-show-size', 'fit');
                                switchFunc();
                            }
                        }
                    });
                    childWindow.onVideoPlayStatusChange(function (playStatus) {
                        switch (playStatus) {
                            case "playing":
                                if (config.setPageActiveTimer) {
                                    window.clearInterval(config.setPageActiveTimer);
                                }
                                websocket_util.utils.setPageActive(true);
                                config.setPageActiveTimer = window.setInterval(function () {
                                    websocket_util.utils.setPageActive(true);
                                }, 5000);
                                break;
                            case "pause":
                                if (config.setPageActiveTimer) {
                                    window.clearInterval(config.setPageActiveTimer);
                                }
                                break;
                            case "ended":
                                if (config.setPageActiveTimer) {
                                    window.clearInterval(config.setPageActiveTimer);
                                }
                                break;
                        }
                    });
                }
            }, 50);
            setTimeout(function () {
                searchFuncInter && window.clearInterval(searchFuncInter);
            }, 30000);
        };
        if (videoElem.prop('contentDocument') && videoElem.prop('contentDocument').readyState == 'complete') {
            insertFrameEvent(videoElem.prop('contentWindow'));
        } else {
            videoElem.load(function () { // 等子iframe加载完毕
                insertFrameEvent(this.contentWindow);
            });
        }
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
                "callback": {
                    "updateCompleted": function (context, video) {  // 更新完成后回调
                        comment_plugin.config.currentTopic = null;
                        applyVideoInfoToPage(video);
                    }
                },
                "hostUser": videoDetailConfig.hostUserId
            });
            video_handle.on(video_handle.config.event.tagClick, function (_e, tag, video_id, clickEvt) {
                clickEvt.preventDefault();
                window.open(('p/tag/' + encodeURIComponent(tag) + '?uid=' + videoDetailConfig.hostUserId).toURL());
            });
            openEditBtn.on('click', function () {
                video_handle.openUpdateVideoModal(config.pageVideoId);
            });
        }
        // 点赞的小玩意
        $(videoDetailConfig.selector.videoLikeArea).on('click', function () {
            var $valueNode = $(this).find('.video-detail-like-count');
            var undo = $valueNode.parent().hasClass('video-has-liked');
            request.likeVideo(config.pageVideoId, undo, function (video, type) {
                var newValue = video.like_count, response = this;
                if (type == 1) {
                    if (undo) {
                        toastr.success('已移除赞~');
                    } else {
                        if (login_handle.validateLogin()) {
                            toastr.success('点击查看赞过的列表', "已添加到赞", {
                                "timeOut": 12000,
                                "onclick": function () {
                                    window.open('u/likes/videos'.toURL());
                                }
                            });
                        }
                    }
                } else {
                    toastr.success(response.message);
                }
                $valueNode.text(newValue).parent().toggleClass('video-has-liked', !undo).toggleClass('like-wrapper-has-liked', !undo);
            });
        });

        // 修改tag链接
        $(videoDetailConfig.selector.videoDetailInfo).on('click', '.video-detail-tags a', function (e) {
            e.preventDefault();
            window.open($(e.currentTarget).url('href') + '&uid=' + videoDetailConfig.hostUserId);
        });
    };

    // 应用相册信息到当前页面
    var applyAlbumInfoToPageIfHas = function () {
        var pageDetailInfoNode = $(config.selector.videoDetailInfo);
        request.loadAlbumInfo(config.pageAlbumId, function (album) {
            var $albumInfoNode = pageDetailInfoNode.find('.video-detail-album-name a.photo-source-album');
            config.pageAlbumName = album.name || ('album_' + album.album_id);
            $albumInfoNode
                .text(config.pageAlbumName)
                .attr('title', album.description || config.pageAlbumName)
                .text(config.pageAlbumName)
                .url('href', 'p/album/' + album.album_id + '?check=' + config.pageCoverId);
        });
    };

    // 应用视频信息到当前页面
    var applyVideoInfoToPage = function (video) {
        $(config.selector.videoNode).url('src', 'video/embed/' + video.video_id);
        var videoDetailInfoNode = $(config.selector.videoDetailInfo);
        videoDetailInfoNode.find('.video-detail-name a').text(video.name || ('video_' + video.video_id));
        videoDetailInfoNode.find('.video-detail-desc').html(common_utils.convertLinkToHtmlTag(video.description));
        videoDetailInfoNode.find('.video-detail-size').text(video.size + 'MB（' + video.width + '×' + video.height + '）');
        videoDetailInfoNode.find('.video-detail-refer a').text(video.refer).url('href', video.refer);
        videoDetailInfoNode.find('.video-detail-video-type').text(video.video_type).attr('data-source-type', video.source_type);
        videoDetailInfoNode.find('.video-detail-click-count-value').text(video.click_count);
        videoDetailInfoNode.find('.video-detail-like-count').text(video.like_count)
            .parent().toggleClass('video-has-liked', video.liked).toggleClass('like-wrapper-has-liked', video.liked);
        if (video.tags != null && video.tags.length > 0) {
            var tagHtml = '';
            $.each(video.tags.split('#'), function (i, tag) {
                if (tag) {
                    tagHtml += '<a target="_blank" href="' + ('p/dashboard?model=photo&tags=<' + tag + '>').toURL() + '" data-video-tag="' + tag + '">#' + tag + '#</a>&nbsp;&nbsp';
                }
            });
            videoDetailInfoNode.find('.video-detail-tags').html(tagHtml);
        } else {
            videoDetailInfoNode.find('.video-detail-tags').html('');
        }
        config.eyeRawWidth = config.videoWidth = video.width;
        config.eyeRawHeight = config.videoHeight = video.height;
        config.pageCoverId = video.cover.photo_id;
        if (config.pageAlbumId != video.cover.album_id) {
            config.pageAlbumId = video.cover.album_id;
            config.pageAlbumName = 'album_' + video.cover.album_id;
            videoDetailInfoNode.find('.video-detail-album-name a.photo-source-album')
                .attr('data-album-id', config.pageAlbumId)
                .attr('data-cover-id', config.pageCoverId)
                .text(config.pageAlbumName)
                .text('title', config.pageAlbumName)
                .url('href', 'p/album/' + config.pageAlbumId + '?check=' + config.pageCoverId)
                .text(config.pageAlbumName);
            applyAlbumInfoToPageIfHas();
        }
        // 评论
        comment_plugin.config.creationId = config.pageVideoId;
        config.tagWrappers = null;
        comment_plugin.pointer.topicTagWrappers = null;
        var commentLabelId = comment_plugin.config.currentTopic || config.pageVideoId;
        if ($(comment_plugin.config.selector.commentListArea).find('.photo-comment-bar').length == 0) {
            comment_plugin.buildCommentAreaHtml();
        } else {
            $(comment_plugin.config.selector.commentListArea).find('.single-comment-label').attr('title', config.pageVideoId).find('a').attr('data-topic', config.pageVideoId);
            $(comment_plugin.config.selector.commentListArea).find('.photo-comment-bar a[data-topic="' + commentLabelId + '"]').parent().trigger('click');
        }
        // 页面meta
        document.title = (video.name || ('video_' + video.video_id)) + ' - ' + config.hostUserNickname + " | ImCoder博客's 视频";
        var headNode = $('head');
        headNode.find('meta[name="description"]').attr('content', video.description);
        headNode.find('meta[name="keywords"]').attr('content', video.tags);
        $(config.selector.firstHeaderArea).find('.video-name').text(video.name || ('video_' + video.video_id));
    };

    // 显示封面照片相关标签
    var buildVideoRelationTagHtml = function (tagWrappers) {
        var groupNode = $(config.selector.videoDetailInfo).find('.form-group-relation-tags');
        if (groupNode.length == 0) {
            groupNode = $($.parseHTML('<div class="form-group form-group-relation-tags" style="display: none">' +
                '    <label class="col-sm-2 control-label">相关标签</label>' +
                '    <div class="col-sm-10">' +
                '        <span class="help-block photo-detail-relation-tags video-detail-relation-tags"></span>' +
                '    </div>' +
                '</div>'));
            $(config.selector.videoDetailInfo).find('.video-detail-info-main .area-set-left').append(groupNode);
        }
        var isHas = false;
        if (tagWrappers && tagWrappers.length > 0) {
            var tagsHtml = '';
            tagWrappers.forEach(function (wrapper) {
                if (wrapper.type == 1) {
                    isHas = true;
                    let tag = wrapper.name;
                    let title = wrapper.description || wrapper.name;
                    let link = ('p/tags_square?tags=<' + tag + '>&extend=true&uid=' + config.hostUserId + '&filter=' + tag).toURL();
                    tagsHtml += '<a target="_blank" href="' + link + '" data-photo-tag="' + tag + '" title="' + title + '">#' + tag + '#</a>&nbsp;&nbsp;';
                }
            });
            groupNode.find('.video-detail-relation-tags').html(tagsHtml);
        }
        if (isHas) {
            groupNode.show();
        } else {
            groupNode.hide().find('.video-detail-relation-tags').html('');
        }
    };

    // 构建合集名称显示栏
    var buildVideoTopicCommentBarHtml = function (topicTagWrappers, topic, isTopic) {
        var video_id = config.pageVideoId;
        var $commentListArea = $(comment_plugin.config.selector.commentListArea);
        var html = '<ul class="photo-comment-bar-wrapper video-comment-bar-wrapper"><ol class="photo-comment-bar video-comment-bar">';
        var singleCommentLabelHtml = '视频评论：<li class="' + ( isTopic ? '' : "current " ) + 'single-comment-label comment-label" ' +
            'title="' + video_id + '"><a data-topic="' + video_id + '" href="' + ('video/detail/' + video_id).toURL() + '" target="_blank">' + video_id + '</a></li>';
        var topicCommentLabelHtml = '合集评论：';
        $.each(topicTagWrappers, function (i, tagWrapper) {
            topicCommentLabelHtml += '<li class="' + ((isTopic && topic == tagWrapper.ptwid) ? 'current ' : '') +
                'topic-comment-label comment-label" title="右键打开' + tagWrapper.name + '">' +
                '<a data-topic="' + tagWrapper.ptwid + '" data-topic-name="' + tagWrapper.name + '" href="' + ('p/topic/' + tagWrapper.ptwid).toURL() + '" target="_blank">' +
                tagWrapper.name + '</a></li>';
        });
        html = html + singleCommentLabelHtml + topicCommentLabelHtml;
        $commentListArea.prepend(html);
        // 修改地址栏
        if (!isTopic && config.initTopic) {
            config.initTopic = null;
            $commentListArea.find('.video-comment-bar a[data-topic="' + config.initTopic + '"]').parent().trigger('click');
        } else {
            var link = document.location.href;
            if (isTopic) {
                link = common_utils.setParamForURL('from', "photo_topic", common_utils.setParamForURL('topic.ptwid', topic, link));
            } else {
                link = common_utils.removeParamForURL('from', common_utils.removeParamForURL('topic.ptwid', link));
            }
            history.replaceState(
                null,
                document.title,
                link
            );
        }
    };

    // 合集相关的事件
    var bindVideoTopicEvent = function () {
        $(comment_plugin.config.selector.commentListArea).on('click', '.photo-comment-bar .comment-label', function (e) {
            e.preventDefault();
            var cache = comment_plugin.pointer;
            var commentLabel = $(this);
            var isTopic = commentLabel.hasClass('topic-comment-label');
            commentLabel.parent().children().removeClass('current');
            commentLabel.addClass('current');
            if (isTopic) {
                if (!comment_plugin.config.currentTopic) { // 备份好当前视频的评论数据
                    if (!cache.videoComments) {
                        cache.videoComments = {};
                    }
                    cache.videoComments[config.pageVideoId] = cache.comments;
                }
                comment_plugin.config.currentTopic = commentLabel.find('a').attr('data-topic');
                comment_plugin.config.creationType = 4;
                comment_plugin.config.creationId = comment_plugin.config.currentTopic;
            } else {
                comment_plugin.config.currentTopic = null;
                comment_plugin.config.creationType = 2;
                comment_plugin.config.creationId = config.pageVideoId;
            }
            var creationId = comment_plugin.config.creationId;
            if (isTopic) { // 合集
                // 加载合集评论
                if (!cache.topicComments) {
                    cache.topicComments = {};
                }
                if (cache.topicComments[creationId]) {
                    cache.comments = cache.topicComments[creationId];
                    comment_plugin.buildCommentAreaHtml();
                } else {
                    comment_plugin.loadCommentList(function (comments) {
                        cache.comments = comments;
                        cache.topicComments[creationId] = comments;
                        comment_plugin.buildCommentAreaHtml();
                    });
                }
            } else { // 单个视频
                // 加载视频评论
                if (!cache.videoComments) {
                    cache.videoComments = {};
                }
                if (cache.videoComments[creationId]) {
                    cache.comments = cache.videoComments[creationId];
                    comment_plugin.buildCommentAreaHtml();
                } else {
                    comment_plugin.loadCommentList(function (comments) {
                        cache.comments = comments;
                        cache.videoComments[creationId] = comments;
                        comment_plugin.buildCommentAreaHtml();
                    });
                }
            }
        });
    };

    // 注册监控服务器的未读评论消息推送
    function initWsReceiveServerPush() {
        if (login_handle.validateLogin()) {
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
                    $(this).css('opacity', '1');
                },
                "onHidden": function (toastElement, closeType) {
                    if (closeType != 0 && toastElement.hasClass('wsMessage') && !toastElement.hasClass('not-sync-ws-message')) {
                        websocket_util.post({
                            "mapping": "transfer_data_in_tabs",
                            "metadata": {
                                "handle": "remove_ws_message",
                                "ws_message_id": parseInt(toastElement.attr('data-wsid'))
                            }
                        });
                    }
                }
            };
            // 收到新评论，取消login.js中的默认处理
            websocket_util.onPush('receive_comment', function (e, wsMessage, wsEvent) {
                var comment = wsMessage.metadata.comment;
                var notify_opts = null;
                var msg = null;
                switch (comment.creationType) {
                    case 2:
                        var video = wsMessage.metadata.video;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function (e) {
                                ($(e.target).closest('a').length > 0) && e.preventDefault();
                                if (video.video_id == config.pageVideoId) {   // 当前视频页就是这个视频的详情页
                                    comment_plugin.utils.scrollToSpecialComment(comment);
                                } else {
                                    window.open(('video/detail/' + video.video_id + '#comment_' + comment.cid).toURL());
                                }
                            }
                        });
                        if (video.video_id == config.pageVideoId) {   // 当前视频页就是这个视频的详情页
                            // 直接显示
                            comment_plugin.utils.appendCommentInPage(comment);
                        }
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 对你的视频<br><b>“' + video.video_id + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        e.stopImmediatePropagation(); // 阻止login中绑定的事件, stopImmediatePropagation能阻止委托事件
                        break;
                }
                if (msg) {
                    globals.notify(notify_opts)
                        .success(msg, '', 'receive_comment' + '_' + comment.cid)
                        .addClass('wsMessage receive_comment').attr('data-wsid', wsMessage.id).attr('data-cid', comment.cid);
                }
            }, true); // 插入到事件队列第一个
        }
    }

    /* ********** main ************* */

    var descNode = $(config.selector.videoDetailInfo).find('.video-detail-desc');
    descNode.html(common_utils.convertLinkToHtmlTag(descNode.html()));

    // 评论列表构建完成后再构建合集名称显示栏
    comment_plugin.on(comment_plugin.config.event.commentHtmlBuildCompleted, function (e, list, pageIndex, buildReason) {
        if (list.length < 50 && (buildReason === 'init' || buildReason === 'refresh')) {
            let $commentList = $(comment_plugin.config.selector.commentListArea).find('.comment-list');
            if (!comment_plugin.config.currentTopic) {
                $commentList.removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInLeft');
            } else {
                $commentList.removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInRight');
            }
            $commentList.on('animationend webkitAnimationEnd', function () {
                let _self = $(this);
                _self.removeClass('animated bounceInLeft bounceInRight');
            });
        }
        if (!comment_plugin.pointer.topicTagWrappers) {
            request.loadPhotoTagWrapperList(config.pageCoverId, function (tagWrappers, topicTagWrappers) {
                config.tagWrappers = tagWrappers;
                comment_plugin.pointer.topicTagWrappers = topicTagWrappers;
                if (topicTagWrappers && topicTagWrappers.length > 0) {
                    buildVideoTopicCommentBarHtml(comment_plugin.pointer.topicTagWrappers, comment_plugin.config.creationId, !!comment_plugin.config.currentTopic);
                }
                buildVideoRelationTagHtml(config.tagWrappers);
            });
        } else {
            buildVideoTopicCommentBarHtml(comment_plugin.pointer.topicTagWrappers, comment_plugin.config.creationId, !!comment_plugin.config.currentTopic);
            buildVideoRelationTagHtml(config.tagWrappers);
        }
    });
    // 评论模块初始化
    comment_plugin.init({
        creationType: 2, // 2代表视频评论
        creationIdVariableName: "creationId",
        creationId: config.pageVideoId,
        hostUserId: config.hostUserId,
        autoScrollOnPageOpen: true, // 开启在页面打开时根据url的#hash值自动滚到对应位置
        commentLazyLoading: true,
    });

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
                    var sh = $(config.selector.videoDetailInfo).offset().top - 100;
                    $('html,body').animate({scrollTop: sh}, 500);
                    break;
            }
            history.replaceState({"mark": "page"}, document.title, common_utils.removeParamForURL('mark'));
        }
        var params = common_utils.parseURL(document.location.href).params;
        if (params["from"] == 'photo_topic' && params["topic.ptwid"]) {
            config.initTopic = params["topic.ptwid"];
        }
        // 注册监控服务器的未读评论消息推送
        initWsReceiveServerPush();
    });
});
