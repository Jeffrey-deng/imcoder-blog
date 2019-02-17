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
                "preview_compress": true
            }
        });
        if (albumConfig.photo_page.full_background) {
            $("body").css("background-image", $("#first").css("background-image"));
            $("#first").css("background-image", "");
        }

        //var album_id = $('#album_size').attr('album_id');
        var hostUser = parseInt($('#first h1').attr('hostUser'));

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.photo_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col;
        var checkVideoId = params.check ? parseInt(params.check) : 0;
        var cloud_photo_preview_args = "";
        var open_preview_compress = albumConfig.photo_page.preview_compress;

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
            page_method_address: "user_videos",
            load_condition: {
                "uid": hostUser,
                "image_type": "video"
            },
            query_size: 0,
            query_start: 0,
            callback: {
                "loadPhotos_callback": function (config, success) {
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载数据", "", "notify_photos_loading");
                    var object = $.extend(true, {}, config.load_condition);
                    delete object.method;
                    object.query_size = config.query_size;
                    object.query_start = config.query_start;
                    $.get("photo.do?method=photoListByAjax", object, function (data) {
                        common_utils.removeNotify("notify_photos_loading");
                        if (data.flag == 200) {
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
                                    "timeOut": 10000,
                                    "closeButton": false
                                }).success("抱歉，未找到您要的内容", "", "notify_photos_loading_empty");
                            }
                        } else {
                            toastr.error(data.info, "加载视频列表失败!");
                            console.warn("Error Code: " + data.flag);
                        }
                    });
                },
                "generatePhotoPreviewUrl": function (source, relativePath, hitCol) { // 生成预览图片url的函数
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
                    album_photo_page_handle.utils.appendPhotoToPage(video.cover);
                    album_photo_page_handle.jumpPage(album_photo_page_handle.utils.calcPageCount());
                },
                "updateCompleted": function (context, video) {  // 更新完成后回调
                    var object = $.extend(true, {}, album_photo_page_handle.config.load_condition);
                    delete object.method;
                    object.query_size = album_photo_page_handle.config.query_size;
                    object.query_start = album_photo_page_handle.config.query_start;
                    $.get("photo.do?method=photoListByAjax", object, function (data) {
                        common_utils.removeNotify("notify_photos_loading");
                        if (data.flag == 200) {
                            var album = {};
                            album.photos = data.photos || [];
                            album.size = data.photos ? data.photos.length : 0;
                            album.show_col = 0;
                            album_photo_page_handle.pointer.album = album;
                            album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                        }
                    });
                },
                "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {  // 上传窗口打开前回调
                    // 加载上传参数及配置，判断该用户是否允许上传
                    $.get("video.do?method=getUploadConfigInfo", function (data) {
                        if (data && data.flag == 200) {
                            delete data.flag;
                            video_handle.config.uploadConfigInfo = data;
                            video_handle.config.maxUploadSize = data.uploadArgs.maxVideoUploadSize;
                            if (!video_handle.config.uploadConfigInfo || video_handle.config.uploadConfigInfo.isAllowUpload) {
                                // 允许上传才打开上传按钮
                                video_handle.pointer.uploadModal.find('button[name="uploadVideo_trigger"]').removeAttr("disabled");
                                common_utils.removeNotify("notify-no-allow-upload");
                            } else {
                                var users = null;
                                var lowestLevel = video_handle.config.uploadConfigInfo.allowUploadLowestLevel;
                                if (lowestLevel == 1) {
                                    users = "高级会员与管理员";
                                } else if (lowestLevel == -1) {
                                    users = "管理员";
                                }
                                common_utils.notify({timeOut: 0}).info("系统当前配置为只允许 <b>" + users + "</b> 上传视频", "您暂时不能上传", "notify-no-allow-upload");
                                // 禁用上传按钮
                                video_handle.pointer.uploadModal.find('button[name="uploadVideo_trigger"]').attr("disabled", "disabled");
                            }
                        } else {
                            toastr.error("加载上传配置失败", "错误");
                        }
                    });
                    // 加载相册列表
                    var hostUser = context.config.hostUser;
                    context.loadAlbums(hostUser, function (data) {
                        openUploadModal_callback(data.albums);
                    });
                },
                "beforeUpdateModalOpen": function (context, updateModal, formatVideoToModal_callback, video) {  // 更新窗口打开前回调
                    // 如果openUpdateVideoModal传入的参数为video对象，直接使用
                    if (typeof video == "object" && video.video_id) {
                        if (login_handle.equalsLoginUser(video.user.uid)) {
                            context.loadAlbums(video.user.uid, function (data) {
                                formatVideoToModal_callback(video, data.albums);
                            });
                        } else {
                            formatVideoToModal_callback(video);
                        }
                        // 如果传入的参数为video_id，异步获取video对象
                    } else {
                        context.loadVideo(video, function (data) {
                            if (data.flag == 200) {
                                var video = data.video;
                                if (login_handle.equalsLoginUser(video.user.uid)) {
                                    context.loadAlbums(video.user.uid, function (data) {
                                        formatVideoToModal_callback(video, data.albums);
                                    });
                                } else {
                                    formatVideoToModal_callback(video);
                                }
                            }
                        });
                    }
                }
            },
            "hostUser": hostUser
        });

        // 绑定打开上传窗口
        $('#uploadVideo').click(function () {
            video_handle.openUploadVideoModal();
        });

        // 绑定插件中编辑按钮事件
        album_video_plugin.utils.bindEvent(album_video_plugin, album_video_plugin.config.event.actionForEditVideo, function (e, video) {
            this.utils.closeVideoPopup();
            video_handle.openUpdateVideoModal(video); // 打开视频更新窗口
        });

        if (params.info && !isNaN(params.info)) {
            video_handle.loadVideo({"video_id": parseInt(params.info)}, function (data) {
                if (data && data.flag == 200) {
                    video_handle.openUpdateVideoModal(data.video);
                }
                history.replaceState(
                    {"flag": "page"},
                    document.title,
                    document.location.pathname + document.location.search.replace(/&info=[\d]*/, "")
                );
            });
        }

    });
});