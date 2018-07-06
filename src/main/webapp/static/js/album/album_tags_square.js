/**
 * Created by Jeffrey.Deng on 2018/5/3.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'toolbar', 'album_page_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, toolbar, album_page_handle);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, toolbar, album_page_handle) {

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
        var load_condition = {};
        var titleStr = "";
        $.each(params, function (key, value) {
            if (key != "size" && key != "page" && key != "method" && key != "col") {
                load_condition[key] = value && decodeURIComponent(decodeURIComponent(value));
                titleStr += "&" + key + "=" + load_condition[key];
            }
        });
        if (titleStr) {
            $("head").find("title").text(titleStr.substring(1) + " | 标签索引 - 相册" );
        }

        var calls = [];
        album_page_handle.init({
            callback: {
                "loadAlbums_callback": function (config, success) { // 加载相册列表的回调
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载数据", "", "notify_photos_loading");
                    var object = $.extend(true, {"query_size": 0}, config.load_condition);
                    $.get("photo.do?method=photoListByAjax", object, function (data) {
                        if (data.flag == 200) {
                            common_utils.getNotify("notify_photos_loading").find(".toast-message").text("正在计算数据");
                            if (!data.photos) {
                                common_utils.removeNotify("notify_photos_loading");
                                return;
                            }
                            var isSearchTags = false;
                            if (config.load_condition.tags) {
                                if (Object.keys(config.load_condition).length == 1) {
                                    isSearchTags = true;
                                } else if (Object.keys(config.load_condition).length == 2 && config.load_condition.album_id) {
                                    isSearchTags = true;
                                }
                            }
                            config.isSearchTags = isSearchTags;
                            var tagsMap = {};
                            $.each(data.photos, function (i, photo) {
                                var tags = photo.tags ? photo.tags.split('#') : [];
                                $.each(tags, function (i, tag) {
                                    if (tag) {
                                        if (isSearchTags && tag.indexOf(config.load_condition.tags) == -1){
                                            return true;
                                        }
                                        var tagInfo = tagsMap[tag];
                                        if (!tagInfo) {
                                            tagInfo = {
                                                "album_id": tag,
                                                "name": tag,
                                                "count": 0,
                                                "cover": photo.path,
                                                "coverId": photo.photo_id
                                            };
                                            tagsMap[tag] = tagInfo;
                                        }
                                        tagInfo.count++;
                                    }
                                });
                            });
                            var tagInfos = [];
                            $.each(tagsMap, function (key, value) {
                                tagInfos.push(value);
                            });
                            tagInfos.length > 0 && tagInfos.sort(function (a, b) {
                                return b.count - a.count;
                            });
                            common_utils.removeNotify("notify_photos_loading");
                            success({"albums": tagInfos});
                        } else {
                            common_utils.removeNotify("notify_photos_loading");
                            toastr.error(data.info, "加载相册失败!");
                            console.warn("Error Code: " + data.flag);
                        }
                    });
                },
                "actionForEditAlbum": function (album) {
                    var album_href_suffix = this.config.album_href_suffix;
                    if (album_href_suffix == undefined) {
                        album_href_suffix = "";
                        if (!this.config.isSearchTags) {
                            $.each(this.config.load_condition, function (key, value) {
                                album_href_suffix += "&" + key + "=" + value;
                            });
                        }
                        this.config.album_href_suffix = album_href_suffix;
                    }
                    window.open(this.config.album_href_prefix + album.album_id + album_href_suffix);
                },
                "makeupNode_callback": function (album_node, album) {
                    var album_href_suffix = this.config.album_href_suffix;
                    if (album_href_suffix == undefined) {
                        album_href_suffix = "";
                        if (!this.config.isSearchTags) {
                            $.each(this.config.load_condition, function (key, value) {
                                album_href_suffix += "&" + key + "=" + value;
                            });
                        }
                        this.config.album_href_suffix = album_href_suffix;
                    }
                    var a = album_node.querySelector("a");
                    a.href = this.config.album_href_prefix + album.album_id + album_href_suffix;
                    a.title = album_href_suffix ? ("查看该相册(用户)下的" + album.album_id + "标签") : "点击查看照片";
                    var span = album_node.querySelector("span");
                    span.title = album_href_suffix ? ("查看该相册(用户)下的" + album.album_id + "标签") : "点击查看照片";
                    span.innerText = span.innerText + "（" + album.count+ "张）";
                },
                "photosOnLoad_callback": function (masonryInstance) {
                    var context = this;
                    if (calls && calls.length > 0) {
                        $.each(calls, function (i, call) {
                            call.call(context, masonryInstance);
                        });
                    }
                    return;
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
            album_href_prefix: "photo.do?method=dashboard&mode=photo&tags="
        });

        var isInAlbum = params.album_id ? true : false;
        var lastSearchKey = null;
        var lastViewIndex = 0;
        toolbar.rewriteSearch(function (key) {
            key = key.trim();
            if (isInAlbum) {
                if (key == "") {
                    toastr.info("请输入！", "", {"progressBar": false});
                    return;
                }
                common_utils.notify({
                    "progressBar": false,
                    "timeOut": 0,
                    "closeButton": false
                }).success("正在查找。。", "", "search_tags_in_album");

                var results = [];
                var complete = album_page_handle.utils.getAlbumByCache(key);
                if (!complete) {
                    $.each(album_page_handle.pointer.albums, function (i, cache) {
                        if (cache.album_id.indexOf(key) != -1) {
                            results.push(cache);
                        }
                    });
                } else {
                    results.push(complete);
                }
                if (results.length == 0) {
                    common_utils.removeNotify("search_tags_in_album");
                    toastr.info("该相册内未找到该标签！", "", {"progressBar": false});
                    return;
                }

                if (key == lastSearchKey) {
                    if (lastViewIndex >= results.length) {
                        lastViewIndex = 0;
                    }
                } else {
                    lastViewIndex = 0;
                }
                var pageNum = album_page_handle.utils.getAlbumPageNum(results[lastViewIndex].album_id);
                var indexAlbum = function (masonryInstance) {
                    common_utils.removeNotify("search_tags_in_album");
                    $.each(results, function (i, result) {
                        album_page_handle.utils.getAlbumDom(result.album_id).find(".album_name span")
                            .css("background-color", "#faebcc");
                    });
                    setTimeout(function () {
                        var span = album_page_handle.utils.getAlbumDom(results[lastViewIndex].album_id).find(".album_name span");
                        var scroll = span.offset().top - $(window).height() * (2 / 3);
                        $("html,body").animate({scrollTop: scroll}, 300);
                        lastViewIndex++;
                    }, 70);
                    calls.splice(calls.indexOf(indexAlbum), 1);
                };
                calls.push(indexAlbum);
                album_page_handle.jumpPage(pageNum);
            } else {
                window.open("photo.do?method=tags_square&tags=" + key);
            }
            lastSearchKey = key;
        }, isInAlbum ? "搜索该相册标签" : "输入关键字搜索标签");
    });
});