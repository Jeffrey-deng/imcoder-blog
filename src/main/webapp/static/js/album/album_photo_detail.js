/**
 * 相册详情页
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'blowup', 'common_utils', 'login_handle', 'toolbar', 'period_cache', 'album_photo_handle', 'album_photo_page_handle', 'album_video_plugin', 'album_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, common_utils, login_handle, toolbar, PeriodCache, album_photo_handle, album_photo_page_handle, album_video_plugin, album_handle);
    }
})(function ($, bootstrap, domReady, toastr, blowup, common_utils, login_handle, toolbar, PeriodCache, album_photo_handle, album_photo_page_handle, album_video_plugin, album_handle) {

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
    //             '<a class="option_featured" itemtype="url" href="p/dashboard?model=photo&album_id=' + album_id + '&tags=精选" target="_blank">精选</a>'
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
    //         $.get("photo.api?method=getPhotoList", {"album_id": album_id, "tags": "精选"}, function (response) {
    //             if (response.status == 200 && response.data.photos && response.data.photos.length > 0) {
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
                    '<a class="option_videos" style="margin-left: 5px;" itemtype="url" href="u/' + album.user.uid + '/videos?cover.album_id=' +
                    album_id + '&from=album_detail" target="_blank" title="查看本相册中的视频">相册视频</a>'
                );
            }
            if (hasFeatured) {
                $("#main .album_options .options_right").prepend(
                    '<a class="option_featured" style="margin-left: 5px;" itemtype="url" href="p/tag/精选?album_id=' + album_id +
                    '&from=album_detail" target="_blank" title="查看本相册中的精选">相册精选</a>'
                );
            }
        }
    }

    var updateAlbumCover = function (album, cover_id, call) {
        var params = {
            "album_id": album.album_id,
            "name": album.name,
            "description": album.description,
            "user.uid": album.user.uid,
            "cover.photo_id": cover_id,
            "permission": album.permission,
            "mount": album.mount,
            "show_col": album.show_col
        };
        $.post("photo.api?method=updateAlbum", params, function (response) {
            if (response.status == 200) {
                album.cover = response.data.album.cover;
                call(true);
            } else {
                call(false);
                toastr.error(response.message, "相册封面更新失败");
                console.warn("Error Code: " + response.status);
            }
        }).fail(function () {
            call(false);
        });
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
        var loadMount = params.mount == "false" ? false : true;
        var col = params.col && parseInt(params.col);
        var checkPhotoId = params.check ? params.check : 0;
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
                "album_id": album_id,
                "mount": loadMount
            },
            allowZipPhotos: true,
            allowZipPhotosMaxLength: 30,
            callback: {
                "loadPhotos_callback": function (config, success) {
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "showDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载数据", "", "notify_photos_loading");
                    var object = $.extend(true, {}, config.load_condition);
                    // Object.keys(object).length
                    $.get("photo.api?method=getAlbum", {
                        "id": object.album_id,
                        "mount": object.mount
                    }, function (response) {
                        common_utils.removeNotify("notify_photos_loading");
                        if (response.status == 200) {
                            var data = response.data;
                            cloud_photo_preview_args = data.cloud_photo_preview_args;
                            success(data);
                            // 添加精选按钮
                            addFeaturedBtnBasedLocal(data.album);
                        } else {
                            toastr.error(response.message, "加载相册信息失败!");
                            console.warn("Error Code: " + response.status);
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
                    config.zipPhoto_sortByFact = confirm("点击是以当前显示结果排序，点击否按原文件名排序");
                    config.zipPhoto_groupWithMirrorPath = confirm("是否需要以路径镜像划分文件夹？");
                    var zipName = "album_" + config.load_condition.album_id + "_" + common_utils.formatDate(new Date(), "yyMMddhhmmss");
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
                    var superEachFileOnloadCall = options.callback.eachFileOnload_callback;
                    options.callback.eachFileOnload_callback = function (blob, photo, location_info, options, zipFileLength, zip, main_folder, folder) {
                        var returnValue = superEachFileOnloadCall(blob, photo, location_info, options, zipFileLength, zip, main_folder, folder);
                        var fileName = photo.path.substring(photo.path.lastIndexOf('/') + 1);
                        if (album_photo_page_handle.config.zipPhoto_sortByFact) {
                            fileName = photo.sort + "_" + fileName;
                        }
                        photo.fileName = fileName;
                        return returnValue;
                    }
                },
                "actionForEditPhoto": function (photo) {
                    $.magnificPopup.close();
                    album_photo_handle.openUpdatePhotoModal(photo);
                },
                "makeupNode_callback": function (photo_node, photo) {
                    if (photo.tags && photo.tags.match(new RegExp("\\bmount@" + this.config.load_condition.album_id + "\\b"))) {
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
                    photo.sort = common_utils.convertRadix62to10(photo.photo_id);
                    album_photo_page_handle.utils.appendPhotoToPage(photo);
                },
                "allUploadCompleted": function (context, photos) {
                    var dfd = $.Deferred();
                    if (photos && photos.length == 1) {
                        var album = album_photo_page_handle.pointer.album;
                        var isCover = album_photo_handle.pointer.uploadModal.find('input[name="photo_cover"]:checked').val() == "1";
                        if (isCover) {
                            var cover = photos[0];
                            updateAlbumCover(album, cover.photo_id, function (success) {
                                if (success) {
                                    PeriodCache.utils.removeCache("user_albums_cache", album.user.uid);
                                    PeriodCache.utils.removeCache("user_albums_cache", "0_" + album.user.uid);
                                }
                                dfd.resolve();
                            });
                        } else {
                            dfd.resolve();
                        }
                    } else {
                        dfd.resolve();
                    }
                    dfd.done(function () {
                        album_photo_page_handle.jumpPage(album_photo_page_handle.utils.calcPageCount());
                        photos = null;
                    });
                },
                "beforeUpdate": function (context, photo) {  // 更新之前回调，返回一个Deferred对象可以异步执行
                    var dfd = $.Deferred();
                    var album = album_photo_page_handle.pointer.album;
                    var before_cover_id = album.cover.photo_id;
                    var new_cover_id = album_photo_handle.pointer.updateModal.find('input[name="photo_cover"]:checked').val() == "0" ? 0 : photo.photo_id;
                    // (new_cover_id == 0 && before_cover_id == photo.photo_id) || (new_cover_id && new_cover_id != "0" && before_cover_id != new_cover_id)
                    if (!(before_cover_id && before_cover_id != "0" && before_cover_id != photo.photo_id && new_cover_id == 0) && before_cover_id != new_cover_id) {
                        updateAlbumCover(album, new_cover_id, function (success) {
                            if (success) {
                                PeriodCache.utils.removeCache("user_albums_cache", album.user.uid);
                                PeriodCache.utils.removeCache("user_albums_cache", "0_" + album.user.uid);
                            }
                            dfd.resolve();
                        });
                    } else {
                        dfd.resolve();
                    }
                    return dfd;
                },
                "updateCompleted": function (context, photo) {
                    var photo_source = album_photo_page_handle.utils.getPhotoByCache(photo.photo_id);
                    var isUpdateFile = photo_source.path != photo.path;
                    album_photo_page_handle.utils.updatePhotoInPage(photo);
                    var album_id = album_photo_page_handle.config.load_condition.album_id;
                    // 如果其他相册的图片取消挂载在本相册，重新构建布局
                    var umount = false;
                    if (photo_source.album_id != album_id) {
                        if (album_photo_page_handle.pointer.album.mount) {
                            umount = photo.tags.match(new RegExp("\\bnot-mount@" + album_id + "\\b")) != null;
                        } else {
                            umount = photo.tags.match(new RegExp("\\bmount@" + album_id + "\\b")) == null;
                        }
                    }
                    if (umount) {
                        album_photo_page_handle.utils.deletePhotoInPage(photo.photo_id);
                    } else if (photo_source.album_id != album_id) {
                        album_photo_page_handle.utils.getPhotoImageDom(photo.photo_id).attr("title", "Refer@" + photo_source.album_id + ": " + photo.name);
                    }
                    // 如果更新了图片文件，重新构建布局
                    if (!umount && isUpdateFile) {
                        album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                    }
                },
                "deleteCompleted": function (context, params) {
                    album_photo_page_handle.utils.deletePhotoInPage(params.photo_id);
                },
                "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {
                    var album_id = context.config.albumId;
                    // 添加设置当前照片为当前相册按钮
                    if (uploadModal.find('input[name="photo_cover"]').length == 0) {
                        uploadModal.find('input[name="photo_refer"]').closest(".form-group").after(
                            '<div class="form-group" style="padding-top: 7px;">' +
                            '<label class="control-label">是否作为封面</label>' +
                            '<label class="radio-inline" style="margin-left:10px;"> <input type="radio" name="photo_cover" value="1"> 是 </label>' +
                            '<label class="radio-inline"> <input type="radio" name="photo_cover" value="0"> 否 </label>' +
                            '</div>'
                        );
                    }
                    uploadModal.find('input[name="photo_cover"][value="0"]').prop("checked", true);
                    // 传入的参数可以修改上传的相册ID
                    openUploadModal_callback(album_id);
                    // 加载上传参数及配置，判断该用户是否允许上传
                    $.get("photo.api?method=getUploadConfigInfo", function (response) {
                        if (response && response.status == 200) {
                            var uploadConfigInfo = response.data;
                            album_photo_handle.config.uploadConfigInfo = uploadConfigInfo;
                            album_photo_handle.config.maxUploadSize = uploadConfigInfo.uploadArgs.maxPhotoUploadSize;
                            if (!uploadConfigInfo || uploadConfigInfo.isAllowUpload) {
                                // 允许上传才打开上传按钮
                                uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr("disabled");
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
                                common_utils.notify({timeOut: 0}).info("系统当前配置为只允许<br>【<b>" + users + "</b>】上传照片", "您暂时不能上传", "notify-no-allow-upload");
                                // 禁用上传按钮
                                uploadModal.find('button[name="uploadPhoto_trigger"]').attr("disabled", "disabled");
                            }
                        } else {
                            toastr.error("加载上传配置失败", "错误");
                        }
                    });
                },
                "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {
                    context.pointer.updateModal.find(".update-convert-photo-url").click();
                    album_photo_handle.pointer.updateModal.find('input[name="photo_sort"]').val(photo.sort).attr("data-val-sort", photo.sort);
                    // 添加设置当前照片为当前相册按钮
                    if (updateModal.find('input[name="photo_cover"]').length == 0) {
                        updateModal.find('.tags-modify').closest(".form-group").after(
                            '<div class="form-group" style="padding-top: 7px;">' +
                            '<label class="control-label">是否作为封面</label>' +
                            '<label class="radio-inline" style="margin-left:10px;"> <input type="radio" name="photo_cover" value="1"> 是 </label>' +
                            '<label class="radio-inline"> <input type="radio" name="photo_cover" value="0"> 否 </label>' +
                            '</div>'
                        );
                    }
                    var isCover = (album_photo_page_handle.pointer.album.cover.photo_id == photo.photo_id ? "1" : "0");
                    updateModal.find('input[name="photo_cover"]').each(function () {
                        if ($(this).val() == isCover) {
                            $(this).prop("checked", true);
                        }
                    });
                    // 如果图片为视频的封面，则添加视频链接
                    var video_id = album_photo_page_handle.utils.getPhotoImageDom(photo.photo_id).children(0).attr("data-video-id");
                    if (video_id && video_id != "0") {
                        var video_href_span = updateModal.find('span[name="video_id"]');
                        if (video_href_span.length == 0) {
                            updateModal.find('span[name="photo_id"]').closest(".form-group").after(
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
                    //如果是引用别的相册的照片
                    if (album_photo_page_handle.config.load_condition.album_id != photo.album_id) {
                        // 引用的照片 添加照片所属相册链接
                        var album_href_span = updateModal.find('span[name="album_id"]');
                        if (album_href_span.length == 0) {
                            updateModal.find('span[name="photo_id"]').closest(".form-group").after(
                                '<div class="form-group"><label class="control-label">所属簿：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                '<a target="_blank" style="color: #666; cursor: pointer" title="在相簿中查看" >' +
                                '<span name="album_id" class="control-label"></span></a></div>'
                            );
                            album_href_span = updateModal.find('span[name="album_id"]');
                        } else {
                            album_href_span.parent().parent().show(0);
                        }
                        secureAlbumInfoConn.get(photo.album_id, function (album) {
                            var album_url = "p/album/" + photo.album_id + "?check=" + photo.photo_id;
                            if (album) {
                                album_href_span.text(album.name).parent().attr("href", album_url);
                            } else {
                                album_href_span.text(photo.album_id).parent().attr("href", album_url);
                            }
                            formatPhotoToModal_callback(photo);
                        });
                    } else {
                        updateModal.find('span[name="album_id"]').closest(".form-group").hide(0); // 本相册照片隐藏链接
                        formatPhotoToModal_callback(photo);
                    }
                }
            },
            "albumId": album_id,
            "downloadType": (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? "url" : "ajax")
        });

        album_photo_handle.utils.bindEvent(album_photo_handle.config.event.tagClick, function (_e, tag, photo_id, clickEvt) {
            clickEvt.preventDefault();
            window.open("p/tag/" + encodeURIComponent(tag) + "?uid=" + album_photo_page_handle.pointer.album.user.uid);
        });

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
                default: // 默认打开当前相册的该标签
                    var album_id = album_photo_page_handle.config.load_condition.album_id;
                    window.open("p/tag/" + tag + "?album_id=" + album_id + "&from=album_detail");
            }
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
            _self.closest(".form-group")
                .find('.update-photo-url').css("display", "block")
                .parent().find('.update-photo-refer').css("display", "none")
                .parent().find('.update-photo-sort').css("display", "none");
        });
        album_photo_handle.pointer.updateModal.find(".update-convert-photo-refer").off("click").click(function (e) {
            var _self = $(this);
            _self.css("font-weight", "bold")
                .parent().find(".update-convert-photo-url").css("font-weight", "normal")
                .parent().find(".update-convert-photo-sort").css("font-weight", "normal");
            _self.closest(".form-group")
                .find('.update-photo-refer').css("display", "block")
                .parent().find('.update-photo-sort').css("display", "none")
                .parent().find('.update-photo-url').css("display", "none");
        });
        album_photo_handle.pointer.updateModal.find(".update-convert-photo-sort").click(function (e) {
            var _self = $(this);
            _self.css("font-weight", "bold")
                .parent().find(".update-convert-photo-url").css("font-weight", "normal")
                .parent().find(".update-convert-photo-refer").css("font-weight", "normal");
            _self.closest(".form-group")
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
            if (!(apr.album_id && apr.photo_id)) {
                toastr.error("相册id或照片id参数错误~");
                return;
            } else {
                apr.album_id = apr.album_id;
                apr.photo_id = apr.photo_id;
                apr.before_sort = parseInt(apr.before_sort) || common_utils.convertRadix62to10(apr.photo_id);
            }
            if (isNaN(apr.sort)) {
                toastr.error("请输入数字，最多支持小数点后三位~");
                return;
            } else {
                // apr.sort = parseInt(parseFloat(apr.sort) * 1000);
            }
            if (apr.before_sort == apr.sort) {
                toastr.info("已是默认值，无需更新~");
                return;
            } else if (apr.sort == common_utils.convertRadix62to10(apr.photo_id)) {
                apr.sort = 0;
            }
            $.post("photo.api?method=saveAlbumPhotoRelation", apr, function (response) {
                if (response.status == 200) {
                    toastr.success("更新成功~");
                    album_photo_page_handle.utils.getPhotoByCache(apr.photo_id).sort = (apr.sort || common_utils.convertRadix62to10(apr.photo_id));
                    album_photo_page_handle.pointer.album.photos.sort(function (a, b) {
                        return (a.sort || common_utils.convertRadix62to10(a.photo_id)) - (b.sort || common_utils.convertRadix62to10(b.photo_id));
                    });
                    album_photo_page_handle.jumpPage(album_photo_page_handle.utils.getPhotoPageNum(apr.photo_id));
                    album_photo_handle.pointer.updateModal.modal('hide');
                } else {
                    toastr.error(response.message, "保存失败");
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
                    if (cacheAlbum.mount != album.mount) {
                        $("#first .album_name").dblclick();
                    }
                    common_utils.extendNonNull(cacheAlbum, album);
                    $("#first .album_name").text(cacheAlbum.name);
                    $("#first .album_description").text(cacheAlbum.description);
                    PeriodCache.utils.removeCache("user_albums_cache", cacheAlbum.user.uid);
                    PeriodCache.utils.removeCache("user_albums_cache", "0_" + cacheAlbum.user.uid);
                },
                "deleteCompleted": function (params) {  // 在相册删除完成后回调
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
        album_handle.utils.bindEvent(album_handle.config.event.beforeDelete, function (e, params) {
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
                album_photo_page_handle.pointer.album = data.album;
                toastr.success("数据刷新成功");
                album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                album_photo_page_handle.utils.updateAlbumSizeInPage();
            });
        });

        // 搜索本相册照片
        toolbar.rewriteSearch({
            placeholder: "搜索本相册照片",
            model_action: function (key) {
                var context = this;
                var hasAlbum = false;
                var hasFrom = false;
                var isFindSpecial = false;
                context.utils.eachEntry(key, ["album"], function (entry) {
                    hasAlbum = true;
                });
                context.utils.eachEntry(key, ["from"], function (entry) {
                    hasFrom = true;
                });
                // 如果不是直接输入的本站图片URL
                if (!/^https?:\/\/[a-z0-9\.:]+\/([\x21-\x7e]*\/)?(user\/\w+\/photos\/\w+\/[0-9a-zA-Z_\.]+\.(gif|jpe?g|png|bmp|svg|ico))(\?[\x21-\x7e]*)?$/.test(key)) {
                    context.utils.eachEntry(key, context.config.special_search_object.photo_schema, function (entry) {
                        isFindSpecial = true;
                    });
                    if (!isFindSpecial) {
                        if (/^[\d]+$/.test(key)) {
                            key = "photo_id=" + key + "&name=" + key + "&description=" + key + "&tags=" + key + "&logic_conn=or"
                        } else if (key) {
                            var encodeKey = encodeURIComponent(key);
                            key = "name=" + encodeKey + "&description=" + encodeKey + "&tags=" + encodeKey + "&logic_conn=or";
                        } else {
                            key = "";
                        }
                    }
                } else { // 直接输入的本站图片URL则直接查找该图片
                    key = "path=" + encodeURIComponent(RegExp.$2);
                }
                if (!hasAlbum) {
                    key = "album_id=" + album_photo_page_handle.config.load_condition.album_id + (key ? ("&" + key) : "");
                }
                if (!hasFrom) {
                    key += "&from=album_detail";
                }
                if (!isFindSpecial) {
                    window.open("p/dashboard?model=photo&" + key);
                } else {
                    context.config.callback.photo_search.call(context, key);
                }
            },
            modelMapping: ["page"],
            setDefaultMapping: true
        });

        // 添加精选按钮   replaceWith addFeaturedBtnBasedLocal(album)
        //addFeaturedBtnBasedRemote(album_id);

        bindBlowup(albumConfig.photo_page.blow_up);
    });
});