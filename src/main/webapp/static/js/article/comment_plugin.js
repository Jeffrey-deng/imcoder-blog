/**
 * 评论插件（模块化）
 * @author Jeffrey.Deng
 * @date 2016-04-27
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'toastr', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.comment_plugin = factory(window.jQuery, toastr, common_utils, login_handle);
    }
})(function ($, toastr, common_utils, login_handle) {

    var pointer = {
        comments: [],
        editor: null
    };

    var config = {
        mainType: 0,
        mainIdVariableName: "mainId",
        mainId: 0,
        hostUserId: 0,
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
                    "mainType": this.config.mainType,
                    "mainId": mainId
                }, function (data) {
                    if (data && data.flag == 200) {
                        call && call.call(context, data.comments);   // 调用call传入评论数组
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
                postComment.mainType = this.config.mainType;
                $.ajax({
                    data: postComment,
                    type: "POST",
                    url: "message.do?method=addComment",
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
        event: {
            "loadCommentListCompleted": "comment.list.load.completed",
        },
        path_params: {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        }
    };


    var init = function (options) {
        // 覆盖参数
        $.extend(true, config, options);

        // 这些参数不能为空
        if (!config.mainIdVariableName || !config.mainId || !config.hostUserId) {
            console.log("comment plugin config setting error, the following parameters should not be empty: \n    " + "options.mainIdVariableName, options.mainId, options.hostUserId");
            return;
        }

        // 输入框
        pointer.editor = $(config.selector.commentEditor);

        // 提交评论按钮绑定事件
        $(config.selector.commentSubmit).click(function () {
            if (login_handle.validateLogin()) {
                var postComment = {};
                postComment.parentId = parseInt($(config.selector.commentParentId).val()) || 0;
                postComment.replyUid = parseInt($(config.selector.commentReplyUid).val()) || 0;
                postComment.content = pointer.editor.val();
                postComment[config.mainIdVariableName] = config.mainId;
                var isEnableInputUseHtmlTag = $(config.selector.commentInputUseHtmlTag).prop("checked");
                var isEnableSendAnonymously = $(config.selector.commentSendAnonymously).prop("checked");
                submitComment(postComment, isEnableInputUseHtmlTag, isEnableSendAnonymously);
            } else {
                // 弹出登陆框
                login_handle.showLoginModal(config.selector.commentListArea, function () {
                    $(config.selector.commentSubmit).click();
                });
            }
        });

        // 保存当前回复的评论id
        $(config.selector.commentParentId).val("0");
        // 保存当前回复的用户id
        $(config.selector.commentReplyUid).val(config.hostUserId);
        // 用来判断用户是否删除@xx: 如果删除了则重置回复对象
        pointer.editorInterval = null;
        pointer.editor.focus(function () {  // 获得焦点启动定时器
            pointer.editorInterval = setInterval(function () {
                if (pointer.editor.val().indexOf("@") === -1) {
                    $(config.selector.commentParentId).val("0");
                    $(config.selector.commentReplyUid).val(config.hostUserId);
                }
            }, 500);
        }).blur(function () {   // 失去焦点销毁定时器
            pointer.editorInterval && clearInterval(pointer.editorInterval);
        });

        // 根据hash自动滚动
        if (config.autoScrollOnPageOpen) {
            // hash响应
            var hash = document.location.href.match(/(#.*)$/) ? RegExp.$1 : ""; // 结果有#符号
            if (hash) {
                switch (true) {
                    case hash == ("#" + config.selector.commentEditorFocusBtnId):
                        utils.setCommentEditorFocus();
                        break;
                    case hash == config.selector.commentListArea:
                        utils.scrollToCommentListArea();
                        break;
                    case hash.match(new RegExp("#" + config.selector.commentNodeIdPrefix + "(\\d+)")) != null:
                        var cid = parseInt(RegExp.$1);
                        var func = function () {
                            utils.scrollToSpecialComment(cid);
                            utils.unbindEvent(config.event.loadCommentListCompleted, func);
                        };
                        utils.bindEvent(config.event.loadCommentListCompleted, func);
                        break;
                }
            }
        }

        // 从服务器加载评论
        loadCommentList(function (comments) {
            pointer.comments = comments || [];
            buildCommentAreaHtml(pointer.comments, 1);
            utils.triggerEvent(config.event.loadCommentListCompleted, pointer.comments);
        });
    };

    var loadCommentList = function (call) {
        config.callback.userDefinedLoadComments.call(context, config.mainId, config.hostUserId, call);
    };

    // 获取评论主楼列表(直接回复文章的第一级评论)
    function getTopics(list) {
        var topics = [];
        for (var i = 0; i < list.length; i++) {
            var t = list[i];
            if (t.parentId == 0) {
                t.replies = getReplies(t, list);
                topics.push(t);
            }
        }
        return topics;
    }

    // 迭代获取评论回复，递归
    function getReplies(item, list) {
        var replies = [];
        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            if (r.parentId == item.cid) {
                r.replies = getReplies(r, list);
                replies.push(r);
            }
        }
        return replies;
    }

    /**
     * 获取评论的HTML，递归
     * @param comment
     * @param building 栋, 从1开始
     * @param floor 栋中的第几层, 从1开始
     * @param room 层中的第几室 , 从1开始
     * @returns {string}
     */
    function getItemHtml(comment, building, floor, room) {
        if (!floor) floor = 1;
        if (!room) room = 1;
        var loginUserId = login_handle.getCurrentUserId() || 0;
        var html = '<li id="' + (config.selector.commentNodeIdPrefix + comment.cid) + '" class="comment-body ';
        html += (comment.parentId == 0 ? 'comment-parent ' : '') + (comment.user.uid == config.hostUserId ? 'comment-by-author ' : '' );
        html += ((floor % 2 == 0) ? 'comment-level-even ' : 'comment-level-odd ') + '">';
        html += '<div class="comment-author"><span itemprop="image" style="text-align: center;">';
        html += '<img class="avatar" src="' + config.path_params.staticPath + comment.user.head_photo + '" title=""></span>';
        if (comment.anonymous == 0) {
            html += '<cite class="fn" itemprop="name"><a href="' + config.path_params.basePath + 'user.do?method=home&uid=' + comment.user.uid + '" target="_blank">' + comment.user.nickname + '</a></cite></div>';
        } else {
            html += '<cite class="fn" itemprop="name"><a class="anonymous-user" title="这是一个匿名用户">' + comment.user.nickname + '</a></cite></div>';
        }
        html += '<div class="comment-meta"><a href="#' + (config.selector.commentNodeIdPrefix + comment.cid) + '"><time itemprop="commentTime" datetime="">' + comment.send_time + '</time></a></div>';
        html += '<div class="comment-floor"><a href="#' + (config.selector.commentNodeIdPrefix + comment.cid) + '">' + (building + '栋/' + floor + '层/' + room + '间') + '</a></div>';
        html += '<div class="comment-content" itemprop="commentText">';
        html += '<p>' + comment.content.replace(/\n/g, "</p><p>") + '</p></div>';
        html += '<div class="comment-reply" cid=' + comment.cid + '>';
        // 匿名的评论每个人都显示删除按钮，是否能删除到服务器再验证
        html += ((loginUserId && (comment.anonymous != 0 || loginUserId == comment.user.uid)) ? '<a href="#delete" onclick="">删除</a>' : '' );
        html += '&nbsp;&nbsp;<a href="#reply" onclick="">回复</a></div>';
        if (comment.replies != null && comment.replies.length > 0) {
            html += '<div class="comment-children" itemprop="discusses"><ol class="comment-list">';
            for (var j = 0; j < comment.replies.length; j++) {
                html += getItemHtml(comment.replies[j], building, floor + 1, j + 1);
            }
            html += '</ol></div>';
        }
        html += '</li>';
        return html;
    }

    /**
     * 构建评论列表HTML
     * @param list
     * @param pageIndex
     */
    function buildCommentAreaHtml(list, pageIndex) {
        // 得到直接回复文章的第一级评论列表
        var topics = getTopics(list);
        // 组装HTM
        var listHtml = '<h3 class="comment-meta-count">已有 ' + list.length + ' 条评论<a class="comment-add-new" style="float:right;" href="#' + config.selector.commentEditorFocusBtnId + '">添加评论</a></h3>';
        listHtml += '<ol class="comment-list">';
        for (var i = 0; i < topics.length; i++) {
            var comment = topics[i];
            var building = i + 1; // 第几栋楼
            listHtml += getItemHtml(comment, building);
        }
        listHtml += '</ol>';
        $(config.selector.commentListArea).html(listHtml);
        // 绑定评论区各按钮事件
        bindCommentHandleBtnEvent();
    }

    // 绑定评论区各按钮事件
    function bindCommentHandleBtnEvent() {
        $(config.selector.commentListArea).find("a").click(function () {
            var _self = $(this);
            if (login_handle.validateLogin()) {
                var href = _self.attr("href");
                if (!href) {
                    return;
                }
                var action = href.match(/#(.*)$/) ? RegExp.$1 : ""; // 结果无#符号
                var commentId = _self.parent().attr("cid");
                switch (true) {
                    case action == "reply":
                        var comment = getComment(commentId, pointer.comments);
                        pointer.editor.val("@" + comment.user.nickname + ":");
                        $(config.selector.commentParentId).val(commentId);
                        $(config.selector.commentReplyUid).val(comment.user.uid);
                        utils.setCommentEditorFocus();
                        break;
                    case action == config.selector.commentEditorFocusBtnId:
                        pointer.editor.val("");
                        $(config.selector.commentParentId).val("0");
                        $(config.selector.commentReplyUid).val(config.hostUserId);
                        utils.setCommentEditorFocus();
                        return true;
                    case action == "delete":
                        if (confirm("你确定要删除这篇评论吗？")) {
                            deleteComment(commentId);
                        }
                        break;
                    case action.match(new RegExp(config.selector.commentNodeIdPrefix + "(\\d+)")) != null:
                        utils.scrollToSpecialComment(parseInt(RegExp.$1));
                        return true;
                    default:
                        return true;
                }
                return false;
            } else {
                toastr.info("先登录才能评论~");
                //弹出登陆框
                login_handle.showLoginModal(_self.attr("href"));
            }
        });
        // 匿名用户点击事件
        $(config.selector.commentListArea).find(".anonymous-user").click(function () {
            toastr.info("这是一个匿名用户, 无法查看~");
            return false;
        });
    }

    // 获取评论对象
    function getComment(cid, list) {
        list = list || pointer.comments;
        for (var i = 0; i < list.length; i++) {
            var comment = list[i];
            if (comment.cid == cid)
                return comment;
        }
        return null;
    }

    /**
     * 删除评论
     * @param commentId
     */
    function deleteComment(commentId) {
        if (!commentId) {
            toastr.error("输入的评论id错误", "参数错误");
            return;
        }
        var comment = getComment(commentId, pointer.comments);
        if (comment) {
            config.callback.userDefinedDeleteComment.call(context, comment, function (type) {
                if (type) {
                    if (type == "full") {
                        utils.deleteCommentInPage(comment.cid, "full");
                    } else if (type == "fill") {
                        utils.deleteCommentInPage(comment.cid, "fill");
                    }
                }
            });
        }
    }

    /**
     * 提交评论
     * @param {Object} postComment
     * @param {Boolean} isEnableInputUseHtmlTag - 是否开启了输入使用HTML标签
     * @param {Boolean} isEnableSendAnonymously - 是否开启了匿名评论
     */
    function submitComment(postComment, isEnableInputUseHtmlTag, isEnableSendAnonymously) {
        if (revisePostComment(postComment, isEnableInputUseHtmlTag, isEnableSendAnonymously)) {
            config.callback.userDefinedSubmitComment.call(context, postComment, function (saveComment) {
                if (saveComment && saveComment.cid) {
                    utils.appendCommentInPage(saveComment);
                    pointer.editor.val("");
                    utils.scrollToSpecialComment(saveComment);
                }
            });
        }
    }

    /**
     * 校正评论
     * @param postComment
     * @param isEnableInputUseHtmlTag
     * @param isEnableSendAnonymously
     * @returns {boolean}
     */
    function revisePostComment(postComment, isEnableInputUseHtmlTag, isEnableSendAnonymously) {
        if (!postComment) {
            toastr.error("程序错误~， 提交的评论对象为空");
            return false;
        }
        // 去除 @{nickname}:
        if (postComment.parentId != 0) {
            var replyComment = getComment(postComment.parentId);
            if (replyComment) {
                postComment.content = postComment.content.replace(new RegExp("^@" + replyComment.user.nickname + ":"), "");
            } else {
                toastr.error("回复的评论id设置错误~ 刷新试试", "你修改dom了？");
                return false;
            }
        }
        // 如果开启了输入使用HTML标签
        if (isEnableInputUseHtmlTag) {
            postComment.content = $("<div/>").html(postComment.content).html(); // 补全标签
        } else {
            // 转义标签
            postComment.content = $("<div/>").text(postComment.content).html();
            // 将图片链接转化为img标签
            var reMap = {};
            var replacementIndex = 0;
            postComment.content = postComment.content.replace(/<img.*?>/, function (match) {
                var key = "【$RE_(*&$_MATCH_^_REPACEMENT_%$_" + (replacementIndex++) + "】"; // 首尾中文符号，避开[\x21-\x7e]更合适
                reMap[key] = match;
                return key;
            });
            postComment.content = postComment.content.replace(/(https?:\/\/[a-z0-9\.]+\/[\x21-\x7e]*\.(gif|jpe?g|png|bmp|svg|ico)(\?[\x21-\x7e]*)?)/gi, function (match, url) {
                if (postComment.content != url) {
                    return '<img src="' + match + '" style="padding-bottom: 6px;padding-top: 6px;">';
                } else {
                    return '<img src="' + match + '">';
                }
            });
            for (var reKey in reMap) {
                postComment.content = postComment.content.replace(key, reMap[reKey]);
            }
        }
        // 如果开启了匿名评论
        if (isEnableSendAnonymously) {
            postComment.anonymous = 1;
        }
        if (!postComment.content) {
            toastr.error("评论不能为空~");
            return false;
        }
        if (postComment.content.length >= 500) {
            toastr.error("评论字数不能超过500！");
            return false;
        }
        return true;
    }

    var utils = {
        "bindEvent": function (eventName, func) {
            $(context).bind(eventName, func);
        },
        "triggerEvent": function (eventName) {
            return $(context).triggerHandler(eventName, Array.prototype.slice.call(arguments, 1));
        },
        "unbindEvent": function (eventName, func) {
            $(context).unbind(eventName, func);
        },
        "appendCommentInPage": function (comment) {
            if (comment) {
                if (!getComment(comment.cid)) {
                    pointer.comments.push(comment);
                    buildCommentAreaHtml(pointer.comments, 1);
                }
            }
        },
        /**
         * 从页面移除评论
         * @param commentId
         * @param level - "full" or "fill"
         */
        "deleteCommentInPage": function (commentId, level) {
            level = level || "full";
            var comment = getComment(commentId, pointer.comments);
            if (comment) {
                if (level == "full") {
                    pointer.comments.splice(pointer.comments.indexOf(comment), 1);
                    // $("#" + config.selector.commentNodeIdPrefix + commentId).remove();
                } else {
                    comment.content = "*已删除*";
                    // $("#" + config.selector.commentNodeIdPrefix + commentId).find('.comment-content').eq(0).find('p').eq(0).html('*已删除*');
                }
                buildCommentAreaHtml(pointer.comments, 1);
            }
        },
        /**
         * 使评论框获得焦点
         */
        "setCommentEditorFocus": function () {
            $('html, body').animate({
                scrollTop: pointer.editor.offset().top - 80
            }, 400);
            pointer.editor.focus();
        },
        /**
         * 滚动到评论列表区域
         * @param cid
         */
        "scrollToCommentListArea": function () {
            $("html, body").animate({scrollTop: $(config.selector.commentListArea).offset().top - 80}, 400);
        },
        /**
         * 滚动到某个评论
         * @param cid
         */
        "scrollToSpecialComment": function (cid) {
            var id = typeof cid == "object" ? cid.cid : cid;
            var commentLi = $("#" + config.selector.commentNodeIdPrefix + id);
            if (commentLi.length > 0) {
                $('html, body').animate({
                    scrollTop: commentLi.offset().top - ($(window).height() / 2 - 75)
                }, 380);
                commentLi.css("background", "#fcf8e3");
                setTimeout(function () {
                    commentLi.css("background", "");
                }, 2500)
            }
        }
    };

    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "loadCommentList": loadCommentList,
        "getTopics": getTopics,
        "getReplies": getReplies,
        "getItemHtml": getItemHtml,
        "buildCommentAreaHtml": buildCommentAreaHtml,
        "bindCommentHandleBtnEvent": bindCommentHandleBtnEvent,
        "getComment": getComment,
        "deleteComment": deleteComment,
        "submitComment": submitComment,
        "revisePostComment": revisePostComment,
        "utils": utils
    };

    return context;
});