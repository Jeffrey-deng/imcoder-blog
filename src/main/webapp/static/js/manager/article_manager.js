/**
 * 文章管理
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr);
    }
})(function ($, bootstrap, domReady, toastr) {
    var articles = null;

    function getArticle(aid, articles) {
        var article = null;
        $.each(articles, function (i, value) {
            if(value.aid == aid) {
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
            + '<th style="text-align:center;">用户</th>'
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
            html += '<tbody><tr style="height: 50px;" aid="' + article.aid + '">';
            html += '<td name="modifyModal_trigger" style="cursor: pointer;" title="点击编辑"><b>' + article.aid + '</b></td>';
            html += '<td><a href="article.do?method=detail&aid='+ article.aid +'" target="_blank"><b>' + article.title + '</b></a></td>';
            html += '<td><a href="user.do?method=home&uid='+ article.author.uid +'"  target="_blank"><i>' + article.author.nickname + '（' + article.author.uid+ '）</i></a></td>';
            html += '<td>' + article.category.atname + '</td>';
            var permission_name = "公开";
            if(article.permission == 1) {
                permission_name = "好友";
            } else if (article.permission == 2){
                permission_name = "私有";
            }
            html += '<td>' + permission_name + '</td>';
            html += '<td>' + article.create_time + '</td>';
            html += '<td>' + article.click + '</td>';
            html += '<td>' + article.comment + '</td>';
            html += '<td>' + article.top + '</td>';
            html += '<td>' + (article.recommend == 0 ? "否" : "<span style=\"color:green;\">推荐</span>") + '</td>';
            html += '</tr></tbody>';
        }
        $('#article_tds').html(html);

        $('#article_tds td').click(function () {
            var aid = $(this).parent().attr("aid");
            var article = getArticle(aid, articles);
            $('#modifyArticleModal span[name="article_aid"]').html(article.aid);
            $('#modifyArticleModal span[name="article_title"]').html(article.title);
            $('#modifyArticleModal select[name="article_category"]').val(article.category.atid);
            $("#modifyArticleModal input[name='article_permission']").each(function () {
                if ($(this).val() == article.permission) {
                    $(this).prop("checked", true);
                }
            });
            $("#modifyArticleModal input[name='article_recommend']").each(function () {
                if ($(this).val() == article.recommend) {
                    $(this).prop("checked", true);
                }
            });
            $("#modifyArticleModal input[name='article_top']").val(article.top);
            $('#modifyArticleModal').modal();
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
        var pageCount = Math.ceil( articles.length / pageSize );
        for (var i = 1; i <= pageCount; i++) {
            if(pagenum == i) {
                navigator_html += '<li class="current"><a jumpPage="'+i+'">'+ i+'</a></li>'
            } else {
                navigator_html += '<li><a jumpPage="'+i+'">'+ i+'</a></li>'
            }
        }
        $('.page-navigator').html(navigator_html);
        $('.page-navigator').find('a').unbind().click(function () {
            assembleCurrentTableHtml(articles, $(this).attr('jumpPage'), 20);
        });
    }

    domReady(function() {
        $.get("manager.do?method=articleListByAjax",function (data) {
            if (data.flag == 200) {
                articles = data.articles;
                assembleCurrentTableHtml(articles, 1, 20);
                $('#articleCount').html(articles.length);
            } else {
                toastr.error(data.info, data.flag);
                console.warn("Error Code: " + data.flag);
            }
        });

        $("#modifyArticleModal input[name='article_recommend'][value='0']").click(function () {
            $("#modifyArticleModal input[name='article_top']").val(0);
        });

        $("#modifyArticleModal input[name='article_recommend'][value='1']").click(function () {
            $("#modifyArticleModal input[name='article_top']").val(1);
        });

        $('#modifyArticleModal button[name="modifyArticle_trigger"]').click(function () {
            var article = {};
            article.aid =  $('#modifyArticleModal span[name="article_aid"]').html();
            article.atid = $('#modifyArticleModal select[name="article_category"]').val();
            article.permission = $("#modifyArticleModal input[name='article_permission']:checked").val();
            article.top = $("#modifyArticleModal input[name='article_top']").val();
            article.recommend = $("#modifyArticleModal input[name='article_recommend']:checked").val();
            $.post("manager.do?method=modifyArticleInfoByManager", article, function (data) {
                if(data.flag == 200) {
                    toastr.success("更新成功");
                    var article_temp = getArticle(article.aid, articles);
                    article_temp.category.atid = article.atid;
                    article_temp.category.atname = $('#modifyArticleModal option[value="'+ article.atid +'"]').html();
                    article_temp.permission = article.permission;
                    article_temp.top = article.top;
                    article_temp.recommend = article.recommend;
                    assembleCurrentTableHtml(articles, $('.page-navigator .current').find('a').attr('jumpPage'), 20);
                    $('#modifyArticleModal').modal('hide');
                } else {
                    toastr.error(data.info, "更新失败");
                    console.warn("Error Code: " + data.flag);
                }
            });
        });

        $('#modifyArticleModal button[name="deleteArticle_trigger"]').click(function () {
            toastr.error("功能待开发中。。。");
        });
    });
});