/**
 * 用户相册中心
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'period_cache', 'album_handle', 'album_page_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, PeriodCache, album_handle, album_page_handle);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, PeriodCache, album_handle, album_page_handle) {

    domReady(function () {

        var albumConfig = common_utils.getLocalConfig("album", {
            "album_page": {
                "full_background": false,
                "default_col": {
                    "2000": 4,
                    "1800": 4,
                    "1600": 4,
                    "940": 3,
                    "720": 2
                },
                "default_size": 0
            },
            "photo_page": {
                "preview_compress": true
            }
        });
        if (albumConfig.album_page.full_background) {
            $("body").css("background-image", $("#first").css("background-image"));
            $("#first").css("background-image", "");
        }

        //var album_id = $('#album_size').attr('album_id');
        var hostUser = parseInt($('#first h1').attr('hostUser'));

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.album_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col && parseInt(params.col);
        var checkAlbumId = params.check ? parseInt(params.check) : 0;
        var cloud_photo_preview_args = "";
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        //从本地缓存中得到相册基本信息组连接
        var album_size_cache_conn = PeriodCache.getOrCreateGroup({
            "version": 1.2,
            "groupName": "album_size_cache",
            "timeOut": 1200000,
            "reload": {
                "url": "photo.do?method=albumByAjax",
                "params": function (groupName, key) {
                    return {"id": key, "mount": true};
                },
                "parse": function (cacheCtx, groupName, key, old_object_value, data) {
                    if (data.flag == 200) {
                        var new_object_value = {"album_id": key, "size": data.album.size};
                        return new_object_value;
                    } else {
                        return {"album_id": key, "size": 0};
                    }
                }
            }
        });
        album_page_handle.init({
            callback: {
                "loadAlbums_callback": function (config, success) { // 加载相册列表的回调
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载数据", "", "notify_albums_loading");
                    $.get("photo.do?method=albumListByAjax", config.load_condition, function (data) {
                        common_utils.removeNotify("notify_albums_loading");
                        if (data.flag == 200) {
                            if (data.albums.length == 0 && !login_handle.equalsLoginUser(hostUser)) {
                                $("#main .album_options").remove();
                                $("#" + config.selector.albumsContainer_id).html(
                                    '<h2 style="font-size: 1.25em;" class="post-title" itemprop="name headline">此用户还没有创建相册，或者你没有权限查看</h2>'
                                ).parent().addClass("post-container");
                            } else {
                                $.each(data.albums, function (i, album) {
                                    try {
                                        var coverJson = JSON.parse(album.cover);
                                        album.cover = coverJson;
                                    } catch (e) {
                                        album.cover = {"path": album.cover};
                                    }
                                });
                                cloud_photo_preview_args = data.cloud_photo_preview_args;
                                success(data);
                            }
                        } else {
                            toastr.error(data.info, "加载相册失败!");
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
                "actionForEditAlbum": function (album) {
                    // 从缓存中获取相册照片数量
                    album_size_cache_conn.get(album.album_id, function (cache_album) {
                        if (cache_album) {
                            album.size = cache_album.size;
                        }
                        album_handle.openUpdateAlbumModal(album);
                    });
                },
                "makeupNode_callback": function (album_node, album) {
                    var a = album_node.querySelector("a");
                    a.title = album.description;
                    var span = album_node.querySelector("span");
                    if (login_handle.equalsLoginUser(album.user.uid)) {
                        span.title = "点击编辑相册";
                    } else {
                        span.title = "点击查看相册信息";
                    }
                }
            },
            path_params: {
                "basePath": $("#basePath").attr("href"),
                "cloudPath": $("#cloudPath").attr("href"),
                "staticPath": $("#staticPath").attr("href")
            },
            selector: {
                "albumsContainer_id": "masonryContainer",
                "page_nav": ".page-navigator",
                "album_id_prefix": "album_",
                "album_count": "#album_count"
            },
            page_params: {
                "pageSize": pageSize,
                "pageNum": pageNum,
                "col": col,
                "default_col": albumConfig.album_page.default_col
            },
            load_condition: {
                "user.uid": hostUser
            },
            checkAlbumId: checkAlbumId,
            album_href_prefix: "photo.do?method=album_detail&id="
        });

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
                    album_page_handle.utils.appendAlbumToPage(album);
                    album_page_handle.jumpPage(album_page_handle.config.page_params.pageCount);
                },
                "updateCompleted": function (album) {  // 在相册更新完成后回调
                    if (album_page_handle.utils.getAlbumByCache(album.album_id).cover.path != album.cover.path) {
                        album_page_handle.jumpPage(album_page_handle.config.page_params.pageNum);
                    }
                    album_page_handle.utils.updateAlbumInPage(album);
                    PeriodCache.utils.removeCache("user_albums_cache", login_handle.getCurrentUserId());
                    PeriodCache.utils.removeCache("user_albums_cache", "0_" + login_handle.getCurrentUserId());
                },
                "deleteCompleted": function (album_id) {  // 在相册删除完成后回调
                    album_page_handle.utils.deleteAlbumInPage(album_id);
                },
                "beforeCreateModalOpen": function (createModal, openCreateModal_callback) {  // 创建窗口打开前回调
                    openCreateModal_callback();
                },
                "beforeUpdateModalOpen": function (updateModal, formatAlbumToModal_callback, album) {  // 更新窗口打开前回调
                    formatAlbumToModal_callback(album);
                }
            }
        });

        $('#createAlbum').click(function () {
            album_handle.openCreateAlbumModal();
        });
    });
});