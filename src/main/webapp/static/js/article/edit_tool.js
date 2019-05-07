(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'summernote', 'store2', 'common_utils', 'login_handle', 'edit_tool_plugin'], factory);
    } else {
        // Browser globals
        window.edit_tool = factory(window.jQuery, null, $(document).ready, toastr, null, store, common_utils, login_handle, null);
    }
})(function ($, bootstrap, domReady, toastr, summernote, store, common_utils, login_handle, edit_tool_plugin) {

    var pointer = {
        mainEditor: null,
        summaryEditor: null,
    };

    var config = {
        selector: {
            "mainEditor": "#article_edit",
            "summaryEditor": "#article_summary",
        },
        maxUploadSize: 5 * 1024 * 1024
    };

    var init = function (options) {
        common_utils.extendNonNull(true, config, options);
        pointer.mainEditor = $(config.selector.mainEditor);
        pointer.summaryEditor = $(config.selector.summaryEditor);
        initEditor();
    };

    var initEditorPlugin = function () {
        // insert code plugin (插入代码插件)
        $.extend(true, $.summernote.lang, {
            'en-US': {
                codeInsert: {
                    name: "InsertCode",
                    tooltip: "open code insert dialog",
                    dialogTitle: "Insert Code block",
                    dialogSubmit: "insert",
                    dialogCancel: "cancel",
                }
            },
            'zh-CN': {
                codeInsert: {
                    name: "插入代码",
                    tooltip: "打开插入代码编辑框",
                    dialogTitle: "插入代码块",
                    dialogSubmit: "提交代码",
                    dialogCancel: "取消",
                }
            }
        });
        $.extend(true, $.summernote.options, {
            codeInsert: {
                icon: '<i class="glyphicon glyphicon-list-alt"/> ',
                dialogClassName: "note-code-insert-dialog"
            }
        });
        $.extend($.summernote.plugins, {
            'codeInsert': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = context.options.langInfo;
                context.memo('button.codeInsert', function () {
                    var button = ui.button({
                        contents: options.codeInsert.icon + lang.codeInsert.name,
                        tooltip: lang.codeInsert.tooltip,
                        click: function (e) {
                            context.invoke('codeInsert.show');
                        }
                    });
                    return button.render();
                });
                self.initialize = function () {
                    var $container, body, footer;
                    $container = options.dialogsInBody ? $(document.body) : $editor;
                    body = '<div class="form-group note-form-group">'+
                        '<textarea class="form-control note-form-control note-code-insert-editor" style="auto;height: 400px;" wrap="off" rows="12"></textarea>'+
                        '</div>';
                    footer = '<button class="btn btn-default note-btn note-btn-default note-btn-code-insert-cancel" data-dismiss="modal">' + lang.codeInsert.dialogCancel + '</button>' +
                        '<button class="btn btn-primary note-btn note-btn-primary note-btn-code-insert-submit">' + lang.codeInsert.dialogSubmit + '</button>';
                    self.$dialog = ui.dialog({
                        className: options.codeInsert.dialogClassName,
                        title: lang.codeInsert.dialogTitle,
                        fade: options.dialogsFade,
                        body: body,
                        footer: footer
                    }).render().appendTo($container);
                    self.bindEvent();
                };
                self.alertSuccess = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-success" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
                self.alertError = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-danger" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
                self.destroy = function () {
                    ui.hideDialog(self.$dialog);
                    self.$dialog.remove();
                };
                self.show = function () {
                    context.invoke('saveRange');
                    ui.onDialogShown(self.$dialog, function () {
                        context.triggerEvent('dialog.shown', self, context);
                    });
                    ui.showDialog(self.$dialog);
                };
                self.bindEvent = function () {
                    self.$dialog.find('.note-btn-code-insert-submit').on("click", function () {
                        self.saveCodeInsert();
                    });
                };
                self.saveCodeInsert = function () {
                    var $codeInsertEditor = self.$dialog.find('.note-code-insert-editor');
                    // 创建节点
                    var pre = document.createElement('pre');
                    pre.className = "user-defined-code";
                    pre.setAttribute("style", "word-wrap:normal");
                    var code = document.createElement('code');
                    code.setAttribute("style", "white-space:pre;overflow-x:auto;word-wrap:normal");
                    // 得到编辑区的值 并转义
                    code.innerHTML = common_utils.encodeHTML($codeInsertEditor.val());
                    pre.appendChild(code);
                    // 添加换行
                    var fragment = document.createDocumentFragment();
                    fragment.appendChild(document.createElement("br"));
                    fragment.appendChild(pre);
                    fragment.appendChild(document.createElement("br"));
                    // 插入节点
                    context.invoke('restoreRange'); // 还原range
                    context.invoke('insertNode', fragment);
                    // 关闭
                    ui.hideDialog(self.$dialog);
                    // toastr.info("代码在编辑区可能会变形，这不是最终的显示效果", "提示");
                    $codeInsertEditor.val("");
                };
            }
        });

        // 查找替换
        $.extend(true, $.summernote.lang, {
            'en-US': {
                findnreplace: {
                    tooltip: 'Find \'N Replace',
                    findBtn: 'Find ',
                    findPlaceholder: 'Enter the text you want to find...',
                    findResult: ' results found for ',
                    findError: 'Nothing entered to find...',
                    replaceBtn: 'Replace',
                    replacePlaceholder: 'Enter the text to replace the text above or selected...',
                    replaceResult: ', replaced by ',
                    replaceError: 'Nothing entered to replace...',
                    noneSelected: 'Nothing selected to replace...'
                }
            }
        });
        $.extend($.summernote.options, {
            findnreplace: {
                highlight: 'border-bottom: 3px solid #fc0; text-decoration: none;',
                icon: '<i class="note-icon" data-toggle="findnreplace">' +
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" id="libre-findnreplace" width="14" height="14">' +
                '<path d="m 5.8,2.3764705 c 0.941176,0 1.811765,0.376471 2.423529,1.011765 l -1.741176,1.741176 4.117647,0 0,-4.11' +
                '7647 -1.411765,1.411765 C 8.317647,1.5529415 7.117647,1.0117645 5.8,1.0117645 c -2.423529,0 -4.423529,1.788236 -4.752941,' +
                '4.117647 l 1.388235,0 C 2.741176,3.5529415 4.129412,2.3764705 5.8,2.3764705 Z m 3.8588235,6.282353 c 0.4470585,-0.611764 0.776' +
                '4705,-1.341176 0.8705885,-2.164706 l -1.388236,0 c -0.305882,1.552942 -1.694117,2.752942 -3.364705,2.752942 -0.941177,0 -1.811765,' +
                '-0.376471 -2.42353,-1.011765 L 5.094118,6.4941175 1,6.4941175 1,10.611765 2.411765,9.2000005 C 3.282353,10.070589 4.482353,10.61176' +
                '5 5.8,10.611765 c 1.058824,0 2.047059,-0.352942 2.847059,-0.9411765 L 11.988235,12.988236 13,11.97647 9.6588235,8.6' +
                '588235 Z"/></svg></i>',
                enable: false
            }
        });
        $.extend($.summernote.plugins, {
            'findnreplace': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    $toolbar = context.layoutInfo.toolbar,
                    options = context.options,
                    lang = context.options.langInfo;
                context.memo('button.findnreplace', function () {
                    var button = ui.button({
                        contents: options.findnreplace.icon,
                        tooltip: lang.findnreplace.tooltip,
                        click: function (e) {
                            e.preventDefault();
                            $editor.find('.note-findnreplace').contents().unwrap('u');
                            context.invoke('findnreplace.show');
                            $toolbar.find('.note-findnreplace-info').text('');
                            if ($note.summernote('createRange').toString()) {
                                var selected = $note.summernote('createRange').toString();
                                $toolbar.find('.note-findnreplace-find').val(selected);
                            }
                        }
                    });
                    return button.render();
                });
                self.shouldInitialize = function () {
                    return options.findnreplace.enable;
                };
                self.initialize = function () {
                    var fnrBody =
                        '<div class="note-findnreplaceToolbar panel-heading hidden" style="z-index: 1000;position: absolute;">' +
                        '<small class="note-findnreplace-info help-block small" style="opacity: 1;background: #337ab7;width: calc(100% - 30px);margin-left: 15px;color: white;">&nbsp;</small>' +
                        '<div class="form-group">' +
                        '<div class="input-group col-xs-12">' +
                        '<input type="text" class="note-findnreplace-find form-control input-sm" value="" placeholder="' + lang.findnreplace.findPlaceholder + '">' +
                        '<span class="note-findnreplace-find-btn input-group-addon btn btn-sm btn-default" style="width: 100px;">' + lang.findnreplace.findBtn + '</span>' +
                        '</div>' +
                        '<div class="input-group col-xs-12">' +
                        '<input type="text" class="note-findnreplace-replace form-control input-sm" value="" placeholder="' + lang.findnreplace.replacePlaceholder + '">' +
                        '<span class="note-findnreplace-replace-btn input-group-addon btn btn-sm btn-default" style="width: 100px;">' + lang.findnreplace.replaceBtn + '</span>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    $editor.find('.note-toolbar').append(fnrBody);
                    self.bindEvent();
                };
                self.bindEvent = function () {
                    var $fnrFindBtn = $toolbar.find('.note-findnreplace-find-btn');
                    var $fnrReplaceBtn = $toolbar.find('.note-findnreplace-replace-btn');
                    $fnrFindBtn.click(function (e) {
                        e.preventDefault();
                        $editor.find('.note-findnreplace').contents().unwrap('u');
                        var fnrCode = context.invoke('code');
                        var fnrFind = $toolbar.find('.note-findnreplace-find').val();
                        var fnrReplace = $toolbar.find('.note-findnreplace-replace').val();
                        var fnrCount = (fnrCode.match(new RegExp(fnrFind, "gi")) || []).length;
                        var $findnreplace_info = $toolbar.find('.note-findnreplace-info');
                        if (fnrFind) {
                            $findnreplace_info.text(fnrCount + lang.findnreplace.findResult + "`" + fnrFind + "`");
                            var fnrReplaced = fnrCode.replace(new RegExp("(" + fnrFind + ")", "gi"), '<u class="note-findnreplace" style="' + options.findnreplace.highlight + '">$1</u>');
                            $note.summernote('code', fnrReplaced);
                        } else
                            $findnreplace_info.html('<span class="text-danger">' + lang.findnreplace.findError + '</span>');
                    });
                    $fnrReplaceBtn.click(function (e) {
                        e.preventDefault();
                        $editor.find('.note-findnreplace').contents().unwrap('u');
                        var fnrCode = context.invoke('code');
                        var fnrFind = $toolbar.find('.note-findnreplace-find').val();
                        var fnrReplace = $toolbar.find('.note-findnreplace-replace').val();
                        var fnrCount = (fnrCode.match(new RegExp(fnrFind, "gi")) || []).length;
                        var $findnreplace_info = $toolbar.find('.note-findnreplace-info');
                        if (fnrFind) {
                            $findnreplace_info.text(fnrCount + lang.findnreplace.findResult + "`" + fnrFind + "`" + lang.findnreplace.replaceResult + "`" + fnrReplace + "`");
                            var fnrReplaced = fnrCode.replace(new RegExp(fnrFind, "gi"), fnrReplace);
                            $note.summernote('code', fnrReplaced);
                        } else {
                            if (fnrReplace) {
                                if ($note.summernote('createRange').toString()) {
                                    $note.summernote('insertText', fnrReplace);
                                    $findnreplace_info.text('');
                                } else
                                    $findnreplace_info.html('<span class="text-danger">' + lang.findnreplace.noneSelected + '</span>');
                            } else
                                $findnreplace_info.html('<span class="text-danger">' + lang.findnreplace.replaceError + '</span>');
                        }
                    });
                };
                self.show = function () {
                    $editor.find('.note-findnreplaceToolbar').toggleClass('hidden');
                };
            }
        });

        // 草稿保存到本地缓存
        $.extend($.summernote.options, {
            sDrafts: {
                storePrefix: 'sDrafts',
                dateFormat: null,
                saveIcon: null,
                loadIcon: null
            }
        });
        $.extend(true, $.summernote.lang, {
            'en-US': {
                sDrafts: {
                    save: 'Save draft',
                    saveTips: 'Save draft',
                    load: 'Load Drafts',
                    loadTips: 'Load Drafts',
                    select: 'select the draft you want to load',
                    provideName: 'Provide a name for this draft',
                    saved: 'Draft was successfully saved',
                    loaded: 'Draft was successfully loaded',
                    deleteAll: 'Delete all drafts',
                    noDraft: 'The selected draft couldn\'t be loaded, try again or select another one',
                    nosavedDrafts: 'There aren\'t any drafts saved',
                    deleteDraft: 'delete',
                    youSure: 'Are you sure you want to do this?'
                }
            },
            'zh-CN': {
                sDrafts: {
                    save: '保存草稿',
                    saveTips: '保存草稿到本地缓存',
                    load: '加载草稿',
                    loadTips: '从本地缓存中加载草稿',
                    select: 'select the draft you want to load',
                    provideName: 'Provide a name for this draft',
                    saved: 'Draft was successfully saved',
                    loaded: 'Draft was successfully loaded',
                    deleteAll: 'Delete all drafts',
                    noDraft: 'The selected draft couldn\'t be loaded, try again or select another one',
                    nosavedDrafts: 'There aren\'t any drafts saved',
                    deleteDraft: 'delete',
                    youSure: 'Are you sure you want to do this?'
                }
            }
        });
        $.extend($.summernote.plugins, {
            'sDraftsSave': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = context.options.langInfo;
                context.memo('button.sDraftsSave', function () {
                    return ui.button({
                        contents: options.sDrafts.saveIcon ? options.sDrafts.saveIcon : lang.sDrafts.save,
                        tooltip: lang.sDrafts.saveTips,
                        click: function (e) {
                            e.preventDefault();
                            context.invoke('sDraftsSave.show');
                            return false;
                        }
                    }).render();
                });
                self.initialize = function () {
                    var $container, body, footer;
                    $container = options.dialogsInBody ? $(document.body) : $editor;
                    body = "<div class='form-group'><label>" + lang.sDrafts.provideName + "</label><input class='note-draftName form-control' type='text' /></div>";
                    footer = "<button class='btn btn-primary note-link-btn'>" + lang.sDrafts.save + "</button>";
                    self.$dialog = ui.dialog({
                        className: 'sDraftsSave-dialog',
                        title: lang.sDrafts.save,
                        fade: options.dialogsFade,
                        body: body,
                        footer: footer
                    }).render().appendTo($container);
                    self.bindEvent();
                };
                self.destroy = function () {
                    ui.hideDialog(self.$dialog);
                    self.$dialog.remove();
                };
                self.bindEvent = function () {
                    self.$dialog.on('click', '.note-link-btn', function (e) {
                        e.preventDefault();
                        var draftName = self.$dialog.find('.note-draftName').val();
                        self.saveDraft(draftName);
                        return false;
                    });
                };
                self.show = function () {
                    ui.showDialog(self.$dialog);
                };
                self.saveDraft = function (name) {
                    var body, isoDate, keyName;
                    isoDate = new Date().toISOString();
                    if (name == null) {
                        name = isoDate;
                    }
                    keyName = options.sDrafts.storePrefix + '-' + (name || isoDate);
                    body = context.code();
                    store.set(keyName, {
                        name: name,
                        sDate: isoDate,
                        body: body
                    });
                    ui.hideDialog(self.$dialog);
                    self.alertSuccess(lang.sDrafts.saved + ': ' + (name || isoDate));
                };
                self.alertSuccess = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-success" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
                self.alertError = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-danger" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
            }
        });
        $.extend($.summernote.plugins, {
            'sDraftsLoad': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = context.options.langInfo;
                self.drafts = {};
                context.memo('button.sDraftsLoad', function () {
                    return ui.button({
                        contents: options.sDrafts.loadIcon ? options.sDrafts.loadIcon : lang.sDrafts.load,
                        tooltip: lang.sDrafts.loadTips,
                        click: function (e) {
                            e.preventDefault();
                            context.invoke('sDraftsLoad.show');
                            return false;
                        }
                    }).render();
                });
                self.initialize = function () {
                    var $container = options.dialogsInBody ? $(document.body) : $editor;
                    self.$dialog = ui.dialog({
                        className: 'sDraftsLoad-dialog',
                        title: lang.sDrafts.load,
                        fade: options.dialogsFade,
                        body: "<div></div>",
                        footer: "<div></div>"
                    }).render().appendTo($container);
                    self.$dialog.on("click", '.note-draft', function (e) {
                        e.preventDefault();
                        var data, div, key;
                        e.preventDefault;
                        div = document.createElement('div');
                        key = $(this).data('draft');
                        data = self.drafts[key];
                        if (data) {
                            div.innerHTML = data.body;
                            context.invoke('editor.insertNode', div);
                            self.alertSuccess(lang.sDrafts.loaded);
                        } else {
                            self.alertError(lang.sDrafts.noDraft);
                        }
                        ui.hideDialog(self.$dialog);
                    });
                    self.$dialog.on("click", 'a.delete-draft', function (e) {
                        e.preventDefault();
                        var data, key, $draftLi;
                        if (confirm(lang.sDrafts.youSure)) {
                            $draftLi = $(this);
                            key = $draftLi.data('draft');
                            data = self.drafts[key];
                            if (data) {
                                store.remove(key);
                                delete self.drafts[key];
                                return $draftLi.parent().hide('slow', function () {
                                    $draftLi.remove();
                                });
                            } else {
                                self.alertError(lang.sDrafts.noDraft);
                            }
                        }
                    });
                    self.$dialog.on("click", 'button.deleteAll', function (e) {
                        var $selfButton, key;
                        $selfButton = $(this);
                        if (confirm(lang.sDrafts.youSure)) {
                            for (key in self.drafts) {
                                store.remove(key);
                            }
                            self.drafts = {};
                            return self.$dialog.find('ul.list-group').hide('slow', function () {
                                $(this).replaceWith("<h4>" + lang.sDrafts.nosavedDrafts + "</h4>");
                                $selfButton.hide('slow');
                            });
                        }
                    });
                };
                self.destroy = function () {
                    ui.hideDialog(self.$dialog);
                    self.$dialog.remove();
                };
                self.show = function () {
                    var key, htmlList;
                    self.drafts = {};
                    store.each(function (key, value) {
                        if (typeof key === 'string' && key.indexOf(options.sDrafts.storePrefix) >= 0) {
                            return self.drafts[key] = value;
                        }
                    });
                    htmlList = '';
                    for (key in self.drafts) {
                        var draft = self.drafts[key];
                        var fDate = options.sDrafts.dateFormat && typeof options.sDrafts.dateFormat === 'function' ? options.sDrafts.dateFormat(draft.sDate) : draft.sDate;
                        htmlList += "<li class='list-group-item'><a class='note-draft' data-draft='" + key + "'>" + draft.name + " - <small>" + fDate + "</small></a>" +
                            "<a class='label label-danger pull-right delete-draft' data-draft='" + key + "'>" + lang.sDrafts.deleteDraft + "</a></li>";
                    }
                    var body = htmlList ? "<h4>" + lang.sDrafts.select + "</h4><ul class='list-group'>" + htmlList + "</ul>" : "<h4>" + lang.sDrafts.nosavedDrafts + "</h4>";
                    var footer = htmlList ? "<button class='btn btn-primary deleteAll'>" + lang.sDrafts.deleteAll + "</button>" : "";
                    self.$dialog.find('.modal-body').html(body);
                    self.$dialog.find('.modal-footer').html(footer);
                    ui.showDialog(self.$dialog);
                };
                self.alertSuccess = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-success" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
                self.alertError = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-danger" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
            }
        });

        // image reset size （重置图片原始大小）
        $.extend(true, $.summernote.lang, {
            'en-US': {
                imageResize: {
                    tooltip: 'reset image source size',
                    name: 'resize',
                }
            },
            'zh-CN': {
                imageResize: {
                    tooltip: '重置图片原始大小',
                    name: '重置',
                }
            }
        });
        $.extend($.summernote.options, {
            imageResize: {
                icon: '',
                getImageSizeCall: function ($img, context) {
                    return $.Deferred(function (dfd) {
                        // dfd.resolve({
                        //     width: 800,
                        //     height: 800,
                        // });
                        alert("需要自己实现");
                    });
                }
            }
        });
        $.extend($.summernote.plugins, {
            'imageResize': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = context.options.langInfo;
                context.memo('button.imageResize', function () {
                    var button = ui.button({
                        contents: options.imageResize.icon || ('<span class="note-fontsize-10">' + lang.imageResize.name + '</span>'),
                        tooltip: lang.imageResize.tooltip,
                        click: function (e) {
                            e.preventDefault();
                            var $img = $($editable.data('target'));
                            options.imageResize.getImageSizeCall.call(self, $img, context).done(context.invoke('editor.wrapCommand', function (raw) {
                                $img.css({
                                    width: raw.width,
                                    height: ''
                                });
                            }));
                        }
                    });
                    return button.render();
                });
            }
        });

        // Set Image To Article Cover （设置图片为文章封面）
        $.extend(true, $.summernote.lang, {
            'en-US': {
                imageSetToCover: {
                    tooltip: 'set image to article cover',
                    name: 'cover',
                }
            },
            'zh-CN': {
                imageSetToCover: {
                    tooltip: '设置图片为文章封面',
                    name: '封面',
                }
            }
        });
        $.extend($.summernote.options, {
            imageSetToCover: {
                icon: '',
                setImageToCoverCall: function ($img, context) {
                    alert("需要自己实现");
                }
            }
        });
        $.extend($.summernote.plugins, {
            'imageSetToCover': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = context.options.langInfo;
                context.memo('button.imageSetToCover', function () {
                    var button = ui.button({
                        contents: options.imageSetToCover.icon || ('<span class="note-fontsize-10">' + lang.imageSetToCover.name + '</span>'),
                        tooltip: lang.imageSetToCover.tooltip,
                        click: function (e) {
                            e.preventDefault();
                            var $img = $($editable.data('target'));
                            options.imageSetToCover.setImageToCoverCall.call(self, $img, context);
                        }
                    });
                    return button.render();
                });
            }
        });

        // add next line （尾部添加新行）
        $.extend(true, $.summernote.lang, {
            'en-US': {
                newLineAdd: {
                    tooltip: 'add next line',
                    name: 'New Line',
                }
            },
            'zh-CN': {
                newLineAdd: {
                    tooltip: '尾部添加新行',
                    name: '新建一行',
                }
            }
        });
        $.extend($.summernote.options, {
            newLineAdd: {
                icon: '',
                afterNewLineAddCall: function (context) {
                }
            }
        });
        $.extend($.summernote.plugins, {
            'newLineAdd': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = context.options.langInfo;
                context.memo('button.newLineAdd', function () {
                    var button = ui.button({
                        contents: options.newLineAdd.icon + lang.newLineAdd.name,
                        tooltip: lang.newLineAdd.tooltip,
                        click: function (e) {
                            e.preventDefault();
                            var detail = context.invoke('code');
                            context.invoke('code', detail + "<br>Next Line");
                            self.alertSuccess("Next Line Ready");
                            options.newLineAdd.afterNewLineAddCall.call(self, context);
                        }
                    });
                    return button.render();
                });
                self.alertSuccess = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-success" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
                self.alertError = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-danger" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
            }
        });

        // Upload Image From URL （互联网图片本地化）
        $.extend(true, $.summernote.lang, {
            'en-US': {
                imageUploadFromURL: {
                    tooltip: 'upload image from url',
                    name: 'upgrade',
                }
            },
            'zh-CN': {
                imageUploadFromURL: {
                    tooltip: '将互联网图片上传到本站服务器',
                    name: '升级',
                }
            }
        });
        $.extend($.summernote.options, {
            imageUploadFromURL: {
                icon: '',
                uploadImageFromURLCall: function ($img, context) {
                    return $.Deferred(function (dfd) {
                        // var newImageURL = "";
                        // dfd.resolve(newImageURL);
                        alert("需要自己实现");
                    });
                }
            }
        });
        $.extend($.summernote.plugins, {
            'imageUploadFromURL': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = context.options.langInfo;
                context.memo('button.imageUploadFromURL', function () {
                    var button = ui.button({
                        contents: options.imageUploadFromURL.icon || ('<span class="note-fontsize-10">' + lang.imageUploadFromURL.name + '</span>'),
                        tooltip: lang.imageUploadFromURL.tooltip,
                        click: function (e) {
                            e.preventDefault();
                            var $img = $($editable.data('target'));
                            options.imageUploadFromURL.uploadImageFromURLCall.call(self, $img, context).done(function (newImageURL) {
                                $img.attr("src", newImageURL);
                                self.alertSuccess("升级成功~");
                            });
                        }
                    });
                    return button.render();
                });
                self.alertSuccess = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-success" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
                self.alertError = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-danger" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
            }
        });

        // insert cloud photos (从Cloud相册中插入图片)
        $.extend(true, $.summernote.lang, {
            'en-US': {
                cloudPhotosInsert: {
                    name: "InsertAlbum",
                    tooltip: "open cloud photos insert dialog",
                    dialogTitle: "Insert Cloud Photos",
                    dialogAlbumLabel: "Album",
                    dialogClassLabel: "ClassName",
                    dialogShapeOptions: ['None', 'Responsive', 'Rounded', 'Circle', 'Thumbnail'],
                    dialogSizeLabel: "Size",
                    dialogSubmit: "insert",
                    dialogCancel: "cancel",
                }
            },
            'zh-CN': {
                cloudPhotosInsert: {
                    name: "插入相册",
                    tooltip: "从您的Cloud相册中插入图片",
                    dialogTitle: "插入相册",
                    dialogAlbumLabel: "相册",
                    dialogClassLabel: "ClassName",
                    dialogShapeOptions: ['None', 'Responsive', 'Rounded', 'Circle', 'Thumbnail'],
                    dialogSizeLabel: "数量",
                    dialogSubmit: "插入照片",
                    dialogCancel: "取消",
                }
            }
        });
        $.extend(true, $.summernote.options, {
            cloudPhotosInsert: {
                icon: '<i class="fa fa-cloud" /> ',
                dialogShapeOptions: ['', 'img-responsive', 'img-rounded', 'img-circle', 'img-thumbnail'],
                dialogClassName: "note-cloud-photos-insert-dialog",
                loadAlbumsCall: function (context) {
                    return $.Deferred(function (dfd) {
                        // var albums = [];
                        // dfd.resolve(albums);
                        alert("需要自己实现");
                    });
                },
                loadAlbumCall: function (album_id, context) {
                    return $.Deferred(function (dfd) {
                        // var album = [];
                        // dfd.resolve(album);
                        alert("需要自己实现");
                    });
                },
                buildCloudPhotosInsertHtmlCall: function (album, className, size, context) {
                    return $.Deferred(function (dfd) {
                        // var photosHtml = "";
                        // dfd.resolve(photosHtml);
                        alert("需要自己实现");
                    });
                },
            }
        });
        $.extend($.summernote.plugins, {
            'cloudPhotosInsert': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = context.options.langInfo;
                context.memo('button.cloudPhotosInsert', function () {
                    var button = ui.button({
                        contents: options.cloudPhotosInsert.icon + lang.cloudPhotosInsert.name,
                        tooltip: lang.cloudPhotosInsert.tooltip,
                        click: function (e) {
                            options.cloudPhotosInsert.loadAlbumsCall.call(self, context).done(function (albums) {
                                var album_select_options_html = '';
                                if (albums == null || albums.length == 0) {
                                    album_select_options_html = '<option value="0">无相册</option>';
                                    self.$dialog.find('.note-btn-cloud-photos-insert-submit').attr("disabled", "disabled");
                                } else {
                                    $.each(albums, function (index, album) {
                                        album_select_options_html += '<option value="' + album.album_id + '">' + album.name + '</option>';
                                    });
                                    self.$dialog.find('.note-btn-cloud-photos-insert-submit').removeAttr("disabled");
                                }
                                self.$dialog.find('.note-cloud-photos-insert-album').html(album_select_options_html);
                                context.invoke('cloudPhotosInsert.show');
                            });
                        }
                    });
                    return button.render();
                });
                self.initialize = function () {
                    var $container, shape, body, footer;
                    $container = options.dialogsInBody ? $(document.body) : $editor;
                    shape = '';
                    for (var i = 0, maxLength = options.cloudPhotosInsert.dialogShapeOptions.length; i < maxLength; i++) {
                        var shapeClassValue = options.cloudPhotosInsert.dialogShapeOptions[i];
                        var shapeClassName = lang.cloudPhotosInsert.dialogShapeOptions[i];
                        shape += '<option value="' + shapeClassValue + '">' + shapeClassName + '</option>';
                    }
                    body = '<div class="form-group note-group-cloud-photos-insert-album">'+
                        '<label class="note-form-label">' + lang.cloudPhotosInsert.dialogAlbumLabel + '</label>'+
                        '<select class="form-control note-form-control note-cloud-photos-insert-album"></select>'+
                        '</div>'+
                        '<div class="form-group note-group-cloud-photos-insert-class">'+
                        '<label class="note-form-label">' + lang.cloudPhotosInsert.dialogClassLabel + '</label>'+
                        '<select class="form-control note-form-control note-cloud-photos-insert-class">' + shape + '</select>'+
                        '</div>'+
                        '<div class="form-group note-group-cloud-photos-insert-size">'+
                        '<label class="note-form-label">' + lang.cloudPhotosInsert.dialogSizeLabel + '</label>'+
                        '<input class="form-control note-form-control note-cloud-photos-insert-size" type="text">'+
                        '</div>';
                    footer = '<button class="btn btn-default note-btn note-btn-default note-btn-cloud-photos-insert-cancel" data-dismiss="modal">' + lang.cloudPhotosInsert.dialogCancel + '</button>' +
                        '<button class="btn btn-primary note-btn note-btn-primary note-btn-cloud-photos-insert-submit">' + lang.cloudPhotosInsert.dialogSubmit + '</button>';
                    self.$dialog = ui.dialog({
                        className: options.cloudPhotosInsert.dialogClassName,
                        title: lang.cloudPhotosInsert.dialogTitle,
                        fade: options.dialogsFade,
                        body: body,
                        footer: footer
                    }).render().appendTo($container);
                    self.bindEvent();
                };
                self.alertSuccess = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-success" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
                self.alertError = function (text) {
                    var alterId = "note-alert-" + new Date().getTime();
                    $editor.find('.note-status-output').html('<div class="alert alert-danger" id="' + alterId + '">' + text + '</div>');
                    setTimeout(function () {
                        $editor.find('#' + alterId).remove();
                    }, 2500);
                };
                self.destroy = function () {
                    ui.hideDialog(self.$dialog);
                    self.$dialog.remove();
                };
                self.show = function () {
                    context.invoke('saveRange');
                    ui.onDialogShown(self.$dialog, function () {
                        context.triggerEvent('dialog.shown', self, context);
                    });
                    ui.showDialog(self.$dialog);
                };
                self.bindEvent = function () {
                    self.$dialog.find('.note-btn-cloud-photos-insert-submit').on("click", function () {
                        var album_id = self.$dialog.find('.note-cloud-photos-insert-album').val();
                        var className = self.$dialog.find('.note-cloud-photos-insert-class').val();
                        var size = self.$dialog.find('.note-cloud-photos-insert-size').val() || 0;
                        self.saveCloudPhotosInsert(album_id, className, size);
                    });
                };
                self.saveCloudPhotosInsert = function (album_id, className, size) {
                    if (album_id && album_id != "0") {
                        if (!/^[0-9]+$/.test(size)) {
                            self.alertError("数量请输入整数");
                        } else {
                            size = parseInt(size);
                            if (size == 0) {
                                size = -1;
                            }
                            if (!className) {
                                className = null;
                            }
                            options.cloudPhotosInsert.loadAlbumCall.call(self, album_id, context).done(function (album) {
                                if (size == -1 || size > album.size) {
                                    size = album.size;
                                }
                                options.cloudPhotosInsert.buildCloudPhotosInsertHtmlCall.call(self, album, className, size).done(function (photosHtml) {
                                    var div = document.createElement("div");
                                    div.className = "album_photos";
                                    div.innerHTML = photosHtml;
                                    context.invoke('restoreRange');
                                    context.invoke('insertNode', div);
                                    ui.hideDialog(self.$dialog);
                                    self.alertSuccess("共插入" + (size == -1 ? album.size : size) + "张图片", "插入成功");
                                });
                            });
                        }
                    }
                };
            }
        });
    };

    var initEditor = function () {
        $.extend(true, $.summernote.lang, {
            'zh-CN': {
                font: {
                    bold: '粗体',
                    italic: '斜体',
                    underline: '下划线',
                    strikethrough: '删除线',
                    clear: '清除格式',
                    height: '行高',
                    name: '字体',
                    size: '字号'
                },
                image: {
                    image: '图片',
                    insert: '插入图片',
                    resizeFull: '调整至 100%',
                    resizeHalf: '调整至 50%',
                    resizeQuarter: '调整至 25%',
                    floatLeft: '左浮动',
                    floatRight: '右浮动',
                    floatNone: '不浮动',
                    remove: '移除图片',
                    dragImageHere: '将图片拖至此处',
                    selectFromFiles: '从本地上传',
                    url: '图片地址'
                },
                link: {
                    link: '链接',
                    insert: '插入链接',
                    unlink: '去除链接',
                    edit: '编辑链接',
                    textToDisplay: '显示文本',
                    url: '链接地址',
                    openInNewWindow: '在新窗口打开'
                },
                video: {
                    video: '视频',
                    videoLink: '视频链接',
                    insert: '插入视频',
                    url: '视频地址',
                    providers: '(优酷, Instagram, DailyMotion, Youtube等)'
                },
                table: {
                    table: '表格'
                },
                hr: {
                    insert: '水平线'
                },
                style: {
                    style: '样式',
                    normal: '普通',
                    blockquote: '引用',
                    pre: '代码',
                    h1: '标题 1',
                    h2: '标题 2',
                    h3: '标题 3',
                    h4: '标题 4',
                    h5: '标题 5',
                    h6: '标题 6'
                },
                lists: {
                    unordered: '无序列表',
                    ordered: '有序列表'
                },
                options: {
                    help: '帮助',
                    fullscreen: '全屏',
                    codeview: '源代码'
                },
                paragraph: {
                    paragraph: '段落',
                    outdent: '减少缩进',
                    indent: '增加缩进',
                    left: '左对齐',
                    center: '居中对齐',
                    right: '右对齐',
                    justify: '两端对齐'
                },
                color: {
                    recent: '最近使用',
                    more: '更多',
                    background: '背景',
                    foreground: '前景',
                    transparent: '透明',
                    setTransparent: '透明',
                    reset: '重置',
                    resetToDefault: '默认'
                },
                shortcut: {
                    shortcuts: '快捷键',
                    close: '关闭',
                    textFormatting: '文本格式',
                    action: '动作',
                    paragraphFormatting: '段落格式',
                    documentStyle: '文档样式'
                },
                history: {
                    undo: '撤销',
                    redo: '重做'
                }
            }
        });

        // 自定义的编辑器
        pointer.mainEditor.summernote({
            lang: "zh-CN",
            height: 450,
            findnreplace: {
                highlight: 'border-bottom: 3px solid #fc0; text-decoration: none;',
                icon: '<i class="glyphicon glyphicon-search" />',
                enable: true
            },
            imageResize: {
                icon: '',
                getImageSizeCall: function ($img, context) {
                    return $.Deferred(function (dfd) {
                        if ($img.attr('data-inside-image') == "true") {
                            var raw = {};
                            if ($img.width() < 1800) {
                                raw.width = $img.attr('data-raw-width');
                                raw.height = $img.attr('data-raw-height');
                            } else {
                                raw.width = 1800;
                                raw.height = 1800;
                                toastr.info("图片过大，所以宽度调整为1800px");
                            }
                            dfd.resolve(raw);
                        } else {
                            dfd.reject();
                        }
                    });
                }
            },
            imageSetToCover: {
                icon: '',
                setImageToCoverCall: function ($img, context) {
                    $img.attr('data-cover', 'true');
                    pointer.summaryEditor.summernote('code', $img.prop("outerHTML"));
                }
            },
            imageUploadFromURL: {
                icon: '',
                uploadImageFromURLCall: function ($img, context) {
                    return $.Deferred(function (dfd) {
                        var originalImageUrl = $img.attr('src');
                        var isInsideImg = $img.attr('data-inside-image') == "true" ? true : false;
                        if (isInsideImg) {
                            toastr.success("已经是本站服务器图片了，无须再下载！");
                            dfd.reject("已经是本站服务器图片了，无须再下载！");
                            return;
                        }
                        uploadImageFromURL(originalImageUrl, function (data) {
                            // 修改节点
                            var imgLoadUrl = data.image_cdn_url;
                            $img.attr('data-relative-path', data.image_url);
                            $img.attr('data-filename', data.image_url.match(/^.*\/([^/]+)$/)[1]);
                            $img.attr('data-raw-width', "" + data.width);
                            $img.attr('data-raw-height', "" + data.height);
                            // 添加不是网络引用图片标记
                            $img.attr('data-inside-image', "true");
                            dfd.resolve(imgLoadUrl);
                            setTimeout(function () {
                                if (!window.confirm("点确认完成修改，点取消还原为网络图片")) {
                                    deleteImage(imgLoadUrl, true, false);
                                    $img.removeAttr("data-inside-image");
                                    $img.attr('src', originalImageUrl);
                                }
                            }, 2000);
                        });
                    });
                }
            },
            cloudPhotosInsert: {
                icon: '<i class="fa fa-cloud" /> ',
                dialogShapeOptions: ['', 'img-responsive', 'img-rounded', 'img-circle', 'img-thumbnail'],
                dialogClassName: "note-cloud-photos-insert-dialog",
                loadAlbumsCall: function (context) {
                    return $.Deferred(function (dfd) {
                        $.get("photo.api?method=getAlbumList", {"user.uid": login_handle.getCurrentUserId()}, function (response) {
                            if (response.status == 200) {
                                dfd.resolve(response.data.albums);
                            } else {
                                toastr.error(response.message, "加载相册列表错误");
                                console.warn("Error Code: " + response.status);
                                dfd.reject(response.message);
                            }
                        });
                    });
                },
                loadAlbumCall: function (album_id, context) {
                    return $.Deferred(function (dfd) {
                        $.get("photo.api?method=getAlbum", {"id": album_id, "mount": true, "photos": true}, function (response) {
                            if (response.status == 200) {
                                response.data.album.cdn_path_prefix = response.data.cdn_path_prefix;
                                dfd.resolve(response.data.album);
                            } else {
                                toastr.error(response.message, "加载相册错误");
                                console.warn("Error Code: " + response.status);
                                dfd.reject(response.message);
                            }
                        });
                    });
                },
                buildCloudPhotosInsertHtmlCall: function (album, className, size, context) {
                    return $.Deferred(function (dfd) {
                        var cdn_path_prefix = album.cdn_path_prefix;
                        var photosHtml = '';
                        for (var i = 0; i < size; i++) {
                            var photo = album.photos[i];
                            photosHtml += '<img ' + (className ? ('class="' + className + '" ') : '') + 'src="' + photo.path + '" ';
                            photosHtml += 'data-filename="' + photo.path.substring(photo.path.lastIndexOf('/') + 1) + '" ';
                            photosHtml += 'data-relative-path="' + photo.path.replace(cdn_path_prefix, "") + '" ';
                            photosHtml += 'data-raw-width="' + photo.width + '" ';
                            photosHtml += 'data-raw-height="' + photo.height + '" ';
                            photosHtml += 'data-photo-id="' + photo.photo_id + '" ';
                            photosHtml += 'data-album-id="' + photo.album_id + '" ';
                            photosHtml += 'title="' + photo.name + '/' + photo.description + '" ';
                            photosHtml += 'data-inside-image="true" ';
                            photosHtml += 'data-cloud-image="true" ';
                            photosHtml += 'style="width: 100%;"/>';
                        }
                        dfd.resolve(photosHtml);
                    });
                },
            },
            nugget: {
                list: [ // list of your nuggets
                    '[[code nugget 1]]',
                    '[[code nugget 2]]',
                    '[[code nugget 2]]'
                ]
            },
            imageTitle: {
                icon: '<span class="note-fontsize-10">标题</span>',
                specificAltField: true,
            },
            imageAttributes: {
                icon: '<i class="note-icon-pencil"/>',
                removeEmpty: true, // true = remove attributes | false = leave empty if present
                disableUpload: true // true = don't display Upload Options | Display Upload Options
            },
            cleaner: {
                action: 'button', // both|button|paste 'button' only cleans via toolbar button, 'paste' only clean when pasting content, both does both options.
                newline: '<br>', // Summernote's default is to use '<p><br></p>'
                notStyle: 'position:absolute;top:0;left:0;right:0', // Position of Notification
                icon: '<i class="note-icon"></i>清除标签',
                keepHtml: false, // Remove all Html formats
                keepOnlyTags: ['<p>', '<br>', '<ul>', '<li>', '<b>', '<strong>', '<i>', '<a>'], // If keepHtml is true, remove all tags except these
                keepClasses: false, // Remove Classes
                badTags: ['style', 'script', 'applet', 'embed', 'noframes', 'noscript', 'html'], // Remove full tags with contents
                badAttributes: ['style', 'start'], // Remove attributes from remaining tags
                limitChars: false, // 0/false | # (0/false disables option)
                limitDisplay: 'both', // text|html|both
                limitStop: false // true/false
            },
            toolbar: [
                //[groupname, [button list]]
                ['style', ['style', 'paperSize']],
                ['fontstyle', ['bold', 'italic', 'clear',]],
                ['sp', ['underline', 'strikethrough', 'superscript', 'subscript']],
                ['font', ['fontname']],
                ['fontsize', ['fontsize']],
                ['height', ['height']],
                ['color', ['color']],
                ['para', ['ul', 'ol', 'paragraph']],
                ['insert', ['hr', 'link', 'picture', 'video']],
                ['table', ['table']],
                ['Misc', ['fullscreen', 'codeview', 'undo', 'redo', 'help']],
                ['ud_group_1', ['codeInsert', 'cloudPhotosInsert']],
                ['ud_group_2', ['newLineAdd', 'cleaner']],
                ['ud_group_3', ['sDraftsLoad', 'sDraftsSave']],
                ['ud_group_4', ['findnreplace']],
            ],
            popover: {
                image: [
                    ['custom', ['imageTitle', 'imageAttributes', 'imageShapes']],
                    ['imagesize', ['imageResize', 'imageSize100', 'imageSize50', 'imageSize25']],
                    ['float', ['floatLeft', 'floatRight', 'floatNone']],
                    ['remove', ['imageUploadFromURL', 'imageSetToCover', 'removeMedia']]
                ],
                link: [
                    ['link', ['linkDialogShow', 'unlink']]
                ],
                air: [
                    ['color', ['color']],
                    ['font', ['bold', 'underline', 'clear']],
                    ['para', ['ul', 'paragraph']],
                    ['table', ['table']],
                    ['insert', ['link', 'picture']]
                ]
            },
            placeholder: 'write here...',
            fontNames: ['Open Sans', 'Microsoft YaHei', 'Helvetica', 'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Merriweather'],
            fontNamesIgnoreCheck: ['Open Sans', 'Microsoft YaHei', 'Arial'],
            fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36'],
            dialogsInBody: false,
            dialogsFade: true,
            callbacks: {
                onImageUpload: function (selectFiles) {
                    var files = [];
                    $.each(selectFiles, function (index, file) {
                        files.push(file);
                    });
                    // 可以同时上传多个图片
                    files.sort(SortLikeWin);
                    uploadImages(files);
                },
                onMediaDelete: function ($target, $editable) {
                    // 删除图片
                    if ($target.prop("tagName") == "IMG") {
                        var $img = $target;
                        var imgUrl = $img.attr("src");
                        var isInsideImg = $img.attr('data-inside-image') == "true" ? true : false;
                        var isCloudImg = $img.attr('data-cloud-image') == "true" ? true : false;
                        deleteImage(imgUrl, isInsideImg, isCloudImg);
                    }
                },
                onDialogShown: function () {
                }
            }
        });

        // summary 编辑器
        pointer.summaryEditor.summernote({
            lang: "zh-CN",
            cleaner: {
                action: 'button', // both|button|paste 'button' only cleans via toolbar button, 'paste' only clean when pasting content, both does both options.
                newline: '<br>', // Summernote's default is to use '<p><br></p>'
                notStyle: 'position:absolute;top:0;left:0;right:0', // Position of Notification
                icon: '<i class="note-icon"></i>清除标签',
                keepHtml: false, // Remove all Html formats
                keepOnlyTags: ['<p>', '<br>', '<ul>', '<li>', '<b>', '<strong>', '<i>', '<a>'], // If keepHtml is true, remove all tags except these
                keepClasses: false, // Remove Classes
                badTags: ['style', 'script', 'applet', 'embed', 'noframes', 'noscript', 'html'], // Remove full tags with contents
                badAttributes: ['style', 'start'], // Remove attributes from remaining tags
                limitChars: false, // 0/false | # (0/false disables option)
                limitDisplay: 'both', // text|html|both
                limitStop: false // true/false
            }
        });

    };

    // 批量上次图片
    function uploadImages(files) {
        var uploadNotifyElement = common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "showDuration": 0,
            "timeOut": 0,
            "closeButton": false,
            "iconClass": "toast-success-no-icon",
            "hideOnHover": false
        }).success("正在上传第 1 张~", "", "notify_post_image_uploading");
        var taskQueue = new common_utils.TaskQueue(function (task) {
            var dfd = $.Deferred();
            var file = task.file;
            var fileName;
            try {
                fileName = file.name;
            } catch (e) {
                fileName = "xx.jpg";
            }
            // 检查大小
            if (config.maxUploadSize != -1 && file.size > config.maxUploadSize) {
                var overSizeError = fileName + " 换个小的，最大" + (config.maxUploadSize / (1024 * 1024)) + "M";
                toastr.error(overSizeError, "别丢个这么大的图片给我a", {timeOut: 0,progressBar: false});
                dfd.reject(overSizeError);
                return;
            }
            var formData = new FormData();
            formData.append("file", file);
            formData.append("fileName", fileName);
            formData.append("isImage", "true");
            uploadNotifyElement.find(".toast-message").text("正在上传第 " + (task.index + 1) + " 张~");
            $.ajax({
                url: "article.api?method=uploadAttachment",
                data: formData,
                type: "POST",
                contentType: false,
                cache: false,
                processData: false,
                success: function (response) {
                    if (response.status == 200) {
                        var data = response.data;
                        var imgLoadUrl = data.image_cdn_url;
                        // 插入节点
                        pointer.mainEditor.summernote('editor.insertImage', imgLoadUrl, function ($img) {
                            $img.css('width', "100%");
                            $img.attr('data-filename', data.image_url.match(/^.*\/([^/]+)$/)[1]);
                            $img.attr('data-relative-path', data.image_url);
                            // 设置后台计算的图片实际尺寸
                            // 用于用户可能还原要图片上传前的尺寸
                            $img.attr('data-raw-width', "" + data.width);
                            $img.attr('data-raw-height', "" + data.height);
                            // 添加不是网络引用图片标记
                            $img.attr('data-inside-image', "true");
                            // 继续上传下一张
                            // 写这个回调方法里面会在图片加载完再执行
                            dfd.resolve();
                        });
                    } else {
                        dfd.reject(response.message);
                        toastr.error(response.message, "错误", {"progressBar": false});
                        console.warn("Error Code: " + response.status);
                    }
                    if (response.status != 200 || task.isLastOne) {
                        common_utils.removeNotify("notify_post_image_uploading");
                        toastr.success("上传服务器完毕, 正在加载", "提示", {"progressBar": true});
                    }
                },
                error: function (XHR, TS) {
                    common_utils.removeNotify("notify_post_image_uploading");
                    dfd.reject(TS);
                    toastr.error(TS, "错误", {"progressBar": false});
                    console.warn("Error Code: " + TS);
                }
            });
            return dfd;
        });
        $.each(files, function (i, file) {
            taskQueue.append({
                "file": file,
                "isLastOne": (i == (files.length - 1)),
                "index": i
            });
        })
    }

    // 互联网图片本地化
    function uploadImageFromURL(internetUrl, call) {
        if (internetUrl.substr(0, 1) == "/") {
            internetUrl = window.location.protocol + "//" + window.location.host + internetUrl;
        }
        var ext = (internetUrl.lastIndexOf(".") == -1 ? ".jpg" : internetUrl.substr(internetUrl.lastIndexOf(".")));
        var notify_downloading = toastr.info("服务器正在下载图片", "提示", {
            "progressBar": false,
            "hideDuration": 0,
            "showDuration": 0,
            "timeOut": 0,
            "closeButton": false
        });
        $.ajax({
            data: {"fileName": "download" + ext, "url": internetUrl},
            type: "POST",
            url: "article.api?method=uploadImageFromURL",
            dataType: "json",
            success: function (response) {
                toastr.remove(notify_downloading, true);
                if (response.status == 200) {
                    var data = response.data;
                    toastr.success("服务器下载成功,正在加载", "提示", {"progressBar": true});
                    call(data);
                } else {
                    toastr.error(response.message, "下载失败");
                    console.warn("uploadImageFromURL Error Code: " + response.status);
                }
            },
            error: function () {
                toastr.remove(notify_downloading, true);
                toastr.error("uploadImageFromURL 服务器错误");
                console.warn("uploadImageFromURL 服务器错误");
            }
        });
    }

    // 删除文件
    function deleteImage(imgUrl, isInsideImg, isCloudImg) {
        var coverUrl = $(pointer.summaryEditor.summernote('code')).find('img').attr('src');
        // 此图片为封面图片则一起把摘要清空
        if (coverUrl == imgUrl) {
            pointer.summaryEditor.summernote('code', '');
        }
        // 网络引用图片则不提交
        if (isInsideImg) {
            // 如果是引用的相册图片 直接返回
            if (isCloudImg) {
                toastr.success("相册引用图片删除成功！");
                toastr.success("如需完全删除，请至相册！");
                return;
            }
            $.ajax({
                url: "article.api?method=deleteAttachment",
                data: {"file_url": imgUrl, "isImage": true},
                type: "POST",
                dataType: 'json',
                success: function (response) {
                    if (response.status == 200) {
                        toastr.success("图片服务器删除成功！");
                    } else if (response.status == 404) {
                        toastr.success("网络引用图片删除成功！");
                    } else {
                        toastr.error(response.message, "删除失败！");
                        console.warn("Error Code: " + response.status);
                    }
                },
                error: function () {
                    toastr.error("图片服务器删除失败！ :)");
                }
            });
        } else {
            toastr.success("网络引用图片删除成功！");
        }
    }

    /**
     * 模仿windows文件按名称排序效果
     * @param v1
     * @param v2
     * @returns {number}
     * @constructor
     */
    function SortLikeWin(v1, v2) {
        var a = v1.name;
        var b = v2.name;
        var reg = /[0-9]+/g;
        var lista = a.match(reg);
        var listb = b.match(reg);
        if (!lista || !listb) {
            return a.localeCompare(b);
        }
        for (var i = 0, minLen = Math.min(lista.length, listb.length); i < minLen; i++) {
            //数字所在位置序号
            var indexa = a.indexOf(lista[i]);
            var indexb = b.indexOf(listb[i]);
            //数字前面的前缀
            var prefixa = a.substring(0, indexa);
            var prefixb = a.substring(0, indexb);
            //数字的string
            var stra = lista[i];
            var strb = listb[i];
            //数字的值
            var numa = parseInt(stra);
            var numb = parseInt(strb);
            //如果数字的序号不等或前缀不等，属于前缀不同的情况，直接比较
            if (indexa != indexb || prefixa != prefixb) {
                return a.localeCompare(b);
            }
            else {
                //数字的string全等
                if (stra === strb) {
                    //如果是最后一个数字，比较数字的后缀
                    if (i == minLen - 1) {
                        return a.substring(indexa).localeCompare(b.substring(indexb));
                    }
                    //如果不是最后一个数字，则循环跳转到下一个数字，并去掉前面相同的部分
                    else {
                        a = a.substring(indexa + stra.length);
                        b = b.substring(indexa + stra.length);
                    }
                }
                //如果数字的string不全等，但值相等
                else if (numa == numb) {
                    //直接比较数字前缀0的个数，多的更小
                    return strb.lastIndexOf(numb + '') - stra.lastIndexOf(numa + '');
                }
                else {
                    //如果数字不等，直接比较数字大小
                    return numa - numb;
                }
            }
        }
    }

    initEditorPlugin();

    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
    };

    return context;
});

