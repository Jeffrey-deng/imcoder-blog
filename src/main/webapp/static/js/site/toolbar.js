/**
 * 页面工具栏
 * @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'stickUp', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.toolbar = factory(window.jQuery, $(document).ready, toastr, jQuery.fn.stickUp, common_utils, login_handle);
    }
})(function ($, domReady, toastr, stickUp, common_utils, login_handle) {

    var _self = $('#header');

    var config = {
        "location_info": common_utils.parseURL(window.location.href),
        "path_params": {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        },
        "special_replace_prefix": "@replaceEL_",
        "special_pair_separator": /[&;；,，]/,   //每一对键值对的分隔符
        "special_value_separator": /[:：=]/,    //键与值的分隔符
        "special_search_object": {    //需要特殊处理的关键字
            "model_schema": ["model", "mode", "m"],
            "photo_schema": ["logic_conn", "name", "description", "desc", "tag", "tags", "uid", "photo_id", "id", "album_id", "aid", "originName", "origin", "path", "image_type", "topic.ptwid", "topic.name", "type", "from", "extend", "accessed", "liked", "commented"],
            "article_schema": ["logic_conn", "id", "aid", "author.uid", "uid", "category.atid", "atid", "title", "tag", "tags", "summary", "create_time", "update_time", "click", "top", "recommend", "accessed", "collected", "commented"],
            "album_schema": ["id", "album_id", "name", "description", "desc", "user.uid", "uid"]
        },
        "special_multiple_match_joiner": "' and ${column} rlike '",    //多重匹配,
        "callback": {
            "action_search": function (key) {
                var context = this;
                if (!key) {
                    config.special_model_mapping["default"].call(context, key);
                    return;
                }
                // 替换搜索输出中的EL表达式， 如果要使用（忽略）分割字符, 用 ""、{}、${} 包裹
                var elMap = context.config.elMap = {}; // 保存el标记内的key
                var elSourceMap = context.config.elSourceMap = {};  // 保存标记包含el表达式的符号包裹
                key = common_utils.replaceByEL(key, function (index, key) {
                    var replaceMark = context.config.special_replace_prefix + index;
                    elMap[replaceMark] = key;
                    elSourceMap[replaceMark] = this[0];
                    return replaceMark;
                });
                var model = null;
                var modelPairRegex = null;
                context.utils.eachEntry(key, context.config.special_search_object.model_schema, function (entry) {
                    model = entry[1].trim();
                    modelPairRegex = entry[0] + context.config.special_value_separator.toString().replace(/\//g, "") +
                        entry[1] + context.config.special_pair_separator.toString().replace(/\//g, "") + "{0,1}";
                    return false;
                });
                // 去掉标记模式的字段
                if (modelPairRegex) {
                    key = key.replace(new RegExp(modelPairRegex), "");
                }
                if (model && config.special_model_mapping[model]) {
                    config.special_model_mapping[model].call(context, key);   // mapping module
                } else {
                    config.special_model_mapping["default"].call(context, key); // mapping default module
                }
            },
            "photo_search": function (key) {
                var isFindSpecial = false; //标记是否找到特殊关键字
                var photo_url = "p/dashboard?model=photo";
                if (key == "") {
                    window.open(photo_url);
                    return;
                }
                // 如果不是直接输入的本站图片URL
                if (!/^https?:\/\/[a-z0-9\.:]+\/([\x21-\x7e]*\/)?(user\/\w+\/photos\/\w+\/[0-9a-zA-Z_\.]+\.(gif|jpe?g|png|bmp|svg|ico))(\?[\x21-\x7e]*)?$/.test(key)) {
                    // Users can search exactly by special keywords in input box.
                    // input eg: tags:邓超 ， convert to "&tags=邓超"
                    // input eg: tags:邓超,album_id=5 ， convert to "&tags=邓超&album_id=5"
                    // input EL eg: path:${http://imcoder.site} ， convert to "&path=http://imcoder.site", this way can ignore keyword ":"
                    // 工具方法遍历pair_key每一个在schema中的pair，回调返回false跳出循环
                    context.utils.eachEntry(key, context.config.special_search_object.photo_schema, function (entry) {
                        // 还原标记位被el表达式保留的value
                        context.utils.revertELReplaceContent(entry, ["tags", "tag"]);
                        // 修正变量名
                        entry[0] == "desc" && (entry[0] = "description");
                        entry[0] == "origin" && (entry[0] = "originName");
                        entry[0] == "id" && (entry[0] = "photo_id");
                        entry[0] == "aid" && (entry[0] = "album_id");
                        entry[0] == "tag" && (entry[0] = "tags");
                        entry[0] == "type" && (entry[0] = "image_type");
                        // 转化图片路径为相对路径
                        entry[0] == "path" && (entry[1] = (
                            entry[1].match(/^https?:\/\/[a-z0-9\.:]+\/([\x21-\x7e]*\/)?(user\/\w+\/photos\/\w+\/[0-9a-zA-Z_\.]+\.(gif|jpe?g|png|bmp|svg|ico))(\?[\x21-\x7e]*)?$/) ? RegExp.$2 : entry[1]));
                        // 编码正则表达式
                        entry[0] == "tags" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                        photo_url += "&" + entry[0] + "=" + encodeURIComponent(entry[1]);
                        isFindSpecial = true;
                    });
                } else { // 直接输入的本站图片URL则直接查找该图片
                    isFindSpecial = true;
                    photo_url += "&path=" + encodeURIComponent(RegExp.$2)
                }
                if (isFindSpecial) {
                    window.open(photo_url);
                } else if (/^[\d]+$/.test(key)) {
                    window.open(photo_url + "&photo_id=" + key + "&name=" + key + "&description=" + key + "&tags=" + key + "&logic_conn=or");
                } else {
                    key = encodeURIComponent(key);
                    window.open(photo_url + "&name=" + key + "&description=" + key + "&tags=" + key + "&logic_conn=or");
                }
            },
            "article_search": function (key) {
                var isFindSpecial = false; //标记是否找到特殊关键字
                var article_url = "";
                if (key == "") {
                    window.open("a/list");
                    return;
                }
                context.utils.eachEntry(key, context.config.special_search_object.article_schema, function (entry) {
                    // 还原标记位被el表达式保留的value
                    context.utils.revertELReplaceContent(entry, ["tags", "tag", "title"]);
                    // 修正变量名
                    entry[0] == "id" && (entry[0] = "aid");
                    entry[0] == "uid" && (entry[0] = "author.uid");
                    entry[0] == "atid" && (entry[0] = "category.atid");
                    entry[0] == "tag" && (entry[0] = "tags");
                    // 编码正则表达式
                    entry[0] == "tags" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                    entry[0] == "title" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                    article_url += "&" + entry[0] + "=" + encodeURIComponent(entry[1]);
                    isFindSpecial = true;
                });
                if (!isFindSpecial) {
                    key = encodeURIComponent(key);
                    article_url += "&title=" + key;
                }
                article_url = "a/list" + (article_url ? ("?" + article_url.substring(1)) : "");
                window.open(article_url);
            },
            "album_search": function (key) {
                var isFindSpecial = false; //标记是否找到特殊关键字
                var album_url = "p/dashboard?model=album";
                if (key == "") {
                    window.open(album_url);
                    return;
                }
                context.utils.eachEntry(key, context.config.special_search_object.album_schema, function (entry) {
                    // 还原标记位被el表达式保留的value
                    context.utils.revertELReplaceContent(entry, ["name"]);
                    // 修正变量名
                    entry[0] == "id" && (entry[0] = "album_id");
                    entry[0] == "desc" && (entry[0] = "description");
                    entry[0] == "uid" && (entry[0] = "user.uid");
                    // 编码正则表达式
                    entry[0] == "name" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                    album_url += "&" + entry[0] + "=" + encodeURIComponent(entry[1]);
                    isFindSpecial = true;
                });
                if (isFindSpecial) {
                    window.open(album_url);
                } else {
                    key = encodeURIComponent(key);
                    window.open(album_url + "&name=" + key);
                }
            },
            "tags_square_search": function (key) {
                var isFindSpecial = false; //标记是否找到特殊关键字
                var tags_square_url = "";
                if (key == "") {
                    window.open("p/tags_square");
                    return;
                }
                var filterKeyWord = null;
                var filterPairRegex = null;
                context.utils.eachEntry(key, ["filter", "f"], function (entry) {
                    filterPairRegex = entry[0] + context.config.special_value_separator.toString().replace(/\//g, "") +
                        entry[1] + context.config.special_pair_separator.toString().replace(/\//g, "") + "{0,1}";
                    context.utils.revertELReplaceContent(entry, ["filter", "f"]); // 利用el表达式忽略的filter中的正则
                    filterKeyWord = entry[1].trim();
                });
                // 去掉标记过滤的字段
                if (filterPairRegex) {
                    key = key.replace(new RegExp(filterPairRegex), "");
                }
                context.utils.eachEntry(key, context.config.special_search_object.photo_schema, function (entry) {
                    // 还原标记位被el表达式保留的value
                    context.utils.revertELReplaceContent(entry, ["tags", "tag"]);
                    // 修正变量名
                    entry[0] == "desc" && (entry[0] = "description");
                    entry[0] == "origin" && (entry[0] = "originName");
                    entry[0] == "id" && (entry[0] = "photo_id");
                    entry[0] == "aid" && (entry[0] = "album_id");
                    entry[0] == "tag" && (entry[0] = "tags");
                    // 转化图片路径为相对路径
                    entry[0] == "path" && (entry[1] = entry[1].replace(context.config.path_params.cloudPath, ""));
                    // 编码正则表达式
                    entry[0] == "tags" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                    tags_square_url += "&" + entry[0] + "=" + encodeURIComponent(entry[1]);
                    isFindSpecial = true;
                });
                if (isFindSpecial) {
                    tags_square_url += (filterKeyWord ? ("&filter=" + encodeURIComponent(filterKeyWord)) : "");
                } else if (filterKeyWord) {
                    tags_square_url += "&filter=" + encodeURIComponent(filterKeyWord);
                } else {
                    tags_square_url += (key ? ("&filter=" + encodeURIComponent(key)) : "");
                }
                tags_square_url = "p/tags_square" + (tags_square_url ? ("?" + tags_square_url.substring(1)) : "");
                window.open(tags_square_url)
            }
        },
        "placeholder": null,
        "inputInitialValue": null,
        "hasReadHelp": true
    };

    var init_search = function () {
        var isPhotoPage = false;
        if (config.location_info.segments) {
            $.each(config.location_info.segments, function (i, seg) {
                if (seg == "p" || seg == "albums" || seg == "videos" || seg == "photos") {
                    isPhotoPage = true;
                }
            });
        }
        config.placeholder = isPhotoPage ? "输入关键字搜索照片" : "输入关键字搜索";
        var searchInputBox = _self.find('.toolbar_search_input');
        searchInputBox.attr("placeholder", config.placeholder);
        config.inputInitialValue && searchInputBox.val(config.inputInitialValue);
        config.special_model_mapping = {
            "default": function (key) {
                if (isPhotoPage) {
                    config.callback.photo_search.call(context, key);
                } else {
                    config.callback.article_search.call(context, key);
                }
            },
            "photo": config.callback.photo_search,
            "p": config.callback.photo_search,
            "photos": config.callback.photo_search,
            "article": config.callback.article_search,
            "a": config.callback.article_search,
            "album": config.callback.album_search,
            "ts": config.callback.tags_square_search
        };
        var searchConfig = common_utils.getLocalConfig("search", {"hasReadHelp": false}); // 搜索帮助
        if (!searchConfig.hasReadHelp) {
            searchInputBox.focus(function (e) {
                try {
                    var searchConfig = common_utils.getLocalConfig("search");
                    if (!searchConfig.hasReadHelp) {
                        common_utils.notify({
                            "timeOut": 10000,
                            "progressBar": false,
                            "iconClass": "toast-success-no-icon",
                            "positionClass": "toast-top-right",
                            "onclick": function () {
                                window.open("site/help?module=search");
                                searchConfig.hasReadHelp = true;
                                common_utils.setLocalConfig("search", searchConfig);
                            }
                        }).success("点击查看搜索帮助", "提示", "notify_search_help");
                    }
                } catch (e) {
                    console.warn("搜索帮助配置出现错误", e);
                }
            });
        }
        // bind search btn
        _self.find('.toolbar_search_trigger').click(function (e) {
            var key = _self.find('.toolbar_search_input').val();
            config.callback.action_search.call(context, key);
            e.preventDefault();
        });
        searchInputBox.parent().parent().keydown(function (e) {
            var theEvent = e || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            if (code == 13) {// keyCode=13是回车键
                _self.find('.toolbar_search_trigger').click();
                // 防止触发表单提交 返回false
                // e.preventDefault();
                return false;
            }
        });
        // quickly search
        $(document).keyup(searchHotKey_event);
    };

    // 按 s 或 f 搜索
    var searchHotKey_event = function (e) {
        var theEvent = e || window.event;
        var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
        var tagName = e.target.tagName;
        if ((code == 83 || code == 70) && !e.target.isContentEditable && tagName != "INPUT" && tagName != "TEXTAREA") { // S键或F键
            _self.find('.toolbar_search_input').focus(); // 将焦点定位到输入框
        }
    };

    /**
     *  重写搜索响应
     * {
     *  {String} placeholder, // 搜索框提示值
     *  {String} inputInitialValue, // 搜索框默认值
     *  {Function} model_action, // 搜索模块响应
     *  {Array} modelMapping, // 搜索模块映射名称
     *  {Boolean} setDefaultMapping  // 是否设置成默认模块，默认false
     *  {Boolean} searchHotKey  // 是否开启搜索快捷键，默认true
     * }
     * @param options
     */
    var rewriteSearch = function (options) {
        if (!options) {
            return;
        }
        options.placeholder && _self.find('.toolbar_search_input').attr("placeholder", options.placeholder);
        options.inputInitialValue && _self.find(".toolbar_search_input").val(options.inputInitialValue);
        if (options.model_action && options.modelMapping) {
            $.each(options.modelMapping, function (i, mapping) {
                config.special_model_mapping[mapping] = options.model_action;
            });
            if (options.setDefaultMapping == true) {
                config.special_model_mapping["default"] = options.model_action;
            }
        }
        if (options.hasOwnProperty("searchHotKey") && options["searchHotKey"] == false) {
            $(document).unbind("keyup", searchHotKey_event); // 特殊页面可配置searchHotKey关闭搜索快捷键
        }
    };

    // bind toolbar always on top
    function bind_always_top() {
        $("#header").stickUp({
            parts: {
                0: 'header'
            }
            // itemClass: 'menuItem',
            // itemHover: 'active',
            // topMargin: 'auto'
        });
    }

    //回到顶部
    function bind_goTop() {
        if ($('#goTop').length > 0) {
            $('#goTop').css("bottom", "-40px");
            $('#goTop').click(function (event) {
                event.preventDefault();
                $('html,body').animate({scrollTop: 0}, 500);
            });
        }
        if ($('#goBottom').length <= 0) {
            $("body").append(
                '<div id="goBottom" class="goBottom" style="bottom: 25px;"><div class="stick"></div><div class="arrow"></div>'
            );
        }
        $('#goBottom').click(function (event) {
            event.preventDefault();
            var h = $(document).height() - $(window).height();
            $('html,body').animate({scrollTop: h}, 750);
        });
        $(window).scroll(function () {
            if ($(this).scrollTop() > 150) {
                $('#goTop').stop().animate({bottom: '70px'}, 300);
                $('#goBottom').stop().animate({bottom: '25px'}, 300);
            } else {
                $('#goTop').stop().animate({bottom: '-40px'}, 300);
                $('#goBottom').stop().animate({bottom: '-40px'}, 300);
            }
        });
    }

    // 初始化导航栏链接
    function init_toolbar_href() {

        // bind_click
        _self.find('.toolbar_jump_writeblog').click(function () {
            jump_writeblog();
        });
        _self.find('.toolbar_jump_login').click(function () {
            login_handle.jumpLogin(window.location.href, true);
        });
        _self.find('.toolbar_user_logout').click(function () {
            logout();
        });

        _self.find('.toolbar_jump_albums').attr("href", "p/dashboard?model=album");

        _self.find('.toolbar_jump_help').attr("href", "help");

        _self.find('.toolbar_jump_notice').attr("href", "notices");

        _self.find('.toolbar_jump_cloud').attr("href", "cloud/share");
    }

    //写博客
    function jump_writeblog() {
        if (!login_handle.validateLogin()) {
            //弹出登陆框
            login_handle.jumpLogin("a/edit?mark=new", true);
        } else {
            //跳转
            window.open("a/edit?mark=new");
        }
    }

    //安全退出
    function logout() {
        login_handle.clearLoginStatus();
    }

    var utils = {
        /**
         * 还原标记位被el表达式保留的value
         * @param {Array} entry
         * @param {Array} ignoreBraceRegexProps - 需要保留{ }符号的属性
         */
        "revertELReplaceContent": function (entry, ignoreBraceRegexProps) {
            if (entry && entry[1] && entry[1].trim().indexOf(context.config.special_replace_prefix) != -1) {
                var match = entry[1].match(new RegExp(context.config.special_replace_prefix + "\\d{1}", "g"));
                if (match) {
                    // 遍历，就是一个value可以写多个el表达式
                    for (var i = 0; i < match.length; i++) {
                        // 如果el符号为 { }，则保留{}符号
                        if (ignoreBraceRegexProps && ignoreBraceRegexProps.indexOf(entry[0]) != -1 && context.config.elSourceMap[match[i]].indexOf("{") == 0) {
                            entry[1] = entry[1].replace(match[i], context.config.elSourceMap[match[i]]);
                        } else { // 如果el符号为 ${} "" “”，则去除el符号
                            entry[1] = entry[1].replace(match[i], context.config.elMap[match[i]]);
                        }
                    }
                }
            }
        },
        /**
         * 遍历pair_key每一个在schema中的pair，回调返回false跳出循环
         * @param {String} key - 被遍历的字符串
         * @param {Array} schema - 当pair_key在schema数组中时候执行回调方法
         * @param {Function} entryCallBack
         */
        "eachEntry": function (key, schema, entryCallBack) {
            $.each(key.split(context.config.special_pair_separator), function (index, pair) {
                if (pair) {
                    var entry = pair.split(context.config.special_value_separator);
                    entry[0] = entry[0].trim();
                    if (entry.length > 1 && schema.indexOf(entry[0]) != -1) {
                        if (entryCallBack(entry) == false) {
                            return false;
                        }
                    }
                }
            });
        },
        "encodeRegexSearch": function (key, value) {
            //在前端转义匹配逻辑为数据库可识别的正则字符串
            //由于在后端又实现了转义，所以此方法失效
            // value = utils.encodeRegexSearchInWeb(key, value);
            value = value.replace(/(^[\|#])|([\|]$)/g, "");  // 去掉首尾|与首#
            // value = encodeURIComponent(value);  // 转义
            return value;
        },
        /**
         * @deprecated 失效
         * 在前端转义匹配逻辑为数据库可识别的正则字符串
         * @param key
         * @param value
         */
        "encodeRegexSearchInWeb": function (key, value) {
            value.indexOf("<") != -1 && (value = value.replace(/\{<\}|\\\\</g, "@WD_BR_L").replace(/</g, "[[:<:]]").replace(/@WD_BR_L/g, "{<}")); // 替换 < 为单词头
            value.indexOf(">") != -1 && (value = value.replace(/\{>\}|\\\\>/g, "@WD_BR_R").replace(/>/g, "[[:>:]]").replace(/@WD_BR_R/g, "{>}")); // 替换 > 为单词尾
            if (value.indexOf("{") != -1) {
                value = common_utils.replaceByEL(value, function (index, key) { // 转义MySQL特殊字符
                    return /^.*[^\d,].*$/.test(key) ? (key.length == 1 ? "[[." + key + ".]]" : key) : this[0];
                }, "\\{", "\\}");
            }
            value = value.replace(/\[\[\.\#\.\]\]|\\\\#/g, "@NUMBER_SIGN");
            if (value.indexOf("#") != -1 && value.indexOf("|") == -1) { // #替换为与正则
                var matchArr = [];
                $.each(value.split("#"), function (i, tag) {
                    if (tag) {
                        matchArr.push(tag);
                    }
                });
                if (matchArr.length == 0) {
                    value = "";
                } else if (matchArr.length == 1) {
                    value = matchArr[0];
                } else if (matchArr.length == 2) {
                    value = "(" + matchArr[0] + ".*" + matchArr[1] + ")|(" + matchArr[1] + ".*" + matchArr[0] + ")";
                } else {
                    var three = "";
                    var joiner = context.utils.getItsMultipleMatchJoiner(key);
                    $.each(matchArr, function (index, matchKey) {
                        three += joiner + matchKey;
                    });
                    value = three.replace(new RegExp("^" + joiner), '');
                }
            }
            value = value.replace(/@NUMBER_SIGN/g, "[[.#.]]");
            value = value.replace(/(^\|)|(\|$)/g, "");  // 去掉首尾 |
            return value;
        },
        "getItsMultipleMatchJoiner": function (key) {
            return common_utils.replaceByEL(context.config.special_multiple_match_joiner, function (i, value) {
                return key;
            });
        }
    };

    var context = {
        "view": _self,
        "config": config,
        "rewriteSearch": rewriteSearch,
        "utils": utils
    };

    domReady(function () {
        $.extend(config.path_params, {
            "basePath": $("#basePath").attr("href"),
            "cloudPath": $("#cloudPath").attr("href"),
            "staticPath": $("#staticPath").attr("href")
        });
        bind_always_top();
        bind_goTop();
        init_toolbar_href();
        init_search();
    });

    return context;
});