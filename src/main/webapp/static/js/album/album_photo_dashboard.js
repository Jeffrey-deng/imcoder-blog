/**
 * @author Jeffrey.Deng
 * @date 2018/3/29
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'blowup', 'globals', 'common_utils', 'login_handle', 'toolbar', 'period_cache', 'results_cache', 'album_photo_handle', 'album_photo_page_handle', 'album_video_plugin', 'comment_plugin', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, globals, common_utils, login_handle, toolbar, PeriodCache, ResultsCache, album_photo_handle, album_photo_page_handle, album_video_plugin, comment_plugin, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, blowup, globals, common_utils, login_handle, toolbar, PeriodCache, ResultsCache, album_photo_handle, album_photo_page_handle, album_video_plugin, comment_plugin, websocket_util) {

    var isClearTopicPage = false, isClearTagPage = false, isClearUserPage = false, // 明确的topic页面，明确的tag页面
        isClearUserLikesPage = false, isClearUserHistoryPage = false;

    /**
     * 放大镜
     */
    function bindBlowup(config) {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            $('#blowup_trigger').hide();
        } else {
            var $blowup = $('#blowup_trigger');
            var blowup = null;
            var isBlowup = false;
            config.originScale = config.scale;
            var switchBlowupBtn = function (open) {
                config.scale = config.originScale;
                if (open) {
                    blowup && blowup.destroy();
                    blowup = $.blowup({
                        selector: "#masonryContainer img",
                        width: config.width,
                        height: config.height,
                        scale: config.scale
                    });
                    var mfpContent = album_photo_page_handle.pointer.magnificPopup.content;
                    if (mfpContent) {
                        album_photo_page_handle.pointer.blowup = $.blowup({
                            selector: mfpContent.find('img'),
                            width: config.width,
                            height: config.height,
                            scale: config.scale
                        });
                    }
                    $blowup.attr('data-blowup', 'on').text('关闭放大镜');
                    toastr.success('Z: 开关，X: 缩小，C: 放大', '已开启放大镜，热键如下', {"progressBar": false, "timeOut": 4200});
                } else {
                    blowup.destroy();
                    blowup = null;
                    if (album_photo_page_handle.pointer.blowup) {
                        album_photo_page_handle.pointer.blowup.destroy();
                        album_photo_page_handle.pointer.blowup = null;
                    }
                    $blowup.attr('data-blowup', 'off').text('放大镜');
                    toastr.success('已关闭放大镜', '', {"progressBar": false});
                }
                isBlowup = open;
            };
            $blowup.on('click', function (e) {
                e.preventDefault();
                switchBlowupBtn(!($blowup.attr('data-blowup') === 'on'));
            });
            album_photo_page_handle.on(album_photo_page_handle.config.event.popupChanged, function (e) {
                if (isBlowup) {
                    var mfpContent = album_photo_page_handle.pointer.magnificPopup.content;
                    if (mfpContent) {
                        album_photo_page_handle.pointer.blowup = $.blowup({
                            selector: mfpContent.find('img'),
                            width: config.width,
                            height: config.height,
                            scale: config.scale
                        });
                    }
                }
            });
            $(document).on('keydown.img.blowup', function (e) {
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                var tagName = e.target.tagName;
                if (!e.target.isContentEditable && tagName !== 'INPUT' && tagName !== 'TEXTAREA') { // S键或F键
                    if (!isBlowup) {
                        switch (code) {
                            case 90: // Z键 - 打开放大镜
                                switchBlowupBtn(true);
                                break;
                        }
                    } else {
                        switch (code) {
                            case 90: // Z键 - 关闭放大镜
                                switchBlowupBtn(false);
                                break;
                            case 88: // X键 - 减小放大倍数
                                config.scale = config.scale - 0.1;
                                if (config.scale < 1) {
                                    config.scale = 1;
                                }
                                if (blowup) {
                                    blowup.options.scale = config.scale;
                                    blowup.refresh();
                                }
                                if (album_photo_page_handle.pointer.blowup) {
                                    album_photo_page_handle.pointer.blowup.options.scale = config.scale;
                                    album_photo_page_handle.pointer.blowup.refresh();
                                }
                                break;
                            case 67: // C键 - 增加放大倍数
                                config.scale = config.scale + 0.1;
                                if (blowup) {
                                    blowup.options.scale = config.scale;
                                    blowup.refresh();
                                }
                                if (album_photo_page_handle.pointer.blowup) {
                                    album_photo_page_handle.pointer.blowup.options.scale = config.scale;
                                    album_photo_page_handle.pointer.blowup.refresh();
                                }
                                break;
                        }
                    }
                }
            });
        }
    }

    const request = globals.extend(globals.request, {
        album_photo_dashboard: {
            'loadTagWrapper': function (tagWrapper, success) {
                return globals.request.get(globals.api.getTagWrapper, tagWrapper, success, ['tagWrapper'], success && 'TagWrapper加载失败');
            },
            'createTagWrapper': function (tagWrapper, success) {
                return globals.request.post(globals.api.saveTagWrapper, tagWrapper, success, ['tagWrapper'], success && 'TagWrapper保存失败');
            },
        }
    }).album_photo_dashboard;

    var applyTagWrapperNameToTitle = function (tagWrapper, user) {
        let $firstArea = $(globals.selector.firstArea),
            $sloganName = $firstArea.find('.media-list-name'),
            $sloganDesc = $firstArea.find('.media-list-desc'),
            is_same_user = $sloganName.attr('data-user-id') == user.uid;
        if (document.location.pathname.match(/.*\/p\/(topic|tag)\/([^/]*)(\/([^/]+))?/)) {
            if (RegExp.$1 == 'tag') {
                if (tagWrapper.description) {
                    let namePrefix = (is_same_user ? $sloganName.text() : ('User / ' + user.uid)) + ' / ';
                    $sloganName.text(namePrefix + tagWrapper.name).attr('data-user-id', user.uid);
                    $sloganDesc.text(tagWrapper.description);
                } else if (!is_same_user) {
                    $sloganName.text('User / ' + user.uid).attr('data-user-id', user.uid);
                }
            }
            return;
        }
        if (tagWrapper.description) {
            $sloganName.text(tagWrapper.topic == 1 ? 'Topic / ' :
                (is_same_user ? ($sloganName.text() + ' / ') : ('User / ' + user.uid + ' / ')) + tagWrapper.name).attr('data-user-id', user.uid);
            $sloganDesc.text(tagWrapper.description).show();
        } else if (tagWrapper.name) {
            if (tagWrapper.topic == 1) {
                $sloganName.text('Photo Topic');
            } else if (!is_same_user) {
                $sloganName.text('User / ' + user.uid).attr('data-user-id', user.uid);
            }
            $sloganDesc.text(tagWrapper.name).show();
        } else {
            $sloganDesc.text('topic / ' + tagWrapper.ptwid).show();
        }
    };

    var initCommentPlugin = function (tagWrapper) {
        $(comment_plugin.config.selector.commentListArea).parent().show();
        comment_plugin.on(comment_plugin.config.event.commentHtmlBuildCompleted, function (e, list, pageIndex, buildReason) {
            if (list.length < 50 && (buildReason == 'init' || buildReason == 'refresh')) {
                $(comment_plugin.config.selector.commentListArea).find('.comment-list').removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInLeft');
            }
        });
        comment_plugin.init({
            creationType: 4, // 4代表照片合集
            creationIdVariableName: "creationId",
            creationId: tagWrapper.ptwid,
            hostUserId: tagWrapper.uid,
            autoScrollOnPageOpen: true, // 开启在页面打开时根据url的#hash值自动滚到对应位置
            callback: {
                /**
                 * 用户定义下载已有评论列表的请求
                 * @param creationType
                 * @param creationId
                 * @param {Function} call - 请求完后执行此回调，将评论列表数组作为参数传入此方法，请求错误则传入null
                 */
                "userDefinedLoadComments": function (creationType, creationId, call) {   // 从服务器加载评论的回调， 在call中返回评论数组
                    let context = this, applyArgs;
                    return $.Deferred(function (dfd) {
                        if (creationId == -1) { // 如果markTagWrapper为404，则延迟到用户提交评论时再创建
                            applyArgs = [[], -1];
                            call && call.apply(context, applyArgs);
                            dfd.resolveWith(context, applyArgs);
                        } else {
                            globals.request.get(globals.api.getCommentList, {
                                "creationType": creationType,
                                "creationId": creationId
                            }, true, ['comments'], '加载评论错误代码{code}').final(function (comments) {
                                applyArgs = [comments, 0];
                                call && call.apply(context, applyArgs);   // 调用call传入评论数组
                                dfd.resolveWith(context, applyArgs);
                            }, function (status, message, type) {
                                if (type == 1 && status == 403) { // 查看是否设置为关闭评论列表
                                    let data = this.data, has_forbidden_type = (data && data.forbidden_type);
                                    toastr.error(has_forbidden_type ? message : '无权限加载评论？', status);
                                    let disable_list_comment = has_forbidden_type && data.forbidden_type == 'setting_disable_list_comment';
                                    if (disable_list_comment) {
                                        $(context.config.selector.commentListArea).toggleClass('comment-disable-list', true);
                                    }
                                }
                                call && call.call(context, null);
                                dfd.rejectWith(context, [status, message, type]);
                            });
                        }
                    });
                },
                /**
                 * 用户定义提交评论请求回调
                 * @param postComment - 要提交的评论
                 * @param {Function} call - 请求完后执行此回调：
                 *  提交正确，将新comment作为参数传入此方法，
                 *  提交错误，将null作为参数传入此方法，
                 */
                "userDefinedSubmitComment": function (postComment, call) {
                    postComment.creationType = this.config.creationType;
                    let context = this, finalDfd = $.Deferred(), applyArgs;
                    $.Deferred(function (dfd) {
                        if (newMarkTagWrapper != null) { // 如果markTagWrapper为404，则先创建
                            request.createTagWrapper(newMarkTagWrapper).final(function (tagWrapper) {
                                dfd.resolveWith(this, [postComment, tagWrapper]);
                            }, function (status, message, type) {
                                let data = this.data;
                                if (type == 1 && data && data.tagWrapper) { // 页面打开的这段时间，markTagWrapper可能有别的页面创建了
                                    dfd.resolveWith(this, [postComment, data.tagWrapper]);
                                } else if (type == 1 && (status == 401 || status == 403)) { // 如果没有返回markTagWrapper，查询之
                                    request.loadTagWrapper(queryMarkTagWrapper).final(function (tagWrapper) {
                                        dfd.resolveWith(this, [postComment, tagWrapper]);
                                    }, function (status, message, type) {
                                        dfd.rejectWith(this, [status, message, type]);
                                    });
                                } else {
                                    dfd.rejectWith(this, [status, message, type]);
                                }
                            });
                            newMarkTagWrapper = null;
                        } else {
                            dfd.resolve(postComment);
                        }
                    }).final(function (postComment, markTagWrapper) {
                        if (markTagWrapper) {
                            applyTagWrapperNameToTitle(markTagWrapper, {'uid': markTagWrapper.uid});
                            postComment.creationId = context.config.creationId = markTagWrapper.ptwid;
                        }
                        globals.request.post(globals.api.addComment, postComment, true, ['comment'], '添加评论失败').final(function (comment) {
                            applyArgs = [comment];
                            call && call.apply(context, applyArgs);
                            finalDfd.resolveWith(context, applyArgs);
                        }, function (status, message, type) {
                            call && call.call(context, null);
                            finalDfd.rejectWith(context, [status, message, type, 1]);
                        });
                    }, function (status, message, type) {
                        toastr.error(message, 'markTagWrapper保存失败');
                        finalDfd.rejectWith(context, [status, message, type, 0]);
                    });
                    return finalDfd;
                }
            }
        });
        initWsReceiveServerPush();
    };

    var isUserTagPage = false;
    var newMarkTagWrapper = null;
    var queryMarkTagWrapper = null;

    function initTopicCommentIfHas(photos, load_condition) {
        if (!photos || photos.length == 0) {
            return;
        }
        load_condition = $.extend({}, load_condition);
        isUserTagPage = true;
        var uniqueUid = null;
        if (load_condition["tags"] || load_condition["topic.ptwid"] || load_condition["topic.name"]) {
            let is_and_logic_conn = (!load_condition.logic_conn || load_condition.logic_conn == 'and'),
                is_base_mark_tag = (load_condition.from == 'photo_topic' || load_condition.from == 'photo_tag');
            if (!load_condition["topic.ptwid"]) {
                if (load_condition.tags) {
                    load_condition.tags = load_condition.tags.replace(/^<|>$/g, '');
                }
                if (load_condition["topic.name"]) {
                    load_condition.tags = load_condition["topic.name"];
                }
            }
            if (load_condition.uid && is_and_logic_conn) {
                uniqueUid = load_condition.uid;
            } else if (photos.length > 0 && (is_and_logic_conn || is_base_mark_tag)) {
                uniqueUid = photos[0].uid;
                $.each(photos, function (i, photo) {
                    if (photo.uid != uniqueUid) {
                        isUserTagPage = false;
                        return false;
                    }
                });
            } else {
                isUserTagPage = false;
            }
        } else {
            isUserTagPage = false;
        }
        if (isUserTagPage) {
            if (load_condition["topic.ptwid"]) {
                let topic = {
                    "type": 0,
                    "topic": 1,
                    "uid": uniqueUid,
                    "ptwid": load_condition["topic.ptwid"],
                    "name": load_condition["topic.name"]
                };
                applyTagWrapperNameToTitle(topic, {"uid": uniqueUid});
                initCommentPlugin(topic);
            } else {
                queryMarkTagWrapper = {"name": load_condition.tags, "uid": uniqueUid, "type": 0};
                request.loadTagWrapper(queryMarkTagWrapper).final(function (tagWrapper) {
                    applyTagWrapperNameToTitle(tagWrapper, {"uid": uniqueUid});
                    initCommentPlugin(tagWrapper);
                }, function (status, message, type) {
                    applyTagWrapperNameToTitle(queryMarkTagWrapper, {"uid": uniqueUid});
                    if (type == 1 && status == 404) {
                        newMarkTagWrapper = {
                            "uid": uniqueUid,
                            "type": 0,
                            "name": load_condition.tags,
                            "pattern": load_condition.tags,
                            "scope": 0,
                            "permission": 1
                        };
                        initCommentPlugin({"uid": uniqueUid, "ptwid": -1});
                    }
                });
            }
        }
    }

    // 注册监控服务器的未读评论消息推送
    function initWsReceiveServerPush() {
        if (!login_handle.validateLogin()) {
        } else {
            var notify_ws_opts = {
                "progressBar": false,
                "positionClass": "toast-top-right",
                "iconClass": "toast-success-no-icon",
                "timeOut": 0,
                "onclick": function () {

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
                let comment = wsMessage.metadata.comment, notify_opts = null, msg = null;
                switch (comment.creationType) {
                    case 4:
                        let tagWrapper = wsMessage.metadata.tagWrapper;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                if (comment_plugin.config.creationId == tagWrapper.ptwid) {
                                    comment_plugin.utils.scrollToSpecialComment(comment);
                                } else {
                                    var link;
                                    if (tagWrapper.topic == 0) {
                                        link = ('p/tag/' + tagWrapper.name + '?uid=' + tagWrapper.uid + '#comment_' + comment.cid).toURL();
                                    } else {
                                        link = ('p/topic/' + tagWrapper.ptwid + '#comment_' + comment.cid).toURL();
                                    }
                                    window.open(link);
                                }
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 对你的照片合集<br><b>“' + tagWrapper.name + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        if (comment_plugin.config.creationId == tagWrapper.ptwid) {
                            comment_plugin.utils.appendCommentInPage(comment);
                        }
                        e.stopImmediatePropagation(); // 阻止login中绑定的事件, stopImmediatePropagation能阻止委托事件
                        break;
                }
                if (msg) {
                    globals.notify(notify_opts)
                        .success(msg, '', 'receive_comment' + '_' + comment.cid)
                        .addClass('wsMessage receive_comment').attr('data-wsid', wsMessage.id).attr('data-cid', comment.cid);
                }
            }, true);   // 插入到事件队列第一个
        }
    }

    var initRelationPageLink = function (load_condition) {
        if (load_condition.tags || $('#first').find('.media-list-name').attr('data-clear-mode') == 'topic') {
            var cast_href = 'redirect?model=photo_tag' + (load_condition.tags ? '' : ('&tags=' + $('#first').find('.media-list-name').attr('data-topic-name')));
            $.each(load_condition, function (key, value) {
                if (key == 'tags' || key == 'uid' || key == 'extend') {
                    cast_href += '&' + key + '=' + value
                }
            });
            if (load_condition.extend == 'true') {
                cast_href += '&casting=down';    // 查看子标签
                $('.album_options .option_tags_subtag').url('href', cast_href).show();
                $('.album_options .option_tags_upcasting').hide();
            } else {
                cast_href += '&casting=up';  // 查看相似标签
                $('.album_options .option_tags_subtag').hide();
                $('.album_options .option_tags_upcasting').url('href', cast_href).show();
            }
        }
        // 标签索引
        var tags_classification_href = '';
        $.each(load_condition, function (key, value) {
            tags_classification_href += '&' + key + '=' + value
        });
        tags_classification_href = 'p/tags_square' + (tags_classification_href ? ('?' + tags_classification_href.substring(1)) : '');
        $('.album_options .option_run_tags_classification').url('href', tags_classification_href).show();
    };

    /**
     * main
     */
    domReady(function () {

        var albumConfig = globals.getLocalConfig('album', {
            "photo_page": {
                "full_background": true,
                "default_col": {
                    "2000": 6,
                    "1800": 5,
                    "1600": 4,
                    "940": 3,
                    "720": 2
                },
                "default_size": 0,
                "default_query_size": 600,
                "photo_node_link_use_by": 'photo_detail',
                "preview_compress": true,
                "blow_up": {
                    "width": 600,
                    "height": 600,
                    "scale": 1.6
                }
            }
        }), $firstArea = $(globals.selector.firstArea);
        if (albumConfig.photo_page.full_background) {
            $('body').css('background-image', $firstArea.css('background-image'));
            $firstArea.css('background-image', '');
        }

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.photo_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col && parseInt(params.col);
        var checkPhotoId = params.check ? params.check : 0;
        var query_size = params.query_size ? parseInt(params.query_size) : albumConfig.photo_page.default_query_size;
        var query_start = params.query_start ? parseInt(params.query_start) : 0;
        var cloud_photo_preview_args = '';
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != 'method' && key != 'size' && key != 'col' && key != 'page' && key != 'check' && key != 'model') {
                load_condition[key] = params[key];
            }
        });

        var title_suffix = "dashboard | ImCoder博客's 相册";
        var clearPageMatch = document.location.pathname.match(/.*\/(p\/(topic|tag)\/([^/]*)(\/([^/]+))?)|(u\/([^/]*)\/?(photos|likes|history))/);
        if (clearPageMatch) {
            if (RegExp.$2 == 'topic') {
                isClearTopicPage = true;
                load_condition["topic.ptwid"] = RegExp.$3 || '0';
                RegExp.$5 && (load_condition["topic.name"] = decodeURIComponent(RegExp.$5));
                !load_condition.from && (load_condition.from = "photo_topic");
            } else if (RegExp.$2 == 'tag') {
                isClearTagPage = true;
                load_condition.extend = (load_condition.extend == undefined ? true : load_condition.extend);
                load_condition.tags = '<' + decodeURIComponent(RegExp.$3) + '>';
                !load_condition.from && (load_condition.from = "photo_tag");
            } else if (clearPageMatch[8] == 'likes') {
                load_condition.liked = "true";
                isClearUserLikesPage = true;
                title_suffix = $firstArea.find('.slogan-name').text() + "喜欢的照片 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_likes_photos");
            } else if (clearPageMatch[8] == 'history') {
                load_condition.accessed = "true";
                isClearUserHistoryPage = true;
                title_suffix = $firstArea.find('.slogan-name').text() + "访问过的照片 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_history_photos");
            } else {
                isClearUserPage = true;
                load_condition.uid = clearPageMatch[7];
                title_suffix = $firstArea.find('.slogan-name').text() + "的照片 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_photos");
            }
        }

        var title_prefix = load_condition.tags || load_condition.name || load_condition.description || '';
        var album_title_prefix = null;
        if (load_condition.album_id && load_condition.from && load_condition.from.indexOf('album_detail') == 0) {
            album_title_prefix = 'album[' + load_condition.album_id + ']';
            if (title_prefix) {
                title_prefix = title_prefix + ' in ' + album_title_prefix;
            } else if (load_condition.image_type == 'video') {
                title_prefix = '视频 in ' + album_title_prefix;
            } else if (isClearTopicPage) {
                title_prefix = 'topic_' + (load_condition["topic.name"] || load_condition["topic.ptwid"]) + ' in ' + album_title_prefix;
            } else {
                title_prefix = album_title_prefix;
            }
        } else {
            if (isClearTopicPage && !title_prefix) {
                title_prefix = 'topic_' + (load_condition["topic.name"] || load_condition["topic.ptwid"]);
            }
        }
        if (title_prefix) {
            if (title_prefix == '_' && !load_condition.description && !load_condition.name) {
                title_prefix = "所有标签";
            }
            $('head').find('title').text(title_prefix + ' - ' + title_suffix);
        }

        album_photo_page_handle.on(album_photo_page_handle.config.event.popupChanged, function (e, check) {
            check && setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                if (title_prefix) {
                    document.title = '照片_' + check + ' of ' + title_prefix + ' - ' + title_suffix;
                } else {
                    document.title = '照片_' + check + ' - ' + title_suffix;
                }
            }, 50);
        });
        album_photo_page_handle.on(album_photo_page_handle.config.event.popupClosed, function (e, check) {
            setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                if (title_prefix) {
                    document.title = title_prefix + ' - ' + title_suffix;
                } else {
                    document.title = title_suffix;
                }
            }, 50);
        });
        album_photo_page_handle.init({
            selector: {
                "photosContainer_id": "masonryContainer",
                "page_nav": ".page-navigator",
                "photo_id_prefix": "photo_",
                "album_size": "#album_size"
            },
            page_params: {
                "pageSize": pageSize,
                "pageNum": pageNum,
                "col": col,
                "default_col": albumConfig.photo_page.default_col
            },
            checkPhotoId: checkPhotoId,
            page_method_address: "dashboard",
            load_condition: load_condition,
            query_size: query_size,
            query_start: query_start,
            photoNodeLinkUsePhotoDetail: albumConfig.photo_page.photo_node_link_use_by == 'photo_detail',
            zipPhoto_groupWithAlbum: false,
            allowZipPhotos: true,
            allowZipPhotosMaxLength: 30,
            callback: {
                "requestPhotoList": function (condition, call) {
                    globals.notify().progress('正在加载数据', '', 'notify_photos_loading');
                    return globals.request.get(globals.api.getPhotoList, condition, true, '加载照片列表失败').always(function () {
                        globals.removeNotify('notify_photos_loading');
                    }).final(function (data) {
                        call.call(album_photo_page_handle, data);
                    });
                },
                "loadPhotos_callback": function (config, success) {
                    let condition = $.extend(true, {}, config.load_condition), context = this;
                    delete condition.method;
                    if (condition["query_start"] === undefined) {
                        if (condition["topic.ptwid"] ||
                            condition["topic.name"] ||
                            ((condition["tags"]) && (condition["uid"] || condition["album_id"]))) {
                            config.query_start = -1;
                        }
                    }
                    condition.query_size = config.query_size;
                    condition.query_start = config.query_start;
                    if (condition.from) {
                        condition.base = condition.from;
                    }
                    condition.from = "album_photo_dashboard";
                    config.callback.requestPhotoList.call(context, condition, function (data) {
                        let album = {};
                        album.photos = data.photos || [];
                        album.size = album.photos.length;
                        album.show_col = 0;
                        data.album = album;
                        cloud_photo_preview_args = data.cloud_photo_preview_args;
                        success.call(context, data);
                        if (album.size == 0) {
                            globals.notify({
                                "progressBar": false,
                                "hideDuration": 0,
                                "showDuration": 0,
                                "timeOut": 10000,
                                "closeButton": false
                            }).success('抱歉，未找到您要的内容', '', 'notify_photos_loading_empty');
                        }
                        if (data.extend == true) {
                            config.load_condition.extend = "true";
                            initRelationPageLink(config.load_condition);
                        }
                        initTopicCommentIfHas(album.photos, config.load_condition);
                    });
                },
                "generatePhotoPreviewUrl": function (source, hitCol) { // 生成预览图片url的函数
                    if (open_preview_compress && cloud_photo_preview_args) {
                        return source + cloud_photo_preview_args.replace('{col}', hitCol);
                    } else {
                        return source;
                    }
                },
                "parsePhotosZipName": function (config) {
                    var zipName = "photos";
                    var photo = {};
                    photo.photo_id = config.load_condition.photo_id;
                    photo.name = config.load_condition.name;
                    photo.description = config.load_condition.description;
                    photo.tags = config.load_condition.tags;
                    if (config.load_condition["topic.ptwid"] || config.load_condition["topic.name"]) {
                        zipName += '_' + (config.load_condition["topic.name"] || config.load_condition["topic.ptwid"]);
                    } else if (photo.name && (photo.name == photo.description) && (photo.name == photo.tags)) {
                        zipName += '_' + photo.name;
                    } else {
                        $.each(photo, function (key, value) {
                            if (value) {
                                zipName += '_' + value;
                            }
                        });
                    }
                    zipName += '_' + common_utils.formatDate(new Date(), 'yyMMddhhmmss');
                    config.zipPhoto_groupWithAlbum = confirm('是否需要以相册划分文件夹？');
                    config.zipPhoto_groupWithMirrorPath = confirm('是否需要以路径镜像划分文件夹？');
                    return zipName;
                },
                "beforeZipPhotos": function (options) {
                    let context = this;
                    let superParseFilesCall = options.callback.parseFiles_callback;
                    options.callback.parseFiles_callback = function (location_info, options) {
                        let photo_arr = superParseFilesCall(location_info, options);
                        return $.Deferred(function (dfd) {
                            let resolveCall = function (user) {
                                if (user && user.userGroup.gid == -1) {
                                    dfd.resolve(photo_arr);
                                } else if (context.config.allowZipPhotos == true) {
                                    let maxValue = context.config.allowZipPhotosMaxLength;
                                    if (maxValue && maxValue < photo_arr.length) {
                                        globals.notify({
                                            "timeOut": 0,
                                            "showDuration": 0
                                        }).success('下载更多需要向管理员\n【申请权限】方可~', '本次只准下载 ' + maxValue + ' 张', 'notify_only_allow_download_little');
                                        dfd.resolve(photo_arr.slice(0, maxValue));
                                    } else {
                                        dfd.resolve(photo_arr);
                                    }
                                } else {
                                    dfd.reject('打包下载需要向管理员\n【申请权限】方可~');
                                }
                            };
                            login_handle.getCurrentUser(false).final(function (user) {
                                resolveCall.call(this, user);
                            }, function () {
                                resolveCall.call(this, null);
                            });
                        });
                    };
                },
                "actionForEditPhoto": function (photo, triggerType) {
                    if (!(isClearTopicPage && !login_handle.equalsLoginUser(photo.uid))
                        && !(photo.image_type.indexOf('video') != -1 && !login_handle.equalsLoginUser(photo.uid))) {
                        triggerType == 'btn' && $.magnificPopup.close();
                        album_photo_handle.openUpdatePhotoModal(photo);
                    }
                },
                "pageJumpCompleted_callback": function (pageNum) {
                    let context = this, config = context.config;
                    if (!config.hasLoadAll && pageNum == config.page_params.pageCount) { // 点击加载 更多图片/全部图片
                        if (config.query_size != 0 && (context.pointer.album.size % config.query_size == 0)) {
                            if (globals.getNotify('notify_load_more_photos', true) != null) {
                                return;
                            }
                            globals.notify({
                                timeOut: 0,
                                iconClass: "toast-success-no-icon",
                                onclick: function (e) {
                                    if (!$(e.target).closest('.btn-load-all-photos').hasValue()) {
                                        return false;
                                    }
                                }
                            }).success('点击加载 <a class="btn-load-more-photos" role="button"><b>更多照片</b></a> / <a class="btn-load-all-photos" role="button"><b>全部照片</b></a>',
                                '', 'notify_load_more_photos').on('click', '.btn-load-more-photos,.btn-load-all-photos', function () {
                                if (config.query_size == 0) {
                                    return;
                                }
                                let isLoadAll = $(this).hasClass('btn-load-all-photos'),
                                    condition = $.extend(true, {}, config.load_condition);
                                if (isLoadAll) {
                                    condition.query_size = config.query_size = 0;
                                } else {
                                    condition.query_size = config.query_size;
                                }
                                if (config.query_start >= 0) {
                                    condition.query_start = context.pointer.album.size;
                                } else {
                                    condition.query_start = (context.pointer.album.size * -1) - 1;
                                }
                                if (condition.from) {
                                    condition.base = condition.from;
                                }
                                condition.from = "album_photo_dashboard";
                                config.callback.requestPhotoList.call(context, condition, function (data) {
                                    let photos = context.pointer.album.photos;
                                    photos.push.apply(photos, data.photos);
                                    context.pointer.album.size = photos.length;
                                    config.page_params.pageCount = context.utils.calcPageCount();
                                    context.utils.updateAlbumSizeInPage();
                                    context.jumpPage(config.page_params.pageNum);
                                    config.hasLoadAll = isLoadAll || (context.pointer.album.size % config.query_size != 0);
                                    if (config.hasLoadAll) {
                                        config.query_size = 0;
                                        globals.removeNotify('notify_load_more_photos');
                                    }
                                    let params = common_utils.parseURL(document.location.href).params,
                                        search = '';
                                    $.each(params, function (key, value) {
                                        if (key != 'method' && key != 'page' && key != 'query_start' && key != 'query_size') {
                                            search += '&' + key + '=' + value;
                                        }
                                    });
                                    search += '&query_start=' + (config.query_start) + '&query_size=' + (config.hasLoadAll ? '0' : String(context.pointer.album.size)) +
                                        '&page=' + config.page_params.pageNum;
                                    search = (search ? ('?' + search.substring(1)) : '');
                                    history.replaceState( // url上加上查询大小
                                        {"mark": "page"},
                                        document.title,
                                        location.pathname + search
                                    );
                                });
                            });
                        }
                    }
                }
            }
        });

        // 创建一个定期刷新的内存缓存实例
        var memoryPeriodCache = new PeriodCache({
            cacheCtx: { // 重写cacheCtx，修改存储的位置
                "ctx": {},
                "setItem": function (key, value) {
                    this.ctx[key] = value;
                },
                "getItem": function (key) {
                    return this.ctx[key];
                },
                "removeItem": function (key) {
                    delete this.ctx[key];
                }
            }
        });
        // 从内存缓存实例中得到相册基本信息组连接
        var secureAlbumInfoConn = memoryPeriodCache.getOrCreateGroup({
            "groupName": "album_info_cache",
            "timeOut": 1800000,
            "reload": {
                "url": globals.api.getAlbum,
                "params": function (groupName, key) {
                    return {"id": key, "photos": false};
                },
                "parse": function (cacheCtx, groupName, key, old_object_value, response) {
                    if (response.status == 200) {
                        return response.data.album;
                    } else {
                        return null;
                    }
                }
            }
        });
        // 缓存用户信息的ajax请求
        var user_base_info_cache = new ResultsCache(function (uid, handler) {
            $.get(globals.api.getUser, {"uid": uid}, function (response) {
                if (response.status == 200) {
                    handler(response.data.user);
                } else {
                    handler(null);
                }
            }).fail(function (XHR, TS) {
                console.error('ResultsCache Error: found exception when load user from internet, text: ' + TS);
                handler(null);
            });
        });
        // 相册处理模块初始化
        album_photo_handle.init({
            "selector": {
                "uploadModal": "#uploadPhotoModal",
                "updateModal": "#updatePhotoModal"
            },
            callback: {
                "eachUploadCompleted": function (context, photo) {
                    album_photo_page_handle.utils.appendPhotoToPage(photo);
                },
                "allUploadCompleted": function (context, photos) {
                    album_photo_page_handle.jumpPage(album_photo_page_handle.utils.calcPageCount());
                    photos = null;
                },
                "updateCompleted": function (context, photo) {
                    var photo_source = album_photo_page_handle.utils.getPhotoByCache(photo.photo_id);
                    var isUpdateFile = photo_source.path != photo.path;
                    album_photo_page_handle.utils.updatePhotoInPage(photo);
                    if (isUpdateFile) { // 如果更新了图片文件
                        album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                    }
                },
                "deleteCompleted": function (context, postData) {
                    album_photo_page_handle.utils.deletePhotoInPage(postData.photo_id);
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
                        const video_id = album_photo_page_handle.utils.getPhotoImageDom(photo.photo_id).find('img').attr('data-video-id');
                        if (video_id && video_id != '0') {
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
                            $videoLinkText.text(video_id).parent().url('href', 'video/detail/' + video_id);
                        } else {
                            updateModal.find('span[name="video_id"]').closest('.form-group').hide(0);
                        }
                    });
                    queue.append(function () {
                        return $.Deferred(function (dfd) {  // dashboard页 添加照片所属相册链接
                            let $albumLinkText = updateModal.find('span[name="album_id"]');
                            if ($albumLinkText.length == 0) {
                                updateModal.find('span[name="photo_id"]').closest('.form-group').after(
                                    '<div class="form-group"><label class="control-label">所属簿：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                    '<a target="_blank" style="color: #666; cursor: pointer" title="在相簿中查看" >' +
                                    '<span name="album_id" class="control-label"></span></a></div>'
                                );
                                $albumLinkText = updateModal.find('span[name="album_id"]');
                            }
                            secureAlbumInfoConn.get(photo.album_id, function (album) {
                                let album_url = 'p/album/' + photo.album_id + '?check=' + photo.photo_id;
                                if (album) {
                                    $albumLinkText.text(album.name).parent().url('href', album_url);
                                } else {
                                    $albumLinkText.text(photo.album_id).parent().url('href', album_url);
                                }
                                dfd.resolve();
                            });
                        });
                    });
                    queue.append(function () {
                        return $.Deferred(function (dfd) {  // dashboard页 添加照片所有者主页链接
                            let $userLinkText = updateModal.find('span[name="user_id"]');
                            if ($userLinkText.length == 0) {
                                updateModal.find('span[name="album_id"]').closest('.form-group').after(
                                    '<div class="form-group"><label class="control-label">所有者：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                    '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看用户主页" >' +
                                    '<span name="user_id" class="control-label"></span></a></div>'
                                );
                                $userLinkText = updateModal.find('span[name="user_id"]');
                            }
                            user_base_info_cache.compute(photo.uid).done(function (user) {
                                let user_home_url = 'u/' + photo.uid + '/home';
                                if (user) {
                                    $userLinkText.text(user.nickname).parent().url('href', user_home_url);
                                } else {
                                    $userLinkText.text(photo.uid).parent().url('href', user_home_url);
                                }
                                dfd.resolve();
                            });
                        });
                    });
                    queue.append(function () {
                        // 回调
                        formatPhotoToModal_callback(photo);
                    });
                }
            },
            "downloadType": /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? 'url' : "ajax"
        });

        if (load_condition.uid) {
            album_photo_handle.on(album_photo_handle.config.event.tagClick, function (_e, tag, photo_id, clickEvt) {
                clickEvt.preventDefault();
                // window.open(('u/' + load_condition.uid + '/photos?tags=<' + tag + '>').toURL());
                window.open(('p/tag/' + encodeURIComponent(tag) + '?uid=' + load_condition.uid).toURL());
            });
        }

        // 绑定特殊标签的扩展点击反应事件
        album_photo_handle.on(album_photo_handle.config.event.tagExtendClick, function (_e, tag, photo_id, clickEvt, keyEvt) {
            switch (true) {
                case /^#?mount@(.*)/i.test(tag): // 挂载
                    window.open(('p/album/' + RegExp.$1 + '?check=' + photo_id).toURL());
                    break;
                case /^#?weibo@(.*)/i.test(tag): // 微博用户
                    var weiboUserKey = RegExp.$1;
                    if (/\d{8,}/.test(weiboUserKey)) {
                        window.open('https://weibo.com/u/' + weiboUserKey);
                    } else {
                        window.open('https://weibo.com/' + weiboUserKey);
                    }
                    break;
                case /^#?weibo-(.*)/i.test(tag): // 微博详情
                    window.open('https://m.weibo.cn/detail/' + RegExp.$1);
                    break;
                case /^#?ytb-(.*)/i.test(tag): // Youtube
                    window.open('https://www.youtube.com/watch?v=' + RegExp.$1);
                    break;
                default:
                    if (isClearUserPage) {
                        window.open(('p/tag/' + tag).toURL());
                    } else {
                        window.open(('p/tag/' + tag + (load_condition.uid ? ('?uid=' + load_condition.uid) : '')).toURL());
                    }
            }
        });

        $('#uploadPhoto').click(function () {
            album_photo_handle.openUploadPhotoModal();
        });

        // 删除历史记录按钮
        if (isClearUserHistoryPage || isClearUserLikesPage) {
            var $deleteAccessRecordBtn = $($.parseHTML('<button class="btn btn-danger btn-delete-access-record" ' +
                'name="deletePhotoAccessRecord_trigger" title="' + (isClearUserHistoryPage ? '删除访问记录' : '从喜欢中移除') + '">'
                + (isClearUserHistoryPage ? '删除记录' : '取消点赞') + '</button>')[0]);
            album_photo_handle.pointer.updateModal.find('.modal-footer').prepend($deleteAccessRecordBtn);
            $deleteAccessRecordBtn.on('click', function () {
                let photo_id = album_photo_handle.pointer.updateModal.find('span[name="photo_id"]').html().trim();
                if (isClearUserHistoryPage) {
                    globals.request.post(globals.api.deleteUserPhotoAccessDetail, {"photo_id": photo_id}, function () {
                        toastr.success('已删除此访问记录~');
                        album_photo_handle.pointer.updateModal.modal('hide');
                    });
                } else {
                    globals.request.post(globals.api.likePhoto, {"photo_id": photo_id, "undo": true}, function () {
                        toastr.success('已取消赞~');
                        album_photo_handle.pointer.updateModal.modal('hide');
                    });
                }
            });
        }

        // 鼠标悬浮于照片显示作者
        var regexHasSetUserName = /^[\s\S]*\n上传者@[^@]+$/;
        $('#' + album_photo_page_handle.config.selector.photosContainer_id).on('mouseenter', album_photo_page_handle.config.selector.photo_node, function (e) {
            var $photoNode = $(this);
            var beforeTitle = $photoNode.attr('title');
            if (!regexHasSetUserName.test(beforeTitle)) {
                var uid = $photoNode.attr('data-uid');
                if (uid) {
                    user_base_info_cache.compute(uid).done(function (user) {
                        if (user) {
                            $photoNode.attr('title', beforeTitle + '\n' + '上传者@' + user.nickname);
                        }
                    });
                }
            }
        });

        // 搜索重写
        if (Object.keys(load_condition).length > 0) {
            var search_input_value = '';
            $.each(load_condition, function (key, value) {
                if (key == 'tags') {
                    value = value.replace(new RegExp(toolbar.utils.getItsMultipleMatchJoiner(key), 'g'), '#');
                    if (/^\((.+)\.\*(.+)\)\|\(\2\.\*\1\)$/.test(value)) {
                        var matchForTwo = value.match(/^\((.+)\.\*(.+)\)\|/);
                        value = matchForTwo[1] + '#' + matchForTwo[2];
                    }
                    value = value.replace(/\[\[:<:\]\]/g, '<');
                    value = value.replace(/\[\[:>:\]\]/g, '>');
                    if (value.indexOf('[[.') != -1) {
                        value = common_utils.replaceByEL(value, function (index, key) { // 还原被转义的MySQL特殊字符
                            return /^[^\w]+$/.test(key) ? ('{' + key + '}') : this[0];
                        }, "\\[\\[\\.", '\\.\\]\\]')
                    }
                    title_prefix = value + (album_title_prefix ? (' in ' + album_title_prefix) : '');
                    document.title = title_prefix + ' - ' + title_suffix;
                }
                search_input_value += ',' + key + ':';
                if (toolbar.config.special_pair_separator.test(value) || toolbar.config.special_value_separator.test(value)) {
                    search_input_value += '"' + value + '"';
                } else {
                    search_input_value += value;
                }
            });
            search_input_value = search_input_value && search_input_value.substring(1);
            toolbar.rewriteSearch({
                inputInitialValue: search_input_value
            });
        }

        bindBlowup(albumConfig.photo_page.blow_up);

        initRelationPageLink(load_condition);

        if (isClearUserPage) {
            $('.album_options .option_photo_square').url('href', 'p/dashboard?model=photo' + document.location.search.replace(/^\?/, '&')).show();
        }

    });
});
