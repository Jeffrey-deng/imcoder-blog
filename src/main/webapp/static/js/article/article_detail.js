(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'magnificPopup', 'login_handle', 'comment_plugin', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, null, login_handle, comment_plugin, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, magnificPopup, login_handle, comment_plugin, websocket_util) {

    var config = {
        pageArticleId: parseInt($("#h_aid").attr("aid")) || 0,
        hostUserId: parseInt($("#h_auid").attr("auid")) || 0,
        selector: {
            "articleHandleArea": ".article_header .article_handle",
            "collectArticleBtn": "#collectArticleBtn",
            "fillArticleToMainAreaBtn": "#fillArticleToMainAreaBtn",
            "firstHeaderArea": "#first",
            "mainArea": "#main",
            "rankListArea": "#rank_col",
            "hostUserNickName": "#h_auid > :nth-child(1)",
            "showDeleteModalBtn": "#showDeleteModalBtn",
            "submitDeleteArticleBtn": "#deleteArticleBtn"
        },
        path_params: {
            "basePath": $('#basePath').attr('href'),
            "staticPath": $('#staticPath').attr('href'),
            "cloudPath": $('#cloudPath').attr('href')
        }
    };

    /**
     * 收藏文章
     */
    function collectArticleBtnAction() {
        var actionBtn = $(config.selector.collectArticleBtn);
        var preStatus = actionBtn.attr("status") || "no";
        //添加收藏
        if (preStatus == "no") {
            $.ajax({
                url: "user.do?method=collectArticle",
                type: "POST",
                data: {"aid": config.pageArticleId},
                success: function (data) {
                    if (data.flag == 200) {
                        toastr.success("文章收藏成功~");
                        setCollectBtnStatus("yes");
                    } else if (data.flag == 204) {
                        toastr.success("已经收藏过了，无须再点击~");
                        setCollectBtnStatus("yes");
                    } else {
                        toastr.error(data.info, "文章收藏失败");
                        console.warn("Error Code: " + data.flag);
                    }
                },
                error: function () {
                    toastr.error("文章收藏失败");
                }
            });
        } else { // 取消收藏
            if (confirm("你确定要取消收藏吗？")) {
                $.ajax({
                    url: "user.do?method=unCollectArticle",
                    type: "POST",
                    data: {"aid": config.pageArticleId},
                    success: function (data) {
                        if (data.flag == 200) {
                            toastr.success("删除收藏成功~");
                            setCollectBtnStatus("no");
                        } else {
                            toastr.error(data.info, "删除收藏失败");
                            console.warn("Error Code: " + data.flag);
                        }
                    },
                    error: function () {
                        toastr.error("删除收藏失败");
                    }
                });
            }
        }
    }

    /**
     * 设置收藏按钮显示状态
     * @param status "yes" 或 "no"
     */
    function setCollectBtnStatus(status) {
        var actionBtn = $(config.selector.collectArticleBtn);
        if (status == "yes") {
            actionBtn.attr("status", "yes").html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 已收藏</b>');
        } else {
            actionBtn.attr("status", "no").html('<span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span><b> 收藏</b>');
        }
    }

    /**
     * 检查登录者是否收藏该文章
     */
    function checkCollection() {
        $.ajax({
            url: 'user.do?method=checkCollection',
            data: {'aid': config.pageArticleId},
            success: function (data) {
                if (data.flag == 200) {
                    console.log("已收藏该文章~");
                    setCollectBtnStatus("yes");
                }
            }
        });
    }

    // 初始化删除事件
    function initDeleteEvent() {
        var callOnValidate = function (inputValidateCode, validateMailModal) {
            deleteArticle(config.pageArticleId, inputValidateCode, function () {
                validateMailModal.modal("hide");
            });
        };
        // 验证码验证正确才运行callOnValidate
        var selector = {
            "validateMailModal": "#validateMailModal",
            "sendValidateMailBtn": "#sendValidateMailBtn",
            "validateMailForm": "#validateMailForm",
        };
        $(config.selector.showDeleteModalBtn).click(function () {
            $(selector.validateMailModal).modal({backdrop: 'static', keyboard: false});
        });
        var validateMailModal = $(selector.validateMailModal);
        if (validateMailModal.length > 0) {
            // 发送验证邮件事件
            $(selector.sendValidateMailBtn).click(function () {
                // 发送邮件
                sendValidateMail();
                // 30秒后重新启用发送按钮
                var _self = $(this);
                _self.attr('disabled', "true").val("30s后");
                var num = 30;
                var enableInterval = setInterval(function () {
                    _self.val((--num) + "s后");
                }, 1000);
                setTimeout(function () {
                    clearInterval(enableInterval);
                    _self.removeAttr("disabled").val("重新发送");
                }, 30 * 1000 + 10);
            });
            // 检查验证码是否正确事件
            $(config.selector.submitDeleteArticleBtn).click(function () {
                var inputValidateCode = $(selector.validateMailForm).find('input[name="validateCode"]').val().replace(/(^\s*)|(\s*$)/g, '');
                if (inputValidateCode) {
                    $.get("site.do?method=checkValidateCode", {"code": inputValidateCode}, function (data) {
                        if (data.flag == 200) {
                            callOnValidate(inputValidateCode, validateMailModal);
                        } else {
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

    /**
     * 发送验证码邮件
     */
    function sendValidateMail() {
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("服务器正在发送邮件~", "", "notify_validate_code_mail_sending");
        $.ajax({
            url: 'site.do?method=sendValidateCode',
            type: "POST",
            success: function (data) {
                common_utils.removeNotify("notify_validate_code_mail_sending");
                if (data.flag == 200) {
                    toastr.success("验证邮件发送成功~");
                } else {
                    toastr.error(data.info, "错误");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function (XHR, TS) {
                common_utils.removeNotify("notify_validate_code_mail_sending");
                toastr.error(TS, "验证邮件发送失败！");
            }
        });
    }

    /**
     * 删除文章
     * @param aid
     * @param validateCode 验证码
     */
    function deleteArticle(aid, validateCode, call) {
        if (!aid) {
            toastr.error("输入aid为空");
            return;
        }
        if (!validateCode) {
            toastr.error("验证码为空");
            return;
        }
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("正在删除~", "", "notify_article_deleting");
        $.post("article.do?method=delete", {"aid": aid, "validateCode": validateCode}, function (data) {
            common_utils.removeNotify("notify_article_deleting");
            if (data.flag == 200) {
                toastr.success('删除成功~');
                toastr.success("此页面刷新后将不可用~", "", {"timeOut": 0});
                call && call();
            } else {
                toastr.error(data.info, '删除失败！');
                console.warn("Error Code: " + data.flag);
            }
        }).fail(function () {
            common_utils.removeNotify("notify_article_deleting");
            toastr.error("服务器错误", '删除失败！');
        });
    }

    /**
     *  将显示文章区域覆盖整个主区域
     * @param {String=} preStatus - "no" 或 "yes", 之前是否已经收藏
     */
    function fillArticleToMainArea(preStatus) {
        preStatus = preStatus || ($(config.selector.fillArticleToMainAreaBtn).attr("status") || "no");
        var url = document.location.href;
        var hashIndex = url.indexOf('#');
        var mainArea = $(config.selector.mainArea);
        var rankListArea = $(config.selector.rankListArea);
        var article_header_ul = mainArea.find(".article_header .article_category").parent().parent();
        if (preStatus == "no") {
            rankListArea.hide(300);
            mainArea.removeClass('col-md-9').addClass('col-md-12');
            var author_nickname_dom = rankListArea.find("#user_rank .author_nickname");
            var author_url = author_nickname_dom.attr("href");
            var author_nickname = author_nickname_dom.text();
            if (article_header_ul.find(".article_author").length == 0) {
                article_header_ul.append('<li class="article_author">作者: <a href="' + author_url + '" target="_blank">' + author_nickname + '</a></li>')
            }
            setFillArticleToMainAreaStatus("yes");
            history.replaceState(
                null,
                document.title,
                (hashIndex == -1 ? url : url.substring(0, hashIndex)) + "#full-screen"
            );
        } else {
            rankListArea.show(300);
            mainArea.removeClass('col-md-12').addClass('col-md-9');
            article_header_ul.find(".article_author").remove();
            setFillArticleToMainAreaStatus("no");
            history.replaceState(
                null,
                document.title,
                (hashIndex == -1 ? url : url.substring(0, hashIndex))
            );
        }
    }

    /**
     * 设置文章全屏按钮显示状态
     * @param status "yes" 或 "no"
     */
    function setFillArticleToMainAreaStatus(status) {
        var actionBtn = $(config.selector.fillArticleToMainAreaBtn);
        if (status == "yes") {
            actionBtn.attr("status", "yes").html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 全屏</b>');
        } else {
            actionBtn.attr("status", "no").html('<span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span><b> 全屏</b>');
        }
    }

    /**
     * 初始化图片放大查看器
     */
    var initClickEnlarge = function () {
        // 图片查看modal
        $(".post-container").magnificPopup({
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
                    return '<a style="color:white" href="' + openUrl + '" target="_blank">' + photo_name + '</a><small>by ' + $(config.selector.hostUserNickName).text() + '</small>';
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

    function isHasArticleHandleArea() {
        return $(config.selector.articleHandleArea).length > 0
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
                var notify_opts = null;
                var msg = null;
                switch (comment.mainType) {
                    case 0:
                        var article = wsMessage.metadata.article;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                if (article.aid == config.pageArticleId) {   // 当前文章是被评论的文章
                                    comment_plugin.utils.scrollToSpecialComment(comment);
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
                                    window.open("article.do?method=detail&aid=" + article.aid + "#comment_" + comment.cid);
                                }
                            }
                        });
                        if (article.aid == config.pageArticleId) {   // 当前文章是被评论的文章
                            // 直接显示
                            comment_plugin.utils.appendCommentInPage(comment);
                        }
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + " 在你的文章<br><b>“" + article.title + "”</b><br>发表了评论~";
                        } else {
                            msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                        }
                        break;
                    case 1:
                        var photo = wsMessage.metadata.photo;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                window.open("photo.do?method=detail&id=" + photo.photo_id + "#comment_" + comment.cid);
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + " 对你的照片<br><b>“" + photo.photo_id + "”</b><br>发表了评论~";
                        } else {
                            msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                        }
                        break;
                    case 2:
                        var video = wsMessage.metadata.video;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function () {
                                window.open("video.do?method=detail&id=" + video.video_id + "#comment_" + comment.cid);
                            }
                        });
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + " 对你的视频<br><b>“" + video.video_id + "”</b><br>发表了评论~";
                        } else {
                            msg = "<b>“" + comment.user.nickname + "”</b><br>回复了你的评论~";
                        }
                        break;
                }
                if (msg) {
                    common_utils.notify(notify_opts)
                        .success(msg, "", "receive_comment" + "_" + comment.cid)
                        .addClass("wsMessage receive_comment").attr("data-wsid", wsMessage.id).attr("data-cid", comment.cid);
                }
            });
        }
    }

    /* ********** main ************* */

    // 评论模块初始化
    comment_plugin.init({
        mainType: 0,    //0代表文章评论
        mainIdVariableName: "mainId",
        mainId: config.pageArticleId,
        hostUserId: config.hostUserId,
        autoScrollOnPageOpen: true, // 开启在页面打开时根据url的#hash值自动滚到对应位置
        selector: {
            "commentListArea": "#comments",
            "commentEditor": "#comment_form_content",
            "commentParentId": "#comment_form_parentId",
            "commentReplyUid": "#comment_form_replyUid",
            "commentInputUseHtmlTag": "#useInputCommentUseHtmlTag",
            "commentSendAnonymously": "#useSendCommentAnonymously",
            "commentSubmit": "#comment_form_submit",
            "commentNodeIdPrefix": "comment_",
            "commentEditorFocusBtnId": "addComment",
        },
        callback: {
            /**
             * 用户定义下载已有评论列表的请求
             * @param mainId
             * @param hostUserId
             * @param {Function} call - 请求完后执行此回调，将评论列表数组作为参数传入此方法，请求错误则传入null
             */
            "userDefinedLoadComments": function (mainId, hostUserId, call) {   // 从服务器加载评论的回调， 在call中返回评论数组
                $.get("message.do?method=listComment", {
                    "mainType": config.mainType,
                    "mainId": mainId
                }, function (data) {
                    if (data && data.flag == 200) {
                        call && call.call(comment_plugin, data.comments);   // 调用call传入评论数组
                    } else {
                        toastr.error("无权限加载评论？", data.flag);
                    }
                }).fail(function () {
                    toastr.error("加载评论出错");
                });
            },
            /**
             * 用户定义提交评论请求回调
             * @param postComment - 要提交的评论
             * @param {Function} call - 请求完后执行此回调：
             *  提交正确，将新comment作为参数传入此方法，
             *  提交错误，将null作为参数传入此方法，
             */
            "userDefinedSubmitComment": function (postComment, call) {
                postComment.mainType = config.mainType;
                $.ajax({
                    data: postComment,
                    type: "POST",
                    url: "message.do?method=addComment",
                    global: false,    // 去掉全局事件
                    success: function (data) {
                        if (data.flag == 200) {
                            call(data.comment);
                        } else {
                            call(null);
                            toastr.error(data.info, "添加评论失败");
                            console.warn("Error Code: " + data.flag);
                        }
                    },
                    error: function (XHR, TS) {
                        call(null);
                        console.warn("评论添加失败，提示：" + TS);
                        toastr.error(TS, "评论添加失败");
                    }
                });
            },
            /**
             * 用户定义删除评论请求回调
             * @param postComment - 要删除的的评论
             * @param {Function} call - 请求完后执行此回调：
             *  提交正确，将“full”或“fill”作为参数传入此方法:
             *      “full”代表可以完全删除此评论，
             *      “fill”代表只是将评论内容填充为“已删除”
             *  提交错误，将null作为参数传入此方法，
             */
            "userDefinedDeleteComment": function (postComment, call) {
                var data = {"cid": postComment.cid, "parentId": postComment.parentId};
                $.post("message.do?method=deleteComment", data, function (data) {
                    if (data) {
                        if (data.flag == 200) {
                            call("full");
                            toastr.success("评论删除成功~");
                        } else if (data.flag == 201) {
                            call("fill");
                            toastr.success("评论删除成功~");
                        } else {
                            call(null);
                            toastr.error(data.info, "评论删除失败");
                            console.warn("Error Code: " + data.flag);
                        }
                    } else {
                        call(null);
                        toastr.error("返回数据出错");
                    }
                });
            }
        },
        path_params: {
            "basePath": $('#basePath').attr('href'),
            "staticPath": $('#staticPath').attr('href'),
            "cloudPath": $('#cloudPath').attr('href')
        }
    });

    domReady(function () {
        // hash响应
        var hash = document.location.href.match(/#(.*)$/) ? RegExp.$1 : "";
        if (hash) {
            switch (hash) {
                case "full-screen":
                    if (document.body.clientWidth >= 768 && isHasArticleHandleArea()) {
                        $(config.selector.mainArea).find(".article_header .article_handle").find(".dropdown-toggle").eq(0).click();
                        fillArticleToMainArea("no");
                    }
                    break;
            }
        } else {
            //滚动效果（除去有hash值时）
            $("html, body").animate({scrollTop: $(config.selector.firstHeaderArea).height()}, 'slow');
        }

        var articleConfig = common_utils.getLocalConfig("article", {"full_screen": false, "full_background": false});
        if (articleConfig.full_background) {    // 是否使用全屏背景
            $("body").css("background-image", $(config.selector.firstHeaderArea).css("background-image"));
            $(config.selector.firstHeaderArea).css("background-image", "");
        }

        if (isHasArticleHandleArea()) {
            // 是否默认填充
            if (articleConfig.full_screen) {
                fillArticleToMainArea("no");
            }
            // 文章填充主区域点击事件
            $(config.selector.fillArticleToMainAreaBtn).click(function () {
                fillArticleToMainArea();
            });

            // 检查收藏
            if (login_handle.validateLogin()) {
                checkCollection();
            }
            $(config.selector.collectArticleBtn).click(function (e) {
                if (login_handle.validateLogin()) {
                    collectArticleBtnAction();
                } else {
                    login_handle.showLoginModal();
                }
            });

            // 删除事件
            initDeleteEvent();
        }

        initClickEnlarge();

        // 注册监控服务器的未读评论消息推送
        initWsReceiveServerPush();
    });

});
