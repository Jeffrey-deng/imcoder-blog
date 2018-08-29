(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'magnificPopup', 'login_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, null, login_handle);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, magnificPopup, login_handle) {

    var list = []; //评论列表
    var aid = $('#h_aid').attr('aid');
    var auid = document.getElementById("h_auid").getAttribute("auid");
    var basePath = $('#basePath').attr('href');
    var staticPath = $('#staticPath').attr('href') == undefined ? basePath : $('#staticPath').attr('href');
    var $comment_editor = $("#comment_form_content");

    //
    function init_comment() {

        $("#comment_form_submit").click(function () {
            submit_comment();
        });
        //从服务器加载评论
        loadList(1);

        $("#comment_form_parentid").val('0');
        $("#comment_form_replyuid").val(auid);
        //用来判断用户是否删除@xx: 如果删除了则重置回复对象
        var editor_inter = null;
        $comment_editor.focus(function () {
            editor_inter = setInterval(function () {
                if ($comment_editor.val().indexOf('@') === -1) {
                    $("#comment_form_parentid").val('0');
                    //默认为作者id
                    $("#comment_form_replyuid").val(auid);
                }
            }, 500);
        }).blur(function () {
            if (editor_inter) clearInterval(editor_inter);
        });
    }

    //从服务器加载评论
    function loadList(pageIndex) {
        $.ajax({
            type: 'POST',
            url: 'article.do?method=listComment&aid=' + aid,
            dataType: 'json',
            success: function (data) {
                //alert(JSON.stringify(data));
                list = data;
                //构造主题
                var topics = getTopics(list);
                //组装HTM
                var listHtml = '<h3 class="comment-meta-count">已有 ' + list.length + '条评论<a class="comment-add-new" style="float:right;" href="#addcomment">添加评论</a></h3>';
                listHtml += '<ol class="comment-list">';
                for (var i = 0; i < topics.length; i++) {
                    var comment = topics[i];
                    var layer = topics.length - i;
                    listHtml += getItemHtml(comment, layer);
                }
                listHtml += '</ol>';

                $('#comments').html(listHtml);
                //绑定事件
                setBtnEvent();
            },
            error: function () {

            }
        });
    }

    //获取评论主题(直接回复文章的第一级评论)
    function getTopics(list) {
        var topics = [];
        for (var i = 0; i < list.length; i++) {
            var t = list[i];
            if (t.parentid == 0) {
                t.replies = getReplies(t, list);
                topics.push(t);
            }
        }
        return topics;
    }

    //迭代获取评论回复
    function getReplies(item, list) {
        var replies = [];
        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            if (r.parentid == item.cid) {
                r.replies = getReplies(r, list);
                replies.push(r);
            }
        }
        return replies;
    }

    var uid = $('body').attr('uid');
    //获取评论的HTML
    function getItemHtml(comment, index, floor, deep) {

        if (!deep) deep = 0;
        var html = "<li id='li_" + comment.cid + "' class='comment-body " + ((comment.parentid == 0) ? 'comment-parent ' : '');
        html += ( (comment.user.uid == auid) ? 'comment-by-author ' : '' );
        html += ( (deep % 2 == 0) ? 'comment-level-even ' : 'comment-level-odd ' ) + "'>";
        html += "<div class='comment-author'> ";
        html += '<span itemprop="image" style="text-align: center;"><img class="avatar" src="' + staticPath + comment.user.head_photo + '" title="" width="32" height="32"></span>';
        html += '<cite class="fn" itemprop="name"><a href="' + basePath + 'user.do?method=home&uid=' + comment.user.uid + '">' + comment.user.nickname + '</a></cite>';
        html += '</div>';
        html += '<div class="comment-meta"> ';
        html += '<a href="#li_' + comment.cid + '"><time itemprop="commentTime" datetime="">' + comment.send_time + '</time></a> ';
        html += '</div>';
        html += '<div class="comment-content" itemprop="commentText"> ';
        html += '<p>' + comment.content + '</p> ';
        html += '</div>';
        html += '<div class="comment-reply" cid=' + comment.cid + '> ';
        html += ( (uid == comment.user.uid) ? '<a href="#delete" onclick="">删除</a>' : '' );
        html += '&nbsp;&nbsp;<a href="#reply" onclick="">回复</a>';
        html += '</div>';
        if (comment.replies != null && comment.replies.length > 0) {
            html += ' <div class="comment-children" itemprop="discusses"> ';
            html += ' <ol class="comment-list"> ';
            for (var j = 0; j < comment.replies.length; j++) {
                html += getItemHtml(comment.replies[j], j + 1, index, deep + 1);
            }
            html += '</ol>';
            html += '</div>';
        }
        html += '</li>';
        return html;
    }

    //获取评论对象
    function getComment(cid, list) {
        for (var i = 0; i < list.length; i++) {
            var comment = list[i];
            if (comment.cid == cid)
                return comment;
        }
        return null;
    }

    /*使评论框获得焦点*/
    function setEditorFocus() {
        // $comment_editor.focus();
        $('html, body').animate({
            scrollTop: $comment_editor.offset().top
        }, 400);
        $comment_editor.focus();
        //window.location.href = "#comment_form_content";
    }

    function setBtnEvent() {
        //评论按钮点击
        $("#comments a").click(function () {
            if (login_handle.validateLogin()) {
                var action = $(this).attr("href");
                action = action.substring(action.lastIndexOf('#'));
                var commentId = $(this).parent().attr("cid");
                switch (action) {
                    case "#reply":
                        replyComment(commentId, list);
                        setEditorFocus();
                        break;
                    case "#addcomment":
                        $comment_editor.val('');
                        $("#comment_form_parentid").val('0');
                        $("#comment_form_replyuid").val(auid);
                        setEditorFocus();
                        return true;
                    case "#delete":
                        deleteComment(commentId);
                        break;
                    default:
                        return true;
                }
                return false;
            } else {
                toastr.info('请先登录！');
                //弹出登陆框
                login_handle.showLoginModal($(this).attr("href"));
            }
        });

        /* $(".comment_item").mouseover(function () {
         $(".comment_manage", $(this)).eq(0).show();
         }).mouseout(function () {
         $(".comment_manage", $(this)).eq(0).hide();
         });*/

    }

    //回复评论
    function replyComment(commentId, list) {
        var comment = getComment(commentId, list);
        $comment_editor.val('@' + comment.user.nickname + ":");
        $("#comment_form_parentid").val(commentId);
        $("#comment_form_replyuid").val(comment.user.uid);
    }

    //删除评论
    function deleteComment(commentId) {
        if (!confirm("你确定要删除这篇评论吗？")) return;

        var comment = getComment(commentId, list);
        var data = {"cid": commentId, "parentid": comment.parentid, "aid": comment.aid};
        $.post("article.do?method=deleteComment", data, function (data) {
            if (data.flag == 200) {
                $("#li_" + commentId).remove();
                toastr.success('删除成功！');
            } else if (data.flag == 201) {
                $("#li_" + commentId).find('.comment-content').eq(0).find('p').eq(0).html('*已删除*');
                toastr.success('删除成功！');
            } else {
                toastr.error(data.info, '删除评论失败！');
                console.warn("Error Code: " + data.flag);
            }
        });
    }

    //提交评论
    function submit_comment() {
        if (login_handle.validateLogin()) {
            var aid = $('#h_aid').attr('aid');
            var parentid = $('#comment_form_parentid').val();
            var replyuid = $('#comment_form_replyuid').val();
            var content = $("#comment_form_content").val();
            //去除@xx:
            if (parentid != '0') {
                content = content.substring(content.indexOf(':') + 1);
            }
            //转义
            if (!$('#tagInner').prop('checked')) {
                content = $('<div/>').text(content).html();
            }
            if (validateComment(content)) {
                $.ajax({
                    data: {'aid': aid, 'parentid': parentid, 'replyuid': replyuid, 'content': content},
                    type: 'POST',
                    dataType: 'json',
                    url: 'article.do?method=addComment',
                    success: function (data) {
                        if (data.flag == 200) {
                            toastr.success('评论添加成功！');
                            loadList(1);
                            $comment_editor.val('');
                        } else {
                            toastr.error(data.info, '添加评论失败！');
                            console.warn("Error Code: " + data.flag);
                        }
                    },
                    error: function () {
                        toastr.error('评论添加失败！');
                    }
                });
            }
        } else {
            //弹出登陆框
            login_handle.showLoginModal('#comments', submit_comment);
        }
    }

    //验证评论
    function validateComment(content) {
        if (content == "") {
            toastr.error('评论不能为空！');
            return false;
        }
        if (content.length >= 500) {
            toastr.error('评论字数不能超过500！');
            return false;
        }
        return true;
    }

    function collectArticle(preStatus) {
        if (login_handle.validateLogin()) {
            //添加收藏
            if (preStatus == "no") {
                $.ajax({
                    url: "user.do?method=collectArticle",
                    type: "POST",
                    data: {'aid': aid},
                    success: function (data) {
                        if (data.flag == 200) {
                            $('#collectArticleBtn').attr("status", "yes")
                            $('#collectArticleBtn').html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 已收藏</b>');
                            toastr.success("收藏成功！");
                        } else if (data.flag == 204) {
                            $('#collectArticleBtn').attr("status", "yes")
                            $('#collectArticleBtn').html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 已收藏</b>');
                            toastr.success("已经收藏过了，无须再点击");
                        } else {
                            toastr.error(data.info, "收藏失败！");
                            console.warn("Error Code: " + data.flag);
                        }
                    },
                    error: function () {
                        toastr.error("收藏失败！");
                    }
                });
            } else {
                if (!confirm("你确定要取消收藏吗？")) return;
                //取消收藏
                $.ajax({
                    url: "user.do?method=unCollectArticle",
                    type: "POST",
                    data: {'aid': aid},
                    success: function (data) {
                        if (data.flag == 200) {
                            $('#collectArticleBtn').attr("status", "no")
                            $('#collectArticleBtn').html('<span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span><b> 收藏</b>');
                            toastr.success("删除收藏成功！");
                        } else {
                            toastr.error(data.info, "删除收藏失败！");
                            console.warn("Error Code: " + data.flag);
                        }
                    },
                    error: function () {
                        toastr.error("删除收藏失败！");
                    }
                });
            }
        } else {
            login_handle.showLoginModal();
        }
    }

    /**
     * 检查登录者是否收藏该文章
     */
    function checkCollection() {
        if (login_handle.validateLogin()) {
            $.ajax({
                url: 'user.do?method=checkCollection',
                data: {'aid': aid},
                success: function (data) {
                    if (data.flag == 200) {
                        console.log("已收藏该文章");
                        $('#collectArticleBtn').attr("status", "yes")
                        $('#collectArticleBtn').html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 已收藏</b>');
                    }
                }
            });
        }
    }

    function initDelete() {
        if ($('#validateMailModal').length > 0) {
            //发送验证邮件事件
            $('#sendValidateMailBtn').click(function () {
                sendValidateMail();
                $('#validateMailModal').modal({backdrop: 'static', keyboard: false});
                $('#sendValidateMailBtn').attr('disabled', "true").val("30s后");
                var num = 30;
                var time_inter = setInterval(function () {
                    num -= 1;
                    $('#sendValidateMailBtn').val(num + "s后");
                }, 1000);
                setTimeout(function () {
                    clearInterval(time_inter);
                    $('#sendValidateMailBtn').removeAttr("disabled").val("重新发送");
                }, 30 * 1000);
            });
            //检查验证码是否正确事件
            $('#deleteArticleBtn').click(function () {
                var code = $('#validateMailForm').find('input[name="validateCode"]').eq(0).val().replace(/(^\s*)|(\s*$)/g, '');
                if (code.toLowerCase() == validateCode.toLowerCase()) {
                    toastr.success('正在删除！');
                    $.post("article.do?method=delete", {"aid": aid, "validateCode": validateCode}, function (data) {
                        if (data.flag == 200) {
                            toastr.success('删除成功！');
                            setTimeout(function () {
                                document.location.href = $("#basePath").attr("href");
                            }, 2000);
                        } else {
                            toastr.error(data.info, '删除失败！');
                            console.warn("Error Code: " + data.flag);
                        }
                    });
                } else {
                    toastr.error('验证码错误！');
                }
            });
        }
    }

    //保存返回的验证码
    var validateCode;
    //发送验证码邮件
    function sendValidateMail() {
        $.ajax({
            url: 'site.do?method=sendValidateMail',
            type: "POST",
            success: function (data) {
                if (data) {
                    validateCode = data;
                    toastr.success('已发送验证邮件！');
                } else {
                    toastr.error('验证邮件发送失败！');
                }
            },
            error: function () {
                toastr.error('验证邮件发送失败！');
            }
        });
    }

    function fullArticleMainArea(preStatus) {
        var url = document.location.href;
        var hashIndex = url.indexOf('#');
        var article_header_ul = $("#main .article_header .article_category").parent().parent();
        if (preStatus == "no") {
            $("#rank_col").hide(300);
            $('#main').removeClass('col-md-9').addClass('col-md-12');

            var author_nickname_dom = $("#user_rank").find(".author_nickname");
            var author_url = author_nickname_dom.attr("href");
            var author_nickname = author_nickname_dom.text();
            if (article_header_ul.find(".article_author").length == 0) {
                article_header_ul.append('<li class="article_author">作者: <a href="' + author_url + '" target="_blank">' + author_nickname + '</a></li>')
            }

            $('#fullArticleBtn').attr("status", "yes").html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 全屏</b>');
            history.replaceState(
                null,
                document.title,
                (hashIndex == -1 ? url : url.substring(0, hashIndex)) + "#full-screen"
            );
        } else {
            $("#rank_col").show(300);
            $('#main').removeClass('col-md-12').addClass('col-md-9');
            article_header_ul.find(".article_author").remove();
            $('#fullArticleBtn').attr("status", "no").html('<span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span><b> 全屏</b>');
            history.replaceState(
                null,
                document.title,
                (hashIndex == -1 ? url : url.substring(0, hashIndex))
            );
        }
    }

    var initClickEnlarge = function () {
        //图片查看modal
        $('.post-container').magnificPopup({
            delegate: 'img', // child items selector, by clicking on it popup will open
            type: 'image',
            callbacks: {
                elementParse: function (item) {
                    // Function will fire for each target element
                    // "item.el" is a target DOM element (if present)
                    // "item.src" is a source that you may modify
                    item.src = item.el[0].src;
                },
            },
            gallery: {
                enabled: true, // set to true to enable gallery
                navigateByImgClick: true,
                arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>', // markup of an arrow button
                //<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%"></button>
                tPrev: '上一张', // title for left button,'Previous (Left arrow key)
                tNext: '下一张', // title for right button,Next (Right arrow key)
                tCounter: '<span class="mfp-counter">%curr% of %total%</span>' // markup of counter
            },
            removalDelay: 300,
            mainClass: 'mfp-with-zoom',
            fixedContentPos: false,
            fixedBgPos: true,
            autoFocusLast: true,
            closeBtnInside: true,
            image: {
                cursor: 'mfp-zoom-out-cur', // Class that adds zoom cursor, will be added to body. Set to null to disable zoom out cursor.
                titleSrc: function (item) {
                    var photo_dom = item.el[0];
                    var photo_name = photo_dom.title || photo_dom.getAttribute("data-filename");
                    var openUrl = "";
                    if (photo_dom.getAttribute("cloudImage")) {
                        openUrl = "redirect.do?model=album&photo_id=" + photo_dom.getAttribute("photo-id");
                    } else {
                        openUrl = photo_dom.src;
                    }
                    return '<a style="color:white" href="' + openUrl + '" target="_blank">' + photo_name + '</a><small>by ' + $("#h_auid").children().text() + '</small>';
                },
                verticalFit: true, // Fits image in area vertically
                tError: '<a href="%url%">此图片</a> 不能加载.' // Error message
            },
            zoom: {
                enabled: true, // By default it's false, so don't forget to enable it
                duration: 400, // duration of the effect, in milliseconds
                easing: 'ease-in-out', // CSS transition easing function
                // The "opener" function should return the element from which popup will be zoomed in
                // and to which popup will be scaled down
                // By defailt it looks for an image tag:
                opener: function (openerElement) {
                    // openerElement is the element on which popup was initialized, in this case its <a> tag
                    // you don't need to add "opener" option if this code matches your needs, it's defailt one.
                    return openerElement.is('img') ? openerElement : openerElement.find('img');
                }
            }
        });
    };

    /* ********** main ************* */

    // 非事件绑定类，立即执行加载评论
    init_comment();

    domReady(function () {

        var x = $('#first').height();

        var hashIndex = document.location.href.indexOf('#');
        var hash = (hashIndex != -1 ? document.location.href.substring(hashIndex + 1) : "");
        if (hash == "addcomment") {
            setEditorFocus();
        } else if (hash == "full-screen") {
            if (document.body.clientWidth >= 768) {
                $("#main .article_header .article_handle").find(".dropdown-toggle").eq(0).click();
                fullArticleMainArea("no");
            }
        } else if (!hash) {
            //滚动效果（除去有hash值时）
            $('html, body').animate({scrollTop: x}, 'slow');
        }

        // 提示吐司  設置
        toastr.options = {
            "closeButton": true,
            "debug": false,
            "progressBar": false,
            "positionClass": "toast-bottom-left",
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "3500",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        $('#collectArticleBtn').click(function (e) {
            var preStatus = e.currentTarget.getAttribute("status") || "no";
            collectArticle(preStatus);
        });

        $('#fullArticleBtn').click(function (e) {
            var preStatus = e.currentTarget.getAttribute("status") || "no";
            fullArticleMainArea(preStatus);
        });

        var articleConfig = common_utils.getLocalConfig("article", {"full_screen": false, "full_background": false});
        if (articleConfig.full_screen) {
            fullArticleMainArea("no");
        }
        if (articleConfig.full_background) {
            $("body").css("background-image", $("#first").css("background-image"));
            $("#first").css("background-image", "");
        }

        initDelete();

        checkCollection();

        initClickEnlarge();
    });

});
