/**
 * Created by Jeffrey.Deng on 2018/3/29.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'blowup', 'common_utils', 'login_handle', 'toolbar', 'period_cache', 'results_cache', 'album_photo_handle', 'album_photo_page_handle', 'album_video_plugin'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, common_utils, login_handle, toolbar, PeriodCache, ResultsCache, album_photo_handle, album_photo_page_handle, album_video_plugin);
    }
})(function ($, bootstrap, domReady, toastr, blowup, common_utils, login_handle, toolbar, PeriodCache, ResultsCache, album_photo_handle, album_photo_page_handle, album_video_plugin) {

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

    /**
     * main
     */
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
        var checkPhotoId = params.check ? parseInt(params.check) : 0;
        var query_size = params.query_size ? parseInt(params.query_size) : albumConfig.photo_page.default_query_size;
        var query_start = params.query_start ? parseInt(params.query_start) : 0;
        var cloud_photo_preview_args = "";
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != "method" && key != "size" && key != "col" && key != "page" && key != "check" && key != "model") {
                load_condition[key] = params[key]
            }
        });

        var title_prefix = params.tags || params.name || params.description || "";
        if (Object.keys(load_condition).length == 2 && load_condition.album_id && load_condition.image_type == "video") {
            title_prefix = "相册" + load_condition.album_id + "_" + "视频";
        }
        if (title_prefix) {
            if (title_prefix == "_" && !params.description && !params.name) {
                title_prefix = "所有标签";
            }
            $("head").find("title").text(title_prefix + " - " + $("head").find("title").text());
        }

        album_photo_page_handle.utils.bindEvent(album_photo_page_handle.config.event.popupChanged, function (e, check) {
            check && setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                if (title_prefix) {
                    document.title = title_prefix + "_" + check + " - dashboard | ImCODER博客's 相册";
                } else {
                    document.title = "照片_" + check + " - dashboard | ImCODER博客's 相册";
                }
            }, 50);
        });
        album_photo_page_handle.utils.bindEvent(album_photo_page_handle.config.event.popupClosed, function (e, check) {
            setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                if (title_prefix) {
                    document.title = title_prefix + " - dashboard | ImCODER博客's 相册";
                } else {
                    document.title = "dashboard | ImCODER博客's 相册";
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
                    if (object.from && object.album_id && object.from.indexOf("album_detail") != -1) {
                        object.base = object.from;
                    } else {
                        object.query_size = config.query_size;
                        object.query_start = config.query_start;
                    }
                    object.from = "album_photo_dashboard";
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
                            toastr.error(data.info, "加载照片列表失败!");
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
                    if (!config.hasLoadAll && config.page_params.pageNum == config.page_params.pageCount) { // 点击加载全部图片
                        var default_query_size = albumConfig.photo_page.default_query_size;
                        if (context.pointer.album.size == default_query_size && config.query_size == default_query_size) {
                            toastr.success("点击加载更多照片", "", {
                                timeOut: 0, iconClass: "toast-success-no-icon", onclick: function () {
                                    config.query_size = 0;
                                    config.query_start = context.pointer.album.size;
                                    var params = common_utils.parseURL(document.location.href).params;
                                    var search = "?method=" + config.page_method_address;
                                    $.each(params, function (key, value) {
                                        if (key != "method" && key != "page" && key != "query_start" && key != "query_size") {
                                            search += "&" + key + "=" + value;
                                        }
                                    });
                                    search += "&query_start=0&query_size=0&page=" + config.page_params.pageNum;
                                    history.replaceState( // url上加上查询大小
                                        {"flag": "page"},
                                        document.title,
                                        location.pathname + search
                                    );
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
                    if (photo.path) { // 如果更新了图片文件
                        album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                    }
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
                    document.title = value + " - dashboard | ImCODER博客's 相册";
                    title_prefix = value;
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

        if (load_condition.tags) {
            var href = "redirect.do?model=photo_tag";
            $.each(load_condition, function (key, value) {
                href += "&" + key + "=" + value
            });
            if (load_condition.extend == "true") {
                href += "&casting=down";    // 查看子标签
                $(".album_options .option_tags_subtag").attr("href", href).show();
            } else {
                href += "&casting=up";  // 查看相似标签
                $(".album_options .option_tags_upcasting").attr("href", href).show();
            }
        }
    });
});
