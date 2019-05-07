(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'toolbar', 'edit_tool', 'edit_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, toolbar, edit_tool, edit_handle);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, toolbar, edit_tool, edit_handle) {

    var pointer = {
        managerHandleForm: null,
        inputCDNHostModal: null,
        currArticle: null,
    };

    var config = {
        selector: {
            "managerHandleForm": "#manager_article_handle_form",
            "queryArticleBtn": "#btn_article_query",
            "queryArticleInput": "#input_article_id",
            "changeArticleImgCDNPrefixBtn": "#btn_article_img_cdn_change",
            "setArticleImgPathRelativeBtn": "#btn_article_img_relative",
            "setArticleImgFormatBtn": "#btn_article_img_format",
            "inputCDNHostModal": "#inputCDNHostModal",
        }
    };

    var changeImgCDNHost = function (cdnHost) {
        var mainEditorContext, $mainEditable, summaryEditorContext, $summaryEditable, handleFn;
        if (!cdnHost) {
            toastr.error('cdnHost输入为空');
            return;
        }
        mainEditorContext = edit_handle.pointer.mainEditor.data('summernote');
        $mainEditable = mainEditorContext.layoutInfo.editable;
        summaryEditorContext = edit_handle.pointer.summaryEditor.data('summernote');
        $summaryEditable = summaryEditorContext.layoutInfo.editable;
        handleFn = function ($editable) {
            $editable.find('img[data-inside-image="true"]').each(function () {
                var $img = $(this);
                var relativePath = $img.attr('data-relative-path');
                if (relativePath) {
                    $img.attr('src', cdnHost + relativePath);
                }
            });
        };
        mainEditorContext.invoke('editor.wrapCommand', handleFn)($mainEditable);
        summaryEditorContext.invoke('editor.wrapCommand', handleFn)($summaryEditable);
        toastr.success("修改完成，请查看！");
    };

    var restoreImgRelativePath = function () {
        var mainEditorContext, $mainEditable, summaryEditorContext, $summaryEditable, handleFn;
        mainEditorContext = edit_handle.pointer.mainEditor.data('summernote');
        $mainEditable = mainEditorContext.layoutInfo.editable;
        summaryEditorContext = edit_handle.pointer.summaryEditor.data('summernote');
        $summaryEditable = summaryEditorContext.layoutInfo.editable;
        handleFn = function ($editable) {
            $editable.find('img[data-inside-image="true"]').each(function () {
                var $img = $(this);
                var relativePath = $img.attr('data-relative-path');
                if (relativePath) {
                    $img.attr('src', relativePath);
                }
            });
        };
        mainEditorContext.invoke('editor.wrapCommand', handleFn)($mainEditable);
        summaryEditorContext.invoke('editor.wrapCommand', handleFn)($summaryEditable);
        toastr.success("修改完成，请查看！");
    };

    function formatImgShow(runFormat) {
        var mainEditorContext, $mainEditable;
        mainEditorContext = edit_handle.pointer.mainEditor.data('summernote');
        $mainEditable = mainEditorContext.layoutInfo.editable;
        mainEditorContext.invoke('editor.wrapCommand', function ($editable, runFormat) {
            if (runFormat) {
                $editable.find('img').each(function (i, img) {
                    img.className = 'img-thumbnail';
                    img.outerHTML = '<p class="img-format">' + img.outerHTML + '</p>';
                });
            } else {
                $editable.find('p.img-format img').removeClass('img-thumbnail').unwrap('p');
            }
        })($mainEditable, runFormat);
        toastr.success("修改完成，请查看！");
    }

    domReady(function () {
        pointer.managerHandleForm = $(config.selector.managerHandleForm);
        pointer.inputCDNHostModal = $(config.selector.inputCDNHostModal);
        edit_handle.utils.bindEvent(edit_handle.config.event.articleFormInitCompleted, function (e) {
            pointer.edit_handle = this.pointer;
            config.edit_handle = this.config;
            pointer.managerHandleForm.find(config.selector.queryArticleInput).val(config.edit_handle.updateAid);
        });
        edit_handle.utils.bindEvent(edit_handle.config.event.articleLoadCompleted, function (e, article) {
            pointer.currArticle = article;
        });
        edit_handle.utils.bindEvent(edit_handle.config.event.articleSaveCompleted, function (e, article, mark) {

        });
        edit_handle.request.saveArticle = function (article, mark, call) {
            var postData = article;
            postData.mark = mark;
            return $.post("manager.api?method=modify_article_content", postData, function (response) {
                if (response.status == 200) {
                    call && call.call(response, response.data.article);
                } else if (call) {
                    toastr.error(response.message, (mark == "new" ? "保存" : "更新") + "文章失败");
                    console.warn("Error Code: " + response.status);
                }
            });
        };
        edit_handle.init({
            "mark": "update",
            "updateAid": common_utils.parseURL(document.location.href).params.aid,
            "selector":{
                "form": "#article_form",
                "successModal": "#resultTipsModal",
                "mainEditor": "#article_edit",
                "summaryEditor": "#article_summary",
                "copyArticleLinkBtn": "#resultTipsModal .copy_article_link_btn"
            },
            "path_params": {
                "basePath": $('#basePath').attr('href'),
                "staticPath": $('#staticPath').attr('href'),
                "cloudPath": $('#cloudPath').attr('href')
            }
        });

        pointer.managerHandleForm.on("click", config.selector.queryArticleBtn, function (e) {
            var inputAid = pointer.managerHandleForm.find(config.selector.queryArticleInput).val();
            if (/^[a-zA-Z0-9]+$/.test(inputAid)) {
                edit_handle.request.loadArticle(inputAid, function (article) {
                    pointer.currArticle = article;
                    edit_handle.initArticleUpdateForm(article);
                    toastr.success(article.title, '成功加载以下文章');
                }).fail(function (xhr, ts) {
                    toastr.error(ts, "加载文章[" + config.updateAid + "]失败");
                    console.error("加载[" + config.updateAid + "]文章失败: " + ts);
                });
            } else {
                toastr.error("请输入正确的文章id！");
            }
        });

        pointer.managerHandleForm.on("click", config.selector.changeArticleImgCDNPrefixBtn, function (e) {
            pointer.inputCDNHostModal.modal({backdrop: 'static', keyboard: false});
        });

        pointer.inputCDNHostModal.on("click", ".modal-btn-cdn-host-submit", function (e) {
            var cdnHost = pointer.inputCDNHostModal.find(".modal-input-cdn-host").val();
            changeImgCDNHost(cdnHost);
            pointer.inputCDNHostModal.modal('hide');
        });

        pointer.managerHandleForm.on("click", config.selector.setArticleImgPathRelativeBtn, function (e) {
            restoreImgRelativePath();
        });

        pointer.managerHandleForm.on("click", config.selector.setArticleImgFormatBtn, function (e) {
            var self = $(this);
            var runFormat = self.attr("data-has-format") != "true";
            formatImgShow(runFormat);
            if (runFormat) {
                self.attr("data-has-format", "true").val("还原修改");
            } else {
                self.attr("data-has-format", "false").val("格式化图片展示");
            }
        });

        // 初始化文章上传的配置
        edit_handle.initCreateConfigInfo();

        // 关闭搜索快捷键
        toolbar.rewriteSearch({"searchHotKey": false});
    });

});