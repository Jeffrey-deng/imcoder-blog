/**
 * @author Jeffrey.Deng
 * @date 2017-01-02
 */
//第三方插件
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'summernote', 'store2'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, store);
    }
})(function ($, bootstrap, domReady, toastr, summernote, store) {

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
                this.showLinkDialog(imgInfo).done(function (imgInfo) {
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
                    imgLink: $($img).parent().is('a') ? $($img).parent() : null
                };
                this.showImageAttributesDialog(imgInfo).done(function (imgInfo) {
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
                    if ($img.parent().is('a')) $img.unwrap();
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
                                    readFileAsDataURL(this.files[0]).done(function (dataURL) {
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
                    var sS = /(\n|\r| class=(')?Mso[a-zA-Z]+(')?)/g;
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
                    if (typeof(allowedTags) == 'undefined') allowedTags = [];
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
                                    $('.note-status-output').html('');
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
                        $('head').append('<style>.note-statusbar .note-status-output{display:block;padding-top:7px;width:100%;font-size:14px;line-height:1.42857143;height:25px;color:#000}.note-statusbar .pull-right{float:right!important}.note-statusbar .note-status-output .text-muted{color:#777}.note-statusbar .note-status-output .text-primary{color:#286090}.note-statusbar .note-status-output .text-success{color:#3c763d}.note-statusbar .note-status-output .text-info{color:#31708f}.note-statusbar .note-status-output .text-warning{color:#8a6d3b}.note-statusbar .note-status-output .text-danger{color:#a94442}.note-statusbar .alert{margin:-7px 0 0 0;padding:2px 10px;border:1px solid transparent;border-radius:0}.note-statusbar .alert .note-icon{margin-right:5px}.note-statusbar .alert-success{color:#3c763d!important;background-color: #dff0d8 !important;border-color:#d6e9c6}.note-statusbar .alert-info{color:#31708f;background-color:#d9edf7;border-color:#bce8f1}.note-statusbar .alert-warning{color:#8a6d3b;background-color:#fcf8e3;border-color:#faebcc}.note-statusbar .alert-danger{color:#a94442;background-color:#f2dede;border-color:#ebccd1}</style>');
                    }
                    if (options.cleaner.limitChars != 0 || options.cleaner.limitDisplay != 'none') {
                        var textLength = $('.note-editable').text().replace(/(<([^>]+)>)/ig, "").replace(/( )/, ' ');
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
                        var textLength = $('.note-editable').text().replace(/(<([^>]+)>)/ig, "").replace(/( )/, ' ');
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
                        var msie = ua.indexOf('MSIE ');
                        msie = msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./);
                        var ffox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
                        if (msie)
                            var text = window.clipboardData.getData('Text');
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
            $('head').append('<style>' + options.paperSize.css + '</style>');
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
     * 第三方云插件
     * https://github.com/uploadcare/uploadcare-summernote
     */
    function getUploadcare() {
        function ensureWidget(version) {
            if (typeof uploadcare == 'undefined') {
                $.getScript(['https://ucarecdn.com/widget/', version, '/uploadcare/uploadcare.min.js'].join(''));
            }
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

        return init;
    }

    /*$.extend($.summernote.plugins, {uploadcare: getUploadcare()});*/
});