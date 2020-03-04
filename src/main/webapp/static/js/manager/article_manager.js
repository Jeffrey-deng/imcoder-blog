/**
 * 文章管理
 * @author Jeffrey.deng
 * @date 2018/1/11
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils) {

    var articles = null;

    var permissionMap = {
        "0": "游客可见",
        "1": "游客可见，但不公开",
        "2": "登陆可见",
        "3": "登陆可见，但不公开",
        "4": "粉丝可见",
        "5": "粉丝可见，但不公开",
        "6": "关注的用户可见",
        "7": "关注的用户可见，但不公开",
        "8": "好友可见",
        "9": "好友可见，但不公开",
        "10": "私有"
    };

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
            + '<th style="text-align:center;">权限</th>'
            + '<th style="text-align:center;">发表时间</th>'
            + '<th style="text-align:center;">点击量</th>'
            + '<th style="text-align:center;">评论数</th>'
            + '<th style="text-align:center;">推荐权重</th>'
            + '<th style="text-align:center;">是否推荐</th>'
            + '</tr></thead>';
        var start = (pagenum - 1) * pageSize;
        var end = start + (articles.length - start < pageSize ? articles.length - start - 1 : pageSize - 1);
        for (var i = start; i <= end; i++) {
            var article = articles[i];
            html += '<tbody><tr style="height: 50px;" data-aid="' + article.aid + '">';
            html += '<td name="modifyModal_trigger" style="cursor: pointer;" title="点击编辑"><b>' + article.aid + '</b></td>';
            html += '<td><a href="' + ('a/detail/' + article.aid).toURL() + '" target="_blank"><b>' + article.title + '</b></a></td>';
            html += '<td><a href="' + ('u/' + article.author.uid + '/home').toURL() + '"  target="_blank"><i>' + article.author.nickname + '（' + article.author.uid + '）</i></a></td>';
            html += '<td>' + article.category.atname + '</td>';
            html += '<td title="' + permissionMap[article.permission] + '">' + article.permission + '</td>';
            html += '<td>' + article.create_time + '</td>';
            html += '<td>' + article.click_count + '</td>';
            html += '<td>' + article.comment_count + '</td>';
            html += '<td>' + article.top + '</td>';
            html += '<td>' + (article.recommend == 0 ? '否' : '<span style="color:green;">推荐</span>') + '</td>';
            html += '</tr></tbody>';
        }
        $('#article_tds').html(html);

        $('#article_tds').on('click', 'td', function () {
            var aid = $(this).parent().attr('data-aid');
            var article = getArticle(aid, articles);
            var $modifyArticleModal = $('#modifyArticleModal');
            $modifyArticleModal.find('span[name="article_aid"]').html(article.aid);
            $modifyArticleModal.find('span[name="article_title"]').html(article.title);
            $modifyArticleModal.find('select[name="article_category"]').val(article.category.atid);
            $modifyArticleModal.find("select[name='article_permission']").val(article.permission);
            $modifyArticleModal.find("input[name='article_recommend']").each(function () {
                if ($(this).val() == article.recommend) {
                    $(this).prop('checked', true);
                }
            });
            $modifyArticleModal.find("input[name='article_top']").val(article.top);
            $modifyArticleModal.modal();
        });
        $('#article_tds').on('click', 'a', function (e) {
            var tagA = e.currentTarget;
            var domA = document.createElement('a');
            domA.setAttribute('href', tagA.getAttribute('href'));
            domA.setAttribute('target', tagA.getAttribute('target'));
            domA.setAttribute('style', 'display:none;');
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
        $('.page-navigator').html(navigator_html).find('a').off('click').on('click', function () {
            assembleCurrentTableHtml(articles, $(this).attr('jumpPage'), 20);
        });
    }

    domReady(function () {
        var $modifyArticleModal = $('#modifyArticleModal');

        $.get(globals.api.manager.getArticleInfoList, function (response) {
            if (response.status == 200) {
                articles = response.data.articles;
                assembleCurrentTableHtml(articles, 1, 20);
                $('#articleCount').html(articles.length);
            } else {
                toastr.error(response.message, response.status);
                console.warn('Error Code: ' + response.status);
            }
        });

        $modifyArticleModal.find('input[name="article_recommend"][value="0"]').click(function () {
            $modifyArticleModal.find("input[name='article_top']").val(0);
        });

        $modifyArticleModal.find('input[name="article_recommend"][value="1"]').click(function () {
            $modifyArticleModal.find('input[name="article_top"]').val(1);
        });

        $modifyArticleModal.find('button[name="modifyArticle_trigger"]').click(function () {
            var article = {};
            article.aid = $modifyArticleModal.find('span[name="article_aid"]').html();
            article.atid = $modifyArticleModal.find('select[name="article_category"]').val();
            article.permission = $modifyArticleModal.find('select[name="article_permission"]').val();
            article.top = $modifyArticleModal.find('input[name="article_top"]').val();
            article.recommend = $modifyArticleModal.find('input[name="article_recommend"]:checked').val();
            $.post(globals.api.manager.modifyArticleInfo, article, function (response) {
                if (response.status == 200) {
                    toastr.success('更新成功');
                    var article_temp = getArticle(article.aid, articles);
                    article_temp.category.atid = article.atid;
                    article_temp.category.atname = $modifyArticleModal.find('option[value="' + article.atid + '"]').html();
                    article_temp.permission = article.permission;
                    article_temp.top = article.top;
                    article_temp.recommend = article.recommend;
                    assembleCurrentTableHtml(articles, $('.page-navigator .current').find('a').attr('jumpPage'), 20);
                    $modifyArticleModal.modal('hide');
                } else {
                    toastr.error(response.message, '更新失败');
                    console.warn('Error Code: ' + response.status);
                }
            });
        });

        $modifyArticleModal.find('button[name="deleteArticle_trigger"]').click(function () {
            toastr.error('功能待开发中。。。');
        });
    });
});