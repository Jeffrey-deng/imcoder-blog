/**
 * @author Jeffrey.Deng
 * @date 2018/3/29
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'blowup', 'common_utils', 'login_handle', 'toolbar', 'period_cache', 'results_cache', 'album_photo_handle', 'album_photo_page_handle', 'album_video_plugin', 'comment_plugin', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, common_utils, login_handle, toolbar, PeriodCache, ResultsCache, album_photo_handle, album_photo_page_handle, album_video_plugin, comment_plugin, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, blowup, common_utils, login_handle, toolbar, PeriodCache, ResultsCache, album_photo_handle, album_photo_page_handle, album_video_plugin, comment_plugin, websocket_util) {

    var isClearTopicPage = false, isClearTagPage = false, isClearUserPage = false, // 明确的topic页面，明确的tag页面
        isClearUserLikesPage = false, isClearUserHistoryPage = false;

    /**
     * 放大镜
     */
    function bindBlowup(config) {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            $("#blowup_trigger").hide();
        } else {
            var blowup = null;
            var isBlowup = "false";
            $("#blowup_trigger").click(function () {
                var _this = $(this);
                isBlowup = _this.attr("isBlowup") || "false";
                if (isBlowup == "false") {
                    blowup = $.blowup({
                        selector: "#masonryContainer img",
                        width: config.width,
                        height: config.height,
                        scale: config.scale
                    });
                    isBlowup = "true";
                    _this.attr("isBlowup", isBlowup);
                    toastr.success("已开启放大镜", "", {"progressBar": false});
                    _this.text("关闭放大镜");
                } else {
                    blowup.destroy();
                    isBlowup = "false";
                    _this.attr("isBlowup", isBlowup);
                    toastr.success("已关闭放大镜", "", {"progressBar": false});
                    _this.text("放大镜");
                }
            });
            album_photo_page_handle.utils.bindEvent(album_photo_page_handle.config.event.popupChanged, function (e) {
                if (isBlowup == "true") {
                    var content = album_photo_page_handle.pointer.magnificPopup.content;
                    if (content) {
                        $.blowup({
                            selector: content.find("img"),
                            width: config.width,
                            height: config.height,
                            scale: config.scale
                        });
                    }
                }
            });
        }
    }

    var loadTagWrapper = function (tagWrapper, call) {
        $.get("photo.api?method=getTagWrapper", tagWrapper, function (response) {
            call(response);
        });
    };

    var createTagWrapper = function (tagWrapper, call) {
        $.get("photo.api?method=saveTagWrapper", tagWrapper, function (response) {
            call(response);
        });
    };

    var applyTagWrapperNameToTitle = function (tagWrapper) {
        if (document.location.pathname.match(/.*\/p\/(topic|tag)\/([^/]*)(\/([^/]+))?/)) {
            return;
        }
        var firstAreaDom = $("#first");
        if (tagWrapper.description) {
            firstAreaDom.find(".media-list-name").text((tagWrapper.topic == 1 ? "Topic / " : "") + tagWrapper.name);
            firstAreaDom.find(".media-list-desc").text(tagWrapper.description).show();
        } else if (tagWrapper.name) {
            if (tagWrapper.topic == 1) {
                firstAreaDom.find(".media-list-name").text("Photo Topic");
            }
            firstAreaDom.find(".media-list-desc").text(tagWrapper.name).show();
        } else {
            firstAreaDom.find(".media-list-desc").text("tag / " + tagWrapper.ptwid).show();
        }
    };

    var initCommentPlugin = function (tagWrapper) {
        $(comment_plugin.config.selector.commentListArea).parent().show();
        comment_plugin.init({
            mainType: 3, // 3代表照片合集
            mainIdVariableName: "mainId",
            mainId: tagWrapper.ptwid,
            hostUserId: tagWrapper.uid,
            autoScrollOnPageOpen: true, // 开启在页面打开时根据url的#hash值自动滚到对应位置
            path_params: {
                "basePath": $('#basePath').attr('href'),
                "staticPath": $('#staticPath').attr('href'),
                "cloudPath": $('#cloudPath').attr('href')
            },
            callback: {
                /**
                 * 用户定义下载已有评论列表的请求
                 * @param mainId
                 * @param hostUserId
                 * @param {Function} call - 请求完后执行此回调，将评论列表数组作为参数传入此方法，请求错误则传入null
                 */
                "userDefinedLoadComments": function (mainId, hostUserId, call) {   // 从服务器加载评论的回调， 在call中返回评论数组
                    if (mainId == -1) {
                        call([]);
                    } else {
                        var mainType = this.config.mainType;
                        $.get("message.api?method=getCommentList", {
                            "mainType": mainType,
                            "mainId": mainId
                        }, function (response) {
                            if (response.status == 200) {
                                call && call.call(comment_plugin, response.data.comments);   // 调用call传入评论数组
                            } else {
                                toastr.error("无权限加载评论？", response.status);
                            }
                        }).fail(function () {
                            toastr.error("加载评论出错");
                        });
                    }
                },
                /**
                 * 用户定义提交评论请求回调
                 * @param postComment - 要提交的评论
                 * @param {Function} call - 请求完后执行此回调：
                 *  提交正确，将新comment作为参数传入此方法，
                 *  提交错误，将null作为参数传入此方法，
                 */
                "userDefinedSubmitComment": function (postComment, call) {
                    postComment.mainType = this.config.mainType;
                    var postFunc = function (postComment) {
                        $.ajax({
                            data: postComment,
                            type: "POST",
                            url: "message.api?method=addComment",
                            success: function (response) {
                                if (response.status == 200) {
                                    call(response.data.comment);
                                } else {
                                    call(null);
                                    toastr.error(response.message, "添加评论失败");
                                    console.warn("Error Code: " + response.status);
                                }
                            },
                            error: function (XHR, TS) {
                                call(null);
                                console.warn("评论添加失败，提示：" + TS);
                                toastr.error(TS, "评论添加失败");
                            }
                        });
                    };
                    if (newTagWrapper != null) {
                        createTagWrapper(newTagWrapper, function (response) {
                            if (response.status == 200) {
                                applyTagWrapperNameToTitle(response.data.tagWrapper);
                                postComment.mainId = comment_plugin.config.mainId = response.data.tagWrapper.ptwid;
                                postFunc(postComment);
                            } else if (response.status == 403 || response.status == 401) {
                                loadTagWrapper(queryTagWrapper, function (response) {
                                    if (response.status == 200) {
                                        applyTagWrapperNameToTitle(response.data.tagWrapper);
                                        postComment.mainId = comment_plugin.config.mainId = response.data.tagWrapper.ptwid;
                                        postFunc(postComment);
                                    } else {
                                        toastr.error(response.message, "保存失败");
                                        console.warn("Error Code: " + response.status);
                                    }
                                });
                            } else {
                                toastr.error(response.message, "保存失败");
                                console.warn("Error Code: " + response.status);
                            }
                        });
                        newTagWrapper = null;
                    } else {
                        postFunc(postComment);
                    }
                }
            }
        });
        initWsReceiveServerPush();
    };

    var isUserTagPage = false;
    var newTagWrapper = null;
    var queryTagWrapper = null;

    function initTopicCommentIfHas(photos, load_condition) {
        if (!photos || photos.length == 0) {
            return;
        }
        load_condition = $.extend({}, load_condition);
        isUserTagPage = true;
        var uniqueUid = null;
        if (load_condition["tags"] || load_condition["topic.ptwid"] || load_condition["topic.name"]) {
            if (!load_condition["topic.ptwid"]) {
                if (load_condition.tags) {
                    load_condition.tags = load_condition.tags.replace(/^<|>$/g, "");
                }
                if (load_condition["topic.name"]) {
                    load_condition.tags = load_condition["topic.name"];
                }
            }
            if (load_condition.uid && (!load_condition.logic_conn || load_condition.logic_conn == 'and')) {
                uniqueUid = load_condition.uid;
            } else if (photos.length > 0) {
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
                var topic = {
                    "uid": uniqueUid,
                    "ptwid": load_condition["topic.ptwid"],
                    "name": load_condition["topic.name"]
                };
                applyTagWrapperNameToTitle(topic);
                initCommentPlugin(topic);
            } else {
                queryTagWrapper = {"name": load_condition.tags, "uid": uniqueUid, "type": 0};
                loadTagWrapper(queryTagWrapper, function (response) {
                    if (response.status == 200) {
                        applyTagWrapperNameToTitle(response.data.tagWrapper);
                        initCommentPlugin(response.data.tagWrapper);
                    } else if (response.status == 404) {
                        newTagWrapper = {
                            "uid": uniqueUid,
                            "type": 0,
                            "name": load_condition.tags,
                            "pattern": load_condition.tags,
                            "scope": 0,
                            "permission": 1
                        };
                        initCommentPlugin({"uid": uniqueUid, "ptwid": -1});
                    } else {
                        console.warn("Error Code: " + response.status);
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
                    case 3:
                        var tagWrapper = wsMessage.metadata.tagWrapper;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                if (comment_plugin.config.mainId == tagWrapper.ptwid) {
                                    comment_plugin.utils.scrollToSpecialComment(comment);
                                } else {
                                    var link;
                                    if (tagWrapper.topic == 0) {
                                        link = "p/tag/" + tagWrapper.name + "?uid=" + tagWrapper.uid + "#comment_" + comment.cid;
                                    } else {
                                        link = "p/topic/" + tagWrapper.ptwid + "#comment_" + comment.cid;
                                    }
                                    window.open(link);
                                }
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + " 对你的照片合集<br><b>“" + tagWrapper.name + "”</b><br>发表了评论~";
                        } else {
                            msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                        }
                        if (comment_plugin.config.mainId == tagWrapper.ptwid) {
                            comment_plugin.utils.appendCommentInPage(comment);
                        }
                        e.stopImmediatePropagation(); // 阻止login中绑定的事件, stopImmediatePropagation能阻止委托事件
                        break;
                }
                if (msg) {
                    common_utils.notify(notify_opts)
                        .success(msg, "", "receive_comment" + "_" + comment.cid)
                        .addClass("wsMessage receive_comment").attr("data-wsid", wsMessage.id).attr("data-cid", comment.cid);
                }
            }, true);   // 插入到事件队列第一个
        }
    }

    var initRelationPageLink = function (load_condition) {
        if (load_condition.tags || $("#first").find(".media-list-name").attr("data-clear-mode") == "topic") {
            var cast_href = "redirect?model=photo_tag" + (load_condition.tags ? "" : ("&tags=" + $("#first").find(".media-list-name").attr("data-topic-name")));
            $.each(load_condition, function (key, value) {
                if (key == "tags" || key == "uid" || key == "extend") {
                    cast_href += "&" + key + "=" + value
                }
            });
            if (load_condition.extend == "true") {
                cast_href += "&casting=down";    // 查看子标签
                $(".album_options .option_tags_subtag").attr("href", cast_href).show();
                $(".album_options .option_tags_upcasting").hide();
            } else {
                cast_href += "&casting=up";  // 查看相似标签
                $(".album_options .option_tags_subtag").hide();
                $(".album_options .option_tags_upcasting").attr("href", cast_href).show();
            }
        }
        // 标签索引
        var tags_classification_href = "";
        $.each(load_condition, function (key, value) {
            tags_classification_href += "&" + key + "=" + value
        });
        tags_classification_href = "p/tags_square" + (tags_classification_href ? ("?" + tags_classification_href.substring(1)) : "");
        $(".album_options .option_run_tags_classification").attr("href", tags_classification_href).show();
    };

    /**
     * main
     */
    domReady(function () {

        var albumConfig = common_utils.getLocalConfig("album", {
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
                "preview_compress": true,
                "blow_up": {
                    "width": 500,
                    "height": 500,
                    "scale": 1.6
                }
            }
        });
        if (albumConfig.photo_page.full_background) {
            $("body").css("background-image", $("#first").css("background-image"));
            $("#first").css("background-image", "");
        }

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.photo_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col && parseInt(params.col);
        var checkPhotoId = params.check ? params.check : 0;
        var query_size = params.query_size ? parseInt(params.query_size) : albumConfig.photo_page.default_query_size;
        var query_start = params.query_start ? parseInt(params.query_start) : 0;
        var cloud_photo_preview_args = "";
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != "method" && key != "size" && key != "col" && key != "page" && key != "check" && key != "model") {
                load_condition[key] = params[key];
            }
        });

        var title_suffix = "dashboard | ImCoder博客's 相册";
        var clearPageMatch = document.location.pathname.match(/.*\/(p\/(topic|tag)\/([^/]*)(\/([^/]+))?)|(u\/([^/]*)\/?(photos|likes|history))/);
        if (clearPageMatch) {
            if (RegExp.$2 == "topic") {
                isClearTopicPage = true;
                load_condition["topic.ptwid"] = RegExp.$3 || "0";
                RegExp.$5 && (load_condition["topic.name"] = decodeURIComponent(RegExp.$5));
                !load_condition.from && (load_condition.from = "photo_topic");
            } else if (RegExp.$2 == "tag") {
                isClearTagPage = true;
                load_condition.extend = (load_condition.extend == undefined ? true : load_condition.extend);
                load_condition.tags = "<" + decodeURIComponent(RegExp.$3) + ">";
                !load_condition.from && (load_condition.from = "photo_tag");
            } else if (clearPageMatch[8] == "likes") {
                load_condition.liked = "true";
                isClearUserLikesPage = true;
                title_suffix = $("#first").find(".slogan_name").text() + "喜欢的照片 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_likes_photos");
            } else if (clearPageMatch[8] == "history") {
                load_condition.accessed = "true";
                isClearUserHistoryPage = true;
                title_suffix = $("#first").find(".slogan_name").text() + "访问过的照片 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_history_photos");
            } else {
                isClearUserPage = true;
                load_condition.uid = clearPageMatch[7];
                title_suffix = $("#first").find(".slogan_name").text() + "的照片 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_photos");
            }
        }

        var title_prefix = load_condition.tags || load_condition.name || load_condition.description || "";
        var album_title_prefix = null;
        if (load_condition.album_id && load_condition.from && load_condition.from.indexOf("album_detail") == 0) {
            album_title_prefix = "album[" + load_condition.album_id + "]";
            if (title_prefix) {
                title_prefix = title_prefix + " in " + album_title_prefix;
            } else if (load_condition.image_type == "video") {
                title_prefix = "视频 in " + album_title_prefix;
            } else if (isClearTopicPage) {
                title_prefix = "topic_" + (load_condition["topic.name"] || load_condition["topic.ptwid"]) + " in " + album_title_prefix;
            } else {
                title_prefix = album_title_prefix;
            }
        } else {
            if (isClearTopicPage && !title_prefix) {
                title_prefix = "topic_" + (load_condition["topic.name"] || load_condition["topic.ptwid"]);
            }
        }
        if (title_prefix) {
            if (title_prefix == "_" && !load_condition.description && !load_condition.name) {
                title_prefix = "所有标签";
            }
            $("head").find("title").text(title_prefix + " - " + title_suffix);
        }

        album_photo_page_handle.utils.bindEvent(album_photo_page_handle.config.event.popupChanged, function (e, check) {
            check && setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                if (title_prefix) {
                    document.title = "照片_" + check + " of " + title_prefix + " - " + title_suffix;
                } else {
                    document.title = "照片_" + check + " - " + title_suffix;
                }
            }, 50);
        });
        album_photo_page_handle.utils.bindEvent(album_photo_page_handle.config.event.popupClosed, function (e, check) {
            setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                if (title_prefix) {
                    document.title = title_prefix + " - " + title_suffix;
                } else {
                    document.title = title_suffix;
                }
            }, 50);
        });
        album_photo_page_handle.init({
            path_params: {
                "basePath": $("#basePath").attr("href"),
                "cloudPath": $("#cloudPath").attr("href"),
                "staticPath": $("#staticPath").attr("href")
            },
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
            zipPhoto_groupWithAlbum: false,
            allowZipPhotos: true,
            allowZipPhotosMaxLength: 30,
            callback: {
                "requestPhotoList": function (condition, call) {
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "showDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载数据", "", "notify_photos_loading");
                    $.get("photo.api?method=getPhotoList", condition, function (response) {
                        common_utils.removeNotify("notify_photos_loading");
                        if (response.status == 200) {
                            var data = response.data;
                            call.call(album_photo_page_handle, data);
                        } else {
                            toastr.error(response.message, "加载照片列表失败!");
                            console.warn("Error Code: " + response.status);
                        }
                    });
                },
                "loadPhotos_callback": function (config, success) {
                    var object = $.extend(true, {}, config.load_condition);
                    delete object.method;
                    if (object["query_start"] === undefined) {
                        if (object["topic.ptwid"] ||
                            object["topic.name"] ||
                            ((object["tags"]) && (object["uid"] || object["album_id"]))) {
                            config.query_start = -1;
                        }
                    }
                    object.query_size = config.query_size;
                    object.query_start = config.query_start;
                    if (object.from) {
                        object.base = object.from;
                    }
                    object.from = "album_photo_dashboard";
                    config.callback.requestPhotoList.call(this, object, function (data) {
                        var album = {};
                        album.photos = data.photos || [];
                        album.size = data.photos ? data.photos.length : 0;
                        album.show_col = 0;
                        data.album = album;
                        cloud_photo_preview_args = data.cloud_photo_preview_args;
                        success(data);
                        if (album.size == 0) {
                            common_utils.notify({
                                "progressBar": false,
                                "hideDuration": 0,
                                "showDuration": 0,
                                "timeOut": 10000,
                                "closeButton": false
                            }).success("抱歉，未找到您要的内容", "", "notify_photos_loading_empty");
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
                        return source + cloud_photo_preview_args.replace("{col}", hitCol);
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
                        zipName += "_" + (config.load_condition["topic.name"] || config.load_condition["topic.ptwid"]);
                    } else if (photo.name && (photo.name == photo.description) && (photo.name == photo.tags)) {
                        zipName += "_" + photo.name;
                    } else {
                        $.each(photo, function (key, value) {
                            if (value) {
                                zipName += "_" + value;
                            }
                        });
                    }
                    zipName += "_" + common_utils.formatDate(new Date(), "yyMMddhhmmss");
                    config.zipPhoto_groupWithAlbum = confirm("是否需要以相册划分文件夹？");
                    config.zipPhoto_groupWithMirrorPath = confirm("是否需要以路径镜像划分文件夹？");
                    return zipName;
                },
                "beforeZipPhotos": function (options) {
                    var context = this;
                    var superParseFilesCall = options.callback.parseFiles_callback;
                    options.callback.parseFiles_callback = function (location_info, options) {
                        var photo_arr = superParseFilesCall(location_info, options);
                        var selectPhotosDfd = $.Deferred();
                        login_handle.getCurrentUser(function (user) {
                            if (user && user.userGroup.gid == -1) {
                                selectPhotosDfd.resolve(photo_arr);
                            } else if (context.config.allowZipPhotos == true) {
                                var maxValue = context.config.allowZipPhotosMaxLength;
                                if (maxValue && maxValue < photo_arr.length) {
                                    toastr.success("下载更多需要向管理员\n【申请权限】方可~", "本次只准下载 " + maxValue + " 张", {
                                        "timeOut": 0,
                                        "showDuration": 0
                                    });
                                    selectPhotosDfd.resolve(photo_arr.slice(0, maxValue));
                                } else {
                                    selectPhotosDfd.resolve(photo_arr);
                                }
                            } else {
                                selectPhotosDfd.reject("打包下载需要向管理员\n【申请权限】方可~");
                            }
                        });
                        return selectPhotosDfd;
                    };
                },
                "actionForEditPhoto": function (photo) {
                    $.magnificPopup.close();
                    album_photo_handle.openUpdatePhotoModal(photo);
                },
                "paginationClick_callback": function (paginationNode) {
                    var context = this;
                    var config = context.config;
                    if (!config.hasLoadAll && config.page_params.pageNum == config.page_params.pageCount) { // 点击加载全部图片
                        var default_query_size = albumConfig.photo_page.default_query_size;
                        if (context.pointer.album.size == default_query_size && config.query_size == default_query_size) {
                            toastr.success("点击加载更多照片", "", {
                                timeOut: 0,
                                iconClass: "toast-success-no-icon",
                                onclick: function () {
                                    var object = $.extend(true, {}, config.load_condition);
                                    config.query_size = object.query_size = 0;
                                    if (config.query_start >= 0) {
                                        object.query_start = context.pointer.album.size;
                                    } else {
                                        object.query_start = -1 * context.pointer.album.size - 1;
                                    }
                                    if (object.from) {
                                        object.base = object.from;
                                    }
                                    object.from = "album_photo_dashboard";
                                    var params = common_utils.parseURL(document.location.href).params;
                                    var search = "";
                                    $.each(params, function (key, value) {
                                        if (key != "method" && key != "page" && key != "query_start" && key != "query_size") {
                                            search += "&" + key + "=" + value;
                                        }
                                    });
                                    search += "&query_start=" + (config.query_start) + "&query_size=0&page=" + config.page_params.pageNum;
                                    search = (search ? ("?" + search.substring(1)) : "");
                                    history.replaceState( // url上加上查询大小
                                        {"mark": "page"},
                                        document.title,
                                        location.pathname + search
                                    );
                                    config.callback.requestPhotoList.call(this, object, function (data) {
                                        var photos = context.pointer.album.photos;
                                        photos.push.apply(photos, data.photos);
                                        context.pointer.album.size = photos.length;
                                        config.page_params.pageCount = context.utils.calcPageCount();
                                        context.utils.updateAlbumSizeInPage();
                                        context.jumpPage(config.page_params.pageNum);
                                        config.hasLoadAll = true;
                                    });
                                }
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
                "url": "photo.api?method=getAlbum",
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
            $.get("user.api?method=getUser", {"uid": uid}, function (response) {
                if (response.status == 200) {
                    handler(response.data.user);
                } else {
                    handler(null);
                }
            }).fail(function (XHR, TS) {
                console.error("ResultsCache Error: found exception when load user from internet, text: " + TS);
                handler(null);
            });
        });
        // 相册处理模块初始化
        album_photo_handle.init({
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
                "deleteCompleted": function (context, params) {
                    album_photo_page_handle.utils.deletePhotoInPage(params.photo_id);
                },
                "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {
                    var album_id = context.config.albumId;
                    // 传入的参数可以修改上传的相册ID
                    openUploadModal_callback(album_id);
                },
                "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {
                    // 如果图片为视频的封面，则添加视频链接
                    var video_id = album_photo_page_handle.utils.getPhotoImageDom(photo.photo_id).children(0).attr("data-video-id");
                    if (video_id && video_id != "0") {
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
                        video_href_span.text(video_id).parent().attr("href", "video/detail/" + video_id);
                    } else {
                        updateModal.find('span[name="video_id"]').parent().parent().hide(0);
                    }
                    // dashboard页 添加照片所属相册链接
                    if (updateModal.find('span[name="album_id"]').length == 0) {
                        updateModal.find('span[name="photo_id"]').parent().parent().after(
                            '<div class="form-group"><label class="control-label">所属簿：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                            '<a target="_blank" style="color: #666; cursor: pointer" title="在相簿中查看" >' +
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
                    secureAlbumInfoConn.get(photo.album_id, function (album) {
                        var album_url = "p/album/" + photo.album_id + "?check=" + photo.photo_id;
                        if (album) {
                            updateModal.find('span[name="album_id"]').text(album.name).parent().attr("href", album_url);
                        } else {
                            updateModal.find('span[name="album_id"]').text(photo.album_id).parent().attr("href", album_url);
                        }
                        user_base_info_cache.compute(photo.uid).then(function (user) {
                            var user_home_url = "u/" + photo.uid + "/home";
                            if (user) {
                                updateModal.find('span[name="user_id"]').text(user.nickname).parent().attr("href", user_home_url);
                            } else {
                                updateModal.find('span[name="user_id"]').text(photo.uid).parent().attr("href", user_home_url);
                            }
                            // 回调
                            formatPhotoToModal_callback(photo);
                        });
                    });
                }
            },
            "downloadType": /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? "url" : "ajax"
        });

        if (load_condition.uid) {
            album_photo_handle.utils.bindEvent(album_photo_handle.config.event.tagClick, function (_e, tag, photo_id, clickEvt) {
                clickEvt.preventDefault();
                // window.open("u/" + load_condition.uid + "/photos?tags=<" + tag + ">");
                window.open("p/tag/" + encodeURIComponent(tag) + "?uid=" + load_condition.uid);
            });
        }

        // 绑定特殊标签的扩展点击反应事件
        album_photo_handle.utils.bindEvent(album_photo_handle.config.event.tagExtendClick, function (_e, tag, photo_id, clickEvt, keyEvt) {
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
                default:
                    if (isClearUserPage) {
                        window.open("p/tag/" + tag);
                    } else {
                        window.open("p/tag/" + tag + (load_condition.uid ? ("?uid=" + load_condition.uid) : ""));
                    }
            }
        });

        $('#uploadPhoto').click(function () {
            album_photo_handle.openUploadPhotoModal();
        });

        // 删除历史记录按钮
        if (isClearUserHistoryPage || isClearUserLikesPage) {
            var $deleteAccessRecordBtn = $($.parseHTML('<button class="btn btn-danger btn-delete-access-record" ' +
                'name="deletePhotoAccessRecord_trigger" title="删除访问记录">删除记录</button>')[0]);
            album_photo_handle.pointer.updateModal.find('.modal-footer').prepend($deleteAccessRecordBtn);
            $deleteAccessRecordBtn.on("click", function () {
                var photo_id = album_photo_handle.pointer.updateModal.find('span[name="photo_id"]').html().trim();
                $.post("user.api?method=deleteUserPhotoAccessRecord", {"bean.photo_id": photo_id}, function (response) {
                    if (response.status == 200) {
                        toastr.success("已删除此访问记录~");
                        album_photo_handle.pointer.updateModal.modal('hide');
                    } else {
                        toastr.error(response.message, response.status);
                        console.warn("Error Code: " + response.status);
                    }
                });
            });
        }

        // 鼠标悬浮于照片显示作者
        var regexHasSetUserName = /^.*\n上传者@[^@]+$/;
        $("#" + album_photo_page_handle.config.selector.photosContainer_id).on("mouseenter", album_photo_page_handle.config.selector.photo_node, function (e) {
            var $photoNode = $(this);
            var beforeTitle = $photoNode.attr("title");
            if (!regexHasSetUserName.test(beforeTitle)) {
                var uid = $photoNode.attr("data-uid");
                if (uid) {
                    user_base_info_cache.compute(uid).then(function (user) {
                        if (user) {
                            $photoNode.attr("title", beforeTitle + "\n" + "上传者@" + user.nickname);
                        }
                    });
                }
            }
        });

        // 搜索重写
        if (Object.keys(load_condition).length > 0) {
            var search_input_value = "";
            $.each(load_condition, function (key, value) {
                if (key == "tags") {
                    value = value.replace(new RegExp(toolbar.utils.getItsMultipleMatchJoiner(key), "g"), '#');
                    if (/^\((.+)\.\*(.+)\)\|\(\2\.\*\1\)$/.test(value)) {
                        var matchForTwo = value.match(/^\((.+)\.\*(.+)\)\|/);
                        value = matchForTwo[1] + "#" + matchForTwo[2];
                    }
                    value = value.replace(/\[\[:<:\]\]/g, '<');
                    value = value.replace(/\[\[:>:\]\]/g, '>');
                    if (value.indexOf("[[.") != -1) {
                        value = common_utils.replaceByEL(value, function (index, key) { // 还原被转义的MySQL特殊字符
                            return /^[^\w]+$/.test(key) ? "{" + key + "}" : this[0];
                        }, "\\[\\[\\.", "\\.\\]\\]")
                    }
                    title_prefix = value + (album_title_prefix ? (" in " + album_title_prefix) : "");
                    document.title = title_prefix + " - " + title_suffix;
                }
                search_input_value += "," + key + ":";
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
            $(".album_options .option_photo_square").attr("href", "p/dashboard?model=photo" + document.location.search.replace(/^\?/, "&")).show();
        }

    });
});
