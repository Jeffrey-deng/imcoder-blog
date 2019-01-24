(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'magnificPopup', 'login_handle', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, null, login_handle, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, magnificPopup, login_handle, websocket_util) {

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
        loadList();

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
    function loadList() {
        $.ajax({
            type: 'POST',
            url: 'article.do?method=listComment&aid=' + aid,
            dataType: 'json',
            success: function (data) {
                //alert(JSON.stringify(data));
                list = data;
                buildCommentAreaHtml(list, 1);
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

    /**
     * 获取评论的HTML
     * @param comment
     * @param building 栋, 从1开始
     * @param floor 栋中的第几层, 从1开始
     * @param room 层中的第几室 , 从1开始
     * @returns {string}
     */
    function getItemHtml(comment, building, floor, room) {
        if (!floor) floor = 1;
        if (!room) room = 1;
        var html = "<li id='li_" + comment.cid + "' class='comment-body " + ((comment.parentid == 0) ? 'comment-parent ' : '');
        html += ( (comment.user.uid == auid) ? 'comment-by-author ' : '' );
        html += ( (floor % 2 == 0) ? 'comment-level-even ' : 'comment-level-odd ' ) + "'>";
        html += "<div class='comment-author'> ";
        html += '<span itemprop="image" style="text-align: center;"><img class="avatar" src="' + staticPath + comment.user.head_photo + '" title=""></span>';
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
            html += '<div class="comment-children" itemprop="discusses">';
            html += '<ol class="comment-list">';
            for (var j = 0; j < comment.replies.length; j++) {
                html += getItemHtml(comment.replies[j], building, floor + 1, j + 1);
            }
            html += '</ol>';
            html += '</div>';
        }
        html += '</li>';
        return html;
    }

    function buildCommentAreaHtml(list, pageIndex) {
        //构造主题
        var topics = getTopics(list);

        //组装HTM
        var listHtml = '<h3 class="comment-meta-count">已有 ' + list.length + ' 条评论<a class="comment-add-new" style="float:right;" href="#addcomment">添加评论</a></h3>';
        listHtml += '<ol class="comment-list">';
        for (var i = 0; i < topics.length; i++) {
            var comment = topics[i];
            var building = topics.length - i; // 第几栋楼
            listHtml += getItemHtml(comment, building);
        }
        listHtml += '</ol>';
        $('#comments').html(listHtml);

        //绑定事件
        setBtnEvent();
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
            scrollTop: $comment_editor.offset().top - 80
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
                list.splice(list.indexOf(comment), 1);
                //$("#li_" + commentId).remove();
                buildCommentAreaHtml(list, 1);
                toastr.success('删除成功！');
            } else if (data.flag == 201) {
                comment.content = "*已删除*";
                //$("#li_" + commentId).find('.comment-content').eq(0).find('p').eq(0).html('*已删除*');
                buildCommentAreaHtml(list, 1);
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
                var start = content.indexOf(':') + 1;
                if (start >= content.length) {
                    toastr.error('评论不能为空！');
                    return;
                }
                content = content.substring(start);
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
                            list.push(data.comment);
                            buildCommentAreaHtml(list, 1);
                            //loadList();
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
                        $('#collectArticleBtn').attr("status", "yes").html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 已收藏</b>');
                    }
                }
            });
        }
    }

    //保存返回的验证码
    var validateCode = null;

    function initDelete() {
        if ($('#validateMailModal').length > 0) {
            //发送验证邮件事件
            $('#sendValidateMailBtn').click(function () {
                var _self = $(this);
                sendValidateMail();
                $('#validateMailModal').modal({backdrop: 'static', keyboard: false});
                _self.attr('disabled', "true").val("30s后");
                var num = 30;
                var time_inter = setInterval(function () {
                    _self.val((--num) + "s后");
                }, 1000);
                setTimeout(function () {
                    clearInterval(time_inter);
                    _self.removeAttr("disabled").val("重新发送");
                }, 30 * 1000 + 10);
            });
            //检查验证码是否正确事件
            $('#deleteArticleBtn').click(function () {
                var code = $('#validateMailForm').find('input[name="validateCode"]').eq(0).val().replace(/(^\s*)|(\s*$)/g, '');
                if (code) {
                    $.get("site.do?method=checkValidateCode", {"code": code}, function (data) {
                        if (data.flag == 200) {
                            validateCode = code;
                            deleteArticle();
                        } else {
                            validateCode = null;
                            toastr.error(data.info, data.flag);
                            console.warn("Error Code: " + data.flag);
                        }
                    });
                } else {
                    toastr.error("请输入验证码~");
                }
            });
        }
    }

    //发送验证码邮件
    function sendValidateMail() {
        $.ajax({
            url: 'site.do?method=sendValidateCode',
            type: "POST",
            success: function (data) {
                if (data.flag == 200) {
                    toastr.success("验证邮件发送成功！");
                } else {
                    toastr.error(data.info, "错误");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function (XHR, TS) {
                toastr.error(TS, '验证邮件发送失败！');
            }
        });
    }

    function deleteArticle() {
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("正在删除~", "", "notify_article_deleting");
        $.post("article.do?method=delete", {"aid": aid, "validateCode": validateCode}, function (data) {
            common_utils.removeNotify("notify_article_deleting");
            if (data.flag == 200) {
                toastr.success('删除成功！');
                toastr.success("此页面刷新后将不可用~", "", {"timeOut": 0});
            } else {
                toastr.error(data.info, '删除失败！');
                console.warn("Error Code: " + data.flag);
            }
        }).fail(function () {
            common_utils.removeNotify("notify_article_deleting");
            toastr.error("服务器错误", '删除失败！');
        });
    }

    // 注册监控服务器的未读评论消息推送
    function initWsReceiveServerPush() {
        if (login_handle.validateLogin()) {
            var eventPrefix = websocket_util.config.event.messageReceive + ".";
            var notify_ws_opts = {
                "progressBar": false,
                "positionClass": "toast-top-right",
                "iconClass": "toast-success-no-icon",
                "timeOut": 0,
                "onclick": function () {

                },
                "onShown": function () {
                    $(this).css("opacity", "1");
                }
            };
            // 收到新评论，unbind取消login.js中的默认处理
            websocket_util.unbind(eventPrefix + "receive_comment").bind(eventPrefix + "receive_comment", function (e, wsMessage, wsEvent) {
                var comment = wsMessage.metadata.comment;
                var article = wsMessage.metadata.article;
                var notify_opts = $.extend({}, notify_ws_opts, {
                    "onclick": function () {
                        if (article.aid == aid) {   // 当前文章是被评论的文章
                            $('html, body').animate({
                                scrollTop: $("#li_" + comment.cid).offset().top - ($(window).height() / 2 - 75)
                            }, 380);
                            // var commentDiv = document.getElementById("li_" + comment.cid);
                            // // 实现当前评论出现可见区域内，就不滚动，否则就滚动到屏幕内
                            // if ("scrollIntoViewIfNeeded" in commentDiv) {   // chrome
                            //     commentDiv.scrollIntoViewIfNeeded();
                            // } else {
                            //     if (!common_utils.isOnScreen(commentDiv, 150, 150)) { // 不在可见区域
                            //         if ("scrollIntoView" in commentDiv) {   // ie, firefox
                            //             commentDiv.scrollIntoView({
                            //                 block: "end",   // 与底部齐平
                            //                 behavior: "smooth"  // 动画
                            //             });
                            //         } else {    // opera
                            //             $('html, body').animate({
                            //                 scrollTop: $(commentDiv).offset().top - ($(window).height() / 2 - 75)
                            //             }, 400);
                            //         }
                            //     }
                            // }
                        } else {
                            window.open("article.do?method=detail&aid=" + comment.aid + "#comments");
                        }
                    }
                });
                if (article.aid == aid) {   // 当前文章是被评论的文章
                    // 直接显示
                    list.push(comment);
                    buildCommentAreaHtml(list, 1);
                }
                var msg = null;
                if (comment.parentid == 0) {
                    msg = comment.user.nickname + " 在你的文章<br><b>“" + article.title + "”</b><br>发表了评论~";
                } else {
                    msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                }
                common_utils.notify(notify_opts).success(msg, "", "receive_comment");
            });
        }
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
                tCounter: '%curr% of %total%' // markup of counter
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
        } else if (hash == "comments") {
            $('html, body').animate({scrollTop: $("#comments").offset().top - 80}, 400);
        } else if (!hash) {
            //滚动效果（除去有hash值时）
            $('html, body').animate({scrollTop: x}, 'slow');
        }

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

        // 注册监控服务器的未读评论消息推送
        initWsReceiveServerPush();
    });

});
