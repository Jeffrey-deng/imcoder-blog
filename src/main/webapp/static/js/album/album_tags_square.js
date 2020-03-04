/**
 * Created by Jeffrey.Deng on 2018/5/3.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', 'login_handle', 'toolbar', 'album_page_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, login_handle, toolbar, album_page_handle);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, login_handle, toolbar, album_page_handle) {

    //字符串的每一字符的范围
    var randomColorArr = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

    function getRandomColor() {
        //颜色字符串
        var colorValue = '';
        //产生一个六位的字符串
        for (var i = 0; i < 6; i++) {
            //15是范围上限，0是范围下限，两个函数保证产生出来的随机数是整数
            colorValue += randomColorArr[Math.ceil(Math.random() * (15 - 0) + 0)];
        }
        return "#" + colorValue;
    }

    // 找出匹配到的tag_wrapper
    function matchTag(photo, wrappers, tag, url_album_id) {
        if (!wrappers) {
            return null;
        }
        var hitWrappers = null;
        var breakMark = false;
        for (var i in wrappers) {
            try {
                var wrapper = wrappers[i];
                if (breakMark && wrapper.match_mode != 5) { // 已经匹配到action为break的wrapper后，只准运行match_mode=5的
                    continue;
                }
                if (wrapper.common_value == 0 && wrapper.uid != photo.uid) { // 用户设置比较器只能作用于自己的照片, 公共配置的除外
                    continue;
                }
                if (wrapper.type != 1) { // 不做匹配的标签跳过
                    continue;
                }
                if (wrapper.scope != '0' && wrapper.scope != url_album_id) { // 当该标签设置作用域为相册时，检查
                    continue;
                }
                var hitWrapper = null;
                var patterns = wrapper.patterns;
                var patternsMatches = wrapper.patternsMatches;
                switch (wrapper.match_mode) { // 匹配类型
                    case 0: // 全等
                        if (wrapper.pattern == tag) {
                            hitWrapper = wrapper;
                        }
                        break;
                    case 1: // 前缀
                        if (tag.indexOf(wrapper.pattern) == 0) {
                            hitWrapper = wrapper;
                        }
                        break;
                    case 2: // 后缀
                        if (tag.indexOf(wrapper.pattern) + wrapper.pattern.length == tag.length) {
                            hitWrapper = wrapper;
                        }
                        break;
                    case 3: // 正则
                        if (wrapper.pattern.test(tag)) {
                            hitWrapper = wrapper;
                        }
                        break;
                    case 4: // 包含
                        if (tag.indexOf(wrapper.pattern) != -1) {
                            hitWrapper = wrapper;
                        }
                        break;
                    case 5: // 同时包含多个tag, 支持正则，正则间以 && 或 空格 隔开
                        // !wrapper.hasResolved !patternsMatches[j] 已匹配成功不跳过是为了获取这种照片满足单独正则的每个tag,
                        // 跳过就只能获取到排序前的，因为满足条件了不执行后面的tag的匹配了
                        for (var j = 0; j < patterns.length; j++) {
                            if (patterns[j].test(tag)) {
                                patternsMatches[j] = true;
                                if (!wrapper.matchTags[tag]) {
                                    wrapper.matchTags[tag] = true;
                                }
                                hitWrapper = wrapper;
                            }
                        }
                        break;
                    default:
                        break;
                }
                if (hitWrapper && wrapper.match_mode == 5 && !wrapper.hasResolved) {  // 当多重匹配达成所有匹配条件的最后一个标签来的时候，标记为已完成，并记录该标签
                    wrapper.hasResolved = true; // 标记为已完成，防止下一次无需满足任何条件就匹配中了
                    for (var x in patternsMatches) {
                        if (!patternsMatches[x]) {
                            wrapper.hasResolved = false;
                            break;
                        }
                    }
                    if (wrapper.hasResolved) {
                        wrapper.completedTag = tag;  // 记录同时匹配模式满足最后一个条件而达成所有条件的那个tag，用来标记什么时候计数该多重匹配Wrapper
                    }
                }
                if (hitWrapper) {
                    if (hitWrappers == null) {
                        hitWrappers = [];
                    }
                    hitWrappers.push(hitWrapper);
                    if (hitWrapper.match_mode == 5) {
                        if (breakMark) {
                            hitWrappers[hitWrappers.length] = hitWrappers[hitWrappers.length - 1];
                            hitWrappers[hitWrappers.length - 1] = hitWrapper;
                        }
                    }
                    if (hitWrapper.action == 1) {
                        breakMark = true;
                    }
                }
            } catch (e) {
                console.warn(e);
            }
        }
        return hitWrappers;
    }

    // 从照片列表中查询出标签列表，并按照用户设置的权重排序，并用filter参数过滤
    function takeOutTags(photos, sourceTagWrappers, config) {
        var isExtend = (config.load_condition.extend != 'false' && sourceTagWrappers && sourceTagWrappers.length > 0);
        var wrappers = [];
        if (sourceTagWrappers && sourceTagWrappers.length > 0) {
            for (var x in sourceTagWrappers) {
                var wrapper = sourceTagWrappers[x];
                if (wrapper.type == 1) {
                    if (wrapper.match_mode == 3) {  // 当match_mode为匹配正则时，先编译好正则
                        wrapper.pattern = new RegExp(wrapper.pattern);
                    } else if (wrapper.match_mode == 5) {   // 当match_mode为同时包含多个tag时，先编译好正则数组，并构建变量数组记录标记
                        var patternSplits = wrapper.pattern.split(/\s*&&\s*|\s+/);
                        wrapper.patterns = new Array(patternSplits.length);
                        for (var y in patternSplits) {
                            wrapper.patterns[y] = new RegExp(patternSplits[y]);
                        }
                        wrapper.patternsMatches = new Array(wrapper.patterns.length).fill(false);
                    }
                    wrapper.color = getRandomColor();
                    wrappers.push(wrapper);
                }
            }
        }
        var isFilterTags = false; //标记是显示该条件下，所有标签还是利用filter值过滤标签后的标签
        var filterTagRegex = null;
        if (config.load_condition.filter) {
            isFilterTags = true;
            filterTagRegex = new RegExp(config.load_condition.filter);
        }
        if (config.load_condition.hasOwnProperty('filter')) {
            delete config.load_condition.filter;
        }
        config.isFilterTags = isFilterTags;
        var url_album_id = (config.load_condition.album_id ? config.load_condition.album_id : 0);
        var tagsMap = {};   // 存储分割出的标签
        var notExtraTagMap = {}; // 记录每个不额外显示的父标签的数量
        $.each(photos, function (i, photo) {
            var tags = photo.tags ? photo.tags.split('#') : [];
            for (var y in wrappers) {   // 每个照片的多重包含匹配的标记值都重置为false
                var multiWrapper = wrappers[y];
                if (multiWrapper.match_mode == 5) {
                    multiWrapper.hasResolved = false;
                    multiWrapper.patternsMatches.fill(false);
                    multiWrapper.matchTags = {};
                    multiWrapper.completedTag = undefined;
                }
            }
            var once = {}; // 一个图片只对同一个 wrapper或标签 计数一次
            $.each(tags, function (i, tag) {
                if (tag) {
                    var hit = false;
                    var hitFirstWrapper = null;
                    var hitWrappers = null;
                    if (isExtend) { // 如果是扩展模式（分组模式）
                        hitWrappers = matchTag(photo, wrappers, tag, url_album_id);
                        if (hitWrappers) {
                            var wrapper;
                            for (var j in hitWrappers) {
                                wrapper = hitWrappers[j];
                                if (j == 0) {
                                    hitFirstWrapper = wrapper;
                                }
                                if (isFilterTags && filterTagRegex.test(wrapper.name)) { // 如果匹配到了且父标签满足过滤条件，则让子标签通过
                                    hit = true;
                                    break;
                                }
                            }
                            for (var i in hitWrappers) {
                                if (hitWrappers[i].match_mode == 5 && !(hitWrappers[i].hasResolved && hitWrappers[i].completedTag == tag)) {
                                    continue;
                                }
                                wrapper = hitWrappers[i];
                                if (!once[wrapper.name]) {
                                    // 如果父标签需要额外单独显示, 只显示被过滤的标签
                                    if (wrapper.extra == 1 && (!isFilterTags || filterTagRegex.test(wrapper.name))) {
                                        var groupTag = tagsMap[wrapper.name];   // 父类标签计数加1
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
                                                },
                                                "color": wrapper.color
                                            };
                                            tagsMap[wrapper.name] = groupTag;
                                        }
                                        if (!groupTag.isGroup) {
                                            groupTag.isGroup = true;
                                        }
                                        groupTag.count++;
                                        once[wrapper.name] = true;
                                    } else if (wrapper.extra == 0) {    // 保存不显示的标签的计数值，以防特殊情况下统计需要用到
                                        var notExtraTag = notExtraTagMap[wrapper.name];
                                        if (!notExtraTag) {
                                            notExtraTag = {
                                                "name": wrapper.name,
                                                "count": 0,
                                                "weight": wrapper.weight,
                                                "description": wrapper.description,
                                                "color": wrapper.color
                                            };
                                            notExtraTagMap[wrapper.name] = notExtraTag;
                                        }
                                        notExtraTag.count++;
                                        once[wrapper.name] = true;
                                    }
                                }
                            }
                        }
                    }
                    if (hit == false && isFilterTags && !filterTagRegex.test(tag)) {    //正则过滤标签
                        return true;
                    }
                    increaseTagCount(tagsMap, tag, photo, hitFirstWrapper, once);
                }
            });
            // // 当前所使用模式下的数据价值是能得到交集父标签在每个子标签中的所占比例（此效果需要查询条件不带tags）
            // // 而以下这种方式下的数据价值是能得到交集父标签对每个子标签的依赖程度
            // // 而这种依赖程度从pattern的表达式就能很轻易的看出来
            // // 故舍弃一下这种方式
            // if (isExtend && isFilterTags) { // 当filter模式下，才会有这个漏洞
            //     for (var y in wrappers) {   // 给多重包含wrapper匹配的tag前面因为还没有满足全部条件而没有加1的tag重新加1
            //         var multiWrapper = wrappers[y];
            //         if (multiWrapper.match_mode == 5) {
            //             if (multiWrapper.hasResolved && filterTagRegex.test(multiWrapper.name)) {
            //                 var includeTags = Object.keys(multiWrapper.matchTags);
            //                 if (includeTags && includeTags.length > 1) {
            //                     for (var z = 0, itLength = includeTags.length; z < itLength; z++) {
            //                         var includeTag = includeTags[z];
            //                         if (multiWrapper.completedTag != includeTag) {  // 去掉最后达成条件的那个tag，因为已经加1，故这里跳过最后一个
            //                             increaseTagCount(tagsMap, includeTag, photo, multiWrapper, once);
            //                         }
            //                     }
            //                 }
            //             }
            //         }
            //     }
            // }
        });
        $.each(notExtraTagMap, function (key, value) {  // 当为父类名称的标签被设置不额外显示时，如果又被用户使用，则将其数量重置为子类标签之和
            var notExtraTag = tagsMap[key];
            if (notExtraTag) {
                if (notExtraTag.isGroup) {
                    notExtraTag.count = notExtraTag.count + value.count;
                } else {
                    notExtraTag.count = notExtraTag.count + value.count;
                    notExtraTag.weight = value.weight;
                    notExtraTag.extend = true;
                    notExtraTag.description = value.description;
                    notExtraTag.color = value.color;
                }
            }
        });
        var tagInfos = [];
        $.each(tagsMap, function (key, value) {
            if (value.count > 0) {
                tagInfos.push(value);
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

    var increaseTagCount = function (tagsMap, tag, photo, wrapper, once) {
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
                },
                "color": wrapper ? wrapper.color : undefined
            };
            tagsMap[tag] = tagInfo;
        }
        if (!once[tag]) { // 当子标签与父标签名称相同或重复标签时，只增加一次
            tagInfo.count++;
            once[tag] = true;
        }
    };

    domReady(function () {

        var albumConfig = globals.getLocalConfig('album', {
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
            },
            "tags_square_page": {
                "tag_wrapper_diff_color": false
            }
        });
        if (albumConfig.album_page.full_background) {
            $('body').css('background-image', $('#first').css('background-image'));
            $('#first').css('background-image', '');
        }

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.album_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var col = params.col;
        var fromAlbumDetailPage = (params.from && params.album_id && (params.from.indexOf('album_detail') != -1));
        var load_condition = {};
        var cloud_photo_preview_args = '';
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        var titleStr = '';
        $.each(params, function (key, value) {
            if (key != 'size' && key != 'page' && key != 'method' && key != 'col') {
                load_condition[key] = value && decodeURIComponent(decodeURIComponent(value));
                titleStr += '&' + key + '=' + load_condition[key];
            }
        });
        if (titleStr) {
            $('head').find('title').text(titleStr.substring(1) + ' | 标签索引 - 相册');
        }

        // 重写一个支持特殊符号做id的选择器
        album_page_handle.utils.getAlbumDom = function (album_id) {
            var encodeId = album_id;
            var jsArr = album_page_handle.config.jsSpecialChars;
            var jqueryArr = album_page_handle.config.jquerySpecialChars;
            $.each(jsArr, function (i, char) {
                encodeId = encodeId.replace(new RegExp('\\' + char, 'g'), '\\' + char);
            });
            $.each(jqueryArr, function (i, char) {
                encodeId = encodeId.replace(new RegExp(char, 'g'), '\\' + char);
            });
            return $('#' + album_page_handle.config.selector.album_id_prefix + encodeId);
        };
        var calls = [];
        album_page_handle.init({
            jsSpecialChars: ["\\", "^", "$", "*", "?", ".", "+", "(', ')", "[", "]", "|", "{", "}"],
            jquerySpecialChars: ["~", "`", "@", "#", "%", "&", "=", "'", "\"", ":", ";", "<", ">", ",", "/"],
            callback: {
                "loadAlbums_callback": function (config, success) { // 加载相册列表的回调
                    globals.notify().progress('正在加载数据', '', 'notify_photos_loading');
                    let condition = $.extend(true, {"query_size": 0}, config.load_condition), context = this;
                    if (condition["query_start"] === undefined) {
                        if (condition["topic.ptwid"] ||
                            condition["topic.name"] ||
                            ((condition["uid"] || condition["album_id"]))) {
                            condition.query_start = -1;
                        }
                    }
                    if (condition.from) {
                        condition.base = condition.from;
                    } else {
                        condition.base = "album_tags_square";
                    }
                    if (!config.load_condition.extend) {   // 加载数据时extend默认为true, 显示指定为false时，不加载tagWrappers，同时不会按tag_wrapper排序
                        condition.extend = "true";
                    }
                    condition.from = "album_tags_square"; // extend=true + from=album_tags_square 将返回tagWrappers列表
                    return globals.request.get(globals.api.getPhotoList, condition, true, '加载照片列表失败').final(function (data) {
                        globals.getNotify('notify_photos_loading').find('.toast-message').text('正在计算数据');
                        fromAlbumDetailPage && (config.load_condition.from = "album_detail_tags");
                        cloud_photo_preview_args = data.cloud_photo_preview_args;
                        let photos = data.photos;
                        if (!photos) {
                            globals.removeNotify('notify_photos_loading');
                            return;
                        }
                        let isNotExtend = config.load_condition.extend == "false";
                        let tagInfos = null;
                        let dfd = $.Deferred();
                        globals.getNotify('notify_photos_loading').find('.toast-message').text('正在计算排序');
                        if (isNotExtend || data.tagWrappers) {
                            config.tagWrappers = data.tagWrappers;
                            tagInfos = takeOutTags(data.photos, data.tagWrappers, config);
                            dfd.resolve(tagInfos);
                        } else {
                            let params = {};
                            params.uid = config.load_condition.uid || 0;
                            params.type = 1;
                            globals.request.get(globals.api.getTagWrapperList, params, true, ['tagWrappers']).final(function (tagWrappers) {
                                data.tagWrappers = tagWrappers
                            }, function () {
                                data.tagWrappers = [];
                            }).always(function () {
                                config.tagWrappers = data.tagWrappers;
                                tagInfos = takeOutTags(data.photos, data.tagWrappers, config);
                                dfd.resolve(tagInfos);
                            });
                        }
                        dfd.done(function (tagInfos) {
                            globals.removeNotify('notify_photos_loading');
                            success.call(context, {"albums": tagInfos});
                            if (tagInfos.length == 0) {
                                globals.notify({
                                    "progressBar": false,
                                    "hideDuration": 0,
                                    "showDuration": 0,
                                    "timeOut": 10000,
                                    "closeButton": false
                                }).success('抱歉，未找到您要的内容', '', 'notify_tags_loading_empty');
                            }
                        });
                    }, function () {
                        globals.removeNotify('notify_photos_loading');
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
                    var album_node = this.utils.getAlbumDom(album.album_id);
                    album_node.find('img').click();
                },
                "makeupNode_callback": function (album_node, album) {
                    var context = this;
                    var config = context.config;
                    var album_href_suffix = config.album_href_suffix;
                    if (album_href_suffix == undefined) {
                        album_href_suffix = '';
                        config.realTagValue = null;
                        config.album_href_tags_regex = null;
                        $.each(config.load_condition, function (key, value) {
                            if (!value) {
                                return true;
                            }
                            if (key == 'extend') {
                                return true;
                            }
                            if (key == 'tags') {
                                config.realTagValue = value.replace(/^<|>$/g, '');
                                if (config.load_condition.extend == 'false') {
                                    config.album_href_tags_regex = encodeURIComponent(toolbar.utils.encodeRegexSearch('tags', '@ANOTHER#' + value));
                                } else {
                                    var supportRegex = (config.tagWrappers && config.tagWrappers.filter(function (wrapper) {
                                        return wrapper.name == config.realTagValue;
                                    }).length > 0) ? false : true;
                                    if (supportRegex) {
                                        config.album_href_tags_regex = encodeURIComponent(toolbar.utils.encodeRegexSearch('tags', '@ANOTHER#' + value));
                                    } else { // // 如果tags不支持正则匹配，则去掉条件
                                        config.album_href_tags_regex = null;
                                    }
                                }
                            } else {
                                album_href_suffix += '&' + key + '=' + value;
                            }

                        });
                        config.album_href_suffix = album_href_suffix;
                    }
                    var a = album_node.querySelector('a');
                    if (album.extend != true && config.album_href_tags_regex && config.realTagValue != album.album_id) {
                        a.href = (config.album_href_prefix + config.album_href_tags_regex.replace(new RegExp(encodeURIComponent('@ANOTHER'), 'g'), '<' + album.album_id + '>') + album_href_suffix).toURL();
                    } else {
                        a.href = (config.album_href_prefix + '<' + album.album_id + '>' + album_href_suffix).toURL();
                    }
                    if (album.extend) { // 是否是用户特殊标注的标签
                        a.href = (a.href + '&extend=true').toURL();
                    }
                    a.title = (album_href_suffix || config.album_href_tags_regex) ? ('查看该条件下的' + album.album_id + '标签') : '点击查看照片';
                    var span = album_node.querySelector('span');
                    span.title = (album_href_suffix || config.album_href_tags_regex) ? ('查看该条件下的' + album.album_id + '标签') : '点击查看照片';
                    span.innerText = span.innerText + '（' + album.count + '张）';
                    if (album.extend && album.description) {
                        a.setAttribute('title', a.title + '\nexplain：' + album.description);
                    }
                    // 颜色
                    if (albumConfig.tags_square_page.tag_wrapper_diff_color && album.color) {
                        let img = album_node.querySelector('img');
                        img.style.boxShadow = '0 0 12px ' + album.color;
                    }
                    album_node.setAttribute('data-weight', album.weight);
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
            album_href_prefix: "p/dashboard?model=photo&tags="
        });

        // 判断当前页面的标签索引的数量
        var isHomePage = Object.keys(load_condition).length == 0 || (Object.keys(load_condition).length == 1 && load_condition.uid) ? true : false;
        var lastSearchKey = null;   //上一次搜索的key
        var nextViewIndex = 0;  //当前准备查看的搜索结果数组index
        toolbar.rewriteSearch({
            placeholder: (isHomePage ? '输入关键字搜索标签' : '搜索本页面标签'),
            model_action: function (key) {
                lastSearchKey = key;
                var context = this;
                key = key.trim();
                if (!isHomePage) {
                    if (key == '') {
                        toastr.info('请输入！', '', {"progressBar": false});
                        return;
                    } else {
                        var openNewFilterPage = false;
                        context.utils.eachEntry(key, ["filter", "f"], function (entry) {
                            openNewFilterPage = true;
                            return false;
                        });
                        if (openNewFilterPage) {
                            var isAppendCurrentConditionTest = new RegExp("^\\s*(filter|f)" +
                                context.config.special_value_separator.toString().replace(/\//g, "") +
                                ".+?" + context.config.special_pair_separator.toString().replace(/\//g, "") + '{0,1}\\s*$');
                            if (isAppendCurrentConditionTest.test(key)) {
                                var currSearch = decodeURI(document.location.search);
                                key = (currSearch && (currSearch + '&')).replace(/^\?/, '') + key;
                            }
                            context.config.callback.tags_square_search.call(context, key);
                            return false;
                        }
                    }
                    globals.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "showDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success('正在查找。。', '', 'search_tags_in_album');

                    // 还原el
                    var match = key.match(new RegExp(context.config.special_replace_prefix + '\\d{1}', 'g'));
                    if (match) {
                        for (var i = 0; i < match.length; i++) {
                            key = key.replace(match[i], context.config.elMap[match[i]]);
                        }
                    }

                    var results = [];
                    var filterKey = new RegExp(key, 'i');
                    $.each(album_page_handle.pointer.albums, function (i, cache) {
                        if (filterKey.test(cache.album_id)) {
                            results.push(cache);
                        }
                    });
                    if (results.length == 0) {
                        globals.removeNotify('search_tags_in_album');
                        toastr.info('该相册内未找到该标签！', '', {"progressBar": false});
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
                        globals.removeNotify('search_tags_in_album');
                        $.each(results, function (i, result) {
                            album_page_handle.utils.getAlbumDom(result.album_id).find('.album_name span')
                                .css('background-color', '#faebcc');
                        });
                        setTimeout(function () {
                            var span = album_page_handle.utils.getAlbumDom(results[nextViewIndex].album_id).find('.album_name span');
                            var scroll = span.offset().top - $(window).height() * (2 / 3);
                            $('html,body').animate({scrollTop: scroll}, 300);
                            nextViewIndex++;
                        }, 70);
                        calls.splice(calls.indexOf(indexAlbum), 1);
                    };
                    calls.push(indexAlbum);
                    album_page_handle.jumpPage(pageNum);
                } else {
                    context.config.callback.tags_square_search.call(context, key);
                }
            },
            modelMapping: ["page"],
            setDefaultMapping: true
        });

        var tags_condition_href = document.location.href.replace(/(^.*p\/tags_square\??)/, "").replace(/&filter=.*$/, "").replace(/&page=\d+/, '');
        $('.album_options .option_tags_condition').url('href', 'p/dashboard?model=photo' + (tags_condition_href ? ('&' + tags_condition_href) : ''));
    });
});