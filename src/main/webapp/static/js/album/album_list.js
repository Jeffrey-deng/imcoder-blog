/**
 * 用户相册中心
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle', 'period_cache', 'album_handle', 'album_page_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, login_handle, PeriodCache, album_handle, album_page_handle);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, login_handle, PeriodCache, album_handle, album_page_handle) {

    domReady(function () {

        var albumConfig = globals.getLocalConfig('album', {
            "album_page": {
                "full_background": false,
                "default_col": {
                    "2000+": 5,
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
        }), $firstArea = $(globals.selector.firstArea);
        if (albumConfig.album_page.full_background) {
            $('body').css('background-image', $firstArea.css('background-image'));
            $firstArea.css('background-image', '');
        }

        // var album_id = $('#album_size').attr('data-album-id');
        var hostUser = $firstArea.find('.slogan-name').attr('data-user-id');

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.album_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col && parseInt(params.col);
        var checkAlbumId = params.check ? params.check : 0;
        var cloud_photo_preview_args = '';
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        //从本地缓存中得到相册基本信息组连接
        var album_size_cache_conn = PeriodCache.getOrCreateGroup({
            "version": 1.2,
            "groupName": "album_size_cache",
            "timeOut": 1200000,
            "reload": {
                "url": "photo.api?method=getAlbum",
                "params": function (groupName, key) {
                    return {"id": key, "mount": true};
                },
                "parse": function (cacheCtx, groupName, key, old_object_value, response) {
                    if (response.status == 200) {
                        var data = response.data;
                        var videoCovers = data.album.photos.filter(function (photo) {
                            return photo.image_type.indexOf('video') != -1;
                        });
                        var new_object_value = {
                            "album_id": key,
                            "size": data.album.size,
                            "videoCount": videoCovers.length
                        };
                        return new_object_value;
                    } else {
                        return {"album_id": key, "size": 0, "videoCount": 0};
                    }
                }
            }
        });
        album_page_handle.init({
            callback: {
                "loadAlbums_callback": function (config, success) { // 加载相册列表的回调
                    globals.notify().progress('正在加载数据', '', 'notify_albums_loading');
                    let condition = $.extend(true, {}, config.load_condition), context = this;
                    return globals.request.get(globals.api.getAlbumList, condition, true, '加载相册列表失败').always(function () {
                        globals.removeNotify('notify_albums_loading');
                    }).final(function (data) {
                        if (data.albums.length == 0 && !login_handle.equalsLoginUser(hostUser)) {
                            $('#main .album_options').remove();
                            $('#' + config.selector.albumsContainer_id).html(
                                '<h2 style="font-size: 1.25em;" class="post-title" itemprop="name headline">此用户还没有创建相册，或者你没有权限查看</h2>'
                            ).parent().addClass('post-container');
                        } else {
                            cloud_photo_preview_args = data.cloud_photo_preview_args;
                            success.call(context, data);
                        }
                    });
                },
                "generatePhotoPreviewUrl": function (source, hitCol) { // 生成预览图片url的函数
                    if (open_preview_compress && cloud_photo_preview_args) {
                        return source + cloud_photo_preview_args.replace('{col}', hitCol);
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
                    var a = album_node.querySelector('a');
                    a.title = album.description;
                    var span = album_node.querySelector('span');
                    if (login_handle.equalsLoginUser(album.user.uid)) {
                        span.title = "点击编辑相册";
                    } else {
                        span.title = "点击查看相册信息";
                    }
                }
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
            album_href_prefix: "p/album/"
        });

        album_handle.init({
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
                        album_page_handle.utils.updateAlbumInPage(album);
                        album_page_handle.jumpPage(album_page_handle.config.page_params.pageNum);
                    } else {
                        album_page_handle.utils.updateAlbumInPage(album);
                    }
                    PeriodCache.utils.removeCache('user_albums_cache', login_handle.getCurrentUserId());
                    PeriodCache.utils.removeCache('user_albums_cache', '0_' + login_handle.getCurrentUserId());
                },
                "deleteCompleted": function (postData) {  // 在相册删除完成后回调
                    album_page_handle.utils.deleteAlbumInPage(postData.album_id);
                },
                "beforeCreateModalOpen": function (createModal, openCreateModal_callback) {  // 创建窗口打开前回调
                    openCreateModal_callback();
                    // 加载上传参数及配置，判断该用户是否允许上传
                    $.get(globals.api.getPhotoUploadConfigInfo, function (response) {
                        if (response && response.status == 200) {
                            var createConfigInfo = response.data;
                            album_handle.config.createConfigInfo = createConfigInfo;
                            if (!createConfigInfo || createConfigInfo.isAllowUpload) {
                                // 允许上传才打开上传按钮
                                createModal.find('button[name="createAlbum_trigger"]').removeAttr('disabled');
                                globals.removeNotify('notify-no-allow-create');
                            } else {
                                var users = null;
                                switch (createConfigInfo.allowUploadLowestLevel) {
                                    case 1:
                                        users = "高级会员与管理员";
                                        break;
                                    case -1:
                                        users = "管理员";
                                        break
                                }
                                globals.notify({timeOut: 0}).info('系统当前配置为只允许<br>【<b>' + users + '</b>】上传照片', '您暂时不能上传', 'notify-no-allow-create');
                                // 禁用上传按钮
                                createModal.find('button[name="createAlbum_trigger"]').attr('disabled', 'disabled');
                            }
                        } else {
                            toastr.error('加载上传配置失败', '错误');
                        }
                    });
                },
                "beforeUpdateModalOpen": function (updateModal, formatAlbumToModal_callback, album) {  // 更新窗口打开前回调
                    formatAlbumToModal_callback(album);
                }
            }
        });
        // 要删除的相册中包含视频时提示用户
        album_handle.on(album_handle.config.event.beforeDelete, function (e, postData) {
            var albumSizeInfo = PeriodCache.utils.getCacheValue(album_size_cache_conn.groupConfig.groupName, postData.album_id);
            if (albumSizeInfo.videoCount) {
                if (!window.confirm('你删除的相册包含' + albumSizeInfo.videoCount + '个视频，确定要继续吗？（建议先删除视频）')) {
                    return false;
                }
            }
            return true;
        });

        $('#createAlbum').click(function () {
            album_handle.openCreateAlbumModal();
        });
    });
});