(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'domReady', 'toastr', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, $(document).ready, toastr, common_utils);
    }
})(function ($, domReady, toastr, common_utils) {

    var params = common_utils.parseURL(window.location.href).params;

    window.page_jump = function (pagenum) {
        var page = "article.do?method=list";
        $.each(params, function (key, value) {
            if (key != "method" && key != "jumpPage") {
                page += "&" + key + "=" + value;
            }
        });
        page += "&jumpPage=" + pagenum;
        window.location.href = page;
    };

    function load_tops() {
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
                        html += '<li><time datetime="" itemprop="datePublished">' + article.update_time + '</time></li>';
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
    }

    domReady(function () {
        var url = window.location.href;
        var name_check = /^(.*imcoder.site[\/]{0,1})$/;
        var ip_check = /^(.*\d+)\.(\d+)\.(\d+)\.(\d+[\/]{0,1})$/;
        var home_check = /^.*method=list$/;
        if (name_check.test(url) || home_check.test(url) || ip_check.test(url)) {
            //为首页（最首页）则查找置顶文章
            load_tops();
        } else {
            $('#top').hide();
        }
    });

});
