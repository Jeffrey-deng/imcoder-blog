/**
 * 用户相册中心
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle', 'toolbar', 'period_cache', 'album_handle', 'album_page_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, login_handle, toolbar, PeriodCache, album_handle, album_page_handle);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, login_handle, toolbar, PeriodCache, album_handle, album_page_handle) {

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

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.album_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col && parseInt(params.col);
        var checkAlbumId = params.check ? params.check : 0;
        var cloud_photo_preview_args = '';
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != 'size' && key != 'page' && key != 'method' && key != 'col' && key != 'model') {
                load_condition[key] = params[key]
            }
        });

        var title_prefix = params.name || params.description || '';
        if (title_prefix && title_prefix == '_') {
            $('head').find('title').text('所有相册' + ' | ' + $('head').find('title').text());
        } else if (title_prefix) {
            $('head').find('title').text(title_prefix + ' | ' + $('head').find('title').text());
        }

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
                        cloud_photo_preview_args = data.cloud_photo_preview_args;
                        success.call(context, data);
                        if (data.albums.length == 0) {
                            globals.notify({
                                "progressBar": false,
                                "hideDuration": 0,
                                "showDuration": 0,
                                "timeOut": 10000,
                                "closeButton": false
                            }).success('抱歉，未找到您要的内容', '', 'notify_albums_loading_empty');
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
                    a.title = album.description + '\n上传者@' + album.user.nickname;
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
            load_condition: load_condition,
            checkAlbumId: checkAlbumId,
            album_href_prefix: "p/album/"
        });

        album_handle.init({
            path_params: globals.path_params,
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
                },
                "beforeUpdateModalOpen": function (updateModal, formatAlbumToModal_callback, album) {  // 更新窗口打开前回调
                    // dashboard页 添加照片所有者主页链接
                    let $userLinkText = updateModal.find('span[name="user_id"]');
                    if ($userLinkText.length == 0) {
                        updateModal.find('span[name="album_id"]').closest('.form-group').after(
                            '<div class="form-group"><label>所有者：</label>' +
                            '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看用户主页" >' +
                            '<span name="user_id" class="control-label" style="display:inline-block;width: 50%;margin-left: 15px;"></span>' +
                            '</a></div>'
                        );
                    }
                    let user_home_url = 'u/' + album.user.uid + '/home';
                    $userLinkText.text(album.user.nickname).parent().url('href', user_home_url);
                    // 回调
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

        // 搜索重写
        var search_input_value = '';
        if (Object.keys(load_condition).length > 0) {
            $.each(load_condition, function (key, value) {
                if (key == 'name') {
                    value = value.replace(new RegExp(toolbar.utils.getItsMultipleMatchJoiner(key), 'g'), '#');
                    if (/^\((.+)\.\*(.+)\)\|\(\2\.\*\1\)$/.test(value)) {
                        var matchForTwo = value.match(/^\((.+)\.\*(.+)\)\|/);
                        value = matchForTwo[1] + '#' + matchForTwo[2];
                    }
                    value = value.replace(/\[\[:<:\]\]/g, '<');
                    value = value.replace(/\[\[:>:\]\]/g, '>');
                    if (value.indexOf('[[.') != -1) {
                        value = common_utils.replaceByEL(value, function (index, key) { // 还原被转义的MySQL特殊字符
                            return /^[^\w]+$/.test(key) ? ('{' + key + '}') : this[0];
                        }, "\\[\\[\\.", '\\.\\]\\]')
                    }
                }
                search_input_value += ',' + key + ':';
                if (toolbar.config.special_pair_separator.test(value) || toolbar.config.special_value_separator.test(value)) {
                    search_input_value += '"' + value + '"';
                } else {
                    search_input_value += value;
                }
            });
        }
        search_input_value = search_input_value && search_input_value.substring(1);
        toolbar.rewriteSearch({
            placeholder: "输入关键字搜索相册",
            inputInitialValue: search_input_value,
            model_action: function (key) {
                this.config.callback.album_search.call(this, key);
            },
            modelMapping: ["album", "albums"],
            setDefaultMapping: true
        });
    });
});