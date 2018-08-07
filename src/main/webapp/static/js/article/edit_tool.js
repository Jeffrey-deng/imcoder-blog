(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'summernote', 'store2', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, store, common_utils, login_handle);
    }
})(function ($, bootstrap, domReady, toastr, summernote, store, common_utils, login_handle) {

    $(document).ajaxError(function () {
        toastr.error("An error occurred!", "执行Ajax请求时发生错误");
    });

    $.extend($.summernote.lang, {
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


//第三方插件
    (function (factory) {
        factory(window.jQuery);
    })(function ($) {

        /**
         * 插入自定义块
         * https://github.com/pHAlkaline/summernote-plugins/tree/master/plugins/nugget
         */
        $.extend($.summernote.options, {
            nugget: {
                list: []
            }

        });
        $.extend(true, $.summernote, {
            // add localization texts
            lang: {
                'en-US': {
                    nugget: {
                        Nugget: 'Nugget',
                        Insert_nugget: 'Insert Nugget'

                    }
                },
                'zh-CN': {
                    nugget: {
                        Nugget: '块',
                        Insert_nugget: '插入自定义块'

                    }
                }
            }
        });
        // Extends plugins for adding nuggets.
        //  - plugin is external module for customizing.
        $.extend($.summernote.plugins, {
            /**
             * @param {Object} context - context object has status of editor.
             */
            'nugget': function (context) {
                // ui has renders to build ui elements.
                //  - you can create a button with `ui.button`
                var ui = $.summernote.ui;
                var options = context.options.nugget;
                var context_options = context.options;
                var lang = context_options.langInfo;
                var defaultOptions = {
                    label: lang.nugget.Nugget,
                    tooltip: lang.nugget.Insert_nugget
                };

                // Assign default values if not supplied
                for (var propertyName in defaultOptions) {
                    if (options.hasOwnProperty(propertyName) === false) {
                        options[propertyName] = defaultOptions[propertyName];
                    }
                }

                // add hello button
                context.memo('button.nugget', function () {
                    // create button

                    var button = ui.buttonGroup([
                        ui.button({
                            className: 'dropdown-toggle',
                            contents: '<span class="nugget">' + options.label + ' </span><span class="note-icon-caret"></span>',
                            tooltip: options.tooltip,
                            data: {
                                toggle: 'dropdown'
                            }
                        }),
                        ui.dropdown({
                            className: 'dropdown-nugget',
                            items: options.list,
                            click: function (event) {
                                event.preventDefault();

                                var $button = $(event.target);
                                var value = $button.data('value');
                                var node = document.createElement('span');
                                node.innerHTML = value;
                                context.invoke('editor.insertText', value);

                            }
                        })
                    ]);

                    // create jQuery object from button instance.
                    return button.render();
                });
            }

        });
//


        /**
         * 添加图片标题
         * https://github.com/asiffermann/summernote-image-title
         */
        $.extend(true, $.summernote.lang, {
            'en-US': {
                imageTitle: {
                    edit: 'Edit title',
                    titleLabel: 'Title',
                    altLabel: 'Alternative Text'
                }
            },
            'zh-CN': {
                imageTitle: {
                    edit: '图片标题',
                    titleLabel: '标题（title）',
                    altLabel: '加载失败提示（alt）'
                }
            }
        });

        $.extend($.summernote.plugins, {
            'imageTitle': function (context) {
                var self = this;

                var ui = $.summernote.ui;
                var $note = context.layoutInfo.note;
                var $editor = context.layoutInfo.editor;
                var $editable = context.layoutInfo.editable;

                if (typeof context.options.imageTitle === 'undefined') {
                    context.options.imageTitle = {};
                }

                if (typeof context.options.imageTitle.specificAltField === 'undefined') {
                    context.options.imageTitle.specificAltField = false;
                }

                if (typeof context.options.imageTitle.icon === 'undefined') {
                    context.options.imageTitle.icon = '<i class="note-icon-pencil"/>';
                }

                var options = context.options;
                var lang = options.langInfo;

                context.memo('button.imageTitle', function () {
                    var button = ui.button({
                        contents: options.imageTitle.icon,
                        tooltip: lang.imageTitle.edit,
                        click: function (e) {
                            context.invoke('imageTitle.show');
                        }
                    });

                    return button.render();
                });

                this.initialize = function () {
                    var $container = options.dialogsInBody ? $(document.body) : $editor;

                    var body = '<div class="form-group">' +
                        '<label>' + lang.imageTitle.titleLabel + '</label>' +
                        '<input class="note-image-title-text form-control" type="text" />' +
                        '</div>';

                    if (options.imageTitle.specificAltField) {
                        body += '<div class="form-group">' +
                            '<label>' + lang.imageTitle.altLabel + '</label>' +
                            '<input class="note-image-alt-text form-control" type="text" />' +
                            '</div>';
                    }

                    var footer = '<button href="#" class="btn btn-primary note-image-title-btn">' + lang.imageTitle.edit + '</button>';

                    this.$dialog = ui.dialog({
                        title: lang.imageTitle.edit,
                        body: body,
                        footer: footer
                    }).render().appendTo($container);
                };

                this.destroy = function () {
                    ui.hideDialog(this.$dialog);
                    this.$dialog.remove();
                };

                this.bindEnterKey = function ($input, $btn) {
                    $input.on('keypress', function (event) {
                        if (event.keyCode === 13) {
                            $btn.trigger('click');
                        }
                    });
                };

                this.show = function () {
                    var $img = $($editable.data('target'));
                    var imgInfo = {
                        imgDom: $img,
                        title: $img.attr('title'),
                        alt: $img.attr('alt'),
                    };
                    this.showLinkDialog(imgInfo).then(function (imgInfo) {
                        ui.hideDialog(self.$dialog);
                        var $img = imgInfo.imgDom;

                        if (imgInfo.alt) {
                            $img.attr('alt', imgInfo.alt);
                        }
                        else {
                            $img.removeAttr('alt');
                        }

                        if (imgInfo.title) {
                            $img.attr('title', imgInfo.title);
                        }
                        else {
                            $img.removeAttr('title');
                        }

                        $note.val(context.invoke('code'));
                        $note.change();
                    });
                };

                this.showLinkDialog = function (imgInfo) {
                    return $.Deferred(function (deferred) {
                        var $imageTitle = self.$dialog.find('.note-image-title-text'),
                            $imageAlt = (options.imageTitle.specificAltField) ? self.$dialog.find('.note-image-alt-text') : null,
                            $editBtn = self.$dialog.find('.note-image-title-btn');

                        ui.onDialogShown(self.$dialog, function () {
                            context.triggerEvent('dialog.shown');

                            $editBtn.click(function (event) {
                                event.preventDefault();
                                deferred.resolve({
                                    imgDom: imgInfo.imgDom,
                                    title: $imageTitle.val(),
                                    alt: (options.imageTitle.specificAltField) ? $imageAlt.val() : $imageTitle.val(),
                                });
                            });

                            $imageTitle.val(imgInfo.title).trigger('focus');
                            self.bindEnterKey($imageTitle, $editBtn);

                            if (options.imageTitle.specificAltField) {
                                $imageAlt.val(imgInfo.alt);
                                self.bindEnterKey($imageAlt, $editBtn);
                            }
                        });

                        ui.onDialogHidden(self.$dialog, function () {
                            $editBtn.off('click');

                            if (deferred.state() === 'pending') {
                                deferred.reject();
                            }
                        });

                        ui.showDialog(self.$dialog);
                    });
                };
            }
        });
//


        /**
         * 修改图片详细属性
         * https://github.com/DiemenDesign/summernote-image-attributes
         */
        var readFileAsDataURL = function (file) {
            return $.Deferred(function (deferred) {
                $.extend(new FileReader(), {
                    onload: function (e) {
                        var sDataURL = e.target.result;
                        deferred.resolve(sDataURL);
                    },
                    onerror: function () {
                        deferred.reject(this);
                    }
                }).readAsDataURL(file);
            }).promise();
        };
        $.extend(true, $.summernote.lang, {
            'en-US': {
                /* US English(Default Language) */
                imageAttributes: {
                    dialogTitle: 'Image Attributes',
                    tooltip: 'Image Attributes',
                    tabImage: 'Image',
                    src: 'Source',
                    browse: 'Browse',
                    title: 'Title',
                    alt: 'Alt Text',
                    dimensions: 'Dimensions',
                    tabAttributes: 'Attributes',
                    class: 'Class',
                    style: 'Style',
                    role: 'Role',
                    tabLink: 'Link',
                    linkHref: 'URL',
                    linkTarget: 'Target',
                    linkTargetInfo: 'Options: _self, _blank, _top, _parent',
                    linkClass: 'Class',
                    linkStyle: 'Style',
                    linkRel: 'Rel',
                    linkRelInfo: 'Options: alternate, author, bookmark, help, license, next, nofollow, noreferrer, prefetch, prev, search, tag',
                    linkRole: 'Role',
                    tabUpload: 'Upload',
                    upload: 'Upload',
                    tabBrowse: 'Browse',
                    editBtn: 'OK'
                }
            },
            'zh-CN': {
                imageAttributes: {
                    dialogTitle: 'Image Attributes',
                    tooltip: '编辑图片详细信息',
                    tabImage: '图片',
                    src: 'Source',
                    browse: 'Browse',
                    title: 'Title',
                    alt: 'Alt Text',
                    dimensions: 'Dimensions',
                    tabAttributes: '样式',
                    class: 'Class',
                    style: 'Style',
                    role: 'Role',
                    tabLink: '添加链接',
                    linkHref: 'URL',
                    linkTarget: 'Target',
                    linkTargetInfo: 'Options: _self, _blank, _top, _parent',
                    linkClass: 'Class',
                    linkStyle: 'Style',
                    linkRel: 'Rel',
                    linkRelInfo: 'Options: alternate, author, bookmark, help, license, next, nofollow, noreferrer, prefetch, prev, search, tag',
                    linkRole: 'Role',
                    tabUpload: '上传',
                    upload: 'Upload',
                    tabBrowse: 'Browse',
                    editBtn: 'OK'
                }
            }
        });
        $.extend($.summernote.options, {
            imageAttributes: {
                icon: '<i class="note-icon-pencil"/>',
                removeEmpty: true,
                disableUpload: false,
                imageFolder: ''
            }
        });
        $.extend($.summernote.plugins, {
            'imageAttributes': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = options.langInfo,
                    imageAttributesLimitation = '';
                if (options.maximumImageFileSize) {
                    var unit = Math.floor(Math.log(options.maximumImageFileSize) / Math.log(1024));
                    var readableSize = (options.maximumImageFileSize / Math.pow(1024, unit)).toFixed(2) * 1 + ' ' + ' KMGTP'[unit] + 'B';
                    imageAttributesLimitation = '<small class="help-block note-help-block">' + lang.image.maximumFileSize + ' : ' + readableSize + '</small>';
                }
                context.memo('button.imageAttributes', function () {
                    var button = ui.button({
                        contents: options.imageAttributes.icon,
                        tooltip: lang.imageAttributes.tooltip,
                        click: function () {
                            context.invoke('imageAttributes.show');
                        }
                    });
                    return button.render();
                });
                this.initialize = function () {
                    var $container = options.dialogsInBody ? $(document.body) : $editor;
                    var timestamp = Date.now();
                    var body = '<ul class="nav note-nav nav-tabs note-nav-tabs">' +
                        '  <li><a href="#note-imageAttributes' + timestamp + '" data-toggle="tab">' + lang.imageAttributes.tabImage + '</a></li>' +
                        '  <li><a href="#note-imageAttributes-attributes' + timestamp + '" data-toggle="tab">' + lang.imageAttributes.tabAttributes + '</a></li>' +
                        '  <li><a href="#note-imageAttributes-link' + timestamp + '" data-toggle="tab">' + lang.imageAttributes.tabLink + '</a></li>';
                    if (options.imageAttributes.disableUpload == false) {
                        body += '  <li><a href="#note-imageAttributes-upload' + timestamp + '" data-toggle="tab">' + lang.imageAttributes.tabUpload + '</a></li>';
                    }
                    body += '</ul>' +
                        '<div class="tab-content note-tab-content">' +
                        // Tab 2
                        '  <div class="tab-pane note-tab-pane" id="note-imageAttributes-attributes' + timestamp + '">' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-class">' +
                        '      <label class="control-label note-form-label col-sm-3">' + lang.imageAttributes.class + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-class form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-style">' +
                        '      <label class="control-label note-form-label col-sm-3">' + lang.imageAttributes.style + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-style form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-role">' +
                        '      <label class="control-label note-form-label col-sm-3">' + lang.imageAttributes.role + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-role form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '    </div>' +
                        '  </div>' +
                        // Tab 3
                        '  <div class="tab-pane note-tab-pane" id="note-imageAttributes-link' + timestamp + '">' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-link-href">' +
                        '      <label class="control-label note-form-label col-xs-3">' + lang.imageAttributes.linkHref + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-link-href form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-link-target">' +
                        '      <label class="control-label note-form-label col-xs-3">' + lang.imageAttributes.linkTarget + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-link-target form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '      <small class="help-block note-help-block text-right">' + lang.imageAttributes.linkTargetInfo + '</small>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-link-class">' +
                        '      <label class="control-label note-form-label col-xs-3">' + lang.imageAttributes.linkClass + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-link-class form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-link-style">' +
                        '      <label class="control-label note-form-label col-xs-3">' + lang.imageAttributes.linkStyle + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-link-style form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-link-rel">' +
                        '      <label class="control-label note-form-label col-xs-3">' + lang.imageAttributes.linkRel + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-link-rel form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '      <small class="help-block note-help-block text-right">' + lang.imageAttributes.linkRelInfo + '</small>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-link-role">' +
                        '      <label class="control-label note-form-label col-xs-3">' + lang.imageAttributes.linkRole + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-link-role form-control note-form-control note-input" type="text">' +
                        '      </div>' +
                        '    </div>' +
                        '  </div>';
                    if (options.imageAttributes.disableUpload == false) {
                        // Tab 4
                        body += '  <div class="tab-pane note-tab-pane" id="note-imageAttributes-upload' + timestamp + '">' +
                            '   <label class="control-label note-form-label col-xs-3">' + lang.imageAttributes.upload + '</label>' +
                            '   <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                            '     <input class="note-imageAttributes-input form-control note-form-control note-input" type="file" name="files" accept="image/*" multiple="multiple" />' +
                            imageAttributesLimitation +
                            '    </div>' +
                            '  </div>';
                    }
                    // Tab 1
                    body += '  <div class="tab-pane note-tab-pane" id="note-imageAttributes' + timestamp + '">' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-url">' +
                        '      <label class="control-label note-form-label col-sm-3">' + lang.imageAttributes.src + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-src form-control note-form-control note-input" type="text" />' +
//                   '        <span class="input-group-btn">' +
//                   '          <button class="btn btn-default class="note-imageAttributes-browse">' + lang.imageAttributes.browse + '</button>' +
//                   '        </span>' +
                        '      </div>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-title">' +
                        '      <label class="control-label note-form-label col-sm-3">' + lang.imageAttributes.title + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-title form-control note-form-control note-input" type="text" />' +
                        '      </div>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-alt">' +
                        '      <label class="control-label note-form-label col-sm-3">' + lang.imageAttributes.alt + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-alt form-control note-form-control note-input" type="text" />' +
                        '      </div>' +
                        '    </div>' +
                        '    <div class="note-form-group form-group note-group-imageAttributes-dimensions">' +
                        '      <label class="control-label note-form-label col-sm-3">' + lang.imageAttributes.dimensions + '</label>' +
                        '      <div class="input-group note-input-group col-xs-12 col-sm-9">' +
                        '        <input class="note-imageAttributes-width form-control note-form-control note-input" type="text" />' +
                        '        <span class="input-group-addon note-input-group-addon">x</span>' +
                        '        <input class="note-imageAttributes-height form-control note-form-control note-input" type="text" />' +
                        '      </div>' +
                        '    </div>' +
                        '  </div>' +
                        '</div>';
                    this.$dialog = ui.dialog({
                        title: lang.imageAttributes.dialogTitle,
                        body: body,
                        footer: '<button href="#" class="btn btn-primary note-btn note-btn-primary note-imageAttributes-btn">' + lang.imageAttributes.editBtn + '</button>'
                    }).render().appendTo($container);
                };
                this.destroy = function () {
                    ui.hideDialog(this.$dialog);
                    this.$dialog.remove();
                };
                this.bindEnterKey = function ($input, $btn) {
                    $input.on('keypress', function (e) {
                        if (e.keyCode === 13) $btn.trigger('click');
                    });
                };
                this.bindLabels = function () {
                    self.$dialog.find('.form-control:first').focus().select();
                    self.$dialog.find('label').on('click', function () {
                        $(this).parent().find('.form-control:first').focus();
                    });
                };
                this.show = function () {
                    var $img = $($editable.data('target'));
                    var imgInfo = {
                        imgDom: $img,
                        title: $img.attr('title'),
                        src: $img.attr('src'),
                        alt: $img.attr('alt'),
                        width: $img.attr('width'),
                        height: $img.attr('height'),
                        role: $img.attr('role'),
                        class: $img.attr('class'),
                        style: $img.attr('style'),
                        imgLink: $($img).parent().is("a") ? $($img).parent() : null
                    };
                    this.showImageAttributesDialog(imgInfo).then(function (imgInfo) {
                        ui.hideDialog(self.$dialog);
                        var $img = imgInfo.imgDom;
                        if (options.imageAttributes.removeEmpty) {
                            if (imgInfo.alt) $img.attr('alt', imgInfo.alt); else $img.removeAttr('alt');
                            if (imgInfo.width) $img.attr('width', imgInfo.width); else $img.removeAttr('width');
                            if (imgInfo.height) $img.attr('height', imgInfo.height); else $img.removeAttr('height');
                            if (imgInfo.title) $img.attr('title', imgInfo.title); else $img.removeAttr('title');
                            if (imgInfo.src) $img.attr('src', imgInfo.src); else $img.attr('src', '#');
                            if (imgInfo.class) $img.attr('class', imgInfo.class); else $img.removeAttr('class');
                            if (imgInfo.style) $img.attr('style', imgInfo.style); else $img.removeAttr('style');
                            if (imgInfo.role) $img.attr('role', imgInfo.role); else $img.removeAttr('role');
                        } else {
                            if (imgInfo.src) $img.attr('src', imgInfo.src); else $img.attr('src', '#');
                            $img.attr('alt', imgInfo.alt);
                            $img.attr('width', imgInfo.width);
                            $img.attr('height', imgInfo.height);
                            $img.attr('title', imgInfo.title);
                            $img.attr('class', imgInfo.class);
                            $img.attr('style', imgInfo.style);
                            $img.attr('role', imgInfo.role);
                        }
                        if ($img.parent().is("a")) $img.unwrap();
                        if (imgInfo.linkHref) {
                            var linkBody = '<a';
                            if (imgInfo.linkClass) linkBody += ' class="' + imgInfo.linkClass + '"';
                            if (imgInfo.linkStyle) linkBody += ' style="' + imgInfo.linkStyle + '"';
                            linkBody += ' href="' + imgInfo.linkHref + '" target="' + imgInfo.linkTarget + '"';
                            if (imgInfo.linkRel) linkBody += ' rel="' + imgInfo.linkRel + '"';
                            if (imgInfo.linkRole) linkBody += ' role="' + imgInfo.linkRole + '"';
                            linkBody += '></a>';
                            $img.wrap(linkBody);
                        }
                        $note.val(context.invoke('code'));
                        $note.change();
                    });
                };
                this.showImageAttributesDialog = function (imgInfo) {
                    return $.Deferred(function (deferred) {
                        var $imageTitle = self.$dialog.find('.note-imageAttributes-title'),
                            $imageInput = self.$dialog.find('.note-imageAttributes-input'),
                            $imageSrc = self.$dialog.find('.note-imageAttributes-src'),
                            $imageAlt = self.$dialog.find('.note-imageAttributes-alt'),
                            $imageWidth = self.$dialog.find('.note-imageAttributes-width'),
                            $imageHeight = self.$dialog.find('.note-imageAttributes-height'),
                            $imageClass = self.$dialog.find('.note-imageAttributes-class'),
                            $imageStyle = self.$dialog.find('.note-imageAttributes-style'),
                            $imageRole = self.$dialog.find('.note-imageAttributes-role'),
                            $linkHref = self.$dialog.find('.note-imageAttributes-link-href'),
                            $linkTarget = self.$dialog.find('.note-imageAttributes-link-target'),
                            $linkClass = self.$dialog.find('.note-imageAttributes-link-class'),
                            $linkStyle = self.$dialog.find('.note-imageAttributes-link-style'),
                            $linkRel = self.$dialog.find('.note-imageAttributes-link-rel'),
                            $linkRole = self.$dialog.find('.note-imageAttributes-link-role'),
                            $editBtn = self.$dialog.find('.note-imageAttributes-btn');
                        $linkHref.val();
                        $linkClass.val();
                        $linkStyle.val();
                        $linkRole.val();
                        $linkTarget.val();
                        $linkRel.val();
                        if (imgInfo.imgLink) {
                            $linkHref.val(imgInfo.imgLink.attr('href'));
                            $linkClass.val(imgInfo.imgLink.attr('class'));
                            $linkStyle.val(imgInfo.imgLink.attr('style'));
                            $linkRole.val(imgInfo.imgLink.attr('role'));
                            $linkTarget.val(imgInfo.imgLink.attr('target'));
                            $linkRel.val(imgInfo.imgLink.attr('rel'));
                        }
                        ui.onDialogShown(self.$dialog, function () {
                            context.triggerEvent('dialog.shown');
                            $imageInput.replaceWith(
                                $imageInput.clone().on('change', function () {
                                    var callbacks = options.callbacks;
                                    if (callbacks.onImageUpload) {
                                        context.triggerEvent('image.upload', this.files);
                                    } else {
                                        readFileAsDataURL(this.files[0]).then(function (dataURL) {
                                            $imageSrc.val(dataURL);
                                        }).fail(function () {
                                            context.triggerEvent('image.upload.error');
                                        });
                                    }
                                }).val('')
                            );
                            $editBtn.click(function (e) {
                                e.preventDefault();
                                deferred.resolve({
                                    imgDom: imgInfo.imgDom,
                                    title: $imageTitle.val(),
                                    src: $imageSrc.val(),
                                    alt: $imageAlt.val(),
                                    width: $imageWidth.val(),
                                    height: $imageHeight.val(),
                                    class: $imageClass.val(),
                                    style: $imageStyle.val(),
                                    role: $imageRole.val(),
                                    linkHref: $linkHref.val(),
                                    linkTarget: $linkTarget.val(),
                                    linkClass: $linkClass.val(),
                                    linkStyle: $linkStyle.val(),
                                    linkRel: $linkRel.val(),
                                    linkRole: $linkRole.val()
                                });
                            });
                            $imageTitle.val(imgInfo.title);
                            $imageSrc.val(imgInfo.src);
                            $imageAlt.val(imgInfo.alt);
                            $imageWidth.val(imgInfo.width);
                            $imageHeight.val(imgInfo.height);
                            $imageClass.val(imgInfo.class);
                            $imageStyle.val(imgInfo.style);
                            $imageRole.val(imgInfo.role);
                            self.bindEnterKey($editBtn);
                            self.bindLabels();
                        });
                        ui.onDialogHidden(self.$dialog, function () {
                            $editBtn.off('click');
                            if (deferred.state() === 'pending') deferred.reject();
                        });
                        ui.showDialog(self.$dialog);
                    });
                };
            }
        });


        /**
         * 清除标签，提取纯文本
         * https://github.com/DiemenDesign/summernote-cleaner
         */
        $.extend(true, $.summernote.lang, {
            'en-US': {
                cleaner: {
                    tooltip: 'Cleaner',
                    not: 'Text has been Cleaned!!!',
                    limitText: 'Text',
                    limitHTML: 'HTML'
                }
            },
            'zh-CN': {
                cleaner: {
                    tooltip: '对选取部分清除标签，提取纯文本',
                    not: 'Text has been Cleaned!!!',
                    limitText: 'Text',
                    limitHTML: 'HTML'
                }
            }
        });
        $.extend($.summernote.options, {
            cleaner: {
                action: 'both', // both|button|paste 'button' only cleans via toolbar button, 'paste' only clean when pasting content, both does both options.
                newline: '<br>', // Summernote's default is to use '<p><br></p>'
                notStyle: 'position:absolute;top:0;left:0;right:0',
                icon: '<i class="note-icon"><svg xmlns="http://www.w3.org/2000/svg" id="libre-paintbrush" viewBox="0 0 14 14" width="14" height="14"><path d="m 11.821425,1 q 0.46875,0 0.82031,0.311384 0.35157,0.311384 0.35157,0.780134 0,0.421875 -0.30134,1.01116 -2.22322,4.212054 -3.11384,5.035715 -0.64956,0.609375 -1.45982,0.609375 -0.84375,0 -1.44978,-0.61942 -0.60603,-0.61942 -0.60603,-1.469866 0,-0.857143 0.61608,-1.419643 l 4.27232,-3.877232 Q 11.345985,1 11.821425,1 z m -6.08705,6.924107 q 0.26116,0.508928 0.71317,0.870536 0.45201,0.361607 1.00781,0.508928 l 0.007,0.475447 q 0.0268,1.426339 -0.86719,2.32366 Q 5.700895,13 4.261155,13 q -0.82366,0 -1.45982,-0.311384 -0.63616,-0.311384 -1.0212,-0.853795 -0.38505,-0.54241 -0.57924,-1.225446 -0.1942,-0.683036 -0.1942,-1.473214 0.0469,0.03348 0.27455,0.200893 0.22768,0.16741 0.41518,0.29799 0.1875,0.130581 0.39509,0.24442 0.20759,0.113839 0.30804,0.113839 0.27455,0 0.3683,-0.247767 0.16741,-0.441965 0.38505,-0.753349 0.21763,-0.311383 0.4654,-0.508928 0.24776,-0.197545 0.58928,-0.31808 0.34152,-0.120536 0.68974,-0.170759 0.34821,-0.05022 0.83705,-0.07031 z"/></svg></i>',
                keepHtml: true, //Remove all Html formats
                keepOnlyTags: [], // If keepHtml is true, remove all tags except these
                keepClasses: false, //Remove Classes
                badTags: ['style', 'script', 'applet', 'embed', 'noframes', 'noscript', 'html'], //Remove full tags with contents
                badAttributes: ['style', 'start'], //Remove attributes from remaining tags
                limitChars: 520, // 0|# 0 disables option
                limitDisplay: 'both', // none|text|html|both
                limitStop: false // true/false
            }
        });
        $.extend($.summernote.plugins, {
            'cleaner': function (context) {
                var self = this,
                    ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    $editor = context.layoutInfo.editor,
                    options = context.options,
                    lang = options.langInfo;
                var cleanText = function (txt, nlO) {
                    var out = txt;
                    if (!options.cleaner.keepClasses) {
                        var sS = /(\n|\r| class=(")?Mso[a-zA-Z]+(")?)/g;
                        out = txt.replace(sS, ' ');
                    }
                    var nL = /(\n)+/g;
                    out = out.replace(nL, nlO);
                    if (options.cleaner.keepHtml) {
                        var cS = new RegExp('<!--(.*?)-->', 'gi');
                        out = out.replace(cS, '');
                        var tS = new RegExp('<(/)*(meta|link|\\?xml:|st1:|o:|font)(.*?)>', 'gi');
                        out = out.replace(tS, '');
                        var bT = options.cleaner.badTags;
                        for (var i = 0; i < bT.length; i++) {
                            tS = new RegExp('<' + bT[i] + '\\b.*>.*</' + bT[i] + '>', 'gi');
                            out = out.replace(tS, '');
                        }
                        var allowedTags = options.cleaner.keepOnlyTags;
                        if (typeof(allowedTags) == "undefined") allowedTags = [];
                        if (allowedTags.length > 0) {
                            allowedTags = (((allowedTags || '') + '').toLowerCase().match(/<[a-z][a-z0-9]*>/g) || []).join('');
                            var tags = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
                            out = out.replace(tags, function ($0, $1) {
                                return allowedTags.indexOf('<' + $1.toLowerCase() + '>') > -1 ? $0 : ''
                            });
                        }
                        var bA = options.cleaner.badAttributes;
                        for (var ii = 0; ii < bA.length; ii++) {
                            //var aS=new RegExp(' ('+bA[ii]+'="(.*?)")|('+bA[ii]+'=\'(.*?)\')', 'gi');
                            var aS = new RegExp(' ' + bA[ii] + '=[\'|"](.*?)[\'|"]', 'gi');
                            out = out.replace(aS, '');
                        }
                    }
                    return out;
                };
                if (options.cleaner.action == 'both' || options.cleaner.action == 'button') {
                    context.memo('button.cleaner', function () {
                        var button = ui.button({
                            contents: options.cleaner.icon,
                            tooltip: lang.cleaner.tooltip,
                            click: function () {
                                if ($note.summernote('createRange').toString())
                                    $note.summernote('pasteHTML', $note.summernote('createRange').toString());
                                else
                                    $note.summernote('code', cleanText($note.summernote('code')));
                                if ($('.note-status-output').length > 0) {
                                    $('.note-status-output').html('<div class="alert alert-success">' + lang.cleaner.not + '</div>');
                                    setTimeout(function () {
                                        $('.note-status-output').html("");
                                    }, 2000);
                                } else
                                    $editor.find('.note-editing-area').append('<div class="alert alert-success" style="' + options.cleaner.notStyle + '">' + lang.cleaner.not + '</div>');
                            }
                        });
                        return button.render();
                    });
                }
                this.events = {
                    'summernote.init': function () {
                        if ($('.note-status-output').length < 1) {
                            $('.note-statusbar').prepend('<output class="note-status-output"></output>');
                            $("head").append('<style>.note-statusbar .note-status-output{display:block;padding-top:7px;width:100%;font-size:14px;line-height:1.42857143;height:25px;color:#000}.note-statusbar .pull-right{float:right!important}.note-statusbar .note-status-output .text-muted{color:#777}.note-statusbar .note-status-output .text-primary{color:#286090}.note-statusbar .note-status-output .text-success{color:#3c763d}.note-statusbar .note-status-output .text-info{color:#31708f}.note-statusbar .note-status-output .text-warning{color:#8a6d3b}.note-statusbar .note-status-output .text-danger{color:#a94442}.note-statusbar .alert{margin:-7px 0 0 0;padding:2px 10px;border:1px solid transparent;border-radius:0}.note-statusbar .alert .note-icon{margin-right:5px}.note-statusbar .alert-success{color:#3c763d!important;background-color: #dff0d8 !important;border-color:#d6e9c6}.note-statusbar .alert-info{color:#31708f;background-color:#d9edf7;border-color:#bce8f1}.note-statusbar .alert-warning{color:#8a6d3b;background-color:#fcf8e3;border-color:#faebcc}.note-statusbar .alert-danger{color:#a94442;background-color:#f2dede;border-color:#ebccd1}</style>');
                        }
                        if (options.cleaner.limitChars != 0 || options.cleaner.limitDisplay != 'none') {
                            var textLength = $(".note-editable").text().replace(/(<([^>]+)>)/ig, "").replace(/( )/, " ");
                            var codeLength = $('.note-editable').html();
                            var lengthStatus = '';
                            if (textLength.length > options.cleaner.limitChars && options.cleaner.limitChars > 0)
                                lengthStatus += 'text-danger">';
                            else
                                lengthStatus += '">';
                            if (options.cleaner.limitDisplay == 'text' || options.cleaner.limitDisplay == 'both') lengthStatus += lang.cleaner.limitText + ': ' + textLength.length;
                            if (options.cleaner.limitDisplay == 'both') lengthStatus += ' / ';
                            if (options.cleaner.limitDisplay == 'html' || options.cleaner.limitDisplay == 'both') lengthStatus += lang.cleaner.limitHTML + ': ' + codeLength.length;
                            $('.note-status-output').html('<small class="pull-right ' + lengthStatus + '&nbsp;</small>');
                        }
                    },
                    'summernote.keydown': function (we, e) {
                        if (options.cleaner.limitChars != 0 || options.cleaner.limitDisplay != 'none') {
                            var textLength = $(".note-editable").text().replace(/(<([^>]+)>)/ig, "").replace(/( )/, " ");
                            var codeLength = $('.note-editable').html();
                            var lengthStatus = '';
                            if (options.cleaner.limitStop == true && textLength.length >= options.cleaner.limitChars) {
                                var key = e.keyCode;
                                allowed_keys = [8, 37, 38, 39, 40, 46]
                                if ($.inArray(key, allowed_keys) != -1) {
                                    $('.cleanerLimit').removeClass('text-danger');
                                    return true;
                                } else {
                                    $('.cleanerLimit').addClass('text-danger');
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                            } else {
                                if (textLength.length > options.cleaner.limitChars && options.cleaner.limitChars > 0)
                                    lengthStatus += 'text-danger">';
                                else
                                    lengthStatus += '">';
                                if (options.cleaner.limitDisplay == 'text' || options.cleaner.limitDisplay == 'both')
                                    lengthStatus += lang.cleaner.limitText + ': ' + textLength.length;
                                if (options.cleaner.limitDisplay == 'both')
                                    lengthStatus += ' / ';
                                if (options.cleaner.limitDisplay == 'html' || options.cleaner.limitDisplay == 'both')
                                    lengthStatus += lang.cleaner.limitHTML + ': ' + codeLength.length;
                                $('.note-status-output').html('<small class="cleanerLimit pull-right ' + lengthStatus + '&nbsp;</small>');
                            }
                        }
                    },
                    'summernote.paste': function (we, e) {
                        if (options.cleaner.action == 'both' || options.cleaner.action == 'paste') {
                            e.preventDefault();
                            var ua = window.navigator.userAgent;
                            var msie = ua.indexOf("MSIE ");
                            msie = msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
                            var ffox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
                            if (msie)
                                var text = window.clipboardData.getData("Text");
                            else
                                var text = e.originalEvent.clipboardData.getData(options.cleaner.keepHtml ? 'Text' : 'text/plain');
                            if (text) {
                                if (msie || ffox)
                                    setTimeout($note.summernote('pasteHTML', cleanText(text, options.cleaner.newline)), 1);
                                else
                                    $note.summernote('pasteHTML', cleanText(text, options.cleaner.newline));
                                if ($('.note-status-output').length > 0)
                                    $('.note-status-output').html('<div class="summernote-cleanerAlert alert alert-success">' + lang.cleaner.not + '</div>');
                                else
                                    $editor.find('.note-resizebar').append('<div class="summernote-cleanerAlert alert alert-success" style="' + options.cleaner.notStyle + '">' + lang.cleaner.not + '</div>');
                            }
                        }
                    }
                }
            }
        });

        /**
         * 添加图片形状
         * https://github.com/DiemenDesign/summernote-image-shapes
         */
        $.extend(true, $.summernote.lang, {
            'en-US': {
                imageShapes: {
                    tooltip: 'Image Shapes',
                    tooltipShapeOptions: ['Responsive', 'Rounded', 'Circle', 'Thumbnail', 'None']
                }
            },
            'zh-CN': {
                imageShapes: {
                    tooltip: '添加图片形状',
                    tooltipShapeOptions: ['Responsive', 'Rounded', 'Circle', 'Thumbnail', 'None']
                }
            }

        });
        $.extend($.summernote.options, {
            imageShapes: {
                icon: '<i class="note-icon-picture"/>',
                /* Must keep the same order as in lang.imageAttributes.tooltipShapeOptions */
                shapes: ['img-responsive', 'img-rounded', 'img-circle', 'img-thumbnail', '']
            }
        });
        $.extend($.summernote.plugins, {
            'imageShapes': function (context) {
                var ui = $.summernote.ui,
                    $editable = context.layoutInfo.editable,
                    options = context.options,
                    lang = options.langInfo;
                context.memo('button.imageShapes', function () {
                    var button = ui.buttonGroup([
                        ui.button({
                            className: 'dropdown-toggle',
                            contents: options.imageShapes.icon + '&nbsp;&nbsp;<span class="caret"></span>',
                            tooltip: lang.imageShapes.tooltipShape,
                            data: {
                                toggle: 'dropdown'
                            }
                        }),
                        ui.dropdown({
                            className: 'dropdown-shape',
                            items: lang.imageShapes.tooltipShapeOptions,
                            click: function (e) {
                                e.preventDefault();
                                var $button = $(e.target);
                                var $img = $($editable.data('target'));
                                var index = $.inArray(
                                    $button.data('value'),
                                    lang.imageShapes.tooltipShapeOptions
                                );
                                $.each(options.imageShapes.shapes, function (index, value) {
                                    $img.removeClass(value);
                                });
                                $img.addClass(options.imageShapes.shapes[index]);
                                context.invoke('editor.afterCommand');
                            }
                        })
                    ]);
                    return button.render();
                });
            }
        });


        /**
         * 纸张A4
         * https://github.com/DiemenDesign/summernote-paper-size
         */
        $.extend(true, $.summernote.lang, {
            'en-US': {
                paperSize: {
                    tooltip: 'Paper Size'
                }
            }
        });
        $.extend($.summernote.options, {
            paperSize: {
                icon: '<i class="note-icon"><svg role="img" focusable="false" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" width="14" height="14"><path d="M 7.5194922,8.03901 5.9609687,6.48048 3.8757344,8.56572 2.4693906,7.15937 l 0,4.37124 4.3712344,0 -1.4063437,-1.40637 2.0852109,-2.08523 z m -4.3154063,2.7569 0,-1.86283 0.6716719,0.67167 2.0852344,-2.08523 0.5194922,0.51949 -2.0852344,2.08523 0.6716484,0.67165 -1.8628125,0 z M 7.159375,2.46939 8.5657187,3.87576 6.4804844,5.96099 l 1.5585,1.5585 2.0852346,-2.08523 1.406367,1.40634 0,-4.37121 -4.371211,0 z M 10.795914,5.06692 10.124242,4.39525 8.0390078,6.48048 7.5195156,5.96099 9.60475,3.87576 8.9331016,3.20411 l 1.8628354,0 0,1.86281 z M 1,1 1,13 13,13 13,1 1,1 Z m 11.265305,11.2653 -10.5306097,0 0,-10.5306 10.5306097,0 0,10.5306 z"/></svg></i> ',
                css: '.note-editor.note-frame.note-document{display:block;overflow:none}' +
                '.note-editor.note-frame.note-document .note-editing-area{background-color:#fafafa;overflow:auto}' +
                '.note-editor.note-frame .note-editing-area .note-editable{overflow:auto;border-radius:0;box-shadow:0;width:100%}' +
                '.note-editor.note-frame.note-document .note-editing-area .note-editable{display:block;margin:40px auto 2px auto;overflow:hidden;overflow-y:auto;border:1px solid #d3d3d3;border-radius:5px;box-shadow:0 0 5px rgba(0,0,0,.1)}' +
                '.note-editor.note-frame.note-document .note-editing-area.a0:before,' +
                '.note-editor.note-frame.note-document .note-editing-area.a0:after,' +
                '.note-editor.note-frame.note-document .note-editing-area.a1:before,' +
                '.note-editor.note-frame.note-document .note-editing-area.a1:after,' +
                '.note-editor.note-frame.note-document .note-editing-area.a2:before,' +
                '.note-editor.note-frame.note-document .note-editing-area.a2:after,' +
                '.note-editor.note-frame.note-document .note-editing-area.a3:before,' +
                '.note-editor.note-frame.note-document .note-editing-area.a3:after,' +
                '.note-editor.note-frame.note-document .note-editing-area.a4:before,' +
                '.note-editor.note-frame.note-document .note-editing-area.a4:after,' +
                '.note-editor.note-frame.note-document .note-editing-area.a5:before,' +
                '.note-editor.note-frame.note-document .note-editing-area.a5:after{font-size:32px;font-weight:700;color:#ddd;position:absolute;top:0;left:10px}' +
                '.note-editor.note-frame.note-document .note-editing-area.a5:after{font-size:14px;top:18px;left:55px;' +
                '}' +
                '.note-editor.note-frame.note-document .note-editing-area.a1:before{content:"A1"}' +
                //'.note-editor.note-frame.note-document .note-editing-area.a1:after{content:"1684 x 2384"}' +
                '.note-editor.note-frame.note-document .note-editing-area.a2:before{content:"A2"}' +
                // '.note-editor.note-frame.note-document .note-editing-area.a2:after{content:"1191 x 1684"}' +
                '.note-editor.note-frame.note-document .note-editing-area.a3:before{content:"A3"}' +
                // '.note-editor.note-frame.note-document .note-editing-area.a3:after{content:"842 x 1191"}' +
                '.note-editor.note-frame.note-document .note-editing-area.a4:before{content:"A4"}' +
                // '.note-editor.note-frame.note-document .note-editing-area.a4:after{content:"595 x 842"}' +
                '.note-editor.note-frame.note-document .note-editing-area.a5:before{content:"A5"}',
                // + '.note-editor.note-frame.note-document .note-editing-area.a5:after{content:"420 x 595"}',
                menu: [
                    'Default',
                    'A0',
                    'A1',
                    'A2',
                    'A3',
                    'A4',
                    'A5'
                ]
            }
        });
        $.extend($.summernote.plugins, {
            'paperSize': function (context) {
                var ui = $.summernote.ui,
                    $note = context.layoutInfo.note,
                    options = context.options,
                    lang = options.langInfo;
                $("head").append('<style>' + options.paperSize.css + '</style>');
                context.memo('button.paperSize', function () {
                    var button = ui.buttonGroup([
                        ui.button({
                            className: 'dropdown-toggle',
                            contents: options.paperSize.icon,
                            tooltip: lang.paperSize.tooltip,
                            data: {
                                toggle: 'dropdown'
                            }
                        }),
                        ui.dropdown({
                            className: 'dropdown-template',
                            items: options.paperSize.menu,
                            click: function (e) {
                                var $button = $(e.target);
                                var value = $button.data('value');
                                e.preventDefault();
                                $('.note-frame').removeClass('note-document');
                                $('.note-editing-area').removeClass('a0').removeClass('a1').removeClass('a2').removeClass('a3').removeClass('a4').removeClass('a5');
                                switch (value) {
                                    case 'A0':
                                        $('.note-frame').addClass('note-document');
                                        $('.note-editing-area').addClass('a0');
                                        $('.note-editable').css({'width': '2384px'}); // height:3370
                                        break;
                                    case 'A1':
                                        $('.note-frame').addClass('note-document');
                                        $('.note-editing-area').addClass('a1');
                                        $('.note-editable').css({'width': '1684px'}); // height:2384
                                        break;
                                    case 'A2':
                                        $('.note-frame').addClass('note-document');
                                        $('.note-editing-area').addClass('a2');
                                        $('.note-editable').css({'width': '1191px'}); // height:1684
                                        break;
                                    case 'A3':
                                        $('.note-frame').addClass('note-document');
                                        $('.note-editing-area').addClass('a3');
                                        $('.note-editable').css({'width': '842px'}); // height:1191
                                        break;
                                    case 'A4':
                                        $('.note-frame').addClass('note-document');
                                        $('.note-editing-area').addClass('a4');
                                        $('.note-editable').css({'width': '595px'}); // height:842
                                        break;
                                    case 'A5':
                                        $('.note-frame').addClass('note-document');
                                        $('.note-editing-area').addClass('a5');
                                        $('.note-editable').css({'width': '420px'}); // height:595
                                        break;
                                    default:
                                        $('.note-frame').removeClass('note-document');
                                        $('.note-editing-area').removeClass('a0').removeClass('a1').removeClass('a2').removeClass('a3').removeClass('a4').removeClass('a5');
                                        $('.note-editable').css({'width': '100%'});
                                }
                            }
                        })
                    ]);
                    return button.render();
                });
            }
        });


        /**
         * 查找替换
         * https://github.com/DiemenDesign/summernote-text-findnreplace
         */
        $.extend(true, $.summernote.lang, {
            'en-US': {
                /* English */
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
                icon: '<i class="note-icon" data-toggle="findnreplace"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" id="libre-findnreplace" width="14" height="14"><path d="m 5.8,2.3764705 c 0.941176,0 1.811765,0.376471 2.423529,1.011765 l -1.741176,1.741176 4.117647,0 0,-4.117647 -1.411765,1.411765 C 8.317647,1.5529415 7.117647,1.0117645 5.8,1.0117645 c -2.423529,0 -4.423529,1.788236 -4.752941,4.117647 l 1.388235,0 C 2.741176,3.5529415 4.129412,2.3764705 5.8,2.3764705 Z m 3.8588235,6.282353 c 0.4470585,-0.611764 0.7764705,-1.341176 0.8705885,-2.164706 l -1.388236,0 c -0.305882,1.552942 -1.694117,2.752942 -3.364705,2.752942 -0.941177,0 -1.811765,-0.376471 -2.42353,-1.011765 L 5.094118,6.4941175 1,6.4941175 1,10.611765 2.411765,9.2000005 C 3.282353,10.070589 4.482353,10.611765 5.8,10.611765 c 1.058824,0 2.047059,-0.352942 2.847059,-0.9411765 L 11.988235,12.988236 13,11.97647 9.6588235,8.6588235 Z"/></svg></i>'
            }
        });
        $.extend($.summernote.plugins, {
            'findnreplace': function (context) {
                var ui = $.summernote.ui;
                var $note = context.layoutInfo.note;
                var $editor = context.layoutInfo.editor;
                var $toolbar = context.layoutInfo.toolbar;
                var options = context.options;
                var lang = options.langInfo;
                context.memo('button.findnreplace', function () {
                    var button = ui.button({
                        contents: options.findnreplace.icon,
                        tooltip: lang.findnreplace.tooltip,
                        click: function (e) {
                            e.preventDefault();
                            $editor.find('.note-findnreplace').contents().unwrap('u');
                            $('#findnreplaceToolbar').toggleClass('hidden');
                            $('#findnreplace-info').text('');
                            if ($note.summernote('createRange').toString()) {
                                var selected = $note.summernote('createRange').toString();
                                $('#note-findnreplace-find').val(selected);
                            }
                        }
                    });
                    return button.render();
                });
                this.initialize = function () {
                    var fnrBody =
                        '<div id="findnreplaceToolbar" class="note-toolbar-wrapper panel-heading hidden">' +
                        '<small id="findnreplace-info" class="help-block small">&nbsp;</small>' +
                        '<div class="form-group">' +
                        '<div class="input-group col-xs-12">' +
                        '<input id="note-findnreplace-find" type="text" class="note-findnreplace-find form-control input-sm" value="" placeholder="' + lang.findnreplace.findPlaceholder + '">' +
                        '<div class="input-group-btn">' +
                        '<button class="note-findnreplace-find-btn btn btn-sm btn-default" style="width: 100px;">' + lang.findnreplace.findBtn + '</button>' +
                        '</div>' +
                        '</div>' +
                        '<div class="input-group col-xs-12">' +
                        '<input id="note-findnreplace-replace" type="text" class="note-findnreplace-replace form-control input-sm" value="" placeholder="' + lang.findnreplace.replacePlaceholder + '">' +
                        '<div class="input-group-btn">' +
                        '<button class="note-findnreplace-replace-btn btn btn-sm btn-default" style="width: 100px;">' + lang.findnreplace.replaceBtn + '</button>' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '</div>';
                    $('.note-toolbar').append(fnrBody);
                    this.show();
                };
                this.findnreplace = function () {
                    var $fnrFindBtn = $toolbar.find('.note-findnreplace-find-btn');
                    var $fnrReplaceBtn = $toolbar.find('.note-findnreplace-replace-btn');
                    $fnrFindBtn.click(function (e) {
                        e.preventDefault();
                        $editor.find('.note-findnreplace').contents().unwrap('u');
                        var fnrCode = context.invoke('code');
                        var fnrFind = $('.note-findnreplace-find').val();
                        var fnrReplace = $('.note-findnreplace-replace').val();
                        var fnrCount = (fnrCode.match(new RegExp(fnrFind, "gi")) || []).length
                        if (fnrFind) {
                            $('#findnreplace-info').text(fnrCount + lang.findnreplace.findResult + "`" + fnrFind + "`");
                            var fnrReplaced = fnrCode.replace(new RegExp("(" + fnrFind + ")", "gi"), '<u class="note-findnreplace" style="' + options.findnreplace.highlight + '">$1</u>');
                            $note.summernote('code', fnrReplaced);
                        } else
                            $('#findnreplace-info').html('<span class="text-danger">' + lang.findnreplace.findError + '</span>');
                    });
                    $fnrReplaceBtn.click(function (e) {
                        e.preventDefault();
                        $editor.find('.note-findnreplace').contents().unwrap('u');
                        var fnrCode = context.invoke('code');
                        var fnrFind = $('.note-findnreplace-find').val();
                        var fnrReplace = $('.note-findnreplace-replace').val();
                        var fnrCount = (fnrCode.match(new RegExp(fnrFind, "gi")) || []).length
                        if (fnrFind) {
                            $('#findnreplace-info').text(fnrCount + lang.findnreplace.findResult + "`" + fnrFind + "`" + lang.findnreplace.replaceResult + "`" + fnrReplace + "`");
                            var fnrReplaced = fnrCode.replace(new RegExp(fnrFind, "gi"), fnrReplace);
                            $note.summernote('code', fnrReplaced);
                        } else {
                            if (fnrReplace) {
                                if ($note.summernote('createRange').toString()) {
                                    $note.summernote('insertText', fnrReplace);
                                    $('#findnreplace-info').text('');
                                } else
                                    $('#findnreplace-info').html('<span class="text-danger">' + lang.findnreplace.noneSelected + '</span>');
                            } else
                                $('#findnreplace-info').html('<span class="text-danger">' + lang.findnreplace.replaceError + '</span>');
                        }
                    });
                };
                this.show = function () {
                    this.findnreplace();
                };
            }
        });


        /**
         * 草稿保存到本地缓存
         * https://github.com/MissAllSunday/summernoteDrafts
         */
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
                var $editor, lang, options, ui;
                ui = $.summernote.ui;
                options = context.options;
                lang = options.langInfo.sDrafts;
                $editor = context.layoutInfo.editor;
                context.memo('button.sDraftsSave', function () {
                    var button;
                    button = ui.button({
                        contents: options.sDrafts.saveIcon ? options.sDrafts.saveIcon : lang.save,
                        tooltip: lang.saveTips,
                        click: function (e) {
                            e.preventDefault();
                            context.invoke('sDraftsSave.show');
                            return false;
                        }
                    });
                    return button.render();
                });
                this.initialize = (function (_this) {
                    return function () {
                        var $container, body, footer;
                        $container = options.dialogsInBody ? $(document.body) : $editor;
                        body = "<div class='form-group'><label>" + lang.provideName + "</label><input class='note-draftName form-control' type='text' /></div>";
                        footer = "<button href='#' class='btn btn-primary note-link-btn'>" + lang.save + "</button>";
                        _this.$dialog = ui.dialog({
                            className: 'link-dialog',
                            title: lang.save,
                            fade: options.dialogsFade,
                            body: body,
                            footer: footer
                        }).render().appendTo($container);
                    };
                })(this);
                this.destroy = (function (_this) {
                    return function () {
                        ui.hideDialog(_this.$dialog);
                        _this.$dialog.remove();
                    };
                })(this);
                this.show = (function (_this) {
                    return function () {
                        var $saveBtn;
                        ui.showDialog(_this.$dialog);
                        return $saveBtn = _this.$dialog.find('.note-link-btn').click(function (e) {
                            var draftName;
                            e.preventDefault;
                            draftName = _this.$dialog.find('.note-draftName').val();
                            _this.saveDraft(draftName);
                            return false;
                        });
                    };
                })(this);
                this.saveDraft = (function (_this) {
                    return function (name) {
                        var body, isoDate, keyName;
                        isoDate = new Date().toISOString();
                        if (name == null) {
                            name = isoDate;
                        }
                        keyName = options.sDrafts.storePrefix + '-' + name;
                        body = context.code();
                        store.set(keyName, {
                            name: name,
                            sDate: isoDate,
                            body: body
                        });
                        alert(lang.saved);
                        ui.hideDialog(_this.$dialog);
                        //_this.destroy();
                    };
                })(this);
            }
        });
        $.extend($.summernote.plugins, {
            'sDraftsLoad': function (context) {
                var $editor, draft, drafts, fn, htmlList, key, lang, options, ui;
                ui = $.summernote.ui;
                options = context.options;
                lang = options.langInfo.sDrafts;
                $editor = context.layoutInfo.editor;
                drafts = [];
                context.memo('button.sDraftsLoad', function () {
                    var button;
                    button = ui.button({
                        contents: options.sDrafts.loadIcon ? options.sDrafts.loadIcon : lang.load,
                        tooltip: lang.loadTips,
                        click: function (e) {
                            e.preventDefault();
                            context.invoke('sDraftsLoad.show');
                            return false;
                        }
                    });
                    return button.render();
                });
                this.initialize = (function (_this) {
                    loadList(_this);
                })(this);

                function loadList(_this) {
                    store.each(function (key, value) {
                        if (typeof key === 'string' && key.indexOf(options.sDrafts.storePrefix) >= 0) {
                            return drafts[key] = value;
                        }
                    });
                    htmlList = '';
                    fn = function () {
                        var fDate;
                        fDate = options.sDrafts.dateFormat && typeof options.sDrafts.dateFormat === 'function' ? options.sDrafts.dateFormat(draft.sDate) : draft.sDate;
                        return htmlList += "<li class='list-group-item'><a href='#' class='note-draft' data-draft='" + key + "'>" + draft.name + " - <small>" + fDate + "</small></a><a href='#' class='label label-danger pull-right delete-draft' data-draft='" + key + "'>" + lang.deleteDraft + "</a></li>";
                    };
                    for (key in drafts) {
                        draft = drafts[key];
                        fn();
                    }

                    var $container, body, footer;
                    $container = options.dialogsInBody ? $(document.body) : $editor;
                    body = htmlList.length ? "<h4>" + lang.select + "</h4><ul class='list-group'>" + htmlList + "</ul>" : "<h4>" + lang.nosavedDrafts + "</h4>";
                    footer = htmlList.length ? "<button href='#' class='btn btn-primary deleteAll'>" + lang.deleteAll + "</button>" : "";
                    _this.$dialog = ui.dialog({
                        className: 'link-dialog',
                        title: lang.load,
                        fade: options.dialogsFade,
                        body: body,
                        footer: footer
                    }).render().appendTo($container);
                }

                this.destroy = (function (_this) {
                    return function () {
                        ui.hideDialog(_this.$dialog);
                        _this.$dialog.remove();
                    };
                })(this);
                this.show = (function (_this) {
                    return function () {
                        var $deleteAllDrafts, $deleteDraft, $selectedDraft, self;

                        self = _this;

                        loadList(self);

                        ui.showDialog(_this.$dialog);

                        $selectedDraft = _this.$dialog.find('.note-draft').click(function (e) {
                            var data, div;
                            e.preventDefault;
                            div = document.createElement('div');
                            key = $(this).data('draft');
                            data = drafts[key];
                            if (data) {
                                div.innerHTML = data.body;
                                context.invoke('editor.insertNode', div);
                                alert(lang.loaded);
                            } else {
                                alert(lang.noDraft);
                            }
                            ui.hideDialog(_this.$dialog);
                            //self.destroy();
                            return false;
                        });
                        $deleteDraft = _this.$dialog.find('a.delete-draft').click(function (e) {
                            var data;
                            if (confirm(lang.youSure)) {
                                key = $(this).data('draft');
                                data = drafts[key];
                                if (data) {
                                    store.remove(key);
                                    delete drafts[key];
                                    self = $(this);
                                    return self.parent().hide('slow', function () {
                                        $(this).remove();
                                    });
                                } else {
                                    return alert(lang.noDraft);
                                }
                            }
                        });
                        $deleteAllDrafts = _this.$dialog.find('button.deleteAll').click(function (e) {
                            var fn1, selfButton, uiDialog;
                            selfButton = $(this);
                            if (confirm(lang.youSure)) {
                                fn1 = function () {
                                    return store.remove(key);
                                };
                                for (key in drafts) {
                                    draft = drafts[key];
                                    fn1();
                                }
                                return uiDialog = self.$dialog.find('ul.list-group').hide('slow', function () {
                                    $(this).replaceWith("<h4>" + lang.nosavedDrafts + "</h4>");
                                    selfButton.hide('slow');
                                });
                            }
                        });
                    };
                })(this);
            }
        });

        /**
         * 第三方云插件
         * https://github.com/uploadcare/uploadcare-summernote
         */
        function ensureWidget(version) {
            if (typeof uploadcare == 'undefined') $.getScript([
                'https://ucarecdn.com/widget/', version, '/uploadcare/uploadcare.min.js'
            ].join(''))
        }

        function createButton(context, opts) {
            return function () {
                var icon = opts.buttonIcon ? '<i class="fa fa-' + opts.buttonIcon + '" /> ' : '';

                return $.summernote.ui.button({
                    contents: icon + opts.buttonLabel,
                    //contents: '<i class="glyphicon glyphicon-cloud" />',
                    tooltip: opts.tooltipText,
                    click: function () {
                        var dialog = uploadcare.openDialog({}, opts);

                        context.invoke('editor.saveRange');
                        dialog.done(done(context, opts));
                    }
                }).render();
            };
        }

        function init(context) {
            var opts = $.extend({
                crop: '',
                version: '2.9.0',
                buttonLabel: 'Uploadcare',
                tooltipText: 'Upload files via Uploadcare'
            }, context.options.uploadcare);

            ensureWidget(opts.version);

            context.memo('button.uploadcare', createButton(context, opts));
        }

        function standardCallback(context, blob) {
            context.invoke('editor.insertNode', $(
                (blob.isImage
                        ? [
                            '<img src="',
                            blob.cdnUrl + (blob.cdnUrlModifiers ? '' : '-/preview/'),
                            '" alt="', blob.name, '" />'
                        ]
                        : ['<a href="', blob.cdnUrl, '">', blob.name, '</a>']
                ).join('')
            ).get(0));
        }

        function done(context, opts) {
            return function (data) {
                var isMultiple = opts.multiple;
                var uploads = isMultiple ? data.files() : [data];

                $.when.apply(null, uploads).done(function () {
                    var blobs = [].slice.apply(arguments);
                    var cb = opts.uploadCompleteCallback;

                    context.invoke('editor.restoreRange');

                    $.each(blobs, function (i, blob) {
                        if ($.isFunction(cb)) {
                            cb.call(context, blob);
                        } else {
                            standardCallback(context, blob);
                        }
                    });
                });
            }
        }

        $.extend($.summernote.plugins, {uploadcare: init});
    });


    /**
     * my code
     */
    domReady(function () {

        toastr.options = {
            "closeButton": true,
            "debug": false,
            "progressBar": false,
            "positionClass": "toast-bottom-left",
            "showDuration": "400",
            "hideDuration": "1000",
            "timeOut": "4500",
            "extendedTimeOut": "1000",
            "showEasing": "swing",
            "hideEasing": "linear",
            "showMethod": "fadeIn",
            "hideMethod": "fadeOut"
        };

        /**  定义的插入代码按钮 start   */
        var insertcode = function (context) {
            var ui = $.summernote.ui;
            // create button
            var button = ui.button({
                contents: '<i class="glyphicon glyphicon-list-alt"/> 插入代码',
                tooltip: '插入代码',
                click: function () {
                    context.invoke('saveRange');
                    $('#code_editModal').modal();
                    //context.invoke('editor.insertText', );
                }
            });
            return button.render();   // return button as jquery object
        };

        //完成code插入点击事件
        $("#btn_insertcode").click(function () {
            var code_edit_area = $("#code_edit_area");
            //创建节点
            var pre = document.createElement('pre');
            pre.className = "user-defined-code";
            pre.setAttribute("style", "word-wrap:normal");
            var code = document.createElement('code');
            code.setAttribute("style", "white-space:pre;overflow-x:auto;word-wrap:normal");
            //得到编辑区的值 并转义
            code.innerHTML = common_utils.encodeHTML(code_edit_area.val());
            pre.appendChild(code);

            //
            var fragment = document.createDocumentFragment();
            fragment.appendChild(document.createElement("br"));
            fragment.appendChild(pre);
            fragment.appendChild(document.createElement("br"));

            //插入节点
            $('#article_edit').summernote('restoreRange');
            $('#article_edit').summernote('insertNode', fragment);

            //关闭
            $('#code_editModal').modal('hide');
            //toastr.info("代码在编辑区可能会变形，这不是最终的显示效果", "提示");
            code_edit_area.val('');
        });
        /**  定义的插入代码按钮 stop   */


            //定义的重置图片大小按钮
        var resetImgSize = function (context) {
                var ui = $.summernote.ui;
                var layoutInfo = context.layoutInfo;
                var $editable = layoutInfo.editable;
                return ui.button({
                    contents: '<span class="note-fontsize-10">重置</span>',
                    tooltip: "重置图片原始大小",
                    click: function () {
                        var $image = $($editable.data('target'));
                        if ($image.attr('internetImage') == "false") {
                            $image.attr("width", "");
                            $image.attr("height", "");
                            if ($image.width() < 1800) {
                                $image.css({
                                    width: $image.attr('data-rawwidth'),
                                    height: ''
                                });
                            } else {
                                $image.css({
                                    width: 1800,
                                    height: ''
                                });
                                toastr.info("图片过大，所以宽度调整为1800px");
                            }
                        }
                    }
                }).render();
            };

        //互联网图片本地化
        var localimage = function (context) {
            var layoutInfo = context.layoutInfo;
            var $editor = layoutInfo.editor;
            var $editable = layoutInfo.editable;
            var ui = $.summernote.ui;
            var button = ui.button({
                contents: '<span class="note-fontsize-10">升级</span>',
                tooltip: '将互联网图片上传到本站服务器',
                click: function () {
                    var $image = $($editable.data('target'));
                    if ($image.attr('internetImage') != 'false') {
                        localImage($image);
                    } else {
                        toastr.info("已经是本站服务器图片了，无须本地化！");
                        /*
                         var index = $image.attr('src').indexOf('upload');
                         $image.attr('src', $image.attr('src').substring(index) );
                         */
                    }

                }
            });
            this.$button = button.render();
            return this.$button;
        };

        //设置图片为封面
        var coverimage = function (context) {
            var layoutInfo = context.layoutInfo;
            var $editable = layoutInfo.editable;
            var ui = $.summernote.ui;
            var button = ui.button({
                contents: '<span class="note-fontsize-10">封面</span>',
                tooltip: '设为文章封面',
                click: function () {
                    var image = $editable.data('target');
                    image.setAttribute('cover', 'true');
                    //cover = image;
                    $('#article_summary').summernote('code', image.outerHTML);
                }
            });
            this.$button = button.render();
            return this.$button;
        };

        // 从Cloud相册中插入图片
        var insertAlbumPhotos = function (context) {
            var layoutInfo = context.layoutInfo;
            var $editable = layoutInfo.editable;
            var ui = $.summernote.ui;
            var button = ui.button({
                contents: '<i class="fa fa-cloud" />插入相册',
                tooltip: '从您的Cloud相册中插入图片',
                click: function () {
                    context.invoke('saveRange');
                    var uid = $('body').attr('uid');
                    if (uid == undefined || uid == "") {
                        uid = 0;
                    }
                    $.get("photo.do?method=albumListByAjax", {"user.uid": uid}, function (data) {
                        if (data.flag == 200) {
                            var options_str = '';
                            if (data.albums == null || data.albums.length == 0) {
                                options_str = '<option value="0">无相册</option>';
                            } else {
                                $.each(data.albums, function (index, album) {
                                    options_str += '<option value="' + album.album_id + '">' + album.name + '</option>';
                                });
                            }
                            $('#insertAlbumPhotos_albumSelect').html(options_str);
                            $('#insertAlbumPhotos_modal').modal();
                        } else {
                            toastr.error("读取相册列表失败");
                            toastr.error(data.info);
                        }
                    });
                }
            });
            this.$button = button.render();
            return this.$button;
        };

        $('#insertAlbumPhotos_confirmBtn').click(function () {
            var album_id = $('#insertAlbumPhotos_albumSelect').val();
            if (album_id == 0) {
                toastr.info("无相册，无法插入");
            } else {
                insertPhotosFromCloud(album_id);
            }
        });

        // 新建一行
        var nextLine = function (context) {
            var layoutInfo = context.layoutInfo;
            var $editable = layoutInfo.editable;
            var ui = $.summernote.ui;
            var button = ui.button({
                contents: '新建一行',
                tooltip: '从底部插入一行',
                click: function () {
                    var detail = $("#article_edit").summernote('code');
                    $("#article_edit").summernote('code', detail + "<br>Next Line");
                    //$('#article_edit').summernote('insertText', 'hello world');
                    toastr.success("Next Line Ready");
                }
            });
            this.$button = button.render();
            return this.$button;
        }


        //自定义的编辑器
        $("#article_edit").summernote({
            lang: "zh-CN",
            height: 450,
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
            uploadcare: {
                // button name (default is Uploadcare)
                buttonLabel: '',//'Image / file',
                // font-awesome icon name (you need to include font awesome on the page)
                buttonIcon: 'cloud',//'picture-o',
                // text which will be shown in button tooltip
                tooltipText: 'Upload files or video or something',

                // uploadcare widget options, see https://uploadcare.com/documentation/widget/#configuration
                publicKey: '2b1b893903c8005f279e', // set your API key
                crop: 'free',
                tabs: 'all',
                multiple: true
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
                ['insert', ['hr', 'link', 'picture', 'video', 'uploadcare']],
                ['table', ['table']],
                ['Misc', ['fullscreen', 'codeview', 'undo', 'redo', 'help']],
                ['ud_group_1', ['insertcode', 'insertAlbumPhotos']],
                ['ud_group_2', ['nextLine', 'cleaner']],
                ['ud_group_3', ['sDraftsLoad', 'sDraftsSave']],
            ],
            buttons: {
                'insertcode': insertcode,
                'resetImgSize': resetImgSize,
                'localimage': localimage,
                'coverimage': coverimage,
                'insertAlbumPhotos': insertAlbumPhotos,
                'nextLine': nextLine
            },
            popover: {
                image: [
                    ['custom', ['imageTitle', 'imageAttributes', 'imageShapes']],
                    ['imagesize', ['resetImgSize', 'imageSize100', 'imageSize50', 'imageSize25']],
                    ['float', ['floatLeft', 'floatRight', 'floatNone']],
                    ['remove', ['localimage', 'coverimage', 'removeMedia']]
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
            fontNames: ['Open Sans', 'Microsoft YaHei', 'Arial', 'Arial Black', 'Comic Sans MS', 'Courier New', 'Merriweather'],
            fontNamesIgnoreCheck: ['Open Sans', 'Microsoft YaHei', 'Arial'],
            fontSizes: ['8', '9', '10', '11', '12', '14', '16', '18', '20', '22', '24', '26', '28', '36'],
            dialogsInBody: false,
            dialogsFade: true,
            callbacks: {
                onImageUpload: function (filesJson) {
                    var files = [];
                    $.each(filesJson, function (index, file) {
                        files.push(file);
                    });
                    // 可以同时上传多个图片
                    files.sort(SortLikeWin);
                    sendFile(files);
                },
                onMediaDelete: function ($target, $editable) {
                    // 删除图片
                    var image = $editable.data('target');
                    deleteFile(image);
                },
                onDialogShown: function () {
                    /*
                     toastr.info("点击选择图片时可能会卡住，要等一下，不要重复点！" +
                     "当连续弹出来或其他bug刷新一下页面.","提示",{"timeOut" : 10000});
                     */
                }
            }
        });

        $('#article_edit').on('summernote.change', function (we, contents, $editable) {
            //console.log('summernote\'s content is changed.');
        });

        $("#article_summary").summernote({
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

    });


    //上传图片
    function sendFile(files, index) {
        index = index || 0;

        if (files.length === 0) {
            toastr.error("图片数量为0！", "", {progressBar: false});
            return;
        }
        var file = files[index];
        //检查大小
        if (file.size > (4 * 1024 * 1000)) {
            toastr.error(file['name'] + " 换个小的，最大4M", "别丢个这么大的图片给我a", {timeOut: 0, progressBar: false});
            return;
        }

        var filename = false;
        try {
            filename = file['name'];
        } catch (e) {
            filename = false;
        }
        //以上防止在图片在编辑器内拖拽引发第二次上传导致的提示错误
        var ext = filename.substr(filename.lastIndexOf("."));
        //ext = ext.toUpperCase();
        var timestamp = new Date().getTime();
        var name = timestamp + "_" + $('body').attr('uid') + "_" + "article" + ext;

        var data = new FormData();
        data.append("file", file);
        data.append("fileName", name);
        data.append("isImage", "true");
        //name是文件名，自己随意定义
        file['name'] = name;

        var notify_uploading = toastr.info("正在上传图片" + ( (index === 0 && files.length === 1) ? "" : "第" + (index + 1) + "张" ), "提示", {
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        });
        $.ajax({
            data: data,
            type: "POST",
            url: "article.do?method=uploadAttachment", //图片上传出来的url，返回的是图片上传后的路径，http格式
            contentType: false,
            dataType: "json",
            cache: false,
            processData: false,
            success: function (data) {
                //data是返回的hash,key之类的值，key是定义的文件名
                //把图片放到编辑框中。editor.insertImage 是参数
                toastr.remove(notify_uploading, true);
                if (data.flag == 200) {
                    index++;
                    if (index > files.length - 1) {
                        toastr.success("上传服务器成功,正在加载", "提示", {"progressBar": true});
                    }
                    var imgLoadUrl = $("#staticPath").attr("href") + (data.image_url).toString();

                    //插入节点
                    $('#article_edit').summernote('editor.insertImage', imgLoadUrl, function ($image) {
                        $image.css('width', "100%");
                        $image.attr('data-filename', name);
                        $image.attr('data-relativepath', (data.image_url).toString());
                        //设置后台计算的图片实际尺寸
                        //用于用户可能还原要图片上传前的尺寸
                        $image.attr('data-rawwidth', "" + data.width);
                        $image.attr('data-rawheight', "" + data.height);
                        //添加不是网络引用图片标记
                        $image.attr('internetImage', "false");

                        //继续上传下一张
                        //写这个回调方法里面会在图片加载完再执行
                        //当然也可以 判断 img.complete 或 img.onload = function(){};
                        //删除第0个元素 files.shift();
                        if (index < files.length) {
                            sendFile(files, index);
                        }
                    });
                } else {
                    toastr.error(data.info, "上传失败", {timeOut: 0});
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function () {
                toastr.remove(notify_uploading, true);
                toastr.error("上传失败,我不背锅", "未知错误", {timeOut: 0});
            }
        });
    }

    //互联网图片本地化
    function localImage($image) {
        var originalImageUrl = $image.attr('src');

        var internet_url = $image.attr('src');
        if (internet_url.substr(0, 1) == "/") {
            internet_url = window.location.protocol + "//" + window.location.host + internet_url;
        }
        //internet_url = encodeURIComponent(internet_url);

        var ext = internet_url.substr(internet_url.lastIndexOf("."));
        //ext = ext.toUpperCase();
        var timestamp = new Date().getTime();
        var name = timestamp + "_" + $('body').attr('uid') + "_" + "article" + ext;

        var notify_downloading = toastr.info("服务器正在下载图片", "提示", {
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        });
        $.ajax({
            data: {"fileName": name, "url": internet_url},
            type: "POST",
            url: "article.do?method=localImage",
            dataType: "json",
            success: function (data) {
                toastr.remove(notify_downloading, true);
                if (data.flag == 200) {
                    toastr.success("服务器下载成功,正在加载", "提示", {"progressBar": true});
                    //修改节点
                    var imgLoadUrl = $("#staticPath").attr("href") + (data.image_url).toString();
                    $image.attr('src', imgLoadUrl);
                    $image.attr('data-relativepath', (data.image_url).toString());
                    $image.attr('data-filename', name);
                    $image.attr('data-rawwidth', "" + data.width);
                    $image.attr('data-rawheight', "" + data.height);
                    //添加不是网络引用图片标记
                    $image.attr('internetImage', "false");

                    restoreImage($image, originalImageUrl);
                } else {
                    toastr.error(data.info, "下载失败");
                    console.warn("Error Code: " + data.flag);
                }
            },
            error: function () {
                toastr.remove(notify_downloading, true);
                toastr.error("服务器错误");
            }
        });
    }

    function restoreImage($image, originalImageUrl) {
        setTimeout(function () {
            if (!window.confirm("点确认完成修改，点取消还原为网络图片")) {
                deleteFile($image);
                $image.attr('internetImage', "true");
                $image.attr('src', originalImageUrl);
            }
        }, 2000);
    }

    //删除文件
    function deleteFile(image) {
        var coverSrc = $($('#article_summary').summernote('code')).find('img').attr('src');
        //此图片为封面图片则一起把摘要清空
        //$image.getAttribute('cover') === "true"
        if (coverSrc == $(image).attr("src")) {
            $('#article_summary').summernote('code', "");
        }

        //网络引用图片则不提交
        if ($(image).attr('internetImage') == 'false') {

            //如果是引用的相册图片 直接返回
            if ($(image).attr("cloudImage") == "true") {
                toastr.success("相册引用图片删除成功！");
                toastr.success("如需完全删除，请至相册！");
                return;
            }

            //得到图片url
            var image_url = $(image).attr('src');
            //image_url = encodeURIComponent(image_url);
            $.ajax({
                url: "article.do?method=deleteAttachment",
                data: {"file_url": image_url, "isImage": true},
                type: "POST",
                dataType: 'json',
                success: function (data) {
                    if (data.flag == 200) {
                        toastr.success("图片服务器删除成功！");
                    } else if (data.flag == 404) {
                        toastr.success("网络引用图片删除成功！");
                    } else {
                        toastr.error(data.info, "删除失败！");
                        console.warn("Error Code: " + data.flag);
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
     * 从用户Cloud相册中插入图片
     * @param album_id
     */
    function insertPhotosFromCloud(album_id) {
        $.get("photo.do?method=albumByAjax", {"id": album_id}, function (data) {
            if (data.flag == 200) {
                var editor = $('#article_edit');
                var photos = data.album.photos;
                var cloudHost = $('#cloudPath').attr('href');
                var imgs_str = '';
                $(photos).each(function (index, photo) {
                    imgs_str += '<img src="' + cloudHost + photo.path + '" ';
                    imgs_str += 'data-filename="' + photo.path.substring(photo.path.lastIndexOf('/') + 1) + '" ';
                    imgs_str += 'data-relativepath="' + photo.path + '" ';
                    imgs_str += 'data-rawwidth="' + photo.width + '" ';
                    imgs_str += 'data-rawheight="' + photo.height + '" ';
                    imgs_str += 'photo-id="' + photo.photo_id + '" ';
                    imgs_str += 'album-id="' + photo.album_id + '" ';
                    imgs_str += 'title="' + photo.name + '/' + photo.description + '" ';
                    imgs_str += 'internetImage="false" ';
                    imgs_str += 'cloudImage="true" ';
                    imgs_str += 'style="width: 100%" />';
                });
                var div = document.createElement("div");
                div.className = "album_photos";
                div.innerHTML = imgs_str;
                editor.summernote('restoreRange');
                editor.summernote('insertNode', div);
                $('#insertAlbumPhotos_modal').modal("hide");
                toastr.success("共插入" + photos.length + "张图片", "插入成功")
            } else {
                toastr.error(data.info, "加载错误");
                console.warn("Error Code: " + data.flag);
            }
        });
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

});

