(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'clipboard', 'niftymodals', 'edit_tool', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.edit_handle = factory(window.jQuery, null, $(document).ready, toastr, Clipboard, null, null, common_utils, login_handle);
    }
})(function ($, bootstrap, domReady, toastr, Clipboard, niftymodals, edit_tool, common_utils, login_handle) {

    var pointer = {
        form: null,
        isSaveFlag: false,
        mainEditor: null,
        summaryEditor: null,
        successModal: null,
        currArticle: null
    };

    var config = {
        mark: "new",
        updateAid: 0,
        selector: {
            "form": "#article_form",
            "successModal": "#resultTipsModal",
            "mainEditor": "#article_edit",
            "summaryEditor": "#article_summary",
            "copyArticleLinkBtn": "#resultTipsModal .copy_article_link_btn"
        },
        path_params: {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        },
        event: {
            "articleFormInitCompleted": "article.form.init.completed",
            "beforeArticleSave": "article.save.before",
            "articleLoadCompleted": "article.load.completed",
            "articleSaveCompleted": "article.save.completed",
        },
        maxUploadSize: 5 * 1024 * 1024
    };

    var init = function (options) {
        common_utils.extendNonNull(true, config, options);
        pointer.form = $(config.selector.form);
        pointer.mainEditor = $(config.selector.mainEditor);
        pointer.summaryEditor = $(config.selector.summaryEditor);
        pointer.successModal = $(config.selector.successModal);
        edit_tool.init({
            selector: {
                "mainEditor": config.selector.mainEditor,
                "summaryEditor": config.selector.summaryEditor,
            },
            maxUploadSize: config.maxUploadSize
        });
        // tags 输入框 绑定事件
        var $tags_modify_dom = pointer.form.find('.form-group-article-edit-tags .article-edit-tags');
        var $article_edit_tags_group = pointer.form.find('.form-group-article-edit-tags');
        utils.calcTagInputWidth($tags_modify_dom);
        $tags_modify_dom.on("click", ".tag-close", function (e) { // 删除
            utils.deleteTag($tags_modify_dom, $(e.currentTarget.parentNode));
        });
        $tags_modify_dom.on({ // 提交
            "keydown": function (e) {
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                if (code == 13) {
                    utils.addTagFromInput($tags_modify_dom, $(e.currentTarget));
                    $article_edit_tags_group.find(".article-edit-btn-tags-edit").text("编辑");
                    // 防止触发表单提交 返回false
                    e.preventDefault();
                    return false;
                }
            },
            "blur": function (e) {
                var input_dom = $(e.currentTarget);
                if (input_dom.val() != "") {
                    utils.addTagFromInput($tags_modify_dom, input_dom);
                    $article_edit_tags_group.find(".article-edit-btn-tags-edit").text("编辑");
                }
            }
        }, ".tag-input");
        $article_edit_tags_group.on("dblclick", "label", function () { // 双击标签全部编辑
            $tags_modify_dom.closest(".form-group").find(".tags-edit-btn").click();
        });
        $article_edit_tags_group.on("click", ".article-edit-btn-tags-edit", function (e) {
            var $btn = $(this);
            if ($btn.text() == '确定') {
                $tags_modify_dom.find(".tag-input").blur();
                return;
            }
            var tags = "";
            $tags_modify_dom.find(".tag-content").each(function (i, tag) {
                tags += "#" + tag.innerText;
            });
            if (tags) {
                $tags_modify_dom.find(".tag-input").val(tags);
                $tags_modify_dom.find(".tag-single").remove();
                utils.calcTagInputWidth($tags_modify_dom);
                $tags_modify_dom.autoTextareaHeight({
                    maxHeight: 150,
                    minHeight: config.tagsAreaHeight,
                    runOnce: true
                });
                $btn.text("确定");
            }
        });
        config.tagsAreaHeight = $tags_modify_dom.outerHeight();
        $tags_modify_dom.autoTextareaHeight({
            maxHeight: 150,
            minHeight: config.tagsAreaHeight
        });
        // save
        pointer.form.on("click", ".article-edit-btn-submit", function (e) {
            e.preventDefault();
            var submitBtn = $(this);
            submitBtn.attr("disabled", "disabled");
            var postArticle = parsePostArticleData(pointer.form);
            if (postArticle) {
                if (config.mark == "update") {
                    postArticle.aid = pointer.currArticle.aid;
                }
                utils.triggerEvent(config.event.beforeArticleSave, postArticle, config.mark);
                request.saveArticle(postArticle, config.mark).then(function (response) {
                    if (response.status == 200) {
                        pointer.isSaveFlag = true;
                        pointer.currArticle = response.data.article;
                        toastr.success("文章" + (config.mark == "new" ? "保存" : "更新") + "成功!", "提示");
                        utils.triggerEvent(config.event.articleSaveCompleted, pointer.currArticle, config.mark);
                    } else if (response.status == 401) {
                        submitBtn.removeAttr("disabled");
                        toastr.error('由于您编辑时间过长导致Session过期了，\n您可以点击下面链接进行登录后，\n再返回此页面进行保存操作！\n<a>点击这里登录</a>.', "保存失败", {
                            "timeOut": 0,
                            onclick: function () {
                                window.open("auth/login?uid=" + login_handle.getCurrentUserId());
                            }
                        });
                        console.warn("Error Code: " + response.status);
                    } else {
                        submitBtn.removeAttr("disabled");
                        toastr.error(response.message, (config.mark == "new" ? "保存" : "更新") + "文章失败");
                        console.warn("Error Code: " + response.status);
                    }
                }, function (xhr, textStatus) {
                    submitBtn.removeAttr("disabled");
                    toastr.error(textStatus, "保存失败");
                    console.error("保存失败: " + textStatus);
                });
            } else {
                submitBtn.removeAttr("disabled");
            }
        });
        // reset
        pointer.form.on("click", ".article-edit-btn-cancel", function (e) {
            e.preventDefault();
        });
        // 初始化更新表单
        if (config.mark == "update" && config.updateAid) {
            request.loadArticle(config.updateAid, function (article) {
                utils.triggerEvent(config.event.articleLoadCompleted, article);
                initArticleUpdateForm(article);
            }).fail(function (xhr, ts) {
                toastr.error(ts, "加载文章[" + config.updateAid + "]失败");
                console.error("加载[" + config.updateAid + "]文章失败: " + ts);
            });
        }
        // 监听页面刷新或关闭事件
        $(window).bind('beforeunload', function () {
            if (!pointer.isSaveFlag) {
                return "文章未保存，若关闭或刷新，则该数据将丢失！";
            }
        });
        // 初始化复制剪切板
        initClipboard(config.selector.copyArticleLinkBtn);
        utils.bindEvent(config.event.articleSaveCompleted, function (e, article, mark) {
            var config = this.config;
            var articleLink = config.path_params.basePath + "a/detail/" + article.aid;
            var $copyLinkBtn = $(config.selector.copyArticleLinkBtn);
            $copyLinkBtn.attr("data-clipboard-text", articleLink);
            var $openArticleLink = pointer.successModal.find('.open-article-link');
            $openArticleLink.attr("href", articleLink);
            pointer.successModal.niftyModal();
        });
        utils.triggerEvent(config.event.articleFormInitCompleted, config);
    };

    var parsePostArticleData = function () {
        var postArticle = {}, category = {}, tags = "", objKey, objValue, childObjKey, childObjValue;
        postArticle.detail = pointer.mainEditor.summernote('isEmpty') ? "" : pointer.mainEditor.summernote('code');
        postArticle.title = pointer.form.find('.form-group-article-edit-title .article-edit-title').val();
        postArticle.summary = pointer.summaryEditor.summernote('isEmpty') ? "" : pointer.summaryEditor.summernote('code');
        category.atid = pointer.form.find('.form-group-article-edit-category .article-edit-category').val();
        postArticle.category = category;
        postArticle.permission = pointer.form.find('.form-group-article-edit-permission .article-edit-permission').val();
        var $tags_modify_dom = pointer.form.find('.form-group-article-edit-tags .article-edit-tags');
        var $tags_input_dom = $tags_modify_dom.find(".tag-input");
        if ($tags_input_dom.val()) {
            utils.addTagFromInput($tags_modify_dom, $tags_input_dom);
        }
        $tags_modify_dom.find(".tag-content").each(function (i, tagNode) {
            var tagValue = tagNode.innerText;
            if (tagValue) {
                tags += "#" + tagValue + "#";
            }
        });
        postArticle.tags = tags;
        postArticle.inform = pointer.form.find('.form-group-article-edit-inform .article-edit-inform').prop('checked');
        var isReady = revisePostArticleData(postArticle);
        if (isReady) {
            for (objKey in postArticle) {
                objValue = postArticle[objKey];
                if (typeof objValue == "object") {
                    for (childObjKey in objValue) {
                        childObjValue = objValue[childObjKey];
                        postArticle[objKey + "." + childObjKey] = childObjValue;
                    }
                    delete postArticle[objKey];
                }
            }
            return postArticle;
        } else {
            return null;
        }
    };

    var revisePostArticleData = function (postArticle) {
        var isReady = true;
        if (!login_handle.validateLogin()) {
            isReady = false;
            toastr.error("你未登陆！", "提示");
        }
        if (!postArticle.detail) {
            isReady = false;
            toastr.error("文章内容不能为空！", "提示");
        }
        if (postArticle.summary.length > 1000) {
            isReady = false;
            toastr.error("文章摘要内容过长！ 1000/" + postArticle.summary.length, "提示");
        }
        if (!postArticle.title) {
            isReady = false;
            toastr.error("文章标题不能为空！", "提示");
        }
        if (postArticle.tags.length > 200) {
            isReady = false;
            toastr.error("文章标签过长！ 200/" + postArticle.tags.length, "提示");
        }
        if (isReady) {
            // 如果没有填写摘要  则取detail前1000(html)字符
            if (!postArticle.summary) {
                if (postArticle.detail.length >= 1000) {
                    var headThousand = postArticle.detail.substring(0, 1000);
                    var headThousandTag = headThousand.substring(0, headThousand.lastIndexOf(">"));
                    // 利用浏览器来补全标签
                    postArticle.summary = $("<div/>").html(headThousandTag).html();
                } else {
                    postArticle.summary = postArticle.detail;
                }
            }
        }
        return isReady;
    };

    var initArticleUpdateForm = function (article) {
        pointer.currArticle = article;
        pointer.mainEditor.summernote('code', article.detail);
        pointer.form.find('.form-group-article-edit-title .article-edit-title').val(article.title);
        pointer.summaryEditor.summernote('code', article.summary);
        pointer.form.find('.form-group-article-edit-category .article-edit-category').val(article.category.atid);
        pointer.form.find('.form-group-article-edit-permission .article-edit-permission').val(article.permission);
        var $tags_modify_dom = pointer.form.find('.form-group-article-edit-tags .article-edit-tags');
        $tags_modify_dom.find(".tag-single").remove();
        var tags_html = '';
        $.each(article.tags.split('#'), function (i, tag) {
            if (tag) {
                tags_html += '<span class="tag-single">' +
                    '<a class="tag-content" target="_blank" href="a/list?tags=&lt;' + tag + '&gt;">' + tag + '</a>' +
                    '<span class="tag-close"">&times</span></span>';
            }
        });
        $tags_modify_dom.prepend(tags_html);
        utils.calcTagInputWidth($tags_modify_dom);
        $tags_modify_dom.autoTextareaHeight({
            maxHeight: 150,
            minHeight: config.tagsAreaHeight,
            runOnce: true
        });
    };

    var request = {
        "saveArticle": function (article, mark, call) {
            var postData = article;
            postData.mark = mark;
            return $.post("article.api?method=save", postData, function (response) {
                if (response.status == 200) {
                    call && call.call(response, response.data.article);
                } else if (call) {
                    toastr.error(response.message, (mark == "new" ? "保存" : "更新") + "文章失败");
                    console.warn("Error Code: " + response.status);
                }
            });
        },
        "createArticle": function (article) {
            return this.saveArticle(article, "new");
        },
        "updateArticle": function (article) {
            return this.saveArticle(article, "update");
        },
        "loadArticle": function (aid, call) {
            return $.get("article.api?method=getArticle", {"aid": aid}, function (response) {
                if (response.status == 200) {
                    call && call.call(response, response.data.article);
                } else if (call) {
                    toastr.error(response.message, "加载文章失败");
                    console.warn("Error Code: " + response.status);
                }
            });
        }
    };

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
        "calcTagInputWidth": function (tags_modify_dom) {
            var tag_single_nodes = tags_modify_dom.find(".tag-single");
            var maxOffset = 0;
            tag_single_nodes.each(function (i, tag_single) {
                if (tag_single.offsetTop > maxOffset) {
                    maxOffset = tag_single.offsetTop;
                }
            });
            var total_width = tags_modify_dom.width();
            var left_width = 0;
            var tag_other_width = null;
            tag_single_nodes.each(function (i, tag_single) {
                if (tag_other_width == null) {
                    var computedStyle = window.getComputedStyle(tag_single);
                    tag_other_width = parseInt(computedStyle.borderLeftWidth) + parseInt(computedStyle.borderLeftWidth) + parseInt(computedStyle.marginLeft) + parseInt(computedStyle.marginRight);
                }
                if (tag_single.offsetTop == maxOffset) {
                    left_width += tag_single.clientWidth + tag_other_width; // 需要加上padding宽度和borderWidth和marginWidth
                }
            });
            var width = total_width - left_width - 5;
            tags_modify_dom.find(".tag-input").width(width > 50 ? width : total_width);
        },
        "addTagFromInput": function (tags_modify_dom, input_dom) {
            var tag = input_dom.val();
            if (tag && !/^[ ]+$/.test(tag)) {
                // 如果要使用分割字符, 用 ""、{}、${} 包裹
                var elMap = {};
                tag = common_utils.replaceByEL(tag, function (index, key) {
                    var replaceMark = "replaceEL_" + index;
                    elMap[replaceMark] = key;
                    return replaceMark;
                });
                var insert_text = "";
                $.each(tag.split(/[#×✖,，;；]/), function (i, value) {
                    if (value) {
                        // 标记处还原原始值
                        var match = value.match(/replaceEL_[\d]{1}/);
                        match && (value = value.replace(match[0], elMap[match[0]]));
                        if (value.indexOf("#") == -1) {
                            insert_text += '<span class="tag-single"><a class="tag-content"  target="_blank" href="a/list?tags=&lt;' + value + '&gt;">' + value + '</a><span class="tag-close"">&times</span></span>';
                        }
                    }
                });
                if (insert_text) {
                    input_dom.before(insert_text);
                    utils.calcTagInputWidth(tags_modify_dom);
                    tags_modify_dom.autoTextareaHeight({
                        maxHeight: 150,
                        minHeight: config.tagsAreaHeight,
                        runOnce: true
                    });
                }
                input_dom.val("");
            } else {
                toastr.error("输入的单个标签不能为空或全是空格！，标签栏为空可以", "", {"progressBar": false, "timeOut": 7000});
            }
        },
        "deleteTag": function (tags_modify_dom, tag_single) {
            tag_single.remove();
            utils.calcTagInputWidth(tags_modify_dom);
            tags_modify_dom.autoTextareaHeight({
                maxHeight: 150,
                minHeight: config.tagsAreaHeight,
                runOnce: true
            });
        },
        "getFormJson": function (form) {  // 将表单中的参数拼装成可用json格式
            var params = {};
            //序列化成[{"name"="a","value"="1"},{"name"="b","value"="2"}]
            var a = $(form).serializeArray();
            $.each(a, function () {
                if (params[this.name] !== undefined) {
                    if (!params[this.name].push) {
                        params[this.name] = [params[this.name]];
                    }
                    params[this.name].push(this.value || '');
                } else {
                    params[this.name] = this.value || '';
                }
            });
            //转化为 {"a"="1","b"="2"}
            return params;
        }
    };

    /**
     * 复制工具ZeroClipboards
     * 剪切板初始化
     */
    function initZeroClipboards(copyBtnSelector, findCopyTextFn) {
        ZeroClipboard.config( { swfPath: config.path_params.basePath + 'lib/zeroClipboard/ZeroClipboard.swf' } );
        // ZeroClipboard.config({swfPath: "https://cdn.bootcss.com/zeroclipboard/2.0.0-beta.4/ZeroClipboard.swf"});
        var client = new ZeroClipboard($(copyBtnSelector));
        client.on('ready', function (event) {
            client.on('copy', function (event) {
                var text = findCopyTextFn();
                event.clipboardData.setData('text/plain', text);
            });
            client.on('aftercopy', function (event) {
                toastr.success("文章地址复制成功！", "提示");
                // console.log('Copied text to clipboard: ' + event.data['text/plain']);
            });
        });
        client.on('error', function (event) {
            console.log('ZeroClipboard error of type "' + event.name + '": ' + event.message);
            // toastr.error("你的浏览器不支持复制！", "提示");
            ZeroClipboard.destroy();
        });
    }

    /**
     * 复制工具clipboard
     * 剪切板初始化
     */
    function initClipboard(copyBtnSelector) {
        var clipboard = new Clipboard(copyBtnSelector);
        // if(!clipboard.isSupported()) {
        //  console.error('该浏览器不支持Clipboard复制');
        // }
        clipboard.on('success', function (e) {
            toastr.success("文章地址复制成功！", "提示");
            console.info('已复制Text:', e.text);
            e.clearSelection();
        });
        clipboard.on('error', function (e) {
            console.error('复制错误');
            console.error('Action:', e.action);
            console.error('Trigger:', e.trigger);
        });
    }

    // 初始化文章上传的配置
    function initCreateConfigInfo() {
        return $.Deferred(function (dfd) {
            $.get("article.api?method=getCreateConfigInfo", function (response) {
                if (response.status == 200) {
                    var createConfigInfo = pointer.createConfigInfo = response.data;
                    config.maxUploadSize = createConfigInfo.uploadArgs.maxPhotoUploadSize;
                    edit_tool.config.maxUploadSize = config.maxUploadSize;
                    if (!createConfigInfo || createConfigInfo.isAllowCreate) {
                        pointer.form.find(".article-edit-btn-submit").removeAttr("disabled");
                        common_utils.removeNotify("notify-no-allow-create");
                        dfd.resolve(createConfigInfo);
                    } else {
                        var users = null;
                        switch (createConfigInfo.allowCreateLowestLevel) {
                            case 1:
                                users = "高级会员与管理员";
                                break;
                            case -1:
                                users = "管理员";
                                break
                        }
                        common_utils.notify({timeOut: 0}).info("系统当前配置为只允许<br>【<b>" + users + "</b>】上传文章", "您暂时不能上传", "notify-no-allow-create");
                        pointer.form.find(".article-edit-btn-submit").attr("disabled", "disabled");
                        dfd.reject('系统当前配置为只允许' + users + '上传文章');
                    }
                } else {
                    pointer.form.find(".article-edit-btn-submit").attr("disabled", "disabled");
                    toastr.error("加载上传文章配置失败", "错误");
                    dfd.reject('加载上传文章配置失败, ' + response.message);
                }
            }).fail(function (xhr, ts) {
                dfd.reject('加载上传文章配置失败, ' + ts);
            });
        });
    }

    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "utils": utils,
        "request": request,
        "parsePostArticleData": parsePostArticleData,
        "revisePostArticleData": revisePostArticleData,
        "initArticleUpdateForm": initArticleUpdateForm,
        "initClipboard": initClipboard,
        "initCreateConfigInfo": initCreateConfigInfo,
    };

    return context;
});