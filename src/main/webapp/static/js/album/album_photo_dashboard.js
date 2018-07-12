/**
 * Created by Jeffrey.Deng on 2018/3/29.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'blowup', 'common_utils', 'login_handle', 'period_cache', 'results_cache', 'album_photo_handle', 'album_photo_page_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, common_utils, login_handle, PeriodCache, ResultsCache, album_photo_handle, album_photo_page_handle);
    }
})(function ($, bootstrap, domReady, toastr, blowup, common_utils, login_handle, PeriodCache, ResultsCache, album_photo_handle, album_photo_page_handle) {

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

    /**
     * main
     */
    domReady(function () {

        // 提示吐司  設置
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "progressBar": true,
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

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : 40;
        var pageNum = params.page ? params.page : 1;
        var col = params.col;
        var checkPhotoId = params.check ? parseInt(params.check) : 0;
        var query_size = params.query_size ? parseInt(params.query_size) : 520;
        var query_start = params.query_start ? parseInt(params.query_start) : 0;

        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
        });

        var search_input_value = params.tags || params.name || params.description || "";
        var title_prefix = params.tags || params.name || params.description || "";
        if (search_input_value) {
            $('#header').find(".toolbar_search_input").val(search_input_value);
        }
        if (title_prefix && title_prefix == "_") {
            !params.description && !params.name && $("head").find("title").text("所有标签" + " | " + $("head").find("title").text());
        } else if (title_prefix) {
            $("head").find("title").text(title_prefix + " | " + $("head").find("title").text());
        }

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
            page_method_address: "dashboard",
            load_condition: params,
            query_size: query_size,
            query_start: query_start,
            zipPhoto_groupWithAlbum: false,
            callback: {
                "loadPhotos_callback": function (config, success) {
                    var object = $.extend(true, {}, config.load_condition);
                    delete object.method;
                    object.query_size = config.query_size;
                    object.query_start = config.query_start;
                    $.get("photo.do?method=photoListByAjax", object, function (data) {
                        if (data.flag == 200) {
                            var album = {};
                            album.photos = data.photos || [];
                            album.size = data.photos ? data.photos.length : 0;
                            album.show_col = 4;
                            data.album = album;
                            success(data);
                        } else {
                            toastr.error(data.info, "加载相册信息失败!");
                            console.warn("Error Code: " + data.flag);
                        }
                    });
                },
                "parsePhotosZipName": function (config) {
                    var zipName = "photos";
                    var photo = {};
                    photo.photo_id = config.load_condition.photo_id;
                    photo.name = config.load_condition.name;
                    photo.description = config.load_condition.description;
                    photo.tags = config.load_condition.tags;
                    if (photo.name && (photo.name == photo.description) && (photo.name == photo.tags)) {
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
                    return zipName;
                },
                "actionForEditPhoto": function (photo) {
                    $.magnificPopup.close();
                    album_photo_handle.openUpdatePhotoModal(photo);
                },
                "paginationClick_callback": function (paginationNode) {
                    var context = this;
                    var config = context.config;
                    if (!config.hasLoadAll && config.page_params.pageNum == config.page_params.pageCount) {
                        if (context.pointer.album.size == 520 && config.query_size == 520) {
                            toastr.success("点击加载更多照片", "", {
                                timeOut: 0, onclick: function () {
                                    config.query_size = 0;
                                    config.query_start = context.pointer.album.size;
                                    context.loadAlbumWithPhotos(config, function (data) {
                                        var photos = context.pointer.album.photos;
                                        photos.push.apply(photos, data.album.photos);
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
                "url": "photo.do?method=albumByAjax",
                "params": function (groupName, key) {
                    return {"id": key, "photos": false};
                },
                "parse": function (cacheCtx, groupName, key, old_object_value, data) {
                    if (data.flag == 200) {
                        return data.album;
                    } else {
                        return null;
                    }
                }
            }
        });
        // 缓存用户信息的ajax请求
        var user_base_info_cache = new ResultsCache(function (uid, handler) {
            $.get("user.do?method=profile", {"uid": uid}, function (user) {
                if (user) {
                    handler(user);
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
                    album_photo_page_handle.utils.updatePhotoInPage(photo);
                    if (photo.iscover == 1) {
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
                    secureAlbumInfoConn.get(photo.album_id, function (album) {
                        var album_url = "photo.do?method=album_detail&id=" + photo.album_id;
                        if (album) {
                            updateModal.find('span[name="album_id"]').text(album.name).parent().attr("href", album_url);
                        } else {
                            updateModal.find('span[name="album_id"]').text(photo.album_id).parent().attr("href", album_url);
                        }
                        user_base_info_cache.compute(photo.uid).then(function (user) {
                            var user_home_url = "user.do?method=home&uid=" + photo.uid;
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

        $('#uploadPhoto').click(function () {
            album_photo_handle.openUploadPhotoModal();
        });

        bindBlowup();
    });
});
