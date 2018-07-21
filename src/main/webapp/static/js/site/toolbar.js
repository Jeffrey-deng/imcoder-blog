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
            "type_schema": ["mode", "m"],
            "photo_schema": ["logic_conn", "name", "description", "desc", "tags", "uid", "photo_id", "id", "album_id", "aid", "originName", "origin", "path"],
            "article_schema": ["logic_conn", "id", "aid", "author.uid", "uid", "category.atid", "atid", "title", "tags", "summary", "create_time", "update_time", "click", "top", "recommend"],
            "album_schema": ["id", "album_id", "name", "description", "desc", "user.uid", "uid"]
        },
        "special_multiple_match_separator": "' and ${column} rlike '",    //多重匹配,
        "callback": {
            "action_search": function (key) {
                var context = this;
                if (!key) {
                    config.special_mode_mapping["default"].call(context, key);
                    return;
                }
                // 替换搜索输出中的EL表达式， 如果要使用（忽略）分割字符, 用 ""、{}、${} 包裹
                var elMap = context.config.elMap = {}; // 保存el标记内的key
                var elSourceMap = context.config.elSourceMap = {};  // 保存标记包含el表达式的符号包裹
                key = common_utils.replaceByEL(key, function (index, key) {
                    var replaceFlag = context.config.special_replace_prefix + index;
                    elMap[replaceFlag] = key;
                    elSourceMap[replaceFlag] = this[0];
                    return replaceFlag;
                });
                var mode = null;
                var modePairRegex = null;
                context.utils.eachEntry(key, context.config.special_search_object.type_schema, function (entry) {
                    mode = entry[1].trim();
                    modePairRegex = entry[0] + context.config.special_value_separator.toString().replace(/\//g, "") +
                        entry[1] + context.config.special_pair_separator.toString().replace(/\//g, "") + "{0,1}";
                    return false;
                });
                // 去掉标记模式的字段
                if (modePairRegex) {
                    key = key.replace(new RegExp(modePairRegex), "");
                }
                if (mode && config.special_mode_mapping[mode]) {
                    config.special_mode_mapping[mode].call(context, key);   // mapping module
                } else {
                    config.special_mode_mapping["default"].call(context, key); // mapping default module
                }
            },
            "photo_search": function (key) {
                var isFindSpecial = false; //标记是否找到特殊关键字
                var photo_url = "photo.do?method=dashboard&mode=photo";
                if (key == "") {
                    window.open(photo_url);
                    return;
                }
                // Users can search exactly by special keywords in input box.
                // input eg: tags:邓超 ， convert to "&tags=邓超"
                // input eg: tags:邓超,album_id=5 ， convert to "&tags=邓超&album_id=5"
                // input EL eg: path:${http://imcoder.site} ， convert to "&path=http://imcoder.site", this way can ignore keyword ":"
                // 工具方法遍历pair_key每一个在schema中的pair，回调返回false跳出循环
                context.utils.eachEntry(key, context.config.special_search_object.photo_schema, function (entry) {
                    // 还原标记位被el表达式保留的value
                    context.utils.revertELReplaceContent(entry, ["tags"]);
                    // 修正变量名
                    entry[0] == "desc" && (entry[0] = "description");
                    entry[0] == "origin" && (entry[0] = "originName");
                    entry[0] == "id" && (entry[0] = "photo_id");
                    entry[0] == "aid" && (entry[0] = "album_id");
                    // 转化图片路径为相对路径
                    entry[0] == "path" && (entry[1] = entry[1].replace(context.config.path_params.cloudPath, ""));
                    // 编码正则表达式
                    entry[0] == "tags" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                    photo_url += "&" + entry[0] + "=" + entry[1];
                    isFindSpecial = true;
                });
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
                var article_url = "article.do?method=list";
                if (key == "") {
                    window.open(article_url);
                    return;
                }
                context.utils.eachEntry(key, context.config.special_search_object.article_schema, function (entry) {
                    // 还原标记位被el表达式保留的value
                    context.utils.revertELReplaceContent(entry, ["tags", "title"]);
                    // 修正变量名
                    entry[0] == "id" && (entry[0] = "aid");
                    entry[0] == "uid" && (entry[0] = "author.uid");
                    entry[0] == "atid" && (entry[0] = "category.atid");
                    // 编码正则表达式
                    entry[0] == "tags" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                    entry[0] == "title" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                    article_url += "&" + entry[0] + "=" + entry[1];
                    isFindSpecial = true;
                });
                if (isFindSpecial) {
                    window.open(article_url);
                } else {
                    key = encodeURIComponent(key);
                    window.open(article_url + "&title=" + key);
                }
            },
            "album_search": function (key) {
                var isFindSpecial = false; //标记是否找到特殊关键字
                var album_url = "photo.do?method=dashboard&mode=album";
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
                    album_url += "&" + entry[0] + "=" + entry[1];
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
                var tags_square_url = "photo.do?method=tags_square";
                if (key == "") {
                    window.open(tags_square_url);
                    return;
                }
                var filterKeyWord = null;
                var filterPairRegex = null;
                context.utils.eachEntry(key, ["filter", "f"], function (entry) {
                    filterPairRegex = entry[0] + context.config.special_value_separator.toString().replace(/\//g, "") +
                        entry[1] + context.config.special_pair_separator.toString().replace(/\//g, "") + "{0,1}";
                    context.utils.revertELReplaceContent(entry, ["filter", "f"]);
                    filterKeyWord = entry[1].trim();
                });
                // 去掉标记过滤的字段
                if (filterPairRegex) {
                    key = key.replace(new RegExp(filterPairRegex), "");
                }
                context.utils.eachEntry(key, context.config.special_search_object.photo_schema, function (entry) {
                    // 还原标记位被el表达式保留的value
                    context.utils.revertELReplaceContent(entry, ["tags"]);
                    // 修正变量名
                    entry[0] == "desc" && (entry[0] = "description");
                    entry[0] == "origin" && (entry[0] = "originName");
                    entry[0] == "id" && (entry[0] = "photo_id");
                    entry[0] == "aid" && (entry[0] = "album_id");
                    // 转化图片路径为相对路径
                    entry[0] == "path" && (entry[1] = entry[1].replace(context.config.path_params.cloudPath, ""));
                    // 编码正则表达式
                    entry[0] == "tags" && (entry[1] = context.utils.encodeRegexSearch(entry[0], entry[1]));
                    tags_square_url += "&" + entry[0] + "=" + entry[1];
                    isFindSpecial = true;
                });
                if (isFindSpecial || key == "") {
                    window.open(tags_square_url + (filterKeyWord ? ("&filter=" + encodeURIComponent(filterKeyWord)) : ""));
                } else {
                    window.open(tags_square_url + (key ? ("&filter=" + encodeURIComponent(key)) : ""));
                }
            }
        },
        "placeholder": null,
        "inputInitialValue": null
    };

    var init_search = function () {
        if (config.location_info.file == "photo.do") {
            config.placeholder = "输入关键字搜索照片"
        } else {
            config.placeholder = "输入关键字搜索"
        }
        _self.find('.toolbar_search_input').attr("placeholder", config.placeholder);
        config.inputInitialValue && _self.find(".toolbar_search_input").val(config.inputInitialValue);
        config.special_mode_mapping = {
            "default": function (key) {
                if (config.location_info.file == "photo.do") {
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
        }
    };

    /**
     *  重写搜索响应
     * {
     *  {String} placeholder, // 搜索框提示值
     *  {String} inputInitialValue, // 搜索框默认值
     *  {Function} mode_action, // 搜索模块响应
     *  {Array} modeMapping, // 搜索模块映射名称
     *  {Boolean} setDefaultMapping  // 是否设置成默认模块
     * }
     * @param options
     */
    var rewriteSearch = function (options) {
        if (!options) {
            return;
        }
        options.placeholder && _self.find('.toolbar_search_input').attr("placeholder", options.placeholder);
        options.inputInitialValue && _self.find(".toolbar_search_input").val(options.inputInitialValue);
        if (options.mode_action && options.modeMapping) {
            $.each(options.modeMapping, function (i, mapping) {
                config.special_mode_mapping[mapping] = options.mode_action;
            });
            if (options.setDefaultMapping == true) {
                config.special_mode_mapping["default"] = options.mode_action;
            }
        }
    };

    // bind toolbar always on top
    function bind_always_top() {
        $("#header").stickUp({
            parts: {
                0: 'header'
            }
            /* itemClass: 'menuItem',
             itemHover: 'active',
             topMargin: 'auto' */
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

    //
    function init_toolbar_href() {
        // init tag a href
        _self.find('.toolbar_user_setting').attr('href', "user.do?method=profilecenter&action=settings");

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

        _self.find('.toolbar_jump_albums').attr("href", "photo.do?method=dashboard&mode=photo");
    }

    // bind search btn
    function bind_search() {
        _self.find('.toolbar_search_trigger').click(function () {
            var key = _self.find('.toolbar_search_input').val();
            config.callback.action_search.call(context, key);
        });
        _self.find('.toolbar_search_input').parent().parent().keydown(function (e) {
            e.defaultPrevented;
            var theEvent = e || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            if (code == 13) {//keyCode=13是回车键
                _self.find('.toolbar_search_trigger').click();
                //防止触发表单提交 返回false
                return false;
            }
        });
    }

    //写博客
    function jump_writeblog() {
        if (!login_handle.validateLogin()) {
            //弹出登陆框
            login_handle.jumpLogin("article.do?method=edit&flag=new", true);
        } else {
            //跳转
            window.open("article.do?method=edit&flag=new");
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
                    if (entry.length > 1 && schema.indexOf(entry[0]) != -1) {
                        if (entryCallBack(entry) == false) {
                            return false;
                        }
                    }
                }
            });
        },
        "encodeRegexSearch": function (key, value) {
            value.indexOf("<") != -1 && (value = value.replace(/\\{<\\}/g, "@WD_BR_L").replace(/</g, "[[:<:]]").replace(/@WD_BR_L/g, "{<}")); // 替换 < 为单词头
            value.indexOf(">") != -1 && (value = value.replace(/\\{>\\}/g, "@WD_BR_R").replace(/>/g, "[[:>:]]").replace(/@WD_BR_R/g, "{>}")); // 替换 > 为单词尾
            if (value.indexOf("{") != -1) {
                value = common_utils.replaceByEL(value, function (index, key) { // 转义MySQL特殊字符
                    return /^[^\w]+$/.test(key) ? "[[." + key + ".]]" : this[0];
                }, "\\{", "\\}");
            }
            value = value.replace(/\[\[\.\#\.\]\]/g, "@NUMBER_SIGN");
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
                    var separator = context.utils.getItsMultipleMatch_Separator(key);
                    $.each(matchArr, function (index, matchKey) {
                        three += separator + matchKey;
                    });
                    value = three.replace(new RegExp("^" + separator), '');
                }
            }
            value = value.replace(/@NUMBER_SIGN/g, "[[.#.]]");
            value = value.replace(/(^\|)|(\|$)/g, "");  // 去掉首尾 |
            value = encodeURIComponent(value);  // 转义
            return value;
        },
        "getItsMultipleMatch_Separator": function (key) {
            return common_utils.replaceByEL(context.config.special_multiple_match_separator, function (i, value) {
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
        bind_search();
    });

    return context;
});