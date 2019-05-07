/**
 * 文章归档
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils);
    }
})(function ($, bootstrap, domReady, toastr, common_utils) {

    var articles = null;

    function getArticle(aid, articles) {
        var article = null;
        $.each(articles, function (i, value) {
            if (value.aid == aid) {
                article = value;
                return false;
            }
        });
        return article;
    }

    function assembleCurrentTableHtml(articles, pagenum, pageSize) {
        var html = '<thead><tr>'
            + '<th style="text-align:center;">文章ID</th>'
            + '<th style="text-align:center;">标题</th>'
            + '<th style="text-align:center;">作者</th>'
            + '<th style="text-align:center;">分类</th>'
            + '<th style="text-align:center;">发表时间</th>'
            + '<th style="text-align:center;">点击量</th>'
            + '<th style="text-align:center;">评论数</th>'
            + '<th style="text-align:center;">收藏数</th>'
            + '</tr></thead>';
        var start = (pagenum - 1) * pageSize;
        var end = start + (articles.length - start < pageSize ? articles.length - start - 1 : pageSize - 1);
        for (var i = start; i <= end; i++) {
            var article = articles[i];
            html += '<tbody><tr style="height: 50px;" aid="' + article.aid + '">';
            html += '<td name="modifyModal_trigger" style="cursor: pointer;" title="' + article.title + '"><b>' + article.aid + '</b></td>';
            html += '<td><a href="a/detail/' + article.aid + '" target="_blank"><b>' + article.title + '</b></a></td>';
            html += '<td><a href="u/' + article.author.uid + '/home"  target="_blank"><i>' + article.author.nickname + '（' + article.author.uid + '）</i></a></td>';
            html += '<td>' + article.category.atname + '</td>';
            html += '<td>' + article.create_time + '</td>';
            html += '<td>' + article.click_count + '</td>';
            html += '<td>' + article.comment_count + '</td>';
            html += '<td>' + article.collect_count + '</td>';
            html += '</tr></tbody>';
        }
        $('#article_tds').html(html);

        $('#article_tds td').click(function () {
            var aid = $(this).parent().attr("aid");
            var article = getArticle(aid, articles);
        });
        $('#article_tds a').click(function (e) {
            var tagA = e.currentTarget;
            var domA = document.createElement("a");
            domA.setAttribute("href", tagA.getAttribute("href"));
            domA.setAttribute("target", tagA.getAttribute("target"));
            domA.setAttribute("style", "display:none;");
            document.body.appendChild(domA);
            domA.click();
            document.body.removeChild(domA);
            return false;
        });

        var navigator_html = '';
        var pageCount = Math.ceil(articles.length / pageSize);
        for (var i = 1; i <= pageCount; i++) {
            if (pagenum == i) {
                navigator_html += '<li class="current"><a jumpPage="' + i + '">' + i + '</a></li>'
            } else {
                navigator_html += '<li><a jumpPage="' + i + '">' + i + '</a></li>'
            }
        }
        $('.page-navigator').html(navigator_html);
        $('.page-navigator').find('a').unbind().click(function () {
            assembleCurrentTableHtml(articles, $(this).attr('jumpPage'), 20);
        });
    }

    domReady(function () {
        var params = common_utils.parseURL(document.location.href).params;
        var uid = 0;
        if (params.uid) {
            uid = params.uid;
        }
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "showDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("正在加载数据", "", "notify_articles_loading");
        $.get("article.api?method=getArticleList", (uid && uid != '0') ? {"author.uid": uid} : {}, function (response) {
            common_utils.removeNotify("notify_articles_loading");
            articles = response.data.articles;
            $('#articleCount').html(articles.length);
            if (articles.length == 0) {
                common_utils.notify({
                    "progressBar": false,
                    "timeOut": 10000,
                    "closeButton": false
                }).success("该用户未发表文章，或者你没有权限查看", "", "notify_articles_loading_empty");
            } else {
                assembleCurrentTableHtml(articles, 1, 20);
            }
        });
    });
});