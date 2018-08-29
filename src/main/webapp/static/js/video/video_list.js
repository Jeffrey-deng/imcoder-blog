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
        // 提示吐司  設置
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "progressBar": false,
            "positionClass": "toast-bottom-left",
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "3500",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        //var album_id = $('#album_size').attr('album_id');
        var hostUser = parseInt($('#first h1').attr('hostUser'));

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : 40;
        var pageNum = params.page ? params.page : 1;
        var col = params.col;
        var checkVideoId = params.check ? parseInt(params.check) : 0;


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
                "col": col
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
                "parsePhotosZipName": function (config) {
                    return false;
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
                }
            },
            "hostUser": hostUser
        });

        $('#uploadVideo').click(function () {
            video_handle.openUploadVideoModal();
        });
    });
});