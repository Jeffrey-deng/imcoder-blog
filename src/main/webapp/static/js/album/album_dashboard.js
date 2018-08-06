/**
 * 用户相册中心
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'toolbar', 'period_cache', 'album_handle', 'album_page_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, toolbar, PeriodCache, album_handle, album_page_handle);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, toolbar, PeriodCache, album_handle, album_page_handle) {

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

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : 40;
        var pageNum = params.page ? params.page : 1;
        var col = params.col;
        var checkAlbumId = params.check ? parseInt(params.check) : 0;

        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != "size" && key != "page" && key != "method" && key != "col" && key != "mode") {
                load_condition[key] = params[key]
            }
        });

        var title_prefix = params.name || params.description || "";
        if (title_prefix && title_prefix == "_") {
            $("head").find("title").text("所有相册" + " | " + $("head").find("title").text());
        } else if (title_prefix) {
            $("head").find("title").text(title_prefix + " | " + $("head").find("title").text());
        }

        //从本地缓存中得到相册基本信息组连接
        var album_size_cache_conn = PeriodCache.getOrCreateGroup({
            "groupName": "album_size_cache",
            "timeOut": 900000,
            "reload": {
                "url": "photo.do?method=albumByAjax",
                "params": function (groupName, key) {
                    return {"id": key};
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
                            $.each(data.albums, function (i, album) {
                                try {
                                    var coverJson = JSON.parse(album.cover);
                                    album.cover = coverJson;
                                } catch (e) {
                                    album.cover = {"path": album.cover};
                                }
                            });
                            success(data);
                            if (data.albums.length == 0) {
                                common_utils.notify({
                                    "progressBar": false,
                                    "hideDuration": 0,
                                    "timeOut": 10000,
                                    "closeButton": false
                                }).success("抱歉，未找到您要的内容", "", "notify_albums_loading_empty");
                            }
                        } else {
                            toastr.error(data.info, "加载相册失败!");
                            console.warn("Error Code: " + data.flag);
                        }
                    });
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
                "col": col
            },
            load_condition: load_condition,
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
                    // dashboard页 添加照片所有者主页链接
                    if (updateModal.find('span[name="user_id"]').length == 0) {
                        updateModal.find('span[name="album_id"]').parent().after(
                            '<div class="form-group"><label>所有者：</label>' +
                            '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看用户主页" >' +
                            '<span name="user_id" class="control-label" style="display:inline-block;width: 50%;margin-left: 15px;"></span>' +
                            '</a></div>'
                        );
                    }
                    var user_home_url = "user.do?method=home&uid=" + album.user.uid;
                    updateModal.find('span[name="user_id"]').text(album.user.nickname).parent().attr("href", user_home_url);
                    // 回调
                    formatAlbumToModal_callback(album);
                }
            }
        });

        $('#createAlbum').click(function () {
            album_handle.openCreateAlbumModal();
        });

        // 搜索重写
        var search_input_value = "";
        if (Object.keys(load_condition).length > 0) {
            $.each(load_condition, function (key, value) {
                if (key == "name") {
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
                }
                search_input_value += "," + key + ":";
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
            mode_action: function (key) {
                this.config.callback.album_search.call(this, key);
            },
            modeMapping: ["album", "albums"],
            setDefaultMapping: true
        });
    });
});