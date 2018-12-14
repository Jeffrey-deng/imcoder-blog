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

    // 找出匹配到的tag_wrapper
    function matchTag(photo, wrappers, tag, url_album_id) {
        if (!wrappers) {
            return null;
        }
        try {
            for (var i in wrappers) {
                var wrapper = wrappers[i];
                if (wrapper.uid != photo.uid) { // 用户设置比较器只能作用于自己的照片
                    continue;
                }
                if (wrapper.scope > 0 && wrapper.scope != url_album_id) { // 当该标签设置作用域为相册时，检查
                    continue;
                }
                switch (wrapper.match_mode) { // 匹配类型
                    case 0: // 全等
                        if (wrapper.pattern == tag) {
                            return wrapper;
                        }
                        break;
                    case 1: // 前缀
                        if (tag.indexOf(wrapper.pattern) == 0) {
                            return wrapper;
                        }
                        break;
                    case 2: // 后缀
                        if (tag.indexOf(wrapper.pattern) + wrapper.pattern.length == tag.length) {
                            return wrapper;
                        }
                        break;
                    case 3: // 正则
                        if (wrapper.pattern.test(tag)) {
                            return wrapper;
                        }
                        break;
                    case 4: // 包含
                        if (tag.indexOf(wrapper.pattern) != -1) {
                            return wrapper;
                        }
                        break;
                    default:
                        continue;
                }
            }
        } catch (e) {
            console.warn(e);
        }
        return null;
    }

    // 从照片列表中查询出标签列表，并按照用户设置的权重排序，并用filter参数过滤
    function takeOutTags(data, config) {
        var isExtend = data.tag_wrappers ? true : false;
        var wrappers = data.tag_wrappers;
        if (wrappers == null) {
            wrappers = [];
        } else if (wrappers.length > 0) {
            for (var i in wrappers) {
                var wrapper = wrappers[i];
                if (wrapper.match_mode == 3) {
                    wrapper.pattern = new RegExp(wrapper.pattern);
                }
            }
        }
        var isFilterTags = false; //标记是显示该条件下，所有标签还是利用filter值过滤标签后的标签
        var filterTagRegex = null;
        if (config.load_condition.filter) {
            isFilterTags = true;
            filterTagRegex = new RegExp(config.load_condition.filter);
        }
        if (config.load_condition.hasOwnProperty("filter")) {
            delete config.load_condition.filter;
        }
        config.isFilterTags = isFilterTags;
        var url_album_id = (config.load_condition.album_id ? parseInt(config.load_condition.album_id) : 0);
        var tagsMap = {};   // 存储分割出的标签
        var notExtraTagMap = {}; // 记录每个不额外显示的父标签的数量
        $.each(data.photos, function (i, photo) {
            var tags = photo.tags ? photo.tags.split('#') : [];
            var once = {}; // 一个图片只对一个wrapper增加一次
            $.each(tags, function (i, tag) {
                if (tag) {
                    var hit = false;
                    var wrapper;
                    if (isExtend) { // 如果是扩展模式（分组模式）
                        wrapper = matchTag(photo, wrappers, tag, url_album_id);
                        if (wrapper) {
                            if (isFilterTags && filterTagRegex.test(wrapper.name)) { // 如果匹配到了且父标签满足过滤条件，则让子标签通过
                                hit = true;
                            }
                            if ((hit || !isFilterTags) && !once[wrapper.name]) { // 如果父标签需要额外单独显示, 只显示被过滤的标签
                                if (wrapper.extra == 1) {   // 父类标签计数加1
                                    var groupTag = tagsMap[wrapper.name];
                                    if (!groupTag) {
                                        groupTag = {
                                            "album_id": wrapper.name,
                                            "name": wrapper.name,
                                            "count": 0,
                                            "weight": wrapper.weight,
                                            "isGroup": true, // 标记为组合标签
                                            "extend": true, // 标记为用户设置过的标签
                                            "description": wrapper.description,
                                            "cover": {
                                                "photo_id": photo.photo_id,
                                                "path": photo.path,
                                                "width": photo.width,
                                                "height": photo.height
                                            }
                                        };
                                        tagsMap[wrapper.name] = groupTag;
                                    }
                                    groupTag.count++;
                                } else {
                                    var notExtraTag = notExtraTagMap[wrapper.name]; // 保存不显示的标签的值，以防特殊情况下统计需要用到
                                    if (!notExtraTag) {
                                        notExtraTag = {
                                            "name": wrapper.name,
                                            "count": 0,
                                            "weight": wrapper.weight,
                                            "description": wrapper.description
                                        };
                                        notExtraTagMap[wrapper.name] = notExtraTag;
                                    }
                                    notExtraTag.count++;
                                }
                                once[wrapper.name] = true;
                            }
                        }
                    }
                    if (hit == false && isFilterTags && !filterTagRegex.test(tag)) {    //正则过滤标签
                        return true;
                    }
                    var tagInfo = tagsMap[tag];
                    if (!tagInfo) {
                        tagInfo = {
                            "album_id": tag,
                            "name": tag,
                            "count": 0,
                            "weight": wrapper ? wrapper.weight : 0,
                            "isGroup": false,
                            "cover": {
                                "photo_id": photo.photo_id,
                                "path": photo.path,
                                "width": photo.width,
                                "height": photo.height
                            }
                        };
                        tagsMap[tag] = tagInfo;
                    }
                    if (!tagInfo.isGroup) { // 当子标签与父标签名称相同时，只增加一次
                        tagInfo.count++;
                    }
                }
            });
            once = {};
        });
        var tagInfos = [];
        $.each(tagsMap, function (key, value) {
            if (value.count > 0) {
                tagInfos.push(value);
            }
        });
        $.each(notExtraTagMap, function (key, value) {  // 当为父类名称的标签被设置不额外显示时，如果又被用户使用，则将其数量重置为子类标签之和
            var notExtraTag = tagsMap[key];
            if (notExtraTag) {
                notExtraTag.count = value.count;
                notExtraTag.weight = value.weight;
                notExtraTag.extend = true;
                notExtraTag.description = value.description;
            }
        });
        tagInfos.length > 0 && tagInfos.sort(function (a, b) {
            if (isExtend) {
                if (a.isGroup == b.isGroup) {
                    var priority = b.weight - a.weight;
                    if (priority != 0) {
                        return priority;
                    } else {
                        return b.count - a.count;
                    }
                } else if (a.isGroup) {
                    return -1;
                } else {
                    return 1;
                }
            } else {
                return b.count - a.count;
            }
        });
        return tagInfos;
    }

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

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.album_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col;
        var fromAlbumDetailPage = (params.from && params.album_id && (params.from.indexOf("album_detail") != -1));
        var load_condition = {};
        var cloud_photo_preview_args = "";
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        var titleStr = "";
        $.each(params, function (key, value) {
            if (key != "size" && key != "page" && key != "method" && key != "col") {
                load_condition[key] = value && decodeURIComponent(decodeURIComponent(value));
                titleStr += "&" + key + "=" + load_condition[key];
            }
        });
        if (titleStr) {
            $("head").find("title").text(titleStr.substring(1) + " | 标签索引 - 相册");
        }

        // 重写一个支持特殊符号做id的选择器
        album_page_handle.utils.getAlbumDom = function (album_id) {
            var encodeId = album_id;
            var jsArr = album_page_handle.config.jsSpecialChars;
            var jqueryArr = album_page_handle.config.jquerySpecialChars;
            $.each(jsArr, function (i, char) {
                encodeId = encodeId.replace(new RegExp("\\" + char, "g"), "\\" + char);
            });
            $.each(jqueryArr, function (i, char) {
                encodeId = encodeId.replace(new RegExp(char, "g"), "\\" + char);
            });
            return $("#" + album_page_handle.config.selector.album_id_prefix + encodeId);
        };
        var calls = [];
        album_page_handle.init({
            jsSpecialChars: ["\\", "^", "$", "*", "?", ".", "+", "(", ")", "[", "]", "|", "{", "}"],
            jquerySpecialChars: ["~", "`", "@", "#", "%", "&", "=", "'", "\"", ":", ";", "<", ">", ",", "/"],
            callback: {
                "loadAlbums_callback": function (config, success) { // 加载相册列表的回调
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载数据", "", "notify_photos_loading");
                    var object = $.extend(true, {"query_size": 0, "extend": "true"}, config.load_condition);
                    if (fromAlbumDetailPage) {
                        object.base = object.from;
                    } else {
                        object.base = "album_tags_square";
                    }
                    object.from = "album_tags_square"; // extend=true + from=album_tags_square 将返回tag_wrappers列表
                    $.get("photo.do?method=photoListByAjax", object, function (data) {
                        if (data.flag == 200) {
                            common_utils.getNotify("notify_photos_loading").find(".toast-message").text("正在计算数据");
                            fromAlbumDetailPage && (config.load_condition.from = "album_detail_tags");
                            cloud_photo_preview_args = data.cloud_photo_preview_args;
                            var photos = data.photos;
                            if (!photos) {
                                common_utils.removeNotify("notify_photos_loading");
                                return;
                            }
                            var isExtend = config.load_condition.extend == "true";
                            var tagInfos = null;
                            if (!isExtend || data.tag_wrappers) {
                                tagInfos = takeOutTags(data, config);
                                common_utils.removeNotify("notify_photos_loading");
                                success({"albums": tagInfos});
                                if (tagInfos.length == 0) {
                                    common_utils.notify({
                                        "progressBar": false,
                                        "hideDuration": 0,
                                        "timeOut": 10000,
                                        "closeButton": false
                                    }).success("抱歉，未找到您要的内容", "", "notify_tags_loading_empty");
                                }
                            } else {
                                common_utils.getNotify("notify_photos_loading").find(".toast-message").text("正在计算排序");
                                var params = {};
                                params.uid = config.load_condition.uid || 0;
                                $.get("photo.do?method=getTagWrappers", params, function (twData) {
                                    if (twData.flag != 200) {
                                        data.tag_wrappers = [];
                                    } else {
                                        data.tag_wrappers = twData.tag_wrappers;
                                    }
                                    tagInfos = takeOutTags(data, config);
                                    common_utils.removeNotify("notify_photos_loading");
                                    success({"albums": tagInfos});
                                    if (tagInfos.length == 0) {
                                        common_utils.notify({
                                            "progressBar": false,
                                            "hideDuration": 0,
                                            "timeOut": 10000,
                                            "closeButton": false
                                        }).success("抱歉，未找到您要的内容", "", "notify_tags_loading_empty");
                                    }
                                });
                            }
                        } else {
                            common_utils.removeNotify("notify_photos_loading");
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
                    var album_node = this.utils.getAlbumDom(album.album_id);
                    album_node.find("img").click();
                },
                "makeupNode_callback": function (album_node, album) {
                    var context = this;
                    var album_href_suffix = this.config.album_href_suffix;
                    if (album_href_suffix == undefined) {
                        album_href_suffix = "";
                        $.each(context.config.load_condition, function (key, value) {
                            if (!value) {
                                return true;
                            }
                            if (key == "extend") {
                                return true;
                            }
                            if (key == "tags") {
                                if (context.config.load_condition.extend == "true") { // 显示指明extend时，不支持正则匹配
                                    context.config.album_href_tags_regex = toolbar.utils.encodeRegexSearch("tags", "@ANOTHER");
                                } else {
                                    context.config.album_href_tags_regex = toolbar.utils.encodeRegexSearch("tags", "@ANOTHER#" + value);
                                }
                            } else {
                                album_href_suffix += "&" + key + "=" + value;
                            }

                        });
                        this.config.album_href_suffix = album_href_suffix;
                    }
                    var a = album_node.querySelector("a");
                    if (context.config.album_href_tags_regex && context.config.load_condition.tags != album.album_id) {
                        a.href = this.config.album_href_prefix + context.config.album_href_tags_regex.replace(new RegExp(encodeURIComponent("@ANOTHER"), "g"), album.album_id) + album_href_suffix;
                    } else {
                        a.href = this.config.album_href_prefix + album.album_id + album_href_suffix;
                    }
                    if (album.extend) {
                        a.href = a.href + "&extend=true";
                    }
                    a.title = (album_href_suffix || context.config.album_href_tags_regex) ? ("查看该条件下的" + album.album_id + "标签") : "点击查看照片";
                    var span = album_node.querySelector("span");
                    span.title = (album_href_suffix || context.config.album_href_tags_regex) ? ("查看该条件下的" + album.album_id + "标签") : "点击查看照片";
                    span.innerText = span.innerText + "（" + album.count + "张）";
                    if (album.extend && album.description) {
                        a.setAttribute("title", a.title + "\nexplain：" + album.description);
                    }
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
                "col": col,
                "default_col": albumConfig.album_page.default_col
            },
            load_condition: load_condition,
            album_href_prefix: "photo.do?method=dashboard&model=photo&tags="
        });

        var isHomePage = Object.keys(load_condition).length == 0 ? true : false; //判断当前页面是不是在查看某个相册的标签索引
        var lastSearchKey = null;   //上一次搜索的key
        var nextViewIndex = 0;  //当前准备查看的搜索结果数组index
        toolbar.rewriteSearch({
            placeholder: (isHomePage ? "输入关键字搜索标签" : "搜索本页面标签"),
            model_action: function (key) {
                lastSearchKey = key;
                var context = this;
                key = key.trim();
                if (!isHomePage) {
                    if (key == "") {
                        toastr.info("请输入！", "", {"progressBar": false});
                        return;
                    }
                    common_utils.notify({
                        "progressBar": false,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在查找。。", "", "search_tags_in_album");

                    // 还原el
                    var match = key.match(new RegExp(context.config.special_replace_prefix + "\\d{1}", "g"));
                    if (match) {
                        for (var i = 0; i < match.length; i++) {
                            key = key.replace(match[i], context.config.elMap[match[i]]);
                        }
                    }

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
                        if (nextViewIndex >= results.length) {
                            nextViewIndex = 0;
                        }
                    } else {
                        nextViewIndex = 0;
                    }
                    var pageNum = album_page_handle.utils.getAlbumPageNum(results[nextViewIndex].album_id);
                    var indexAlbum = function (masonryInstance) {
                        common_utils.removeNotify("search_tags_in_album");
                        $.each(results, function (i, result) {
                            album_page_handle.utils.getAlbumDom(result.album_id).find(".album_name span")
                                .css("background-color", "#faebcc");
                        });
                        setTimeout(function () {
                            var span = album_page_handle.utils.getAlbumDom(results[nextViewIndex].album_id).find(".album_name span");
                            var scroll = span.offset().top - $(window).height() * (2 / 3);
                            $("html,body").animate({scrollTop: scroll}, 300);
                            nextViewIndex++;
                        }, 70);
                        calls.splice(calls.indexOf(indexAlbum), 1);
                    };
                    calls.push(indexAlbum);
                    album_page_handle.jumpPage(pageNum);
                } else {
                    this.config.callback.tags_square_search.call(this, key);
                }
            },
            modelMapping: ["page"],
            setDefaultMapping: true
        });

        $(".album_options .option_tags_condition").attr("href", "photo.do?method=dashboard&model=photo" + document.location.href.replace(/(^.*\?method=tags_square)/, "").replace(/&filter=.*$/, ""));
    });
});