/**
 * 相册详情页
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'blowup', 'common_utils', 'login_handle', 'period_cache', 'album_photo_handle', 'album_photo_page_handle', 'album_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, common_utils, login_handle, PeriodCache, album_photo_handle, album_photo_page_handle, album_handle);
    }
})(function ($, bootstrap, domReady, toastr, blowup, common_utils, login_handle, PeriodCache, album_photo_handle, album_photo_page_handle, album_handle) {

    /**
     * 放大镜
     */
    function bindBlowup() {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            $("#blowup_trigger").hide();
        } else {
            var blowup = null;
            $("#blowup_trigger").click(function () {
                var _this = $(this);
                var isBlowup = _this.attr("isBlowup");
                isBlowup = isBlowup || "false";
                if (isBlowup == "false") {
                    blowup = $.blowup({
                        selector: "#masonryContainer img",
                        width: 500,
                        height: 500,
                        scale: 1.6
                    });
                    _this.attr("isBlowup", "true");
                    toastr.success("已开启放大镜", "", {"progressBar": false});
                    _this.text("关闭放大镜");
                } else {
                    blowup.destroy();
                    _this.attr("isBlowup", "false");
                    toastr.success("已关闭放大镜", "", {"progressBar": false});
                    _this.text("放大镜");
                }
            });
        }
    }

    function addFeaturedBtnBasedRemote(album_id) {
        var callback = function (album_id) {
            $("#main .album_options .options_right").prepend(
                '<a class="option_featured" itemtype="url" href="photo.do?method=dashboard&mode=photo&album_id=' + album_id + '&tags=精选" target="_blank">精选</a>'
            );
        };
        var isLoadNew = true;
        var featured_info_cache = localStorage.getItem("featured_info_cache");
        if (featured_info_cache) {
            featured_info_cache = JSON.parse(featured_info_cache);
            var featured_info_album = featured_info_cache[album_id];
            if (featured_info_album) {
                var interval = new Date().getTime() - parseInt(featured_info_album.time);
                if (interval < 1800000) {
                    isLoadNew = false;
                    if (featured_info_album.featured == "true") {
                        callback(album_id);
                    }
                }
            }
        } else {
            localStorage.setItem("featured_info_cache", "{}");
            featured_info_cache = {};
        }
        if (isLoadNew) {
            $.get("photo.do?method=photoListByAjax", {"album_id": album_id, "tags": "精选"}, function (data) {
                if (data.flag == 200 && data.photos && data.photos.length > 0) {
                    featured_info_cache[album_id] = {
                        "album_id": album_id,
                        "featured": "true",
                        "time": new Date().getTime()
                    };
                    localStorage.setItem("featured_info_cache", JSON.stringify(featured_info_cache));
                    callback(album_id);
                } else {
                    featured_info_cache[album_id] = {
                        "album_id": album_id,
                        "featured": "false",
                        "time": new Date().getTime()
                    };
                    localStorage.setItem("featured_info_cache", JSON.stringify(featured_info_cache));
                }
            });
        }
    }

    function addFeaturedBtnBasedLocal(album) {
        if ($("#main .album_options .options_right .option_featured").length > 0) {
            return;
        }
        if (!album) {
            return;
        }
        var album_id = album.album_id;
        var photos = album.photos;
        if (photos && photos.length > 0) {
            var hasFeatured = false;
            $.each(photos, function (i, photo) {
                if (photo.tags && photo.tags.indexOf("精选") != -1) {
                    hasFeatured = true;
                    return false;
                }
            });
            if (hasFeatured) {
                $("#main .album_options .options_right").prepend(
                    '<a class="option_featured" itemtype="url" href="photo.do?method=dashboard&mode=photo&album_id=' + album_id + '&tags=精选" target="_blank">精选</a>'
                );
            }
        }
    }

    /**
     * main
     */
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

        var album_id = $('#album_size').attr('album_id');

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : 40;
        var pageNum = params.page ? params.page : 1;
        var col = params.col;
        var checkPhotoId = params.check ? parseInt(params.check) : 0;

        // 照片页面布局模块初始化
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
                "col": col
            },
            checkPhotoId: checkPhotoId,
            page_method_address: "album_detail",
            load_condition: {
                "album_id": album_id
            },
            callback: {
                "loadPhotos_callback": function (config, success) {
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载数据", "", "notify_photos_loading");
                    var object = $.extend(true, {}, config.load_condition);
                    // Object.keys(object).length
                    $.get("photo.do?method=albumByAjax", {"id": object.album_id}, function (data) {
                        common_utils.removeNotify("notify_photos_loading");
                        if (data.flag == 200) {
                            success(data);
                            // 添加精选按钮
                            addFeaturedBtnBasedLocal(data.album);
                        } else {
                            toastr.error(data.info, "加载相册信息失败!");
                            console.warn("Error Code: " + data.flag);
                        }
                    });
                },
                "parsePhotosZipName": function (config) {
                    var zipName = "album_" + config.load_condition.album_id;
                    return zipName;
                },
                "actionForEditPhoto": function (photo) {
                    $.magnificPopup.close();
                    album_photo_handle.openUpdatePhotoModal(photo);
                }
            }
        });

        // 相册照片处理模块初始化
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
                    album_photo_page_handle.utils.updatePhotoInPage(photo);
                    if (photo.path) { // 如果更新了图片文件
                        album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                    }
                    if (photo.iscover == 1) {
                        var photo_source = album_photo_page_handle.utils.getPhotoByCache(photo.photo_id);
                        album_photo_page_handle.pointer.album.cover = JSON.stringify({
                            "photo_id": photo_source.photo_id,
                            "path": photo_source.path,
                            "width": photo_source.width,
                            "height": photo_source.height
                        });
                        PeriodCache.utils.removeCache("user_albums_cache", login_handle.getCurrentUserId());
                        PeriodCache.utils.removeCache("user_albums_cache", "0_" + login_handle.getCurrentUserId());
                    }
                },
                "deleteCompleted": function (context, photo_id) {
                    album_photo_page_handle.utils.deletePhotoInPage(photo_id);
                },
                "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {
                    var album_id = context.config.albumId;
                    // 传入的参数可以修改上传的相册ID
                    openUploadModal_callback(album_id);
                },
                "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {
                    formatPhotoToModal_callback(photo);
                }
            },
            "albumId": album_id,
            "downloadType": (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? "url" : "ajax")
        });

        $('#uploadPhoto').click(function () {
            album_photo_handle.openUploadPhotoModal();
        });

        // dragenter .album_options
        $(document.body).on("dragenter", function (e) {
            var types = e.originalEvent.dataTransfer.types;
            if (types && types.indexOf("Files") != -1) {
                e.stopPropagation();
                e.preventDefault();
                if (!common_utils.getNotify("dragUpload_notify")) {
                    common_utils.notify({
                        "timeOut": 0,
                        "progressBar": false
                    }).success("松开鼠标上传", "", "dragUpload_notify");
                }
            }
        });
        // dragover
        $(document.body).on("dragover", function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
        // drop
        $(document.body).on("drop", function (e) {
            e.preventDefault();
            e.stopPropagation();
            var files = e.originalEvent.dataTransfer.files;
            if (files && files.length > 0) {
                common_utils.removeNotify("dragUpload_notify");
                album_photo_handle.openUploadPhotoModal(files);
            }
        });

        // 相册处理模块初始化
        album_handle.init({
            path_params: {
                "basePath": $("#basePath").attr("href"),
                "cloudPath": $("#cloudPath").attr("href"),
                "staticPath": $("#staticPath").attr("href")
            },
            selector: {
                "createAlbumModal": "#createAlbumModal",
                "updateAlbumModal": "#updateAlbumModal"
            },
            callback: {
                "createCompleted": function (album) {  // 在相册创建完成后回调

                },
                "updateCompleted": function (album) {  // 在相册更新完成后回调
                    album.cover = ((typeof album.cover == "object") ? JSON.stringify(album.cover) : album.cover);
                    var cacheAlbum = album_photo_page_handle.pointer.album;
                    $.extend(cacheAlbum, album);
                    $("#first .album_name").text(cacheAlbum.name);
                    $("#first .album_description").text(cacheAlbum.description);
                    PeriodCache.utils.removeCache("user_albums_cache", cacheAlbum.user.uid);
                    PeriodCache.utils.removeCache("user_albums_cache", "0_" + cacheAlbum.user.uid);
                },
                "deleteCompleted": function (album_id) {  // 在相册删除完成后回调

                },
                "beforeCreateModalOpen": function (createModal, openCreateModal_callback) {  // 创建窗口打开前回调
                    openCreateModal_callback();
                },
                "beforeUpdateModalOpen": function (updateModal, formatAlbumToModal_callback, album) {  // 更新窗口打开前回调
                    formatAlbumToModal_callback(album);
                }
            }
        });

        $('#album_create_time').click(function () {
            album_handle.openUpdateAlbumModal(album_photo_page_handle.pointer.album);
        });

        // 添加精选按钮   replaceWith addFeaturedBtnBasedLocal(album)
        //addFeaturedBtnBasedRemote(album_id);

        bindBlowup();
    });
});