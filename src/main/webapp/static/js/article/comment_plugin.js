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
        commentSortBy: "hot", // 评论排序by，time: 按时间，hot: 按点赞
        commentSortType: "desc", // 评论排序方式，asc: 升序，desc: 降序
        selector: {
            "commentListArea": "#comments",
            "commentEditor": "#comment_form_content",
            "commentParentId": "#comment_form_parentId",
            "commentReplyUid": "#comment_form_replyUid",
            "commentInputUseHtmlTag": "#useInputCommentUseHtmlTag",
            "commentSendAnonymously": "#useSendCommentAnonymously",
            "commentOpenInsertImageModal": "#openInsertImageModalTrigger",
            "commentInsertImageModal": "#messageInsertImageModal",
            "commentSubmit": "#comment_form_submit",
            "commentNodeIdPrefix": "comment_",
            "commentEditorFocusBtnId": "addComment",
            "commentLikeBtnSvgSymbolId": "comment-like-btn-symbol",
            "comment_liked_record_cache_name": "comment_liked_record"
        },
        callback: {
            /**
             * 用户定义下载已有评论列表的请求
             * @param mainId
             * @param hostUserId
             * @param {Function} call - 请求完后执行此回调，将评论列表数组作为参数传入此方法，请求错误则传入null
             */
            "userDefinedLoadComments": function (mainId, hostUserId, call) {   // 从服务器加载评论的回调， 在call中返回评论数组
                var mainType = this.config.mainType;
                $.get("message.api?method=getCommentList", {
                    "mainType": mainType,
                    "mainId": mainId
                }, function (response) {
                    if (response.status == 200) {
                        call && call.call(context, response.data.comments);   // 调用call传入评论数组
                    } else {
                        toastr.error("无权限加载评论？", response.status);
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
                    url: "message.api?method=addComment",
                    success: function (response) {
                        if (response.status == 200) {
                            call(response.data.comment);
                        } else {
                            call(null);
                            toastr.error(response.message, "添加评论失败");
                            console.warn("Error Code: " + response.status);
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
                $.post("message.api?method=deleteComment", data, function (response) {
                    if (response.status == 200) {
                        var data = response.data;
                        if (data.type == 2) {
                            call("full");
                            toastr.success("评论删除成功~");
                        } else if (data.type == 1) {
                            call("fill");
                            toastr.success("评论删除成功~");
                        }
                    } else {
                        call(null);
                        toastr.error(response.message, "评论删除失败");
                        console.warn("Error Code: " + response.status);
                    }
                });
            },
            /**
             * 用户定义点赞评论请求回调
             * @param postComment - 要点赞的评论
             * @param {Function} call - 请求完后执行此回调：
             *  提交正确，将新comment作为参数传入此方法，
             *  提交错误，将null作为参数传入此方法，
             */
            "userDefinedLikeComment": function (comment, call) {
                var postData = {"cid": comment.cid};
                $.ajax({
                    data: postData,
                    type: "POST",
                    url: "message.api?method=likeComment",
                    success: function (response) {
                        if (response.status == 200) {
                            call(response.data.comment);
                        } else {
                            call(null);
                            toastr.error(response.message, "点赞评论失败");
                            console.warn("Error Code: " + response.status);
                        }
                    },
                    error: function (XHR, TS) {
                        call(null);
                        console.warn("点赞添加失败，提示：" + TS);
                        toastr.error(TS, "点赞添加失败");
                    }
                });
            }
        },
        event: {
            "loadCommentListCompleted": "comment.list.load.completed",
            "commentHtmlBuildCompleted": "comment.html.build.completed",
            "commentSubmitCompleted": "comment.submit.completed",
            "commentDeleteCompleted": "comment.delete.completed",
            "commentLikeCompleted": "comment.like.completed"
        },
        path_params: {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        }
    };


    var init = function (options) {
        // 覆盖参数
        common_utils.extendNonNull(true, config, options);

        // 这些参数不能为空
        if (!config.mainIdVariableName || !config.mainId || config.mainId == "0" || !config.hostUserId) {
            console.log("comment plugin config setting error, the following parameters should not be empty: \n    " + "options.mainIdVariableName, options.mainId, options.hostUserId");
            return;
        }

        // 输入框
        pointer.editor = $(config.selector.commentEditor);

        // 评论贴图按钮
        $(config.selector.commentOpenInsertImageModal).click(function () {
            $(config.selector.commentInsertImageModal).modal();
            return false;
        });

        // 提交贴图按钮
        $(config.selector.commentInsertImageModal).find(".message-image-submit-btn").click(function () {
            var modal = $(config.selector.commentInsertImageModal);
            var imageFiles = modal.find(".message-image-input")[0].files;
            var imageUrl = modal.find(".message-image-url").val();
            if ((!imageFiles || imageFiles.length == 0) && !imageUrl) {
                toastr.error("请选择图片或输入图片地址~");
                return;
            }
            var isUploadFile = imageFiles && imageFiles.length > 0;
            var insertCall = function (imageHtml) {
                var content = pointer.editor.val();
                if (!content || /[\s\S]*\n$/.test(content)) {
                    pointer.editor.val(content + imageHtml);
                } else {
                    pointer.editor.val(content + "\n" + imageHtml);
                }
                modal.modal("hide");
                modal.find(".message-image-input").val("");
                modal.find(".message-image-url").val("");
                utils.setCommentEditorFocus(false);
            };
            if (isUploadFile) {
                common_utils.postImage(imageFiles, "message-insert-image not-only-img", function (imageHtml, imageArr, isAllSuccess) {
                    if (isAllSuccess) {
                        toastr.success("已插入" + imageArr.length + "张图片~");
                    }
                    insertCall(imageHtml);
                });
            } else {
                var imageHtml = '<img class="message-insert-image-url not-only-img" src="' + imageUrl + '">\n';
                toastr.success("已插入图片~");
                insertCall(imageHtml);
            }
        });

        // 提交评论按钮绑定事件
        $(config.selector.commentSubmit).click(function () {
            if (login_handle.validateLogin()) {
                var postComment = {};
                postComment.parentId = $(config.selector.commentParentId).val() || 0;
                postComment.replyUid = $(config.selector.commentReplyUid).val() || 0;
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
            var auto_scroll_hash = document.location.href.match(/(#.*)$/) ? RegExp.$1 : ""; // 结果有#符号
            if (auto_scroll_hash) {
                var auto_scroll_func = function (e) {
                    setTimeout(function () {
                        switch (true) {
                            case auto_scroll_hash == ("#" + config.selector.commentEditorFocusBtnId):
                                utils.setCommentEditorFocus();
                                break;
                            case auto_scroll_hash == config.selector.commentListArea:
                                utils.scrollToCommentListArea();
                                break;
                            case auto_scroll_hash.match(new RegExp("#" + config.selector.commentNodeIdPrefix + "(\\w+)")) != null:
                                var cid = RegExp.$1;
                                utils.scrollToSpecialComment(cid);
                                break;
                        }
                    }, 100);
                    utils.unbindEvent(config.event.loadCommentListCompleted, auto_scroll_func);
                };
                utils.bindEvent(config.event.loadCommentListCompleted, auto_scroll_func);
            }
        }

        // 评论点赞按钮svg模板
        $("body").append('<svg style="display: none;"><symbol id="' + config.selector.commentLikeBtnSvgSymbolId + '">' +
            '<path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 ' +
            '9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z" class="style-scope yt-icon"></path>' +
            '</symbol></svg>');

        // 绑定评论区各按钮事件
        bindCommentHandleBtnEvent();

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
        html += ((floor % 2 == 0) ? 'comment-level-even ' : 'comment-level-odd ') + '" data-cid=' + comment.cid + '>';
        html += '<div class="comment-author"><span itemprop="image" style="text-align: center;">';
        html += '<img class="avatar" src="' + comment.user.head_photo + '" title=""></span>';
        if (comment.anonymous == 0) {
            html += '<cite itemprop="name"><a class="comment-user-name" href="' + config.path_params.basePath + 'u/' + comment.user.uid + '/home" target="_blank">' + comment.user.nickname + '</a></cite></div>';
        } else {
            html += '<cite itemprop="name"><a class="comment-anonymous-user-name" title="这是一个匿名用户">' + comment.user.nickname + '</a></cite></div>';
        }
        html += '<div class="comment-meta"><time itemprop="commentTime" datetime="">' +
            '<a href="#' + (config.selector.commentNodeIdPrefix + comment.cid) + '" data-action-type="' + (config.selector.commentNodeIdPrefix + comment.cid) + '">' + comment.send_time + '</a></time><div class="comment-floor">';
        html += '<a href="#' + (config.selector.commentNodeIdPrefix + comment.cid) + '" data-action-type="' + (config.selector.commentNodeIdPrefix + comment.cid) + '">'
            + (building + '栋/' + floor + '层/' + room + '间') + '</a></div></div>';
        html += '<div class="comment-content" itemprop="commentText">' + common_utils.convertLinkToHtmlTag(comment.content) + '</div>';
        html += '<ul class="comment-reply">';
        // 匿名的评论每个人都显示删除按钮，是否能删除到服务器再验证
        html += '<li> <span class="comment-like">' +
            '<svg class="comment-like-btn" viewBox="0 0 24 24"><use class="comment-like-btn-ref" xlink:href="#' + config.selector.commentLikeBtnSvgSymbolId + '" x="0" y="0"/></svg>' +
            '<em class="comment-like-counts-value">' + (comment.like_count || "") + '</em></span></li>';
        html += ((loginUserId && (comment.anonymous != 0 || loginUserId == comment.user.uid)) ? '<li><a data-action-type="delete">删除</a></li>' : '' );
        html += '<li><a data-action-type="reply" onclick="">回复</a></li></ul>';
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
        list = list || pointer.comments;
        pageIndex = 1;
        // 排序
        sortCommentList(list, config.commentSortBy, config.commentSortType);
        // 得到直接回复文章的第一级评论列表
        var topics = getTopics(list);
        // 组装HTM
        var listHtml = '<ul class="comment-list-header"><li><span class="comment-total-count">已有 <em class="comment-total-count-value">' + list.length + '</em> 条评论</span></li>' +
            '<li><div class="btn-group comment-sort-by-select">' +
            '<label class="dropdown-toggle comment-sort-by-icon" data-toggle="dropdown"><span class="glyphicon glyphicon-sort"></span><span class="sr-only">Toggle Dropdown</span></label>' +
            '<span class="dropdown-toggle comment-sort-by-btn" data-toggle="dropdown" aria-expanded="true"><b>排序方式</b></span>' +
            '<ul class="dropdown-menu"><li class="comment-sort-by comment-sort-by-hot-desc">热门评论</li><li class="comment-sort-by comment-sort-by-time-asc">时间升序</li>' +
            '<li class="comment-sort-by comment-sort-by-time-desc">时间降序</li></ul></div></li>' +
            '</div></li><li style="float:right;"><a class="comment-add-new" data-action-type="' + config.selector.commentEditorFocusBtnId + '">添加评论</a></li></ul>';
        listHtml += '<ol class="comment-list">';
        for (var i = 0; i < topics.length; i++) {
            var comment = topics[i];
            var building = i + 1; // 第几栋楼
            listHtml += getItemHtml(comment, building);
        }
        listHtml += '</ol>';
        var prefix = document.location.href.replace(/#.*$/, "");
        $(config.selector.commentListArea)
            .html(listHtml)
            .find('a[href^="#"]').each(function (i, node) { // hash锚点设置前缀
            node.href = prefix + node.getAttribute("href");
        });
        utils.triggerEvent(config.event.commentHtmlBuildCompleted, list, pageIndex);
    }

    // 绑定评论区各按钮事件
    function bindCommentHandleBtnEvent() {
        $(config.selector.commentListArea).on("click", "a", function () {
            var _self = $(this);
            if (login_handle.validateLogin()) {
                var actionType = _self.attr("data-action-type");
                if (!actionType) {
                    return;
                }
                var action = actionType.match(/#?(.*)$/) ? RegExp.$1 : ""; // 结果无#符号
                var commentId = _self.closest(".comment-body").attr("data-cid");
                var setHash = false;
                switch (true) {
                    case action == "reply":
                        var comment = getComment(commentId, pointer.comments);
                        pointer.editor.val("@" + comment.user.nickname + ":");
                        $(config.selector.commentParentId).val(commentId);
                        $(config.selector.commentReplyUid).val(comment.user.uid);
                        utils.setCommentEditorFocus(false);
                        break;
                    case action == config.selector.commentEditorFocusBtnId:
                        pointer.editor.val("");
                        $(config.selector.commentParentId).val("0");
                        $(config.selector.commentReplyUid).val(config.hostUserId);
                        utils.setCommentEditorFocus(false);
                        setHash = true;
                        break;
                    case action == "delete":
                        if (confirm("你确定要删除这篇评论吗？")) {
                            deleteComment(commentId);
                        }
                        break;
                    case action.match(new RegExp(config.selector.commentNodeIdPrefix + "(\\w+)")) != null:
                        utils.scrollToSpecialComment(RegExp.$1, false);
                        setHash = true;
                        break;
                    default:
                        return true;
                        break;
                }
                if (setHash) {
                    // document.location.hash = action;
                }
                return true;
            } else {
                toastr.info("先登录才能评论~");
                //弹出登陆框
                login_handle.showLoginModal(function () {
                    _self.click();
                });
            }
        }).on("click", ".comment-anonymous-user-name", function () { // 匿名用户点击事件
            toastr.info("这是一个匿名用户, 无法查看~");
            return false;
        }).on("click", ".comment-like", function () { // 评论点赞事件
            likeComment($(this).closest(".comment-body").attr("data-cid"));
        }).on("click", ".comment-sort-by-hot-desc", function () {    // 评论按热门降序排序事件
            config.commentSortBy = "hot";
            config.commentSortType = "desc";
            buildCommentAreaHtml(pointer.comments, 1);
        }).on("click", ".comment-sort-by-time-asc", function () {   // 评论按时间升序排序事件
            config.commentSortBy = "time";
            config.commentSortType = "asc";
            buildCommentAreaHtml(pointer.comments, 1);
        }).on("click", ".comment-sort-by-time-desc", function () {   // 评论按时间降序排序事件
            config.commentSortBy = "time";
            config.commentSortType = "desc";
            buildCommentAreaHtml(pointer.comments, 1);
        }).on("click", 'img', function () {
            var $img = $(this);
            if ($img.closest('a').length == 0) {
                window.open($img.attr('src'));
            }
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
     * 评论排序
     * @param list
     * @param sortBy  - time | hot
     * @param sortType - asc | desc
     */
    function sortCommentList(list, sortBy, sortType) {
        sortBy = (sortBy == "time" ? 0 : 1);
        sortType = (sortType == "asc" ? 0 : 1);
        if (list) {
            list.sort(function (a, b) {
                var i = undefined;
                if (sortBy == 0) {
                    i = (sortType == 0 ? (a.cid - b.cid) : (b.cid - a.cid));
                } else {
                    i = (sortType == 0 ? (a.like_count - b.like_count) : (b.like_count - a.like_count));
                    if (i == 0) {
                        i = a.cid - b.cid;
                    }
                }
                return i;
            });
        }
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
                    utils.triggerEvent(config.event.commentDeleteCompleted, comment, type);
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
                    utils.triggerEvent(config.event.commentSubmitCompleted, saveComment);
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
        var textContent = postComment.content;
        if (isEnableInputUseHtmlTag) {
            textContent = $("<div/>").html(textContent).html(); // 补全标签
            textContent = textContent.replace(/(<(code|format|script)[\s\S]*?>)([\s\S]*?)(<\/\2>)/gi, function (match, tagLeft, tagName, content, tagRight) {
                if (tagName == "code") {
                    return ("<pre>" + tagLeft + common_utils.encodeHTML(content).replace(/(^\n+)|(\n+$)/g, "") + tagRight + "</pre>");
                } else if (tagName == "format") {
                    return ("<pre><code>" + common_utils.encodeHTML(content).replace(/(^\n+)|(\n+$)/g, "") + "</code></pre>"); // .replace(/\n/g, "<br>")
                } else {    // 去掉脚本
                    return "";
                }
            });
        } else {
            var reMap = {};
            var replacementIndex = 0;
            textContent = textContent.replace(/(<img[\s\S]*?>)|{(<format>)}|{(<\/format>)}/gi, function (match, g1, g2, g3) {
                var key = "【$RE_(*%$_MATCH_^_REPACEMENT_%$_" + (replacementIndex++) + "】"; // 首尾中文符号，避开[\x21-\x7e]更合适，此处需要特别注意xml符号，因为下面会转义
                reMap[key] = g1 || (g2 && common_utils.encodeHTML(g2)) || (g3 && common_utils.encodeHTML(g3));
                return key;
            }).replace(/(<format[\s\S]*?>)([\s\S]*?)(<\/format>)/gi, function (match, tagLeft, content, tagRight) { // 代码块, 原来是code标签，先改为format标签
                var key = "【$RE_(*%$_MATCH_^_REPACEMENT_%$_" + (replacementIndex++) + "】"; // 首尾中文符号，避开[\x21-\x7e]更合适，此处需要特别注意xml符号，因为下面会转义
                reMap[key] = ("<pre><code>" + common_utils.encodeHTML(content).replace(/(^\n+)|(\n+$)/g, "") + "</code></pre>"); // .replace(/\n/g, "<br>")
                return key;
            });
            // 转义标签
            textContent = $("<div/>").text(textContent).html();
            // 将图片链接转化为img标签
            textContent = textContent.replace(/(https?:\/\/[a-z0-9\.:]+\/[\x21-\x7e]*\.(gif|jpe?g|png|bmp|svg|ico)(\?[\x21-\x7e]*)?)/gi, function (match, url) {
                if (textContent != url) {
                    return '<img class="not-only-img" src="' + match + '">';
                } else {
                    return '<img src="' + match + '">';
                }
            });
            for (var reKey in reMap) {
                textContent = textContent.replace(reKey, reMap[reKey]);
            }
        }
        if (/^\s*<img[^>]*?>\s*$/.test(textContent)) {
            textContent = textContent.replace(/\s*not-only-img/gi, "");
        }
        postComment.content = textContent;
        // 如果开启了匿名评论
        if (isEnableSendAnonymously) {
            postComment.anonymous = 1;
        }
        if (!postComment.content) {
            toastr.error("评论不能为空~");
            return false;
        }
        if (postComment.content.length >= 3999) {
            toastr.error("评论字数超出~  " + postComment.content.length + "/4000");
            return false;
        }
        return true;
    }

    /**
     * 点赞评论
     *
     * @param commentId
     */
    function likeComment(commentId) {
        if (!commentId) {
            toastr.error("输入的评论id错误", "参数错误");
            return;
        }
        var comment = getComment(commentId, pointer.comments);
        if (comment) {
            var $comment_body = utils.getCommentNode(comment.cid);
            var $comment_like = $comment_body.find("> .comment-reply .comment-like");
            if (!$comment_like.hasClass("comment-has-liked")) {
                var hasLikedInRecord = utils.containCommentLikeRecordInLocal(comment);
                if (!hasLikedInRecord) {
                    config.callback.userDefinedLikeComment.call(context, comment, function (newestComment) {
                        if (newestComment && newestComment.cid) {
                            comment.like_count = newestComment.like_count;
                            $comment_body.find("> .comment-reply .comment-like-counts-value").text(comment.like_count);
                            $comment_like.addClass("comment-has-liked");
                            utils.putCommentLikeRecordToLocal(comment);
                            utils.triggerEvent(config.event.commentLikeCompleted, comment);
                        }
                    });
                } else {
                    $comment_like.addClass("comment-has-liked");
                    toastr.success("该评论你之前已经赞过了~");
                }
            }
        }
    }

    var utils = {
        "once": function (eventName, func, bindFirst) {
            var funcWrapper = function () {
                try {
                    func.apply(context, arguments);
                } finally {
                    utils.unbindEvent(eventName, funcWrapper);
                }
            };
            utils.bindEvent(eventName, funcWrapper, bindFirst);
        },
        "bindEvent": function (eventName, func, bindFirst) {
            if (bindFirst == true) {
                $(context).onfirst(eventName, func);
            } else {
                $(context).bind(eventName, func);
            }
        },
        "triggerEvent": function (eventName) {
            return $(context).triggerHandler(eventName, Array.prototype.slice.call(arguments, 1));
        },
        "unbindEvent": function (eventName, func) {
            $(context).unbind(eventName, func);
        },
        "getCommentNode": function (commentId) {
            return $("#" + config.selector.commentNodeIdPrefix + commentId);
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
        "setCommentEditorFocus": function (tryMultiScroll) {
            (tryMultiScroll === undefined || tryMultiScroll === null) && (tryMultiScroll = true);
            var focusFunc = function (no) {
                var time;
                switch (no) {
                    case 0:
                        time = 350;
                        break;
                    case 1:
                        time = 150;
                        break;
                    case 2:
                        time = 150;
                        break;
                    case 3:
                    case 4:
                        time = 300;
                        break;
                    default:
                        time = 300;
                }
                $('html, body').animate({
                    scrollTop: pointer.editor.offset().top - 80
                }, time);
                pointer.editor.focus();
            };
            focusFunc(0);
            tryMultiScroll && utils.tryToRunOnCommentMediaLoad(focusFunc);
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
        "scrollToSpecialComment": function (cid, tryMultiScroll) {
            (tryMultiScroll === undefined || tryMultiScroll === null) && (tryMultiScroll = true);
            var id = typeof cid == "object" ? cid.cid : cid;
            var commentLi = $("#" + config.selector.commentNodeIdPrefix + id);
            if (commentLi.length > 0) {
                var scrollFunc = function (no) {
                    var time;
                    switch (no) {
                        case 0:
                            time = 350;
                            break;
                        case 1:
                            time = 150;
                            break;
                        case 2:
                            time = 150;
                            break;
                        case 3:
                        case 4:
                            time = 300;
                            break;
                        default:
                            time = 300;
                    }
                    $('html, body').animate({
                        scrollTop: commentLi.offset().top - ($(window).height() / 2 - 300)
                    }, time);
                    commentLi.removeClass("comment-un-read").addClass("comment-un-read");
                    setTimeout(function () {
                        commentLi.removeClass("comment-un-read");
                    }, 7000);
                };
                scrollFunc(0);
                if (tryMultiScroll) {
                    utils.tryToRunOnCommentMediaLoad(scrollFunc);
                }
            } else {
                utils.scrollToCommentListArea();
            }
        },
        "tryToRunOnCommentMediaLoad": function (call) {
            setTimeout(function () {
                call(1);
                $(config.selector.commentListArea).find("iframe").each(function (i, frame) {
                    var insertFrameEvent = function (childWindow) {
                        call(2);
                        var searchFuncInter = window.setInterval(function () {
                            if (childWindow.onVideoDomReady) {
                                searchFuncInter && window.clearInterval(searchFuncInter);
                                childWindow.onVideoPageReady(function () {
                                    call(3);
                                });
                                childWindow.onVideoDomReady(function () {
                                    call(4);
                                });
                            }
                        }, 50);
                        setTimeout(function () {
                            searchFuncInter && window.clearInterval(searchFuncInter);
                        }, 30000);
                    };
                    var childFrame = $(frame);
                    if (childFrame.prop("contentDocument") && childFrame.prop("contentDocument").readyState == "complete") {
                        insertFrameEvent(childFrame.prop("contentWindow"));
                    } else {
                        childFrame.load(function () { // 等子iframe加载完毕
                            insertFrameEvent(this.contentWindow);
                        });
                    }
                });
            }, 100);
        },
        /**
         * 得到评论点赞的本地记录
         */
        "getCommentLikeRecordInLocal": function () {
            var comment_liked_record = localStorage.getItem(config.selector.comment_liked_record_cache_name);
            var needBuildNew = false;
            if (!comment_liked_record) {
                needBuildNew = true;
            } else {
                try {
                    comment_liked_record = JSON.parse(comment_liked_record);
                    if (!comment_liked_record.data || comment_liked_record.data.length > 50) {
                        needBuildNew = true;
                    }
                } catch (e) {
                    needBuildNew = true;
                }
            }
            if (needBuildNew) {
                comment_liked_record = {"data": [], "create_at": new Date().getTime()};
                localStorage.setItem(config.selector.comment_liked_record_cache_name, JSON.stringify(comment_liked_record));
            }
            return comment_liked_record;
        },
        /**
         * 评论点赞的本地记录是否包含该comment
         *
         * @param comment
         * @param {Object=} comment_liked_record - 可不填
         * @returns {boolean}
         */
        "containCommentLikeRecordInLocal": function (comment, comment_liked_record) {
            var comment_liked_record = comment_liked_record || utils.getCommentLikeRecordInLocal();
            var hasLikedInRecord = false;
            if (!comment_liked_record.data) {
                comment_liked_record.data = [];
            } else if (comment_liked_record.data.length > 0) {
                var filterArr = comment_liked_record.data.filter(function (cid, i) {
                    return cid == comment.cid;
                });
                if (filterArr.length > 0) {
                    hasLikedInRecord = true;
                }
            }
            return hasLikedInRecord;
        },
        /**
         * 将该comment添加到评论点赞的本地记录中
         * @param comment
         */
        "putCommentLikeRecordToLocal": function (comment) {
            var comment_liked_record = utils.getCommentLikeRecordInLocal();
            if (!utils.containCommentLikeRecordInLocal(comment, comment_liked_record)) {
                comment_liked_record.data.push(comment.cid);
            }
            localStorage.setItem(config.selector.comment_liked_record_cache_name, JSON.stringify(comment_liked_record));
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