(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'globals', 'common_utils', 'toolbar'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, $(document).ready, toastr, globals, common_utils, toolbar);
    }
})(function ($, domReady, toastr, globals, common_utils, toolbar) {

    let selector = globals.extend(globals.selector, {
        index: {
            'topArea': '#top',
            'pageNavigator': '.page-navigator'
        }
    }).index;

    var initPageJump = function () {
        var params = common_utils.parseURL(document.location.href).params;
        var page = '';
        $.each(params, function (key, value) {
            if (key != 'method' && key != 'page') {
                page += key + '=' + value + '&';
            }
        });
        $(selector.pageNavigator).find('.page-trigger').each(function (i, node) {
            let $node = $(node), pageNum = $node.attr('page');
            $node.url('href', ('a/list?' + page + 'page=' + pageNum));
        });
    };

    var loadTopArticle = function () {
        let $topArea = $(selector.topArea);
        globals.request.get(globals.api.getTopArticleList, true, ['articles'], '查询置顶列表失败').final(function (articles) {
            let tab_content = '', nav_tab = '';
            articles.sort(function (a1, a2) {
                let index = a2.top - a1.top;
                if (index == 0) {
                    return a2.aid - a1.aid;
                } else {
                    return index;
                }
            });
            for (let i = 0, max = articles.length; i < max; i++) {
                let article = articles[i], tabId = 'tab_top_article_' + i;
                nav_tab += '<li class="' + (i == 0 ? 'active' : '') + '"><a data-toggle="tab" href="#' + tabId + '" aria-expanded="' + (i == 0 ? 'true' : 'false') + '">' + (i + 1) + '</a></li>';
                tab_content += '<div id="' + tabId + '" class="tab-pane ' + (i == 0 ? 'active' : '') + '">';
                tab_content += '<div class="panel-body" style="width:90%;">';
                tab_content += '<h2 class="post-title" itemprop="name headline"><p class="ui red ribbon label" style="font-size:1rem;margin-top:-0.6em"><a target="_blank" style="color:white;" href="' + ('a/list?recommend=1').toURL() + '">推荐文章</a></p>';
                tab_content += '<a class="article-link" itemtype="url" target="_blank" href="' + ('a/detail/' + article.aid).toURL() + '" data-article-top="' + article.top + '" data-article-id="' + article.aid + '">' + article.title + '</a></h2>';
                tab_content += '<ul class="post-meta">';
                tab_content += '<li> 作者: <a href="' + ('u/' + article.author.uid + '/home').toURL() + '" target="_blank"> ' + article.author.nickname + '</a> </li>';
                tab_content += '<li>分类: <a href="' + ('a/list?category.atid=' + article.category.atid).toURL() + '">' + article.category.atname + '</a></li>';
                tab_content += '<li><time title="更新时间：' + article.update_time + '" datetime="" itemprop="datePublished">' + article.create_time + '</time></li>';
                tab_content += '</ul><div class="post-content" itemprop="articleBody">';
                tab_content += article.summary + '</div></div></div>';
            }
            $topArea.find('.nav-tabs').html(nav_tab);
            $topArea.find('.tab-content').html(tab_content);
            $topArea.show();
            hljs.initHighlightingOnLoad();
        }, function () {
            $topArea.hide();
        });
    };

    var showSearchCondition = function () {
        // 显示搜索条件
        var params = common_utils.parseURL(document.location.href).params;
        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != 'method' && key != 'page') {
                load_condition[key] = params[key];
            }
        });
        if (Object.keys(load_condition).length > 0) {
            var search_input_value = '';
            $.each(load_condition, function (key, value) {
                if (key == 'tags' || key == 'title') {
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
                    document.title = value + ' - CODER 博客';
                    toolbar.view.find('#navbar-collapse .navbar-nav .active').next().find('a').text((key == 'tags' ? '标签=' : '标题=') + "'" + value + "'");
                }
                search_input_value += ',' + key + ':';
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

    if (/[&?]tdsourcetag=[\w]+/.test(document.location.search)) { // 对付腾讯
        history.replaceState(
            null,
            document.title,
            common_utils.removeParamForURL('tdsourcetag')
        );
    }

    // 图片加载失败显示默认图片
    common_utils.bindImgErrorHandler($(globals.selector.mainArea).find('img'), globals.path_params.cloudPath + 'res/img/img_load_error_default.jpg');

    // 为首页（最首页）则查找置顶文章
    if ((document.location.search == '' || document.location.search == '?page=1')) {
        loadTopArticle();
    } else {    // 没有就隐藏置顶栏
        $(selector.topArea).hide();
    }

    initPageJump();

    showSearchCondition();

});
