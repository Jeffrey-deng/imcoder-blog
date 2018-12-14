(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'common_utils', 'toolbar'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, $(document).ready, toastr, common_utils, toolbar);
    }
})(function ($, domReady, toastr, common_utils, toolbar) {

    var initPageJump = function () {
        var params = common_utils.parseURL(document.location.href).params;
        var page = "article.do?method=list";
        $.each(params, function (key, value) {
            if (key != "method" && key != "jumpPage") {
                page += "&" + key + "=" + value;
            }
        });
        $(".page-navigator").find(".page-trigger").each(function (i, a) {
            a.href = page + "&jumpPage=" + a.getAttribute("page");
        });
    };

    var loadTopArticle = function () {
        $.ajax({
            url: 'article.do?method=listTops',
            type: 'GET',
            success: function (data) {
                if (data != null && data != "") {
                    data.sort(function (a1, a2) {
                        var index = a2.top - a1.top;
                        if (index == 0) {
                            return a2.aid - a1.aid;
                        } else {
                            return index;
                        }
                    });
                    var html = "";
                    var nav_tab = '';
                    $(data).each(function (i, article) {
                        nav_tab += '<li class="' + (i == 0 ? "active" : "") + '"><a data-toggle="tab" href="#tab-' + i + '" aria-expanded="' + (i == 0 ? "true" : "false") + '">' + (i + 1) + '</a></li>';
                        html += '<div id="tab-' + i + '" class="tab-pane ' + (i == 0 ? "active" : "") + '">';
                        html += '<div class="panel-body" style="width: 90%;">';
                        html += '<h2 class="post-title" itemprop="name headline"><p class="ui red ribbon label" style="margin-top:-0.6em"><a target="_blank" style="color:white;" href="article.do?method=list&recommend=1">推荐文章</a></p>';
                        html += '<a itemtype="url" target="_blank" href="article.do?method=detail&aid=' + article.aid + '" article-top="' + article.top + '">' + article.title + '</a></h2>';
                        html += '<ul class="post-meta">';
                        html += '<li> 作者: <a href="user.do?method=home&uid=' + article.author.uid + '" target="_blank"> ' + article.author.nickname + '</a> </li>';
                        html += '<li>分类: <a href="article.do?method=list&category.atid=' + article.category.atid + '">' + article.category.atname + '</a></li>';
                        html += '<li><time title="更新时间：' + article.update_time + '" datetime="" itemprop="datePublished">' + article.create_time + '</time></li>';
                        html += '</ul><div class="post-content" itemprop="articleBody">';
                        html += article.summary + '</div></div></div>';
                    });
                    $('#top_nav').html(nav_tab);
                    $('#top_content').html(html);
                    $('#top').show();
                    hljs.initHighlightingOnLoad();
                } else {
                    $('#top').hide();
                }
            },
            error: function () {
                toastr.info('查询置顶列表失败！');
            }
        });
    };

    var showSearchCondition = function () {
        // 显示搜索条件
        var params = common_utils.parseURL(document.location.href).params;
        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != "method" && key != "jumpPage") {
                load_condition[key] = params[key];
            }
        });
        if (Object.keys(load_condition).length > 0) {
            var search_input_value = "";
            $.each(load_condition, function (key, value) {
                if (key == "tags" || key == "title") {
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
                    document.title = value + " - CODER 博客";
                    toolbar.view.find("#navbar-collapse .navbar-nav .active").next().find("a").text((key == "tags" ? "标签=" : "标题=") + "'" + value + "'");
                }
                search_input_value += "," + key + ":";
                if (toolbar.config.special_pair_separator.test(value) || toolbar.config.special_value_separator.test(value)) {
                    search_input_value += '"' + value + '"';
                } else {
                    search_input_value += value;
                }
            });
            search_input_value = search_input_value && search_input_value.substring(1);
            toolbar.rewriteSearch({
                inputInitialValue: search_input_value
            });
        }
    };

    /* ********** main ************* */

    if (/\/\?tdsourcetag=[\w]+$/.test(document.location.href)) { // 对付腾讯
        history.replaceState(
            null,
            document.title,
            $("#basePath").attr("href")
        );
    }

    initPageJump();
    //为首页（最首页）则查找置顶文章
    if (/^.*(imcoder.site\/?|(\d+\.){3}\d+\/?|method=list|localhost.*\/)$/.test(document.location.href)) {
        loadTopArticle();
    } else {    // 没有就隐藏置顶栏
        $('#top').hide();
    }
    showSearchCondition();

});
