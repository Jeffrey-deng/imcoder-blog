/**
 * 相册照片处理模块
 * @author Jeffery.deng
 * @date 2018/1/11
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'clipboard', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.album_photo_handle = factory(window.jQuery, null, toastr, Clipboard, globals, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, Clipboard, globals, common_utils, login_handle) {

    var pointer = {
        uploadModal: null,
        updateModal: null,
        failUploadNum: 0,
        uploadPhotos: null
    };
    var config = {
        path_params: globals.path_params,
        selector: {
            "uploadModal": "#uploadPhotoModal",
            "updateModal": "#updatePhotoModal",
            "copyPhotoUrlTrigger": ".copyPhotoUrl_btn"
        },
        callback: {
            "beforeEachUpload": function (context, photo, file, postData, index) {  // 每一个图片上传之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "eachUploadCompleted": function (context, photo, index) {  // 每一个图片上传完成后回调
                return;
            },
            "allUploadCompleted": function (context, photos, failUploadCount) {  // 所有图片上传完成后回调
                return;
            },
            "beforeUpdate": function (context, photo, file, postData) {  // 更新之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "updateCompleted": function (context, photo) {  // 更新完成后回调
                return;
            },
            "beforeDelete": function (context, postData) {  // 删除之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "deleteCompleted": function (context, postData) {  // 删除完成后回调
                return;
            },
            "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {  // 上传窗口打开前回调
                var album_id = context.config.albumId;
                // 传入的参数可以修改上传的相册ID
                openUploadModal_callback(album_id);
            },
            "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {  // 更新窗口打开前回调
                // 如果openUpdatePhotoModal传入的参数为photo对象，直接使用
                if (typeof photo == 'object') {
                    formatPhotoToModal_callback(photo);
                    // 如果传入的参数为photo_id，异步获取photo对象
                } else {
                    context.request.loadPhoto(photo, function (photo) {
                        formatPhotoToModal_callback(photo);
                    });
                }
            }
        },
        event: { // 以事件方式添加回调，以便支持多个回调，这时定义的是事件名
            "beforeEachUpload": "photo.upload.before",
            "eachUploadCompleted": "photo.upload.completed",
            "allUploadCompleted": "photo.upload.all.completed",
            "beforeUpdate": "photo.update.before",
            "updateCompleted": "photo.update.completed",
            "beforeDelete": "photo.delete.before",
            "deleteCompleted": "photo.delete.completed",
            "tagClick": "photo.tag.click", // 标签被点击
            "tagExtendClick": "photo.tag.extendclick", // 标签按住alt被点击
        },
        albumId: 0,
        downloadType: "url",
        maxUploadSize: 10 * 1024 * 1024
    };
    var init = function (options) {

        $.extendNotNull(true, config, options);

        pointer.uploadModal = $(config.selector.uploadModal);
        pointer.updateModal = $(config.selector.updateModal);

        // 提交上传事件
        pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').click(function () {
            var files = pointer.uploadPhotos || pointer.uploadModal.find('input[name="photos"]')[0].files,
                $submitBtn = $(this),
                uploadFileCount = files.length;
            if (files == null || uploadFileCount == 0 || files[0] == undefined || files[0] == null) {
                toastr.error('未选择文件呢');
                return;
            }
            $submitBtn.attr('disabled', 'disabled');
            var photoInfo = {};
            photoInfo.album_id = config.albumId;
            photoInfo.name = pointer.uploadModal.find('input[name="photo_name"]').val();
            photoInfo.refer = pointer.uploadModal.find('input[name="photo_refer"]').val();
            photoInfo.description = pointer.uploadModal.find('textarea[name="photo_desc"]').val();
            var topic = {};
            var needCheckTopic = true;
            var $selectTopicNode = pointer.uploadModal.find('.topic-select option:selected');
            topic.name = $selectTopicNode.attr('value');
            topic.description = photoInfo.name;
            if ($selectTopicNode.hasClass('empty-topic')) {
                topic.ptwid = '0';
                needCheckTopic = false;
            }
            var $selectTopicPermissionNode = pointer.uploadModal.find('.topic-permission-select option:selected');
            if ($selectTopicPermissionNode.hasClass('default-permission')) {
                topic.scope = config.albumId;
            } else if ($selectTopicPermissionNode.hasClass('permission-follow-album')) {
                topic.scope = $selectTopicPermissionNode.attr('value');
            } else {
                topic.scope = '0';
                topic.permission = parseInt($selectTopicPermissionNode.attr('value'));
            }
            photoInfo.topic = topic;
            var tags = '';
            pointer.uploadModal.find('.tags-modify').find('.tag-content').each(function (i, tag) {
                var tags_value = tag.innerText;
                if (/^mount@\d+$/.test(tags_value) || tags_value == topic.name) {
                    tags = '#' + tags_value + '#' + tags;
                } else {
                    tags += '#' + tags_value + '#';
                }
            });
            if (topic.ptwid != '0' && tags.indexOf(topic.name) == -1) {
                tags = '#' + topic.name + '#' + tags;
            }
            photoInfo.tags = (tags == '##' ? '' : tags);
            if (photoInfo.description.length >= 2000) {
                toastr.error('描述字数' + photoInfo.description.length + '过长, 应在2000字内', '错误', {"progressBar": false});
                this.removeAttribute('disabled');
                return;
            }
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    $.Deferred(function (dfd) {
                        if (needCheckTopic) {
                            request.loadOrCreateTopic(topic, function (tagWrapper) {
                                photoInfo.topic = tagWrapper;
                                dfd.resolve();
                            }).fail(function () {
                                dfd.reject();
                            });
                        } else {
                            dfd.resolve();
                        }
                    }).done(function () {
                        request.uploadPhoto(files, photoInfo, true).progress(function (photo, type, message, index, failUploadCount, maxIndex, maxUploadSize) {
                            let file = this;
                            if (type == 0) {
                                let notify_uploading = globals.getNotify('notify_photo_uploading');
                                if (notify_uploading) {
                                    notify_uploading.title(`正在上传第 ${index + 1} 张`);
                                    notify_uploading.find('progress').val(index);
                                } else {
                                    globals.notify().progress(`<progress value="${index}" max="${maxIndex + 1}" style="width:100%;"></progress>`, `正在上传第 ${index + 1} 张`, 'notify_photo_uploading');
                                }
                            } else if (type == -1) {
                                toastr.info(message, '照片上传被跳过');
                                console.warn(file.name + ' 上传失败，原因被程序忽略');
                            } else if (type == -2) {
                                toastr.info('跳过第' + (index + 1) + '张：\n<b>' + file.name + '</b>\n因为文件超出最大上传大小，\n最大支持' + (maxUploadSize / (1024 * 1024)).toFixed(2) + 'M', '', {
                                    'timeOut': 0,
                                    'onclick': function () {
                                        return false;
                                    }
                                });
                                console.warn(file.name + ' 上传失败，原因超出最大上传大小');
                            }
                        }).always(function () {
                            pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr('disabled');
                            globals.removeNotify('notify_photo_uploading');
                        }).final(function (photos, failUploadCount) {
                            pointer.uploadPhotos = null;
                            if (failUploadCount > 0) {
                                toastr.error('共 ' + failUploadCount + ' 张照片未上传！', '', {'timeOut': 0});
                            }
                            pointer.uploadModal.find('input[name="photos"]').val(''); // 将这里清空会将files对象清空到length=0
                            if (failUploadCount < uploadFileCount) {
                                toastr.success('上传完成！');
                                pointer.uploadModal.modal('hide');
                            }
                        }, function (status, message, type, file, failUploadCount) {
                            if (type != 0) {
                                pointer.uploadPhotos = null;
                                pointer.uploadModal.find('input[name="photos"]').val('');
                            }
                            if (failUploadCount > 0) {
                                toastr.error('共 ' + failUploadCount + ' 张照片未上传！', '', {'timeOut': 0});
                            }
                        });
                    });
                } else if (isLogin === false) {
                    toastr.error('登陆状态失效，请重新登录！');
                    $submitBtn.removeAttr('disabled');
                } else {
                    toastr.error('上传失败', '断网了？');
                    $submitBtn.removeAttr('disabled');
                }
            }, true);
        });

        // 更新图片事件
        pointer.updateModal.find('button[name="updatePhoto_trigger"]').click(function () {
            var $tags_modify = pointer.updateModal.find('.tags-modify');
            var $tag_input = $tags_modify.find('.tag-input');
            if ($tag_input.val() != '') {
                utils.addTagFromInput($tags_modify, $tag_input);
            }
            var photo = {};
            photo.photo_id = pointer.updateModal.find('span[name="photo_id"]').html().trim();
            photo.name = pointer.updateModal.find('input[name="photo_name"]').val();
            photo.refer = pointer.updateModal.find('input[name="photo_refer"]').val();
            photo.description = pointer.updateModal.find('textarea[name="photo_desc"]').val();
            var topic = {};
            var needCheckTopic = true;
            var $selectTopicNode = pointer.updateModal.find('.topic-select option:selected');
            topic.name = $selectTopicNode.attr('value');
            topic.description = photo.name;
            if ($selectTopicNode.hasClass('empty-topic')) {
                topic.ptwid = '0';
                needCheckTopic = false;
            } else {
                if ($selectTopicNode.hasClass('before-topic')) {
                    topic.ptwid = $selectTopicNode.attr('data-ptwid');
                    needCheckTopic = false;
                }
            }
            var $selectTopicPermissionNode = pointer.updateModal.find('.topic-permission-select option:selected');
            if ($selectTopicPermissionNode.hasClass('permission-follow-album')) {
                topic.scope = $selectTopicPermissionNode.attr('value');
            } else {
                topic.scope = '0';
                topic.permission = parseInt($selectTopicPermissionNode.attr('value'));
            }
            if (!needCheckTopic && topic.ptwid != '0' && !$selectTopicPermissionNode.hasClass('before-topic-permission')) {
                needCheckTopic = true;
            }
            photo.topic = topic;
            var tags = '';
            $tags_modify.find('.tag-content').each(function (i, tag) {
                var tags_value = tag.innerText;
                if (/^mount@\d+$/.test(tags_value) || tags_value == topic.name) {
                    tags = '#' + tags_value + '#' + tags;
                } else {
                    tags += '#' + tags_value + '#';
                }
            });
            if (topic.ptwid != '0' && tags.indexOf(topic.name) == -1) {
                tags = '#' + topic.name + '#' + tags;
            }
            photo.tags = (tags == '##' ? '' : tags);
            if (photo.description.length >= 2000) {
                toastr.error('描述字数' + photo.description.length + '过长, 应在2000字内', '错误', {"progressBar": false});
                return;
            }
            var file = pointer.updateModal.find('input[name="photo_file"]')[0].files[0];
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    globals.notify().progress('正在更新图片~', '', 'notify_updating');
                    pointer.updateModal.find('button[name="updatePhoto_trigger"]').attr('disabled', 'disabled');
                    $.Deferred(function (dfd) {
                        if (needCheckTopic) {
                            request.loadOrCreateTopic(topic, function (tagWrapper) {
                                photo.topic = tagWrapper;
                                dfd.resolve();
                            }).fail(function () {
                                dfd.reject();
                            });
                        } else {
                            dfd.resolve();
                        }
                    }).done(function () {
                        request.updatePhoto(photo, file).always(function () {
                            pointer.updateModal.find('button[name="updatePhoto_trigger"]').removeAttr('disabled');
                            globals.removeNotify('notify_updating');
                        }).final(function (photo) {
                            toastr.success('更新成功', '');
                            pointer.updateModal.modal('hide');
                            pointer.updateModal.find('input[name="photo_file"]').val('');
                        }, function (status, message, type) {
                            if (type >= 0) {
                                pointer.updateModal.find('input[name="photo_file"]').val('');
                            }
                        });
                    });
                } else {
                    toastr.error('登陆状态失效，请重新登录！');
                }
            }, false);
        });

        // 删除图片事件
        pointer.updateModal.find('button[name="deletePhoto_trigger"]').click(function () {
            var photo_id = pointer.updateModal.find('span[name="photo_id"]').html().trim();
            if (window.confirm('确定要删除此图片吗？')) {
                request.deletePhoto(photo_id, function () {
                    toastr.success('删除成功', '');
                    pointer.updateModal.modal('hide');
                });
            }
        });

        // 切换按钮
        pointer.updateModal.find('.update-convert-photo-url').click(function (e) {
            var $self = $(this);
            $self.css('font-weight', 'bold').parent().find('.update-convert-photo-refer').css('font-weight', 'normal');
            $self.closest('.form-group').find('.update-photo-url').css('display', 'block');
            $self.closest('.form-group').find('.update-photo-refer').css('display', 'none');
        });
        pointer.updateModal.find('.update-convert-photo-refer').click(function (e) {
            var $self = $(this);
            $self.css('font-weight', 'bold').parent().find('.update-convert-photo-url').css('font-weight', 'normal');
            $self.closest('.form-group').find('.update-photo-url').css('display', 'none');
            $self.closest('.form-group').find('.update-photo-refer').css('display', 'block');
        });

        // topic选择
        utils.applyTopicToSelect(pointer.uploadModal.find('.topic-select'), null, null);
        utils.applyTopicPermissionToSelect(pointer.uploadModal.find('.topic-permission-select'), null, config.albumId);
        pointer.uploadModal.find('.topic-select').change(function () {
            var $selectTopicNode = $(this).find('option:selected');
            if (!$selectTopicNode.hasClass('empty-topic')) {
                if ($selectTopicNode.hasClass('before-topic')) {
                    pointer.uploadModal.find('.topic-permission-select .before-topic-permission').prop('selected', true);
                } else {
                    pointer.uploadModal.find('.topic-permission-select .default-permission').prop('selected', true);
                }
                var queryArgs = {
                    "uid": login_handle.getCurrentUserId(),
                    "name": $selectTopicNode.attr('value'),
                    "type": 0
                };
                request.loadTagWrapper(queryArgs, function (photoTopic) {
                    var current_album_id = config.albumId;
                    utils.applyTopicPermissionToSelect(pointer.uploadModal.find('.topic-permission-select'), photoTopic, current_album_id);
                });
            }
        });
        pointer.updateModal.find('.topic-select').change(function () {
            var $selectTopicNode = $(this).find('option:selected');
            if (!$selectTopicNode.hasClass('empty-topic')) {
                if ($selectTopicNode.hasClass('before-topic')) {
                    pointer.updateModal.find('.topic-permission-select .before-topic-permission').prop('selected', true);
                } else {
                    pointer.updateModal.find('.topic-permission-select .default-permission').prop('selected', true);
                }
                var queryArgs = {
                    "uid": login_handle.getCurrentUserId(),
                    "name": $selectTopicNode.attr('value'),
                    "type": 0
                };
                request.loadTagWrapper(queryArgs, function (photoTopic) {
                    var current_album_id = pointer.updateModal.find('span[name="photo_id"]').attr('data-album-id');
                    utils.applyTopicPermissionToSelect(pointer.updateModal.find('.topic-permission-select'), photoTopic, current_album_id);
                });
            }
        });

        // 打开topic
        pointer.updateModal.find('.topic-select').closest('.form-group').find('label').click(function () {
            var $topic_select = pointer.updateModal.find('.topic-select');
            if ($topic_select.is(':visible')) {
                var topicId = $topic_select.find('option:selected').attr('data-ptwid');
                if (topicId) {
                    window.open(('p/topic/' + topicId).toURL());
                }
            }
        });

        // 新标签打开照片
        pointer.updateModal.find('.open-update-photo-url').click(function () {
            let $btn = $(this), $group = $btn.closest('.form-group'), $label = $group.find('.update-convert-photo-url');
            if ($label.attr('data-current-show') == 'originName') {
                window.open(pointer.updateModal.data('photo').path);
            } else {
                let url = $(this).prev().val();
                if (url) {
                    window.open(url);
                } else {
                    toastr.error('照片链接为空呢~');
                }
            }
        });

        // 打开照片的相关链接
        pointer.updateModal.find('.open-update-photo-refer').click(function () {
            let url = $(this).prev().val();
            if (url) {
                window.open(url);
            } else {
                toastr.info('你还没有设置相关页面呢~');
            }
        });

        // 复制图片地址
        initClipboard(config.selector.copyPhotoUrlTrigger, config.selector.updateModal);

        // 下载图片事件
        pointer.updateModal.find('a[name="photo_path"]').click(function () {
            let photo = pointer.updateModal.data('photo'), originName = photo.originName, fileName, isAuthor = pointer.updateModal.data('isAuthor');
            if (!isAuthor || (originName && window.confirm('点击是命名以服务器文件名，否以原文件名'))) {
                originName = null;
            }
            if (!originName) {
                fileName = pointer.updateModal.data('photo').path.match(/\/([^/]*)$/)[1];
            } else {
                fileName = originName;
            }
            utils.downloadPhoto(this.getAttribute('path'), config.downloadType, fileName);
        }).closest('.form-group').find('.update-convert-photo-url').on('dblclick', function () {
            let isAuthor = pointer.updateModal.data('isAuthor'), $label = $(this), $group = $label.closest('.form-group');
            if (isAuthor) {
                let photo = pointer.updateModal.data('photo'), originName = photo.originName, current_show = $label.attr('data-current-show') || 'url';
                if (current_show == 'url') {
                    $group.find('.copy-input').val(originName);
                    current_show = 'originName';
                } else {
                    $group.find('.copy-input').val(photo.path);
                    current_show = 'url';
                }
                $label.attr('data-current-show', current_show);
            }
        });

        // upload modal tags 输入框 绑定事件
        var $upload_tags_modify = pointer.uploadModal.find('.tags-modify');
        pointer.uploadModal.on('shown.bs.modal', function () {
            utils.calcTagInputWidth($upload_tags_modify);
        });
        $upload_tags_modify.on('click', '.tag-close', function (e) { // 删除
            utils.deleteTag($upload_tags_modify, $(e.currentTarget.parentNode));
        });
        $upload_tags_modify.on({ // 提交
            "keydown": function (e) {
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                if (code == 13) {
                    utils.addTagFromInput($upload_tags_modify, $(e.currentTarget));
                    $upload_tags_modify.closest('.form-group').find('.tags-edit-btn').text('编辑');
                    // 防止触发表单提交 返回false
                    // e.preventDefault();
                    return false;
                }
            },
            "blur": function (e) {
                var input_dom = $(e.currentTarget);
                // $upload_tags_modify.find('.tag-single').length == 0
                if (input_dom.val() != '') {
                    utils.addTagFromInput($upload_tags_modify, input_dom);
                    $upload_tags_modify.closest('.form-group').find('.tags-edit-btn').text('编辑');
                }
            }
        }, '.tag-input');
        $upload_tags_modify.closest('.form-group').find('label').dblclick(function () { // 双击标签全部编辑
            $upload_tags_modify.closest('.form-group').find('.tags-edit-btn').click();
        });
        $upload_tags_modify.closest('.form-group').find('.tags-edit-btn').on('click', function (e) {
            var $btn = $(this);
            if ($btn.text() == '确定') {
                $upload_tags_modify.find('.tag-input').blur();
                return;
            }
            var tags = '';
            $upload_tags_modify.find('.tag-content').each(function (i, tag) {
                tags += '#' + tag.innerText;
            });
            if (tags) {
                $upload_tags_modify.find('.tag-input').val(tags);
                $upload_tags_modify.find('.tag-single').remove();
                utils.calcTagInputWidth($upload_tags_modify);
                $upload_tags_modify.autoTextareaHeight({
                    maxHeight: 150,
                    minHeight: config.tagsAreaHeight,
                    runOnce: true
                });
                $btn.text('确定');
                utils.applyTopicToSelect(pointer.uploadModal.find('.topic-select'), null, null);
                utils.applyTopicPermissionToSelect(pointer.uploadModal.find('.topic-permission-select'), null, config.albumId);
            }
        });

        // update modal tags 输入框 绑定事件
        var $update_tags_modify = pointer.updateModal.find('.tags-modify');
        pointer.updateModal.on('shown.bs.modal', function () { // 计算输入框宽度
            pointer.updateModal.find('textarea[name="photo_desc"]').autoTextareaHeight({
                maxHeight: 200,
                minHeight: config.textareaInputHeight,
                runOnce: true
            });
            if ($update_tags_modify.find('.tag-input').length > 0) {
                utils.calcTagInputWidth($update_tags_modify);
                // console.log($update_tags_modify.outerHeight(true) + '_ ' + $update_tags_modify.prop('scrollHeight'));
                $update_tags_modify.autoTextareaHeight({
                    maxHeight: 150,
                    minHeight: config.tagsAreaHeight,
                    runOnce: true
                });
            }
        });
        $update_tags_modify.on('click', '.tag-close', function (e) {
            utils.deleteTag($update_tags_modify, $(e.currentTarget.parentNode));
        });
        $update_tags_modify.on({
            "keydown": function (e) {
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                if (code == 13) {
                    utils.addTagFromInput($update_tags_modify, $(e.currentTarget));
                    $update_tags_modify.closest('.form-group').find('.tags-edit-btn').text('编辑');
                    // 防止触发表单提交 返回false
                    // e.preventDefault();
                    return false;
                }
            },
            "blur": function (e) {
                var input_dom = $(e.currentTarget);
                // $update_tags_modify.find('.tag-single').length == 0
                if (input_dom.val() != '') {
                    $update_tags_modify.closest('.form-group').find('.tags-edit-btn').text('编辑');
                    utils.addTagFromInput($update_tags_modify, input_dom);
                }
            }
        }, '.tag-input');
        // 可自定义事件修改标签被点击的事件
        config.tagExtendClickEvent = null;
        $update_tags_modify.on({
            "keydown": function (e) {
                var theEvent = e || window.event;
                if (theEvent.altKey) {  // 按住alt点击
                    e.preventDefault();
                    config.tagExtendClickEvent = e;
                } else {
                    config.tagExtendClickEvent = null;
                }
            },
            "keyup": function (e) {
                config.tagExtendClickEvent = null;
            },
            "click": function (clickEvt) {
                var _self = $(this);
                var photo_id = pointer.updateModal.find('span[name="photo_id"]').html().trim();
                var tag = _self.text();
                if (config.tagExtendClickEvent || clickEvt.altKey) {  // 是否按住alt点击
                    clickEvt.preventDefault();
                    context.trigger(config.event.tagExtendClick, tag, photo_id, clickEvt, config.tagExtendClickEvent);
                } else {
                    context.trigger(config.event.tagClick, tag, photo_id, clickEvt);
                }
            }
        }, '.tag-content');
        $update_tags_modify.closest('.form-group').find('label').dblclick(function () { // 双击标签全部编辑
            $update_tags_modify.closest('.form-group').find('.tags-edit-btn').click();
        });
        $update_tags_modify.closest('.form-group').find('.tags-edit-btn').on('click', function (e) {
            var $btn = $(this);
            if ($btn.text() == '确定') {
                $update_tags_modify.find('.tag-input').blur();
                return;
            }
            var tags = '';
            $update_tags_modify.find('.tag-content').each(function (i, tag) {
                tags += '#' + tag.innerText;
            });
            if (tags) {
                $update_tags_modify.find('.tag-input').val(tags);
                $update_tags_modify.find('.tag-single').remove();
                utils.calcTagInputWidth($update_tags_modify);
                $update_tags_modify.autoTextareaHeight({
                    maxHeight: 150,
                    minHeight: config.tagsAreaHeight,
                    runOnce: true
                });
                $btn.text('确定');
            }
        });

        //  desc textArea 自适应高度
        config.textareaInputHeight = pointer.updateModal.find('textarea[name="photo_desc"]').outerHeight();
        pointer.updateModal.find('textarea[name="photo_desc"]').autoTextareaHeight({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });
        pointer.uploadModal.find('textarea[name="photo_desc"]').autoTextareaHeight({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });

        // tags 输入框自适应高度
        config.tagsAreaHeight = pointer.updateModal.find('.tags-modify').eq(0).outerHeight();
        pointer.updateModal.find('.tags-modify').autoTextareaHeight({
            maxHeight: 150,
            minHeight: config.tagsAreaHeight
        });
        pointer.uploadModal.find('.tags-modify').css('overflow-y', 'hidden').autoTextareaHeight({
            maxHeight: 150,
            minHeight: config.tagsAreaHeight
        });
    };
    const request = globals.extend(globals.request, {
        album_photo_handle: {
            'uploadPhoto': function (files, photoData, success) {
                return $.Deferred(function (dfd) {
                    files = $.makeArray(files); // file并不是Array，而是FileList对象
                    let runUpload, photoDataBackUp = $.extend(true, {}, photoData), photos = [];
                    if (photoDataBackUp.topic) {
                        for (let k of ['ptwid', 'name', 'scope', 'permission', 'description']) {
                            let v = photoDataBackUp.topic[k];
                            if (v !== null && v !== undefined) {
                                photoDataBackUp["topic." + k] = v;
                            }
                        }
                        delete photoDataBackUp.topic;
                    }
                    runUpload = function (files, photoData, index, maxIndex, failUploadCount, maxUploadSize) {
                        let file = files[index], postData;
                        photoData = $.extend(true, {}, photoData);
                        if (maxUploadSize == -1 || file.size <= maxUploadSize) {
                            postData = new FormData();
                            postData.append('file', file);
                            postData.append('originName', (file.name.lastIndexOf('.') != -1 ? file.name : (file.name + '.jpg')));
                            $.each(photoData, function (key, value) {
                                postData.append(key, value);
                            });
                            common_utils.wrapAsyncResult.call(context, config.callback.beforeEachUpload)(context, photoData, file, postData, index).final(function (allowUpload) {
                                allowUpload = (allowUpload !== false && context.trigger(config.event.beforeEachUpload, photoData, file, postData, index) !== false);
                                if (allowUpload) {
                                    dfd.notifyWith(file, [photoData, 0, '正在上传第' + (index + 1) + '张~', index, failUploadCount, maxIndex, maxUploadSize]);
                                    globals.request.ajax({
                                        type: 'post',
                                        contentType: false,
                                        cache: false,
                                        processData: false,
                                    }, globals.api.uploadPhoto, postData, false, ['photo'], success && ('照片' + file.name + '上传失败')).final(function (photo) {
                                        dfd.notifyWith(file, [photo, 1, '第' + (index + 1) + '张上传完成', index, failUploadCount, maxIndex, maxUploadSize]);
                                    }, function (status, message, type) {
                                        failUploadCount = failUploadCount + 1 + (maxIndex - index);
                                        (this.file = file, this.failUploadCount = failUploadCount);
                                        dfd.rejectWith(this, [status, message, type, file, failUploadCount]);
                                    });
                                } else {
                                    failUploadCount++;
                                    dfd.notifyWith(file, [photoData, -1, '跳过第' + (index + 1) + '张', index, failUploadCount, maxIndex, maxUploadSize]);
                                }
                            }, function (message) {
                                failUploadCount = failUploadCount + 1 + (maxIndex - index);
                                globals.request.rejectedResp(
                                    {'message': (message || '上传回调抛出异常'), 'type': -1, 'file': file, 'failUploadCount': failUploadCount}, success && '照片上传中断',
                                    ['status', 'message', 'type', 'file', 'failUploadCount'], false, dfd);
                            });
                        } else {
                            failUploadCount++;
                            dfd.notifyWith(file, [photoData, -2, '跳过第' + (index + 1) + '张，文件超出大小，最大' + (maxUploadSize / (1024 * 1024)).toFixed(2) + 'M',
                                index, failUploadCount, maxIndex, maxUploadSize]);
                        }
                    };
                    dfd.progress(function (photo, type, message, index, failUploadCount, maxIndex, maxUploadSize) {
                        if (type != 0) {
                            setTimeout(function () { // 设为异步，让外面的回调先运行
                                if (type == 1) {
                                    photos.push(photo);
                                    config.callback.eachUploadCompleted.call(context, context, photo, index); // 单个上传完成回调
                                    context.trigger(config.event.eachUploadCompleted, photo, index);
                                }
                                if (index < maxIndex) {
                                    index++;
                                    runUpload(files, photoDataBackUp, index, maxIndex, failUploadCount, config.maxUploadSize);
                                } else {
                                    config.callback.allUploadCompleted.call(context, context, photos, failUploadCount); // 全部上传完成回调
                                    context.trigger(config.event.allUploadCompleted, photos, failUploadCount);
                                    globals.request.resolvedResp({'status': 200, 'message': '照片上传成功', 'data': {'photos': photos, 'failUploadCount': failUploadCount}}, success, ['photos', 'failUploadCount'], false, dfd);
                                }
                            }, 0);
                        }
                    });
                    runUpload(files, photoDataBackUp, 0, files.length - 1, 0, config.maxUploadSize);
                });
            },
            'updatePhoto': function (photo, file, success) {
                return $.Deferred(function (dfd) {
                    photo = $.extend(true, {}, photo);
                    if (photo != null && photo.photo_id) {
                        let runUpdate, isUploadFile = file && /^image.*/.test(file.type), postData, ajaxOption;
                        if (photo.topic) {
                            for (let k of ['ptwid', 'name', 'scope', 'permission', 'description']) {
                                let v = photo.topic[k];
                                if (v !== null && v !== undefined) {
                                    photo["topic." + k] = v;
                                }
                            }
                            delete photo.topic;
                        }
                        if (isUploadFile) {
                            postData = new FormData();
                            postData.append('file', file);
                            postData.append('originName', (file.name.lastIndexOf('.') != -1 ? file.name : (file.name + '.jpg')));
                            $.each(photo, function (key, value) {
                                postData.append(key, value);
                            });
                            ajaxOption = {
                                type: 'post',
                                contentType: false,
                                cache: false,
                                processData: false,
                            }
                        } else {
                            postData = photo;
                            ajaxOption = {
                                type: 'post',
                            }
                        }
                        runUpdate = function (allowUpdate, cancelMessage) {
                            if (allowUpdate) {
                                globals.request.ajax(ajaxOption, globals.api.updatePhoto, postData, success, ['photo'], success && '更新错误').final(function (photo) {
                                    config.callback.updateCompleted.call(context, context, photo, isUploadFile);
                                    context.trigger(config.event.updateCompleted, photo, isUploadFile);
                                    dfd.resolveWith(this, arguments);
                                }, function () {
                                    dfd.rejectWith(this, arguments);
                                });
                            } else {
                                globals.request.rejectedResp({'message': cancelMessage || '更新被取消', 'type': -2}, success && '照片更新失败', null, false, dfd);
                            }
                        };
                        // 更新之前回调
                        common_utils.wrapAsyncResult.call(context, config.callback.beforeUpdate)(context, photo, file, postData).final(function (allowUpdate, message) {
                            allowUpdate = (allowUpdate !== false && context.trigger(config.event.beforeUpdate, photo, file, postData) !== false);
                            runUpdate.call(context, allowUpdate, message);
                        }, function (message) {
                            runUpdate.call(context, false, message);
                        });
                    } else {
                        globals.request.rejectedResp({'message': '提交photo对象错误', 'type': -1}, success && '照片更新失败', null, false, dfd);
                    }
                });
            },
            'deletePhoto': function (photo_id, success) {
                return $.Deferred(function (dfd) {
                    if (photo_id && photo_id != '0') {
                        let runDelete, postData = {"photo_id": photo_id};
                        runDelete = function (allowDelete, cancelMessage) {
                            if (allowDelete) {
                                globals.request.post(globals.api.deletePhoto, postData, success, success && '照片删除失败').final(function () {
                                    config.callback.deleteCompleted.call(context, context, postData); // 回调
                                    context.trigger(config.event.deleteCompleted, postData);
                                    dfd.resolveWith(this, arguments);
                                }, function () {
                                    dfd.rejectWith(this, arguments);
                                });
                            } else {
                                globals.request.rejectedResp({'message': cancelMessage || '删除被取消', 'type': -2}, success && '照片删除失败', null, false, dfd);
                            }
                        };
                        // 删除之前回调
                        common_utils.wrapAsyncResult.call(context, config.callback.beforeDelete)(context, postData).final(function (allowDelete, message) {
                            allowDelete = (allowDelete !== false && context.trigger(config.event.beforeDelete, postData) !== false);
                            runDelete.call(context, allowDelete, message);
                        }, function (message) {
                            runDelete.call(context, false, message);
                        });
                    } else {
                        globals.request.rejectedResp({'message': '提交photo_id为空', 'type': -1}, success && '照片删除失败', null, false, dfd);
                    }
                });
            },
            'loadPhoto': function (photo_id, success) {
                let postData = {"id": photo_id};
                return globals.request.get(globals.api.getPhoto, postData, success, ['photo'], success && '加载照片信息失败');
            },
            'loadOrCreateTopic': function (topic, success) {
                return globals.request.get(globals.api.getOrCreateTopic, topic, success, ['tagWrapper'], success && '加载Topic信息失败');
            },
            'loadTagWrapper': function (tagWrapper, success) {
                return globals.request.get(globals.api.getTagWrapper, tagWrapper, success, ['tagWrapper'], false).fail(function (status, message, type) {
                    if (success && status != 404) {
                        toastr.error(message, '加载Topic信息失败');
                    }
                });
            },
        }
    }).album_photo_handle;
    var openUploadPhotoModal = function (files) {
        if (!login_handle.validateLogin()) {
            toastr.error('你没有登录！');
            login_handle.jumpLogin();
            return false;
        }
        if (files && files.length > 0) {
            var images = [];
            var imageRegex = /^image.*/;
            $.each(files, function (i, file) {
                if (imageRegex.test(file.type)) {
                    images.push(file);
                }
            });
            if (images.length > 0) {
                pointer.uploadModal.find('input[name="photos"]').closest('.form-group').hide();
                pointer.uploadModal.find('.modal-title').text('上传图片（已选择 ' + images.length + ' 张图片）');
                pointer.uploadPhotos = images;
            } else {
                pointer.uploadModal.find('input[name="photos"]').closest('.form-group').show();
                pointer.uploadModal.find('.modal-title').text('上传图片');
                pointer.uploadPhotos = null;
            }
        } else {
            pointer.uploadModal.find('input[name="photos"]').closest('.form-group').show();
            pointer.uploadModal.find('.modal-title').text('上传图片');
            pointer.uploadPhotos = null;
        }
        var openUploadModal_callback = function (album_id) {
            config.albumId = album_id;
            pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr('disabled');
            pointer.failUploadNum = 0;
            pointer.uploadModal.modal('show');
        };
        config.callback.beforeUploadModalOpen.call(context, context, pointer.uploadModal, openUploadModal_callback); // 回调
        return true;
    };
    /**
     * 打开照片信息更新窗口
     * @param {Integer|Object} photo - 可为photo_id或photo对象
     *          默认处理：对于窗口所需photo对象，如果传入为photo对象则直接使用，如果为photo_id则调用loadPhoto异步获取；
     *                    如需修改可重写回调方法beforeUpdateModalOpen，该方法的参数photo由此处的photo参数传入；
     *          异步获取：异步获取photo对象参考beforeUpdateModalOpen默认写法；
     *                    或异步获取完photo对象后再将该对象传入此方法；
     */
    var openUpdatePhotoModal = function (photo) {
        var formatPhotoToModal_callback = function (photo) {
            var isAuthor = login_handle.equalsLoginUser(photo.uid);
            pointer.updateModal.data('photo', photo).data('isAuthor', isAuthor);
            // load to modal
            var photo_url = 'p/detail/' + photo.photo_id;
            pointer.updateModal.find('span[name="photo_id"]').text(photo.photo_id).attr('data-album-id', photo.album_id).parent().url('href', photo_url);
            let downloadUrl = isAuthor ? photo.path : ('photo.api?method=downloadPhoto&photo_id=' + photo.photo_id).toURL();
            pointer.updateModal.find('.copy-input').val(downloadUrl);
            pointer.updateModal.find('a[name="photo_path"]').attr('path', downloadUrl);
            pointer.updateModal.find('input[name="photo_refer"]').val(photo.refer);
            pointer.updateModal.find('input[name="photo_name"]').val(photo.name);
            pointer.updateModal.find('textarea[name="photo_desc"]').val(photo.description);
            pointer.updateModal.find('span[name="photo_size"]').html(photo.size + 'KB（' + photo.width + '×' + photo.height + '）');
            pointer.updateModal.find('span[name="photo_upload_time"]').html(photo.upload_time);
            if (isAuthor) {
                pointer.updateModal.find('.update-convert-photo-url').attr('title', '原始文件名：' + photo.originName).attr('data-origin-name', photo.originName);
            } else {
                pointer.updateModal.find('.update-convert-photo-url').attr('title', "").attr('data-origin-name', '');
            }

            // css
            var dialogStyle = isAuthor ? '0px' : '30px';
            pointer.updateModal.find('.modal-dialog').css('margin-top', dialogStyle);

            // define btn by user type
            var fileStyle = isAuthor ? 'block' : 'none';
            var btnStyle = isAuthor ? 'inline-block' : 'none';
            pointer.updateModal.find('input[name="photo_file"]').val('').closest('.form-group').css('display', fileStyle);
            pointer.updateModal.find('button[name="deletePhoto_trigger"]').css('display', btnStyle);
            pointer.updateModal.find('button[name="updatePhoto_trigger"]').css('display', btnStyle);

            // 照片标签
            photo.tags = photo.tags || '';
            var tags_modify_dom = pointer.updateModal.find('.tags-modify').eq(0).css('height', '');
            if (isAuthor) {
                // show
                tags_modify_dom.closest('.form-group').show().find('.tags-edit-btn').show();
                // css
                tags_modify_dom.addClass('form-control');
                tags_modify_dom.css('overflow-y', 'hidden').closest('.form-group').css('padding-top', "").next().css('padding-top', '7px');
                // html
                let tags_str = '';
                $.each(photo.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single"><a class="tag-content" target="_blank" href="' + ('p/tag/' + encodeURIComponent(tag)).toURL() + '">' + tag + '</a>' +
                            '<span class="tag-close">&times</span></span>';
                    }
                });
                tags_str += '<input type="text" class="tag-input" name="tag_input" title="回车完成输入" placeholder="回车完成输入"/>';
                // tags_modify_dom.prop('outerHTML', '');
                // tags_modify_dom.replaceWith(tags_str);
                tags_modify_dom.html(tags_str);
                pointer.updateModal.find('.tags-edit-btn').text('编辑');
            } else if (!isAuthor && photo.tags) {
                // show
                tags_modify_dom.closest('.form-group').show().find('.tags-edit-btn').hide();
                // css
                tags_modify_dom.removeClass('form-control');
                tags_modify_dom.css('overflow-y', "").closest('.form-group').css('padding-top', '7px').next().css('padding-top', '');
                // html
                let tags_str = '';
                $.each(photo.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single" style="margin-right: 6px;"><a class="tag-content"  target="_blank" href="' + ('p/tag/' + encodeURIComponent(tag)).toURL() + '">' + tag + '</a></span>';
                    }
                });
                tags_modify_dom.html(tags_str);
            } else {
                // hide
                tags_modify_dom.closest('.form-group').hide();
                // html
                tags_modify_dom.find('.tag-single').remove();
                // css
                tags_modify_dom.css('overflow-y', "").closest('.form-group').next().css('padding-top', '7px');
            }
            var photoTopic = null;
            if (photo.topic && photo.topic.ptwid) {
                photoTopic = photo.topic;
            }
            if (isAuthor) {
                // 合集名称选择
                var topic_select_dom = pointer.updateModal
                    .find('.form-group .topic-name').text('').parent().attr('href', '').hide()
                    .closest('.form-group').show()
                    .find('label').text('合集名称 / 权限：')
                    .closest('.form-group')
                    .find('.topic-select,.topic-permission-select').parent().show(0).find('.topic-select');
                utils.applyTopicToSelect(topic_select_dom, photo.tags, photoTopic);
                // 合集权限选择
                utils.applyTopicPermissionToSelect(pointer.updateModal.find('.topic-permission-select'), photoTopic, photo.album_id);
            } else if (photoTopic) {
                pointer.updateModal
                    .find('.form-group .topic-name').text(photo.topic.name).parent().url('href', 'p/topic/' + photoTopic.ptwid).show()
                    .closest('.form-group').show()
                    .find('label').text('合集名称：')
                    .closest('.form-group')
                    .find('.topic-select,.topic-permission-select').html('').parent().hide(0);
            } else {
                pointer.updateModal
                    .find('.form-group .topic-name').text('').parent().attr('href', '')
                    .closest('.form-group').hide()
                    .find('.topic-select,.topic-permission-select').html('');
            }
            pointer.updateModal.modal('show');
        };
        config.callback.beforeUpdateModalOpen.call(context, context, pointer.updateModal, formatPhotoToModal_callback, photo); // 回调
    };
    var initClipboard = function (bindElementSelector, containerId) {
        var clipboard = new Clipboard(bindElementSelector, {
            container: $(containerId).get(0) //html所在模态框ID
        });
        // if (!clipboard.isSupported()) {
        //     console.error('该浏览器不支持Clipboard复制');
        // }
        clipboard.on('success', function (e) {
            toastr.success('图片地址复制成功！', '提示', {"progressBar": false});
            console.info('已复制Text:', e.text);
            e.clearSelection();
        });
        clipboard.on('error', function (e) {
            console.error('复制错误', '提示', {"progressBar": false});
            console.error('Action:', e.action);
            console.error('Trigger:', e.trigger);
        });
    };
    var utils = {
        "calcTagInputWidth": function ($tags_modify) {
            var tag_single_nodes = $tags_modify.find('.tag-single');
            var maxOffset = 0;
            tag_single_nodes.each(function (i, tag_single) {
                if (tag_single.offsetTop > maxOffset) {
                    maxOffset = tag_single.offsetTop;
                }
            });
            var total_width = $tags_modify.width();
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
            var width = total_width - left_width - 1;
            $tags_modify.find('.tag-input').width(width > 50 ? width : total_width);
        },
        "addTagFromInput": function ($tags_modify, $input) {
            var tag = $input.val();
            if (tag && !/^[ ]+$/.test(tag)) {
                // 如果要使用分割字符, 用 ""、{}、${} 包裹
                var elMap = {};
                tag = common_utils.replaceByEL(tag, function (index, key) {
                    var replaceMark = 'replaceEL_' + index;
                    elMap[replaceMark] = key;
                    return replaceMark;
                });
                var topic_select_dom = $tags_modify.closest('.modal-body').find('.topic-select');
                var insert_text = '';
                $.each(tag.split(/[#×✖,，;；]/), function (i, value) {
                    if (value) {
                        // 标记处还原原始值
                        var match = value.match(/replaceEL_[\d]{1}/);
                        match && (value = value.replace(match[0], elMap[match[0]]));
                        if (value.indexOf('#') == -1) {
                            insert_text += '<span class="tag-single"><a class="tag-content"  target="_blank" href="' + ('p/tag/' + encodeURIComponent(value)).toURL() + '">' + value + '</a><span class="tag-close"">&times</span></span>';
                            if (topic_select_dom.find('option[value="' + value + '"]').length == 0) {
                                topic_select_dom.append('<option value="' + value + '">' + value + '</option>');
                            }
                        }
                    }
                });
                if (insert_text) {
                    $input.before(insert_text);
                    utils.calcTagInputWidth($tags_modify);
                    $tags_modify.autoTextareaHeight({
                        maxHeight: 150,
                        minHeight: config.tagsAreaHeight,
                        runOnce: true
                    });
                    // $input.prevAll().find('.tag-close').unbind('click').click(function (e) {
                    //     utils.deleteTag($tags_modify, $(e.currentTarget.parentNode));
                    // });
                }
                $input.val('');
            } else {
                toastr.error('输入的单个标签不能为空或全是空格！，标签栏为空可以', '', {"progressBar": false, "timeOut": 7000});
            }
        },
        "deleteTag": function ($tags_modify, $tag_single) {
            var tagName = $tag_single.find('a').text();
            var tagNameCount = 0;
            $tags_modify.find('.tag-content').each(function (i, tag) {
                if (tagName == tag.innerText) {
                    tagNameCount++;
                }
            });
            if (tagNameCount == 1) {
                var topic_select_dom = $tags_modify.closest('.modal-body').find('.topic-select');
                topic_select_dom.find('option[value="' + tagName + '"]').remove();
            }
            $tag_single.remove();
            utils.calcTagInputWidth($tags_modify);
            $tags_modify.autoTextareaHeight({
                maxHeight: 150,
                minHeight: config.tagsAreaHeight,
                runOnce: true
            });
        },
        "applyTopicToSelect": function ($topic_select, tags, photoTopic) {
            var topic_option_str = '<option value="0" class="empty-topic default-topic' + (photoTopic ? '' : ' before-topic') + '" style="color: #d07a01">不设置</option>';
            if (tags) {
                $.each(tags.split('#'), function (i, tag) {
                    if (tag) {
                        if (photoTopic != null && photoTopic.name == tag) {
                            topic_option_str += '<option value="' + tag + '" class="tag-topic before-topic" data-ptwid="' + photoTopic.ptwid + '">' + tag + '</option>';
                        } else {
                            topic_option_str += '<option value="' + tag + '">' + tag + '</option>';
                        }
                    }
                });
            }
            $topic_select.html(topic_option_str);
            $topic_select.find('.before-topic').prop('selected', true);
        },
        "applyTopicPermissionToSelect": function ($topic_permission_select, photoTopic, current_album_id) {
            !current_album_id && (current_album_id = 0);
            var topic_permission_option_str = '';
            if (photoTopic != null && photoTopic.scope != '0' && photoTopic.scope != current_album_id) {
                topic_permission_option_str +=
                    '<option value="' + photoTopic.scope + '" class="permission-follow-album" style="color: #d07a01">跟随相册[' + photoTopic.scope + ']</option>' +
                    '<option value="' + current_album_id + '" class="permission-follow-album default-permission">跟随当前相册</option>'
            } else {
                topic_permission_option_str += '<option value="' + current_album_id + '" class="permission-follow-album default-permission">跟随当前相册</option>'
            }
            topic_permission_option_str += '<option value="0" class="permission-no-follow">游客可见，不跟随</option>' +
                '<option value="1" class="permission-no-follow" title="不会在搜索结果、广场、用户主页中出现">游客可见但不公开，不跟随</option>' +
                '<option value="2" class="permission-no-follow">登陆可见，不跟随</option>' +
                '<option value="3" class="permission-no-follow">登陆可见但不公开，不跟随</option>' +
                '<option value="4" class="permission-no-follow" title="关注你的用户可见">粉丝可见，不跟随</option>' +
                '<option value="5" class="permission-no-follow">粉丝可见但不公开，不跟随</option>' +
                '<option value="6" class="permission-no-follow" title="你关注的用户可见">关注的用户可见，不跟随</option>' +
                '<option value="7" class="permission-no-follow">关注的用户可见但不公开，不跟随</option>' +
                '<option value="8" class="permission-no-follow">好友可见，不跟随</option>' +
                '<option value="9" class="permission-no-follow">好友可见但不公开，不跟随</option>' +
                '<option value="10" class="permission-no-follow">私有，不跟随</option>';
            $topic_permission_select.html(topic_permission_option_str);
            if (photoTopic != null && photoTopic.scope == '0') {
                $topic_permission_select.find('option.permission-no-follow[value="' + photoTopic.permission + '"]')
                    .addClass('before-topic-permission').prop('selected', true);
            } else {
                $topic_permission_select.find('option.permission-follow-album[value="' + (photoTopic ? photoTopic.scope : current_album_id) + '"]')
                    .addClass('before-topic-permission').prop('selected', true);
            }
        },
        'downloadPhoto': function (url, downloadType, fileName) {
            downloadType = downloadType || 'url';
            if (downloadType == 'ajax') {
                common_utils.ajaxDownload(url, function (blob) {
                    common_utils.downloadBlobFile(blob, fileName || url.substring(url.lastIndexOf('/') + 1));
                    toastr.success('已下载！', '');
                });
            } else {
                common_utils.downloadUrlFile(url, fileName);
                toastr.success('已下载！', '');
            }
        },
    };
    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "request": request,
        "utils": utils,
        "openUploadPhotoModal": openUploadPhotoModal,
        "openUpdatePhotoModal": openUpdatePhotoModal,
        "on": globals.on,
        "once": globals.once,
        "trigger": globals.trigger,
        "off": globals.off
    };
    return context;

});