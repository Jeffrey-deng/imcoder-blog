(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'globals', 'common_utils', 'magnificPopup', 'login_handle', 'comment_plugin', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, globals, common_utils, null, login_handle, comment_plugin, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, globals, common_utils, magnificPopup, login_handle, comment_plugin, websocket_util) {

    var selector = globals.extend(globals.selector, {
        'article_detail': {
            "articleHandleArea": ".article-header .article-handle",
            "collectArticleBtn": "#collectArticleBtn",
            "fillArticleToMainAreaBtn": "#fillArticleToMainAreaBtn",
            "firstHeaderArea": "#first",
            "mainArea": "#main",
            "rankListArea": "#rank_col",
            "hostUserNickName": "#user_rank .author-nickname",
            "showDeleteModalBtn": "#showDeleteModalBtn",
            "validateMailModal": "#validateMailModal",
            "articleContent": '#article_content',
            "articleDetail": '#article_content .article-detail'
        }
    }).article_detail;

    var config = {
        pageArticleId: ($(globals.selector.firstArea).find('.slogan-name').attr('data-article-id')) || 0,
        hostUserId: ($(globals.selector.firstArea).find('.slogan-name').attr('data-user-id')) || 0,
        selector: selector,
        path_params: globals.path_params,
        img_load_error_default: "res/img/img_load_error_default.jpg"
    };

    const request = globals.extend(globals.request, {
        article_detail: {
            "checkArticleIsCollected": function (aid, success) {
                let postData = {'aid': aid};
                return globals.request.post(globals.api.checkArticleIsCollected, postData, success, ['type'], false);
            },
            'collectArticle': function (aid, toggleCollect, success) {
                let postData = {'aid': aid};
                if (toggleCollect) {
                    return globals.request.post(globals.api.collectArticle, postData, success, ['type'], success && '文章收藏失败，代码{code}');
                } else {
                    return globals.request.post(globals.api.uncollectArticle, postData, success, ['type'], success && '文章收藏失败，代码{code}');
                }
            },
            'deleteArticle': function (aid, inputValidateCode, success) {
                let postData = {'aid': aid, 'validateCode': inputValidateCode};
                return globals.request.post(globals.api.deleteArticle, postData, success, success && '文章删除失败，代码{code}');
            },
        },
        user_auth: {
            'sendValidateCode': function (success) {
                return globals.request.post(globals.api.sendValidateCode, {}, success, success && '验证邮件发送失败');
            },
            'checkValidateCode': function (inputValidateCode, success) {
                let postData = {'code': inputValidateCode};
                return globals.request.post(globals.api.checkValidateCode, postData, success, success && '验证码输入错误');
            }
        }
    }).article_detail;

    let initCollectArticleEvent = function () {
        let $collectBtn = $(config.selector.collectArticleBtn), initCollectValue = $collectBtn.attr('data-collect-status') === 'yes';
        // 检查收藏
        if (!initCollectValue) {
            request.checkArticleIsCollected(config.pageArticleId).final(function (type) {
                if (type == 1) {
                    console.log('已收藏该文章' + config.pageArticleId + '~');
                }
                toggleCollectBtnShow(type == 1);
            });
        }
        // 收藏按钮事件
        $collectBtn.on('click', function (e) {
            if (login_handle.validateLogin()) {
                let toggleCollect = $collectBtn.attr('data-collect-status') !== 'yes';
                if (toggleCollect || confirm('你确定要取消收藏吗？')) {
                    request.collectArticle(config.pageArticleId, toggleCollect, function (type) {
                        if (toggleCollect) {
                            if (type == 0) {
                                toastr.success('已经收藏过了，无须再点击~');
                            } else {
                                toastr.success('文章收藏成功~');
                            }
                        } else {
                            if (type == 0) {
                                toastr.success('已经收藏过了，无须再点击~');
                            } else {
                                toastr.success('删除收藏成功~');
                            }
                        }
                        toggleCollectBtnShow(toggleCollect);
                    });
                }
            } else {
                login_handle.showLoginModal();
            }
        });
    };

    /**
     * 设置收藏按钮显示状态
     * @param {Boolean} toggleCollect
     */
    let toggleCollectBtnShow = function (toggleCollect) {
        let $collectBtn = $(config.selector.collectArticleBtn);
        if (toggleCollect) {
            $collectBtn.attr('data-collect-status', 'yes').html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 已收藏</b>');
        } else {
            $collectBtn.attr('data-collect-status', 'no').html('<span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span><b> 收藏</b>');
        }
    };

    let initValidateMailModalEvent = function (validateMailModalSelector, callOnValidate) {
        let modalCtx = {
            available: false,
            validateMailModal: $(validateMailModalSelector),
            sendMail: function () {
                if (!this.available) {
                    return this;
                }
                let $sendBtn = this.validateMailModal.find('.validate-btn-send-email');
                if ($sendBtn.attr('disable') === undefined) {
                    let countDownSecond, enableInterval;
                    // 发送邮件
                    globals.notify().progress('服务器正在发送邮件~', '', 'notify_validate_code_mail_sending');
                    globals.request.user_auth.sendValidateCode(true).always(function () {
                        globals.removeNotify('notify_validate_code_mail_sending');
                    }).final(function () {
                        toastr.success('验证邮件发送成功~');
                    });
                    // 30秒后重新启用发送按钮
                    $sendBtn.attr('disabled', 'true').val('30s后');
                    countDownSecond = 30;
                    enableInterval = setInterval(function () {
                        $sendBtn.val((--countDownSecond) + 's后');
                    }, 1000);
                    setTimeout(function () {
                        clearInterval(enableInterval);
                        $sendBtn.removeAttr('disabled').val('重新发送');
                    }, 30 * 1000 + 10);
                }
                return this;
            },
            checkMail: function (inputValidateCode, callOnValidate) {
                if (!this.available) {
                    return this;
                }
                let ctx = this;
                if (inputValidateCode) {
                    globals.request.user_auth.checkValidateCode(inputValidateCode).final(function () {
                        callOnValidate.call(ctx, inputValidateCode);
                    }, function (status, message, type) {
                        toastr.error(message, status);
                    });
                } else {
                    toastr.error('请输入验证码~');
                }
                return this;
            },
            showModal: function () {
                if (!this.available) {
                    return this;
                }
                this.validateMailModal.modal({backdrop: 'static', keyboard: false});
                return this;
            },
            closeModal: function () {
                if (!this.available) {
                    return this;
                }
                this.validateMailModal.modal('hide');
                return this;
            },
        }, $validateMailModal = $(validateMailModalSelector);
        if ($validateMailModal.hasValue()) {
            modalCtx.available = true;
            $validateMailModal
                .on('click', '.validate-btn-send-email', function () {   // 发送验证邮件事件
                    modalCtx.sendMail();
                })
                .on('click', '.validate-btn-check-code', function () {  // 检查验证码是否正确事件
                    let inputValidateCode = $validateMailModal.find('.validate-input-code').val().replace(/(^\s*)|(\s*$)/g, '');
                    if (inputValidateCode) {
                        modalCtx.checkMail(inputValidateCode, callOnValidate);
                    } else {
                        toastr.error('请输入验证码~');
                    }
                });
        }
        return modalCtx;
    };

    // 初始化删除事件
    function initDeleteArticleEvent() {
        let modalCtx = initValidateMailModalEvent(config.selector.validateMailModal, function (inputValidateCode) {
            globals.notify().progress('正在删除~', '', 'notify_article_deleting');
            request.deleteArticle(config.pageArticleId, inputValidateCode, function () {
                modalCtx.closeModal();
                modalCtx.available = false;
                toastr.success('删除成功~');
                toastr.success('此页面刷新后将不可用~', '', {"timeOut": 0});
                // 监听页面刷新或关闭事件
                $(window).bind('beforeunload', function () {
                    return "此页面关闭后将不可用，确定关闭？";
                });
            }).always(function () {
                globals.removeNotify('notify_article_deleting');
            });
        });
        if (modalCtx.available) {
            $(config.selector.showDeleteModalBtn).on('click', function () {
                modalCtx.showModal();
            });
        }
    }

    /**
     *  将显示文章区域覆盖整个主区域
     * @param {String=} preStatus - "no" 或 "yes", 之前是否已经收藏
     */
    function fillArticleToMainArea(preStatus) {
        preStatus = preStatus || ($(config.selector.fillArticleToMainAreaBtn).attr('status') || 'no');
        let url = document.location.href;
        let hashIndex = url.indexOf('#');
        let $mainArea = $(config.selector.mainArea);
        let $rankListArea = $(config.selector.rankListArea);
        let $article_header_ul = $mainArea.find('.article-header .article-category').closest('ul');
        if (preStatus == 'no') {
            $rankListArea.hide(300);
            $mainArea.removeClass('col-md-9').addClass('col-md-12');
            if ($article_header_ul.find('.article-author').length == 0) {
                let $author_nickname = $rankListArea.find('#user_rank .author-nickname');
                let authorHomeLink = ('u/' + $author_nickname.attr('data-author-uid') + '/home').toURL();
                let authorNickname = $author_nickname.text();
                $article_header_ul.append('<li class="article-author">作者: <a href="' + authorHomeLink + '" target="_blank">' + authorNickname + '</a></li>')
            }
            setFillArticleToMainAreaStatus('yes');
            history.replaceState(
                null,
                document.title,
                (hashIndex == -1 ? url : url.substring(0, hashIndex)) + "#full-screen"
            );
        } else {
            $rankListArea.show(300);
            $mainArea.removeClass('col-md-12').addClass('col-md-9');
            $article_header_ul.find('.article-author').remove();
            setFillArticleToMainAreaStatus('no');
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
        if (status == 'yes') {
            actionBtn.attr('status', 'yes').html('<span class="glyphicon glyphicon-star" aria-hidden="true"></span><b> 全屏</b>');
        } else {
            actionBtn.attr('status', 'no').html('<span class="glyphicon glyphicon-star-empty" aria-hidden="true"></span><b> 全屏</b>');
        }
    }

    /**
     * 初始化图片放大查看器
     */
    var initClickEnlarge = function () {
        // 图片查看modal
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
                updateStatus: function (data) {
                    // console.log('Status changed', data);
                    // "data" is an object that has two properties:
                    // "data.status" - current status type, can be "loading", "error", "ready"
                    // "data.text" - text that will be displayed (e.g. "Loading...")
                    // you may modify this properties to change current status or its text dynamically
                    if (data.status == 'error') {
                        data.status = "loading";
                        this.contentContainer.find('.mfp-img')
                            .attr('src', config.path_params.cloudPath + config.img_load_error_default)
                            .attr('title', '该图片加载失败~');
                    }
                }
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
                    var photo_name = photo_dom.title || photo_dom.getAttribute('data-filename');
                    var openUrl = '';
                    if (photo_dom.getAttribute('data-cloud-image')) {
                        openUrl = 'redirect?model=album&photo_id=' + photo_dom.getAttribute('data-photo-id');
                        if (!photo_name) {
                            photo_name = photo_dom.getAttribute('data-photo-id')
                        }
                    } else {
                        openUrl = photo_dom.src;
                        if (!photo_name) {
                            photo_name = openUrl.match(/\/([^\/]+)$/) ? RegExp.$1 : openUrl;
                        }
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
            var eventPrefix = websocket_util.config.event.messageReceive + '.';
            var notify_ws_opts = {
                "progressBar": false,
                "positionClass": "toast-top-right",
                "iconClass": "toast-success-no-icon",
                "timeOut": 0,
                "onclick": function (e) {
                    if ($(e.target).closest('a').length > 0) {
                        e.preventDefault();
                        window.open(e.target.href);
                        return false;
                    }
                },
                "onShown": function () {
                    $(this).css('opacity', '1');
                },
                "onHidden": function (toastElement, closeType) {
                    if (closeType != 0 && toastElement.hasClass('wsMessage') && !toastElement.hasClass('not-sync-ws-message')) {
                        websocket_util.post({
                            "mapping": "transfer_data_in_tabs",
                            "metadata": {
                                "handle": "remove_ws_message",
                                "ws_message_id": parseInt(toastElement.attr('data-wsid'))
                            }
                        });
                    }
                }
            };
            // 收到新评论，取消login.js中的默认处理
            websocket_util.on(eventPrefix + 'receive_comment', function (e, wsMessage, wsEvent) {
                var comment = wsMessage.metadata.comment;
                var notify_opts = null;
                var msg = null;
                switch (comment.creationType) {
                    case 0:
                        var article = wsMessage.metadata.article;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function (e) {
                                ($(e.target).closest('a').length > 0) && e.preventDefault();
                                if (article.aid == config.pageArticleId) {   // 当前文章是被评论的文章
                                    comment_plugin.utils.scrollToSpecialComment(comment);
                                    // var commentDiv = document.getElementById('li_' + comment.cid);
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
                                    window.open(('a/detail/' + article.aid + '#comment_' + comment.cid).toURL());
                                }
                            }
                        });
                        if (article.aid == config.pageArticleId) {   // 当前文章是被评论的文章
                            // 直接显示
                            comment_plugin.utils.appendCommentInPage(comment);
                        }
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 在你的文章<br><b>“' + article.title + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        e.stopImmediatePropagation(); // 阻止login中绑定的事件, stopImmediatePropagation能阻止委托事件
                        break;
                }
                if (msg) {
                    globals.notify(notify_opts)
                        .success(msg, '', 'receive_comment' + '_' + comment.cid)
                        .addClass('wsMessage receive_comment').attr('data-wsid', wsMessage.id).attr('data-cid', comment.cid);
                }
            }, true); // 插入到事件队列第一个
        }
    }

    /* ********** main ************* */

    comment_plugin.on(comment_plugin.config.event.commentHtmlBuildCompleted, function (e, list, pageIndex, buildReason) {
        if (list.length < 50 && (buildReason == 'init' || buildReason == 'refresh')) {
            $(comment_plugin.config.selector.commentListArea).find('.comment-list').removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInLeft');
        }
    });

    // 评论模块初始化
    comment_plugin.init({
        creationType: 0,    //0代表文章评论
        creationIdVariableName: "creationId",
        creationId: config.pageArticleId,
        hostUserId: config.hostUserId,
        autoScrollOnPageOpen: true, // 开启在页面打开时根据url的#hash值自动滚到对应位置
        selector: {
            "commentListArea": "#comments",
            "commentEditor": "#comment_form_content",
            "commentParentId": "#comment_form_parent_id",
            "commentReplyUid": "#comment_form_reply_uid",
            "commentInputUseHtmlTag": "#useInputCommentUseHtmlTag",
            "commentSendAnonymously": "#useSendCommentAnonymously",
            "commentSubmit": "#comment_form_submit",
            "commentNodeIdPrefix": "comment_",
            "commentEditorFocusBtnId": "addComment",
        },
    });

    // 图片加载失败显示默认图片
    common_utils.bindImgErrorHandler($(selector.articleContent).find('img'), config.path_params.cloudPath + config.img_load_error_default);

    if (/[&?]tdsourcetag=[\w]+/.test(document.location.search)) { // 对付腾讯
        history.replaceState(
            null,
            document.title,
            common_utils.removeParamForURL('tdsourcetag')
        );
    }

    domReady(function () {
        // hash响应
        var hash = document.location.href.match(/#(.*)$/) ? RegExp.$1 : '';
        if (hash) {
            switch (hash) {
                case "full-screen":
                    if (document.body.clientWidth >= 768 && isHasArticleHandleArea()) {
                        $(config.selector.mainArea).find('.article-header .article-handle').find('.dropdown-toggle').eq(0).click();
                        fillArticleToMainArea('no');
                    }
                    break;
            }
        } else {
            //滚动效果（除去有hash值时）
            $('html, body').animate({scrollTop: $(config.selector.firstHeaderArea).height()}, 'slow');
        }

        var articleConfig = globals.getLocalConfig('article', {"full_screen": false, "full_background": false});
        if (articleConfig.full_background) {    // 是否使用全屏背景
            $('body').css('background-image', $(config.selector.firstHeaderArea).css('background-image'));
            $(config.selector.firstHeaderArea).css('background-image', '');
        }

        if (isHasArticleHandleArea()) {
            // 是否默认填充
            if (articleConfig.full_screen) {
                fillArticleToMainArea('no');
            }
            // 文章填充主区域点击事件
            $(config.selector.fillArticleToMainAreaBtn).click(function () {
                fillArticleToMainArea();
            });

            // 文章收藏
            initCollectArticleEvent();

            // 文章删除事件
            initDeleteArticleEvent();
        }

        initClickEnlarge();

        // 注册监控服务器的未读评论消息推送
        initWsReceiveServerPush();

    });

});
