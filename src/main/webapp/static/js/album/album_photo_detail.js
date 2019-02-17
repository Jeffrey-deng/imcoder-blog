/**
 * 相册详情页
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'blowup', 'common_utils', 'login_handle', 'period_cache', 'album_photo_handle', 'album_photo_page_handle', 'album_video_plugin', 'album_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, common_utils, login_handle, PeriodCache, album_photo_handle, album_photo_page_handle, album_video_plugin, album_handle);
    }
})(function ($, bootstrap, domReady, toastr, blowup, common_utils, login_handle, PeriodCache, album_photo_handle, album_photo_page_handle, album_video_plugin, album_handle) {

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

    // function addFeaturedBtnBasedRemote(album_id) {
    //     var callback = function (album_id) {
    //         $("#main .album_options .options_right").prepend(
    //             '<a class="option_featured" itemtype="url" href="photo.do?method=dashboard&model=photo&album_id=' + album_id + '&tags=精选" target="_blank">精选</a>'
    //         );
    //     };
    //     var isLoadNew = true;
    //     var featured_info_cache = localStorage.getItem("featured_info_cache");
    //     if (featured_info_cache) {
    //         featured_info_cache = JSON.parse(featured_info_cache);
    //         var featured_info_album = featured_info_cache[album_id];
    //         if (featured_info_album) {
    //             var interval = new Date().getTime() - parseInt(featured_info_album.time);
    //             if (interval < 1800000) {
    //                 isLoadNew = false;
    //                 if (featured_info_album.featured == "true") {
    //                     callback(album_id);
    //                 }
    //             }
    //         }
    //     } else {
    //         localStorage.setItem("featured_info_cache", "{}");
    //         featured_info_cache = {};
    //     }
    //     if (isLoadNew) {
    //         $.get("photo.do?method=photoListByAjax", {"album_id": album_id, "tags": "精选"}, function (data) {
    //             if (data.flag == 200 && data.photos && data.photos.length > 0) {
    //                 featured_info_cache[album_id] = {
    //                     "album_id": album_id,
    //                     "featured": "true",
    //                     "time": new Date().getTime()
    //                 };
    //                 localStorage.setItem("featured_info_cache", JSON.stringify(featured_info_cache));
    //                 callback(album_id);
    //             } else {
    //                 featured_info_cache[album_id] = {
    //                     "album_id": album_id,
    //                     "featured": "false",
    //                     "time": new Date().getTime()
    //                 };
    //                 localStorage.setItem("featured_info_cache", JSON.stringify(featured_info_cache));
    //             }
    //         });
    //     }
    // }

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
            var hasVideo = false;
            $.each(photos, function (i, photo) {
                if (photo.tags && photo.tags.indexOf("精选") != -1) {
                    hasFeatured = true;
                }
                if (photo.image_type && photo.image_type.indexOf("video") != -1) {
                    hasVideo = true;
                }
                if (hasFeatured && hasVideo) {
                    return false;
                }
            });
            if (hasVideo && $("#main .album_options .options_right .option_video").length == 0) {
                $("#main .album_options .options_right").prepend(
                    '<a class="option_video" style="margin-left: 5px;" itemtype="url" href="photo.do?method=dashboard&model=photo&album_id=' + album_id + '&image_type=video&from=album_detail" target="_blank">视频</a>'
                );
            }
            if (hasFeatured) {
                $("#main .album_options .options_right").prepend(
                    '<a class="option_featured" style="margin-left: 5px;" itemtype="url" href="photo.do?method=dashboard&model=photo&album_id=' + album_id + '&tags=精选&from=album_detail" target="_blank">精选</a>'
                );
            }
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

        var album_id = $('#album_size').attr('album_id');

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.photo_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col && parseInt(params.col);
        var checkPhotoId = params.check ? parseInt(params.check) : 0;
        var cloud_photo_preview_args = "";
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        // 照片页面布局模块初始化
        album_photo_page_handle.utils.bindEvent(album_photo_page_handle.config.event.popupChanged, function (e, check) {
            var handle = this;
            if (check) {
                setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                    document.title = handle.pointer.album.name + "_" + check + " - " + handle.pointer.album.user.nickname + "的相册 | ImCoder's 博客";
                }, 50);
            }
        });
        album_photo_page_handle.utils.bindEvent(album_photo_page_handle.config.event.popupClosed, function (e, check) {
            var handle = this;
            setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                document.title = handle.pointer.album.name + " - " + handle.pointer.album.user.nickname + "的相册 | ImCoder's 博客";
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
                    $.get("photo.do?method=albumByAjax", {"id": object.album_id, "mount": true}, function (data) {
                        common_utils.removeNotify("notify_photos_loading");
                        if (data.flag == 200) {
                            cloud_photo_preview_args = data.cloud_photo_preview_args;
                            success(data);
                            // 添加精选按钮
                            addFeaturedBtnBasedLocal(data.album);
                        } else {
                            toastr.error(data.info, "加载相册信息失败!");
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
                    config.zipPhoto_sortByFact = confirm("点击是以当前显示结果排序，点击否按原文件名排序");
                    var zipName = "album_" + config.load_condition.album_id;
                    return zipName;
                },
                "beforeZipPhotos": function (options) {
                    options.callback.eachFileOnload_callback = function (blob, photo, location_info, options, zipFileLength, zip, main_folder, folder) {
                        var fileName = photo.path.substring(photo.path.lastIndexOf('/') + 1);
                        if (album_photo_page_handle.config.zipPhoto_sortByFact) {
                            fileName = photo.sort + "_" + fileName;
                        }
                        photo.fileName = fileName;
                        if (blob == null) {
                            toastr.error("照片" + photo.photo_id + "打包失败，已单独下载！", "", {"progressBar": false, timeOut: 0});
                            common_utils.downloadUrlFile(photo.url, fileName);
                        }
                        return true;
                    }
                },
                "actionForEditPhoto": function (photo) {
                    $.magnificPopup.close();
                    album_photo_handle.openUpdatePhotoModal(photo);
                },
                "makeupNode_callback": function (photo_node, photo) {
                    if (photo.tags.indexOf("mount@" + this.config.load_condition.album_id) != -1) {
                        photo_node.title = "Refer@" + photo.album_id + ": " + photo_node.title;
                    }
                    return;
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
                    var photo_source = album_photo_page_handle.utils.getPhotoByCache(photo.photo_id);
                    var isUpdateFile = photo_source.path != photo.path;
                    album_photo_page_handle.utils.updatePhotoInPage(photo);
                    var album_id = album_photo_page_handle.config.load_condition.album_id;
                    // 如果其他相册的图片取消挂载在本相册，重新构建布局
                    var umount = (photo_source.album_id != album_id && photo.tags.match(new RegExp("\\bmount@" + album_id + "\\b")) == null);
                    if (umount) {
                        album_photo_page_handle.utils.deletePhotoInPage(photo.photo_id);
                    } else if (photo_source.album_id != album_id) {
                        album_photo_page_handle.utils.getPhotoImageDom(photo.photo_id).attr("title", "Refer@" + photo_source.album_id + ": " + photo.name);
                    }
                    // 如果更新了图片文件，重新构建布局
                    if (!umount && isUpdateFile) {
                        album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                    }
                    if (photo.iscover == 1) {
                        album_photo_page_handle.pointer.album.cover = photo_source;
                        PeriodCache.utils.removeCache("user_albums_cache", login_handle.getCurrentUserId());
                        PeriodCache.utils.removeCache("user_albums_cache", "0_" + login_handle.getCurrentUserId());
                    }
                },
                "deleteCompleted": function (context, photo_id) {
                    album_photo_page_handle.utils.deletePhotoInPage(photo_id);
                },
                "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {
                    // 加载上传参数及配置，判断该用户是否允许上传
                    $.get("photo.do?method=getUploadConfigInfo", function (data) {
                        if (data && data.flag == 200) {
                            delete data.flag;
                            album_photo_handle.config.uploadConfigInfo = data;
                            album_photo_handle.config.maxUploadSize = data.uploadArgs.maxPhotoUploadSize;
                            if (!album_photo_handle.config.uploadConfigInfo || album_photo_handle.config.uploadConfigInfo.isAllowUpload) {
                                // 允许上传才打开上传按钮
                                album_photo_handle.pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr("disabled");
                                common_utils.removeNotify("notify-no-allow-upload");
                            } else {
                                var users = null;
                                var lowestLevel = album_photo_handle.config.uploadConfigInfo.allowUploadLowestLevel;
                                if (lowestLevel == 1) {
                                    users = "高级会员与管理员";
                                } else if (lowestLevel == -1) {
                                    users = "管理员";
                                }
                                common_utils.notify({timeOut: 0}).info("系统当前配置为只允许 <b>" + users + "</b> 上传照片", "您暂时不能上传", "notify-no-allow-upload");
                                // 禁用上传按钮
                                album_photo_handle.pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').attr("disabled", "disabled");
                            }
                        } else {
                            toastr.error("加载上传配置失败", "错误");
                        }
                    });
                    var album_id = context.config.albumId;
                    // 传入的参数可以修改上传的相册ID
                    openUploadModal_callback(album_id);
                },
                "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {
                    context.pointer.updateModal.find(".update-convert-photo-url").click();
                    album_photo_handle.pointer.updateModal.find('input[name="photo_sort"]').val(photo.sort / 1000).attr("data-val-sort", photo.sort);
                    // 如果图片为视频的封面，则添加视频链接
                    var video_id = album_photo_page_handle.utils.getPhotoImageDom(photo.photo_id).children(0).attr("video_id");
                    if (video_id) {
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
                        video_href_span.text(video_id).parent().attr("href", "video.do?method=user_videos&uid=" + photo.uid + "&check=" + photo.photo_id);
                    } else {
                        updateModal.find('span[name="video_id"]').parent().parent().hide(0);
                    }
                    //如果是引用别的相册的照片
                    if (album_photo_page_handle.config.load_condition.album_id != photo.album_id) {
                        // 引用的照片 添加照片所属相册链接
                        var album_href_span = updateModal.find('span[name="album_id"]');
                        if (album_href_span.length == 0) {
                            updateModal.find('span[name="photo_id"]').parent().parent().after(
                                '<div class="form-group"><label class="control-label">所属簿：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看该相簿" >' +
                                '<span name="album_id" class="control-label"></span></a></div>'
                            );
                            album_href_span = updateModal.find('span[name="album_id"]');
                        } else {
                            album_href_span.parent().parent().show(0);
                        }
                        secureAlbumInfoConn.get(photo.album_id, function (album) {
                            var album_url = "photo.do?method=album_detail&id=" + photo.album_id;
                            if (album) {
                                album_href_span.text(album.name).parent().attr("href", album_url);
                            } else {
                                album_href_span.text(photo.album_id).parent().attr("href", album_url);
                            }
                            formatPhotoToModal_callback(photo);
                        });
                    } else {
                        updateModal.find('span[name="album_id"]').parent().parent().hide(0); // 本相册照片隐藏链接
                        formatPhotoToModal_callback(photo);
                    }
                }
            },
            "albumId": album_id,
            "downloadType": (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? "url" : "ajax")
        });

        // 增加保存照片在相册内排序权重按钮
        album_photo_handle.pointer.updateModal.find(".update-photo-refer").after('<div class="update-photo-sort" style="display: none">' +
            '<div class="input-group"><input title="默认值为照片id大小，最多支持三位小数" class="form-control" type="text" name="photo_sort">' +
            '<span class="input-group-addon btn btn-sm save-update-photo-sort">保存</span></div></div>');
        album_photo_handle.pointer.updateModal.find(".update-convert-photo-refer")
            .after(' / <div class="update-convert-photo-sort" style="font-weight: normal;display: inline;">图片排序</div>');
        // 切换按钮
        album_photo_handle.pointer.updateModal.find(".update-convert-photo-url").off("click").click(function (e) {
            var _self = $(this);
            _self.css("font-weight", "bold")
                .parent().find(".update-convert-photo-refer").css("font-weight", "normal")
                .parent().find(".update-convert-photo-sort").css("font-weight", "normal");
            _self.parent().parent()
                .find('.update-photo-url').css("display", "block")
                .parent().find('.update-photo-refer').css("display", "none")
                .parent().find('.update-photo-sort').css("display", "none");
        });
        album_photo_handle.pointer.updateModal.find(".update-convert-photo-refer").off("click").click(function (e) {
            var _self = $(this);
            _self.css("font-weight", "bold")
                .parent().find(".update-convert-photo-url").css("font-weight", "normal")
                .parent().find(".update-convert-photo-sort").css("font-weight", "normal");
            _self.parent().parent()
                .find('.update-photo-refer').css("display", "block")
                .parent().find('.update-photo-sort').css("display", "none")
                .parent().find('.update-photo-url').css("display", "none");
        });
        album_photo_handle.pointer.updateModal.find(".update-convert-photo-sort").click(function (e) {
            var _self = $(this);
            _self.css("font-weight", "bold")
                .parent().find(".update-convert-photo-url").css("font-weight", "normal")
                .parent().find(".update-convert-photo-refer").css("font-weight", "normal");
            _self.parent().parent()
                .find('.update-photo-sort').css("display", "block")
                .parent().find('.update-photo-url').css("display", "none")
                .parent().find('.update-photo-refer').css("display", "none");
        });
        // 保存照片在相册内的排序
        album_photo_handle.pointer.updateModal.find(".save-update-photo-sort").click(function (e) {
            var apr = {
                "album_id": album_photo_handle.config.albumId,
                "photo_id": album_photo_handle.pointer.updateModal.find('span[name="photo_id"]').text(),
                "sort": album_photo_handle.pointer.updateModal.find('input[name="photo_sort"]').val() || 0,
                "before_sort": album_photo_handle.pointer.updateModal.find('input[name="photo_sort"]').attr("data-val-sort") || 0
            };
            if (!(apr.album_id > 0 && apr.photo_id > 0)) {
                toastr.error("相册id或照片id参数错误~");
                return;
            } else {
                apr.album_id = parseInt(apr.album_id);
                apr.photo_id = parseInt(apr.photo_id);
                apr.before_sort = parseInt(apr.before_sort) || apr.photo_id * 1000;
            }
            if (isNaN(apr.sort)) {
                toastr.error("请输入数字，最多支持小数点后三位~");
                return;
            } else {
                apr.sort = parseInt(parseFloat(apr.sort) * 1000);
            }
            if (apr.before_sort == apr.sort) {
                toastr.info("已是默认值，无需更新~");
                return;
            } else if (apr.sort == apr.photo_id) {
                apr.sort = 0;
            }
            $.post("photo.do?method=saveAlbumPhotoRelation", apr, function (data) {
                if (data && data.flag == 200) {
                    toastr.success("更新成功~");
                    album_photo_page_handle.utils.getPhotoByCache(apr.photo_id).sort = (apr.sort || apr.photo_id * 1000);
                    album_photo_page_handle.pointer.album.photos.sort(function (a, b) {
                        return (a.sort || a.photo_id * 1000) - (b.sort || b.photo_id * 1000);
                    });
                    album_photo_page_handle.jumpPage(album_photo_page_handle.utils.getPhotoPageNum(apr.photo_id));
                    album_photo_handle.pointer.updateModal.modal('hide');
                } else {
                    toastr.error(data.info, "保存失败");
                }
            });
        });

        // 绑定事件打开上传窗口
        $('#uploadPhoto').click(function () {
            album_photo_handle.openUploadPhotoModal();
        });

        // dragenter .album_options
        $(document.body).on("dragenter", function (e) {
            var types = e.originalEvent.dataTransfer.types;
            if (types && types.length > 0 && types[0] == "Files") {
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
                    var cacheAlbum = album_photo_page_handle.pointer.album;
                    $.extend(cacheAlbum, album);
                    $("#first .album_name").text(cacheAlbum.name);
                    $("#first .album_description").text(cacheAlbum.description);
                    PeriodCache.utils.removeCache("user_albums_cache", cacheAlbum.user.uid);
                    PeriodCache.utils.removeCache("user_albums_cache", "0_" + cacheAlbum.user.uid);
                },
                "deleteCompleted": function (album_id) {  // 在相册删除完成后回调
                    toastr.success("此页面刷新后将不可用~", "", {"timeOut": 0});
                },
                "beforeCreateModalOpen": function (createModal, openCreateModal_callback) {  // 创建窗口打开前回调
                    openCreateModal_callback();
                },
                "beforeUpdateModalOpen": function (updateModal, formatAlbumToModal_callback, album) {  // 更新窗口打开前回调
                    formatAlbumToModal_callback(album);
                }
            }
        });
        // 要删除的相册中包含视频时提示用户
        album_handle.utils.bindEvent(album_handle.config.event.beforeDelete, function (e, album_id, album_name) {
            var photos = album_photo_page_handle.pointer.album.photos;
            var videoCount = 0;
            for (var i in photos) {
                if (photos[i].image_type.indexOf("video") != -1) {
                    videoCount++;
                }
            }
            if (videoCount > 0) {
                if (!window.confirm("你删除的相册包含" + videoCount + "个视频，确定要继续吗？（建议先删除视频）")) {
                    return false;
                }
            }
            return true;
        });

        $('#album_create_time').click(function () {
            album_handle.openUpdateAlbumModal(album_photo_page_handle.pointer.album);
        });

        $("#first .album_name").dblclick(function () {
            album_photo_page_handle.loadAlbumWithPhotos(album_photo_page_handle.config, function (data) {
                if (data.flag == 200) {
                    album_photo_page_handle.pointer.album = data.album;
                    toastr.success("数据刷新成功");
                    album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                    album_photo_page_handle.utils.updateAlbumSizeInPage();
                }
            });
        });

        // 添加精选按钮   replaceWith addFeaturedBtnBasedLocal(album)
        //addFeaturedBtnBasedRemote(album_id);

        bindBlowup(albumConfig.photo_page.blow_up);
    });
});