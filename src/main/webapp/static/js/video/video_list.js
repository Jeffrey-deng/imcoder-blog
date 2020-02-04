/**
 * 用户视频列表
 * @author Jeffrey.Deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'period_cache', 'video_handle', 'album_photo_page_handle', 'album_video_plugin'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, PeriodCache, video_handle, album_photo_page_handle, album_video_plugin);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, PeriodCache, video_handle, album_photo_page_handle, album_video_plugin) {

    var isClearTopicPage = false, isClearTagPage = false, isClearUserPage = false, // 明确的topic页面，明确的tag页面
        isClearUserLikesPage = false, isClearUserHistoryPage = false;

    var videoList = [];

    var convertVideoToPhoto = function (video) {
        var cover = video.cover;
        // cover.video = video;
        cover.video_id = video.video_id;
        cover.name = video.name;
        cover.description = video.description;
        cover.tags = video.tags;
        cover.permission = video.permission;
        cover.uid = video.user.uid;
        return cover;
    };

    var convertVideoListToPhotoList = function (videoList) {
        var photoList = null;
        if (videoList && videoList.length > 0) {
            photoList = new Array(videoList.length);
            $.each(videoList, function (i, video) {
                photoList[i] = convertVideoToPhoto(video);
            });
        } else {
            photoList = [];
        }
        return photoList;
    };

    var request = {
        "loadVideoByCoverOverride": function (cover_id, callback) {
            setTimeout(function () {
                $.each(videoList, function (i, video) {
                    if (video.cover.photo_id == cover_id) {
                        callback && callback(video);
                        return false;
                    }
                });
            }, 0);
        },
        "loadVideosByCoversOverride": function (array, callback) {
            setTimeout(function () {    // 这里要异步因为checkPhotoId，不异步的阻断函数反而阻断自己的click，使popup失效
                var videos = [];
                for (var i in array) {
                    var cover_id = array[i];
                    for (var j in videoList) {
                        var video = videoList[j];
                        if (cover_id == video.cover.photo_id) {
                            videos.push(video);
                        }
                    }
                }
                callback && callback(videos);
            }, 0);
        }
    };

    var getVideoIndexInList = function (video) {
        var index = undefined;
        $.each(videoList, function (i, value) {
            if (value.video_id == video.video_id) {
                index = i;
                return false;
            }
        });
        return index;
    };

    domReady(function () {

        var albumConfig = common_utils.getLocalConfig("album", {
            "photo_page": {
                "full_background": false,
                "default_col": {
                    "2000": 6,
                    "1800": 5,
                    "1600": 4,
                    "940": 3,
                    "720": 2
                },
                "default_size": 0,
                "photo_node_link_use_by": 'photo_detail',
                "preview_compress": true
            }
        });
        if (albumConfig.photo_page.full_background) {
            $("body").css("background-image", $("#first").css("background-image"));
            $("#first").css("background-image", "");
        }

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.photo_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col;
        var query_size = params.query_size ? parseInt(params.query_size) : albumConfig.photo_page.default_query_size;
        var query_start = params.query_start ? parseInt(params.query_start) : 0;
        var checkVideoId = params.check ? params.check : 0;
        var cloud_photo_preview_args = "";
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != "method" && key != "size" && key != "col" && key != "page" && key != "check" && key != "model") {
                load_condition[key] = params[key];
            }
        });

        var title_suffix = "video dashboard | ImCoder博客's 相册";
        var clearPageMatch = document.location.pathname.match(/.*\/(video\/(topic|tag)\/([^/]*)(\/([^/]+))?)|(u\/([^/]*)\/?(videos|likes|history))/);
        if (clearPageMatch) {
            if (RegExp.$2 == "topic") {
                isClearTopicPage = true;
                load_condition["topic.ptwid"] = RegExp.$3 || "0";
                RegExp.$5 && (load_condition["topic.name"] = decodeURIComponent(RegExp.$5));
                !load_condition.from && (load_condition.from = "video_topic");
            } else if (RegExp.$2 == "tag") {
                isClearTagPage = true;
                load_condition.extend = (load_condition.extend == undefined ? true : load_condition.extend);
                load_condition.tags = "<" + decodeURIComponent(RegExp.$3) + ">";
                !load_condition.from && (load_condition.from = "video_tag");
            } else if (clearPageMatch[8] == "likes") {
                load_condition.liked = "true";
                isClearUserLikesPage = true;
                title_suffix = $("#first").find(".slogan_name").text() + "喜欢的视频 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_likes_videos");
            } else if (clearPageMatch[8] == "history") {
                load_condition.accessed = "true";
                isClearUserHistoryPage = true;
                title_suffix = $("#first").find(".slogan_name").text() + "访问过的视频 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_history_videos");
            } else {
                isClearUserPage = true;
                load_condition["user.uid"] = clearPageMatch[7];
                title_suffix = $("#first").find(".slogan_name").text() + "的视频 | ImCoder博客's 相册";
                !load_condition.from && (load_condition.from = "user_videos");
            }
        }
        var title_prefix = load_condition.tags || load_condition.name || load_condition.description || "";
        var album_title_prefix = null;
        if (load_condition["cover.album_id"] && load_condition.from && load_condition.from.indexOf("album_detail") == 0) {
            album_title_prefix = "album[" + load_condition["cover.album_id"] + "]";
            if (title_prefix) {
                title_prefix = title_prefix + " in " + album_title_prefix;
            } else {
                title_prefix = album_title_prefix;
            }
        }
        if (title_prefix) {
            if (title_prefix == "_" && !load_condition.description && !load_condition.name) {
                title_prefix = "所有标签";
            }
            $("head").find("title").text(title_prefix + " - " + title_suffix);
        }

        album_photo_page_handle.on(album_photo_page_handle.config.event.popupChanged, function (e, checkCover, checkVideo) {
            checkVideo && setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                if (title_prefix) {
                    document.title = "视频_" + checkVideo + " of " + title_prefix + " - " + title_suffix;
                } else {
                    document.title = "视频_" + checkVideo + " - " + title_suffix;
                }
            }, 50);
        });
        album_photo_page_handle.on(album_photo_page_handle.config.event.popupClosed, function (e, checkCover, checkVideo) {
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
                "album_size": "#video_count"
            },
            page_params: {
                "pageSize": pageSize,
                "pageNum": pageNum,
                "col": col,
                "default_col": albumConfig.photo_page.default_col
            },
            checkPhotoId: checkVideoId,
            page_method_address: isClearUserPage ? "user_videos" : "dashboard",
            load_condition: load_condition,
            query_size: query_size,
            query_start: query_start,
            photoNodeLinkUsePhotoDetail: albumConfig.photo_page.photo_node_link_use_by == 'photo_detail',
            callback: {
                "requestPhotoList": function (condition, call) {
                    var context = this;
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "showDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载数据", "", "notify_videos_loading");
                    return $.get("video.api?method=getVideoList", condition, function (response) {
                        common_utils.removeNotify("notify_videos_loading");
                        if (response.status == 200) {
                            var data = response.data;
                            if (!videoList || videoList.length == 0) {
                                videoList = data.videos;
                            } else {
                                videoList.push.apply(videoList, data.videos);
                            }
                            data.photos = convertVideoListToPhotoList(data.videos);
                            if (context.config.checkPhotoId) {
                                $.each(videoList, function (i, video) {
                                    if (video.video_id == context.config.checkPhotoId) {
                                        context.config.checkPhotoId = video.cover.photo_id;
                                    }
                                });
                            }
                            call.call(album_photo_page_handle, data);
                        } else {
                            toastr.error(response.message, "加载视频列表失败!");
                            console.warn("Error Code: " + response.status);
                        }
                    }).fail(function () {
                        toastr.error("加载视频列表失败!");
                    });
                },
                "loadPhotos_callback": function (config, success) {
                    var object = $.extend(true, {}, config.load_condition);
                    delete object.method;
                    if (isClearUserPage && config.load_condition["query_start"] === undefined) {
                        config.query_start = -1;
                    }
                    object.query_size = config.query_size;
                    object.query_start = config.query_start;
                    if (object.from) {
                        object.base = object.from;
                    }
                    object.from = "video_dashboard";
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
                            }).success("抱歉，未找到您要的内容", "", "notify_videos_loading_empty");
                        }
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
                    return false;
                },
                "actionForEditPhoto": function (photo) {
                    video_handle.openUpdateVideoModal({"cover_id": photo.photo_id});
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
        // 从内存缓存实例中得到用户相册列表组连接
        var secureUserAlbumListConn = memoryPeriodCache.getOrCreateGroup({
            "groupName": "user_album_list_cache",
            "timeOut": 180000,
            "reload": {
                "url": "photo.api?method=getAlbumList",
                "params": function (groupName, key) {
                    return {"user.uid": key};
                },
                "parse": function (cacheCtx, groupName, key, old_object_value, response) {
                    if (response.status == 200) {
                        return response.data.albums;
                    } else {
                        return null;
                    }
                }
            }
        });
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
                "uploadCompleted": function (context, video) {  // 视频上传完成后回调
                    videoList.push(video);
                    album_photo_page_handle.utils.appendPhotoToPage(convertVideoToPhoto(video));
                    album_photo_page_handle.jumpPage(album_photo_page_handle.utils.calcPageCount());
                },
                "updateCompleted": function (context, video) {  // 更新完成后回调
                    var index = getVideoIndexInList(video);
                    videoList[index] = video;
                    album_photo_page_handle.pointer.album.photos = convertVideoListToPhotoList(videoList);
                    album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                },
                "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {  // 上传窗口打开前回调
                    // 加载相册列表
                    var hostUser = context.config.hostUser;
                    var dfd = $.Deferred();
                    secureUserAlbumListConn.get(hostUser, function (albums) {
                        openUploadModal_callback(albums);
                        dfd.resolve();
                    });
                    dfd.done(function () {
                        // 加载上传参数及配置，判断该用户是否允许上传
                        $.get("video.api?method=getUploadConfigInfo", function (response) {
                            if (response.status == 200) {
                                var uploadConfigInfo = response.data;
                                video_handle.config.uploadConfigInfo = uploadConfigInfo;
                                video_handle.config.maxUploadSize = uploadConfigInfo.uploadArgs.maxVideoUploadSize;
                                if (!uploadConfigInfo || uploadConfigInfo.isAllowUpload) {
                                    // 允许上传才打开上传按钮
                                    uploadModal.find('button[name="uploadVideo_trigger"]').removeAttr("disabled");
                                    common_utils.removeNotify("notify-no-allow-upload");
                                } else {
                                    var users = null;
                                    switch (uploadConfigInfo.allowUploadLowestLevel) {
                                        case 1:
                                            users = "高级会员与管理员";
                                            break;
                                        case -1:
                                            users = "管理员";
                                            break
                                    }
                                    common_utils.notify({timeOut: 0}).info("系统当前配置为只允许<br>【<b>" + users + "</b>】上传视频", "您暂时不能上传", "notify-no-allow-upload");
                                    // 禁用上传按钮
                                    uploadModal.find('button[name="uploadVideo_trigger"]').attr("disabled", "disabled");
                                }
                            } else {
                                toastr.error("加载上传配置失败", "错误");
                            }
                        });
                    });
                },
                "beforeUpdateModalOpen": function (context, updateModal, formatVideoToModal_callback, video) {  // 更新窗口打开前回调
                    var dfd = $.Deferred();
                    // 如果openUpdateVideoModal传入的参数为video对象，直接使用
                    if (typeof video == "object" && video.video_id) {
                        dfd.resolve(video);
                    } else {    // 如果传入的参数为video_id，异步获取video对象
                        context.loadVideo(video, function (video) {
                            if (video) {
                                dfd.resolve(video);
                            } else {
                                dfd.reject();
                            }
                        });
                    }
                    dfd.done(function (video) {
                        if (login_handle.equalsLoginUser(video.user.uid)) {
                            secureUserAlbumListConn.get(video.user.uid, function (albums) {
                                formatVideoToModal_callback(video, albums);
                            });
                        } else {
                            formatVideoToModal_callback(video);
                        }
                    });
                }
            },
            "hostUser": load_condition["user.uid"] || login_handle.getCurrentUserId() || 0
        });

        // video_handle.on(video_handle.config.event.tagClick, function (_e, tag, video_id, clickEvt) {
        //     clickEvt.preventDefault();
        //     window.open("u/" + load_condition["user.uid"] + "/videos?tags=<" + tag + ">");
        // });

        if (isClearUserPage) {
            // 绑定打开上传窗口
            $('#uploadVideo').click(function () {
                video_handle.openUploadVideoModal();
            });
        }

        // 重写插件中的请求方法
        album_video_plugin.request.loadVideoByCover = request.loadVideoByCoverOverride;
        album_video_plugin.request.loadVideosByCovers = request.loadVideosByCoversOverride;
        // 视频插件设置为纯视频模式
        album_video_plugin.config.popup_url_check_id_use_by = "video";
        // 绑定视频插件中编辑按钮事件
        album_video_plugin.on(album_video_plugin, album_video_plugin.config.event.actionForEditVideo, function (e, video) {
            this.utils.closeVideoPopup();
            video_handle.openUpdateVideoModal(video); // 打开视频更新窗口
        });

        // 删除历史记录按钮
        if (isClearUserHistoryPage || isClearUserLikesPage) {
            var $deleteAccessRecordBtn = $($.parseHTML('<button class="btn btn-danger btn-delete-access-record" ' +
                'name="deleteVideoAccessRecord_trigger" title="' + (isClearUserHistoryPage ? '删除访问记录' : '从喜欢中移除') + '">'
                + (isClearUserHistoryPage ? '删除记录' : '取消点赞') + '</button>')[0]);
            video_handle.pointer.updateModal.find('.modal-footer').prepend($deleteAccessRecordBtn);
            $deleteAccessRecordBtn.on("click", function () {
                var video_id = video_handle.pointer.updateModal.find('span[name="video_id"]').html().trim();
                if (isClearUserHistoryPage) {
                    $.post("user.api?method=deleteUserVideoAccessDetail", {"video_id": video_id}, function (response) {
                        if (response.status == 200) {
                            toastr.success("已删除此访问记录~");
                            video_handle.pointer.updateModal.modal('hide');
                        } else {
                            toastr.error(response.message, response.status);
                            console.warn("Error Code: " + response.status);
                        }
                    });
                } else {
                    $.post("video.api?method=likeVideo", {"video_id": video_id, "undo": true}, function (response) {
                        if (response.status == 200) {
                            toastr.success("已取消赞~");
                            video_handle.pointer.updateModal.modal('hide');
                        } else {
                            toastr.error(response.message, response.status);
                            console.warn("Error Code: " + response.status);
                        }
                    });
                }
            });
        }

        // 鼠标悬浮于照片显示作者
        var regexHasSetUserName = /^[\s\S]*\n上传者@[^@]+$/;
        $("#" + album_photo_page_handle.config.selector.photosContainer_id).on("mouseenter", album_photo_page_handle.config.selector.photo_node, function (e) {
            var $photoNode = $(this);
            var beforeTitle = $photoNode.attr("title");
            if (!regexHasSetUserName.test(beforeTitle)) {
                var cover_id = $photoNode.attr("data-id");
                if (cover_id) {
                    request.loadVideoByCoverOverride(cover_id, function (video) {
                        if (video) {
                            $photoNode.attr("title", beforeTitle + "\n" + "上传者@" + video.user.nickname);
                        }
                    });
                }
            }
        });

        // 标签索引
        var tags_classification_href = "&image_type=video";
        $.each(load_condition, function (key, value) {
            if (key == "user.uid") {
                tags_classification_href += "&uid" + "=" + value
            } else if (key != "source_type" && key != "video_type" && key != "rotate") {
                tags_classification_href += "&" + key + "=" + value
            }
        });
        tags_classification_href = "p/tags_square" + (tags_classification_href ? ("?" + tags_classification_href.substring(1)) : "");
        $(".video_options .option_run_tags_classification").attr("href", tags_classification_href).show();

        if (isClearUserPage) {
            // mark
            if (/[&?]mark=([^&#]+)/.test(document.location.href)) {
                switch (RegExp.$1) {
                    case "upload":
                        var upload_cover_album_id = params["cover.album_id"];
                        if (upload_cover_album_id) {
                            video_handle.pointer.remember_cover_album_id = upload_cover_album_id;
                        }
                        video_handle.openUploadVideoModal();
                        break;
                }
                history.replaceState({"mark": "page"}, document.title, common_utils.removeParamForURL("mark"));
            }
        }

    });
});