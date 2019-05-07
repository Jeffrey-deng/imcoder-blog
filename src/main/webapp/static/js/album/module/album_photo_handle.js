/**
 * 相册照片处理模块
 * @author Jeffery.deng
 * @date 2018/1/11
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'clipboard', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.album_photo_handle = factory(window.jQuery, null, toastr, Clipboard, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, Clipboard, common_utils, login_handle) {

    var pointer = {
        uploadModal: null,
        updateModal: null,
        failUploadNum: 0,
        uploadPhotos: null
    };
    var config = {
        path_params: {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        },
        selector: {
            "uploadModal": "#uploadPhotoModal",
            "updateModal": "#updatePhotoModal",
            "copyPhotoUrlTrigger": ".copyPhotoUrl_btn"
        },
        callback: {
            "beforeEachUpload": function (context, photo, file, formData) {  // 每一个图片上传之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "eachUploadCompleted": function (context, photo) {  // 每一个图片上传完成后回调
                return;
            },
            "allUploadCompleted": function (context, photos) {  // 所有图片上传完成后回调
                return;
            },
            "beforeUpdate": function (context, photo, file, formData) {  // 更新之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "updateCompleted": function (context, photo) {  // 更新完成后回调
                return;
            },
            "beforeDelete": function (context, params) {  // 删除之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "deleteCompleted": function (context, params) {  // 删除完成后回调
                return;
            },
            "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {  // 上传窗口打开前回调
                var album_id = context.config.albumId;
                // 传入的参数可以修改上传的相册ID
                openUploadModal_callback(album_id);
            },
            "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {  // 更新窗口打开前回调
                // 如果openUpdatePhotoModal传入的参数为photo对象，直接使用
                if (typeof photo == "object") {
                    formatPhotoToModal_callback(photo);
                    // 如果传入的参数为photo_id，异步获取photo对象
                } else {
                    context.loadPhoto(photo, function (photo) {
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

        common_utils.extendNonNull(true, config, options);

        pointer.uploadModal = $(config.selector.uploadModal);
        pointer.updateModal = $(config.selector.updateModal);

        //提交上传事件
        pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').click(function () {
            var files = pointer.uploadPhotos || pointer.uploadModal.find('input[name="photos"]')[0].files;
            if (files == null || files[0] == undefined || files[0] == null) {
                toastr.error("未选择文件呢");
                return;
            }
            this.setAttribute("disabled", "disabled");
            var photoInfo = {};
            photoInfo.album_id = config.albumId;
            photoInfo.name = pointer.uploadModal.find('input[name="photo_name"]').val();
            photoInfo.refer = pointer.uploadModal.find('input[name="photo_refer"]').val();
            photoInfo.description = pointer.uploadModal.find('textarea[name="photo_desc"]').val();
            var topic = {};
            var needCheckTopic = true;
            var selectTopicNode = pointer.uploadModal.find('.topic-select option:selected');
            topic.name = selectTopicNode.attr("value");
            topic.description = photoInfo.name;
            if (selectTopicNode.hasClass("empty-topic")) {
                topic.ptwid = 0;
                needCheckTopic = false;
            }
            var selectTopicPermissionNode = pointer.uploadModal.find('.topic-permission-select option:selected');
            if (selectTopicPermissionNode.hasClass("default-permission")) {
                topic.scope = config.albumId;
            } else if (selectTopicPermissionNode.hasClass("permission-follow-album")) {
                topic.scope = selectTopicPermissionNode.attr("value");
            } else {
                topic.scope = 0;
                topic.permission = parseInt(selectTopicPermissionNode.attr("value"));
            }
            photoInfo.topic = topic;
            var tags = "";
            pointer.uploadModal.find(".tags-modify").find(".tag-content").each(function (i, tag) {
                var tags_value = tag.innerText;
                if (/^mount@\d+$/.test(tags_value) || tags_value == topic.name) {
                    tags = "#" + tags_value + "#" + tags;
                } else {
                    tags += "#" + tags_value + "#";
                }
            });
            if (topic.ptwid && tags.indexOf(topic.name) == -1) {
                tags = "#" + topic.name + "#" + tags;
            }
            photoInfo.tags = (tags == "##" ? "" : tags);
            if (photoInfo.description.length >= 2000) {
                toastr.error("描述字数" + photoInfo.description.length + "过长, 应在2000字内", "错误", {"progressBar": false});
                this.removeAttribute("disabled");
                return;
            }
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    if (needCheckTopic) {
                        loadOrCreateTopic(topic, function (tagWrapper) {
                            photoInfo.topic = tagWrapper;
                            uploadPhoto(files, photoInfo);
                        });
                    } else {
                        uploadPhoto(files, photoInfo);
                    }
                } else {
                    toastr.error("登陆状态失效，请重新登录！");
                    this.removeAttribute("disabled");
                }
            }, true);
        });

        //更新图片事件
        pointer.updateModal.find('button[name="updatePhoto_trigger"]').click(function () {
            var tags_modify_dom = pointer.updateModal.find('.tags-modify');
            var tags_input_dom = tags_modify_dom.find(".tag-input");
            if (tags_input_dom.val() != "") {
                utils.addTagFromInput(tags_modify_dom, tags_input_dom);
            }
            var photo = {};
            photo.photo_id = pointer.updateModal.find('span[name="photo_id"]').html().trim();
            photo.name = pointer.updateModal.find('input[name="photo_name"]').val();
            photo.refer = pointer.updateModal.find('input[name="photo_refer"]').val();
            photo.description = pointer.updateModal.find('textarea[name="photo_desc"]').val();
            var topic = {};
            var needCheckTopic = true;
            var selectTopicNode = pointer.updateModal.find('.topic-select option:selected');
            topic.name = selectTopicNode.attr("value");
            topic.description = photo.name;
            if (selectTopicNode.hasClass("empty-topic")) {
                topic.ptwid = 0;
                needCheckTopic = false;
            } else {
                if (selectTopicNode.hasClass("before-topic")) {
                    topic.ptwid = selectTopicNode.attr("data-ptwid");
                    needCheckTopic = false;
                }
            }
            var selectTopicPermissionNode = pointer.updateModal.find('.topic-permission-select option:selected');
            if (selectTopicPermissionNode.hasClass("permission-follow-album")) {
                topic.scope = selectTopicPermissionNode.attr("value");
            } else {
                topic.scope = 0;
                topic.permission = parseInt(selectTopicPermissionNode.attr("value"));
            }
            if (!needCheckTopic && topic.ptwid != 0 && !selectTopicPermissionNode.hasClass("before-topic-permission")) {
                needCheckTopic = true;
            }
            photo.topic = topic;
            var tags = "";
            tags_modify_dom.find(".tag-content").each(function (i, tag) {
                var tags_value = tag.innerText;
                if (/^mount@\d+$/.test(tags_value) || tags_value == topic.name) {
                    tags = "#" + tags_value + "#" + tags;
                } else {
                    tags += "#" + tags_value + "#";
                }
            });
            if (topic.ptwid != 0 && tags.indexOf(topic.name) == -1) {
                tags = "#" + topic.name + "#" + tags;
            }
            photo.tags = (tags == "##" ? "" : tags);
            if (photo.description.length >= 2000) {
                toastr.error("描述字数" + photo.description.length + "过长, 应在2000字内", "错误", {"progressBar": false});
                return;
            }
            var file = pointer.updateModal.find('input[name="photo_file"]')[0].files[0];
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    if (needCheckTopic) {
                        loadOrCreateTopic(topic, function (tagWrapper) {
                            photo.topic = tagWrapper;
                            updatePhoto(photo, file);
                        });
                    } else {
                        updatePhoto(photo, file);
                    }
                } else {
                    toastr.error("登陆状态失效，请重新登录！");
                }
            }, false);
        });

        //删除图片事件
        pointer.updateModal.find('button[name="deletePhoto_trigger"]').click(function () {
            var photo_id = pointer.updateModal.find('span[name="photo_id"]').html().trim();
            if (window.confirm("确定要删除此图片吗？")) {
                deletePhoto(photo_id);
            }
        });

        // 切换按钮
        pointer.updateModal.find(".update-convert-photo-url").click(function (e) {
            var _self = $(this);
            _self.css("font-weight", "bold").parent().find(".update-convert-photo-refer").css("font-weight", "normal");
            _self.closest(".form-group").find('.update-photo-url').css("display", "block");
            _self.closest(".form-group").find('.update-photo-refer').css("display", "none");
        });
        pointer.updateModal.find(".update-convert-photo-refer").click(function (e) {
            var _self = $(this);
            _self.css("font-weight", "bold").parent().find(".update-convert-photo-url").css("font-weight", "normal");
            _self.closest(".form-group").find('.update-photo-url').css("display", "none");
            _self.closest(".form-group").find('.update-photo-refer').css("display", "block");
        });

        // topic选择
        utils.applyTopicToSelect(pointer.uploadModal.find('.topic-select'), null, null);
        utils.applyTopicPermissionToSelect(pointer.uploadModal.find('.topic-permission-select'), null, config.albumId);
        pointer.uploadModal.find('.topic-select').change(function () {
            var selectTopicNode = $(this).find('option:selected');
            if (!selectTopicNode.hasClass("empty-topic")) {
                if (selectTopicNode.hasClass("before-topic")) {
                    pointer.uploadModal.find('.topic-permission-select .before-topic-permission').prop("selected", true);
                } else {
                    pointer.uploadModal.find('.topic-permission-select .default-permission').prop("selected", true);
                }
                var queryArgs = {
                    "uid": login_handle.getCurrentUserId(),
                    "name": selectTopicNode.attr("value"),
                    "action": -1
                };
                loadTagWrapper(queryArgs, function (photoTopic) {
                    var current_album_id = config.albumId;
                    utils.applyTopicPermissionToSelect(pointer.uploadModal.find('.topic-permission-select'), photoTopic, current_album_id);
                });
            }
        });
        pointer.updateModal.find('.topic-select').change(function () {
            var selectTopicNode = $(this).find('option:selected');
            if (!selectTopicNode.hasClass("empty-topic")) {
                if (selectTopicNode.hasClass("before-topic")) {
                    pointer.updateModal.find('.topic-permission-select .before-topic-permission').prop("selected", true);
                } else {
                    pointer.updateModal.find('.topic-permission-select .default-permission').prop("selected", true);
                }
                var queryArgs = {
                    "uid": login_handle.getCurrentUserId(),
                    "name": selectTopicNode.attr("value"),
                    "action": -1
                };
                loadTagWrapper(queryArgs, function (photoTopic) {
                    var current_album_id = pointer.updateModal.find('span[name="photo_id"]').attr("data-album-id");
                    utils.applyTopicPermissionToSelect(pointer.updateModal.find('.topic-permission-select'), photoTopic, current_album_id);
                });
            }
        });

        // 打开topic
        pointer.updateModal.find(".topic-select").closest(".form-group").find("label").click(function () {
            var $topic_select = pointer.updateModal.find(".topic-select");
            if ($topic_select.is(":visible")) {
                var topicId = $topic_select.find("option:selected").attr("data-ptwid");
                if (topicId) {
                    window.open("p/topic/" + topicId);
                }
            }
        });

        // 新标签打开照片
        pointer.updateModal.find(".open-update-photo-url").click(function () {
            var url = $(this).prev().val();
            if (url) {
                window.open(url);
            } else {
                toastr.error("照片链接为空呢~");
            }
        });

        // 打开照片的相关链接
        pointer.updateModal.find(".open-update-photo-refer").click(function () {
            var url = $(this).prev().val();
            if (url) {
                window.open(url);
            } else {
                toastr.info("你还没有设置相关页面呢~");
            }
        });

        //复制图片地址
        initClipboard(config.selector.copyPhotoUrlTrigger, config.selector.updateModal);

        //下载图片事件
        pointer.updateModal.find('a[name="photo_path"]').click(function () {
            downloadPhoto(this.getAttribute("path"), config.downloadType);
        });

        // upload modal tags 输入框 绑定事件
        var upload_tags_modify_dom = pointer.uploadModal.find('.tags-modify');
        pointer.uploadModal.on('shown.bs.modal', function () {
            utils.calcTagInputWidth(upload_tags_modify_dom);
        });
        upload_tags_modify_dom.on("click", ".tag-close", function (e) { // 删除
            utils.deleteTag(upload_tags_modify_dom, $(e.currentTarget.parentNode));
        });
        upload_tags_modify_dom.on({ // 提交
            "keydown": function (e) {
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                if (code == 13) {
                    utils.addTagFromInput(upload_tags_modify_dom, $(e.currentTarget));
                    upload_tags_modify_dom.closest(".form-group").find(".tags-edit-btn").text("编辑");
                    // 防止触发表单提交 返回false
                    // e.preventDefault();
                    return false;
                }
            },
            "blur": function (e) {
                var input_dom = $(e.currentTarget);
                // upload_tags_modify_dom.find(".tag-single").length == 0
                if (input_dom.val() != "") {
                    utils.addTagFromInput(upload_tags_modify_dom, input_dom);
                    upload_tags_modify_dom.closest(".form-group").find(".tags-edit-btn").text("编辑");
                }
            }
        }, ".tag-input");
        upload_tags_modify_dom.closest(".form-group").find("label").dblclick(function () { // 双击标签全部编辑
            upload_tags_modify_dom.closest(".form-group").find(".tags-edit-btn").click();
        });
        upload_tags_modify_dom.closest(".form-group").find(".tags-edit-btn").on("click", function (e) {
            var $btn = $(this);
            if ($btn.text() == '确定') {
                upload_tags_modify_dom.find(".tag-input").blur();
                return;
            }
            var tags = "";
            upload_tags_modify_dom.find(".tag-content").each(function (i, tag) {
                tags += "#" + tag.innerText;
            });
            if (tags) {
                upload_tags_modify_dom.find(".tag-input").val(tags);
                upload_tags_modify_dom.find(".tag-single").remove();
                utils.calcTagInputWidth(upload_tags_modify_dom);
                upload_tags_modify_dom.autoTextareaHeight({
                    maxHeight: 150,
                    minHeight: config.tagsAreaHeight,
                    runOnce: true
                });
                $btn.text("确定");
                utils.applyTopicToSelect(pointer.uploadModal.find('.topic-select'), null, null);
                utils.applyTopicPermissionToSelect(pointer.uploadModal.find('.topic-permission-select'), null, config.albumId);
            }
        });

        // update modal tags 输入框 绑定事件
        var update_tags_modify_dom = pointer.updateModal.find('.tags-modify');
        pointer.updateModal.on('shown.bs.modal', function () { // 计算输入框宽度
            pointer.updateModal.find('textarea[name="photo_desc"]').autoTextareaHeight({
                maxHeight: 200,
                minHeight: config.textareaInputHeight,
                runOnce: true
            });
            if (update_tags_modify_dom.find(".tag-input").length > 0) {
                utils.calcTagInputWidth(update_tags_modify_dom);
                // console.log(tags_modify_dom.outerHeight(true) + "_ " + tags_modify_dom.prop("scrollHeight"));
                update_tags_modify_dom.autoTextareaHeight({
                    maxHeight: 150,
                    minHeight: config.tagsAreaHeight,
                    runOnce: true
                });
            }
        });
        update_tags_modify_dom.on("click", ".tag-close", function (e) {
            utils.deleteTag(update_tags_modify_dom, $(e.currentTarget.parentNode));
        });
        update_tags_modify_dom.on({
            "keydown": function (e) {
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                if (code == 13) {
                    utils.addTagFromInput(update_tags_modify_dom, $(e.currentTarget));
                    update_tags_modify_dom.closest(".form-group").find(".tags-edit-btn").text("编辑");
                    // 防止触发表单提交 返回false
                    // e.preventDefault();
                    return false;
                }
            },
            "blur": function (e) {
                var input_dom = $(e.currentTarget);
                // update_tags_modify_dom.find(".tag-single").length == 0
                if (input_dom.val() != "") {
                    update_tags_modify_dom.closest(".form-group").find(".tags-edit-btn").text("编辑");
                    utils.addTagFromInput(update_tags_modify_dom, input_dom);
                }
            }
        }, ".tag-input");
        // 可自定义事件修改标签被点击的事件
        config.tagExtendClickEvent = null;
        update_tags_modify_dom.on({
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
                    utils.triggerEvent(config.event.tagExtendClick, tag, photo_id, clickEvt, config.tagExtendClickEvent);
                } else {
                    utils.triggerEvent(config.event.tagClick, tag, photo_id, clickEvt);
                }
            }
        }, ".tag-content");
        update_tags_modify_dom.closest(".form-group").find("label").dblclick(function () { // 双击标签全部编辑
            update_tags_modify_dom.closest(".form-group").find(".tags-edit-btn").click();
        });
        update_tags_modify_dom.closest(".form-group").find(".tags-edit-btn").on("click", function (e) {
            var $btn = $(this);
            if ($btn.text() == '确定') {
                update_tags_modify_dom.find(".tag-input").blur();
                return;
            }
            var tags = "";
            update_tags_modify_dom.find(".tag-content").each(function (i, tag) {
                tags += "#" + tag.innerText;
            });
            if (tags) {
                update_tags_modify_dom.find(".tag-input").val(tags);
                update_tags_modify_dom.find(".tag-single").remove();
                utils.calcTagInputWidth(update_tags_modify_dom);
                update_tags_modify_dom.autoTextareaHeight({
                    maxHeight: 150,
                    minHeight: config.tagsAreaHeight,
                    runOnce: true
                });
                $btn.text("确定");
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
        pointer.uploadModal.find('.tags-modify').css("overflow-y", "hidden").autoTextareaHeight({
            maxHeight: 150,
            minHeight: config.tagsAreaHeight
        });
    };
    var uploadPhoto = function (files, photoInfo, index, photos) {
        index = arguments[2] || 0;
        photos = arguments[3] || [];
        if (index == 0) {
            if (photoInfo.topic) {
                $.each(photoInfo.topic, function (k, v) {
                    if (k == "ptwid" || k == "name" || k == "scope" || k == "permission" || k == "description") {
                        if (v !== null && v !== undefined) {
                            photoInfo["topic." + k] = v;
                        }
                    }
                });
                delete photoInfo.topic;
            }
        }
        var file = files[index];
        if (config.maxUploadSize != -1 && file.size > config.maxUploadSize) {
            toastr.error("换个小的，最大" + (config.maxUploadSize / (1024 * 1024)) + "M", file['name'], {timeOut: 0});
            console.warn("Error : 文件超过大小 - " + file['name']);
            index++;
            pointer.failUploadNum += 1;
            if (index > files.length - 1) {
                common_utils.removeNotify("notify_uploading");
                toastr.success("上传完成！");
                if (pointer.failUploadNum !== 0) {
                    toastr.error("因超过大小，" + pointer.failUploadNum + "张照片未上传！", "", {timeOut: 0});
                }
                pointer.uploadModal.modal('hide');
                pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr("disabled");
                pointer.uploadModal.find('input[name="photos"]').val("");
                config.callback.allUploadCompleted.call(context, context, photos); // 回调
                pointer.uploadPhotos = null;
            } else {
                uploadPhoto(files, photoInfo, index, photos);
            }
            return;
        }
        var data = new FormData();
        data.append("file", file);
        data.append("originName", (file.name.lastIndexOf(".") != -1 ? file.name : (file.name + ".jpg")));
        $.each(photoInfo, function (key, value) {
            data.append(key, value);
        });
        var call = function () {
            var notify_uploading = common_utils.getNotify("notify_uploading");
            if (notify_uploading) {
                notify_uploading.find(".toast-message").text("正在上传第 " + (index + 1) + " 张");
            } else {
                common_utils.notify({
                    "progressBar": false,
                    "hideDuration": 0,
                    "showDuration": 0,
                    "timeOut": 0,
                    "closeButton": false
                }).success("正在上传第 " + (index + 1) + " 张", "", "notify_uploading");
            }
            $.ajax({
                url: "photo.api?method=upload",
                data: data,
                type: "POST",
                contentType: false,
                cache: false,
                processData: false,
                success: function (response) {
                    if (response.status == 200) {
                        var data = response.data;
                        config.callback.eachUploadCompleted.call(context, context, data.photo); // 回调
                        utils.triggerEvent(config.event.eachUploadCompleted, data.photo);
                        photos.push(data.photo);
                        index++;
                        if (index > files.length - 1) {
                            common_utils.removeNotify("notify_uploading");
                            toastr.success("上传完成！");
                            if (pointer.failUploadNum !== 0) {
                                toastr.error("因超过大小，" + pointer.failUploadNum + "张照片未上传！", "", {timeOut: 0});
                            }
                            pointer.uploadModal.modal('hide');
                            pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr("disabled");
                            pointer.uploadModal.find('input[name="photos"]').val("");
                            config.callback.allUploadCompleted.call(context, context, photos); // 回调
                            utils.triggerEvent(config.event.allUploadCompleted, photos);
                            pointer.uploadPhotos = null;
                        } else {
                            uploadPhoto(files, photoInfo, index, photos);
                        }
                    } else {
                        common_utils.removeNotify("notify_uploading");
                        toastr.error(response.message, file['name'] + ", 上传失败", {timeOut: 0});
                        console.warn("Error Code: " + file['name'] + " upload fail - " + response.status);
                        pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr("disabled");
                    }
                },
                error: function () {
                    common_utils.removeNotify("notify_uploading");
                    toastr.error(file['name'] + " 上传失败", "未知错误", {timeOut: 0});
                    pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr("disabled");
                    pointer.uploadPhotos = null;
                }
            });
        };
        // 上传之前回调
        utils.triggerEvent(config.event.beforeEachUpload, photoInfo, file, data);
        var deferred = config.callback.beforeEachUpload.call(context, context, photoInfo, file, data);
        if (deferred && deferred.promise) {
            deferred.done(call);
        } else {
            call();
        }
    };
    var updatePhoto = function (photo, file) {
        if (photo.topic) {
            $.each(photo.topic, function (k, v) {
                if (k == "ptwid" || k == "name" || k == "scope" || k == "permission" || k == "description") {
                    if (v !== null && v !== undefined) {
                        photo["topic." + k] = v;
                    }
                }
            });
            delete photo.topic;
        }
        if (photo != null && photo.photo_id) {
            var call = null;
            var formData = undefined;
            if (file && /^image.*/.test(file.type)) { // 如果指定了文件，则更新图片文件
                var formData = new FormData();
                formData.append("file", file);
                formData.append("originName", (file.name.lastIndexOf(".") != -1 ? file.name : (file.name + ".jpg")));
                $.each(photo, function (key, value) {
                    formData.append(key, value);
                });
                call = function () {
                    $.ajax({
                        url: "photo.api?method=update",
                        data: formData,
                        type: "POST",
                        contentType: false,
                        cache: false,
                        processData: false,
                        success: function (response) {
                            pointer.updateModal.find('button[name="updatePhoto_trigger"]').removeAttr("disabled");
                            common_utils.removeNotify("notify_updating");
                            if (response.status == 200) {
                                var data = response.data;
                                toastr.success("更新成功", "", {"progressBar": false});
                                config.callback.updateCompleted.call(context, context, data.photo);
                                utils.triggerEvent(config.event.updateCompleted, data.photo);
                                pointer.updateModal.modal('hide');
                            } else {
                                toastr.error(response.message, "错误", {"progressBar": false});
                                console.warn("Error Code: " + response.status);
                            }
                            pointer.updateModal.find('input[name="photo_file"]').val("");
                        },
                        error: function (XHR, TS) {
                            pointer.updateModal.find('button[name="updatePhoto_trigger"]').removeAttr("disabled");
                            common_utils.removeNotify("notify_updating");
                            toastr.error(TS, "错误", {"progressBar": false});
                            console.warn("Error Code: " + TS);
                        }
                    });
                };
            } else { // 如果没有指定了文件
                call = function () {
                    $.post("photo.api?method=update", photo, function (response) {
                        pointer.updateModal.find('button[name="updatePhoto_trigger"]').removeAttr("disabled");
                        common_utils.removeNotify("notify_updating");
                        if (response.status == 200) {
                            var data = response.data;
                            toastr.success("更新成功", "", {"progressBar": false});
                            pointer.updateModal.modal('hide');
                            config.callback.updateCompleted.call(context, context, data.photo); // 回调
                            utils.triggerEvent(config.event.updateCompleted, data.photo);
                        } else {
                            toastr.error(response.message, "错误", {"progressBar": false});
                            console.warn("Error Code: " + response.status);
                        }
                        pointer.updateModal.find('input[name="photo_file"]').val("")
                    }).fail(function (XHR, TS) {
                        pointer.updateModal.find('button[name="updatePhoto_trigger"]').removeAttr("disabled");
                        common_utils.removeNotify("notify_updating");
                        toastr.error(TS, "错误", {"progressBar": false});
                        console.warn("Error Code: " + TS);
                    });
                };
            }
            common_utils.notify({
                "progressBar": false,
                "hideDuration": 0,
                "showDuration": 0,
                "timeOut": 0,
                "closeButton": false
            }).success("正在更新图片~", "", "notify_updating");
            pointer.updateModal.find('button[name="updatePhoto_trigger"]').attr("disabled", "disabled");
            // 更新之前回调
            utils.triggerEvent(config.event.beforeUpdate, photo, file, formData);
            var deferred = config.callback.beforeUpdate.call(context, context, photo, file, formData);
            if (!(deferred && deferred.promise)) {
                deferred = $.when();
            }
            deferred.done(call);
        }
    };
    var deletePhoto = function (photo_id) {
        if (photo_id && photo_id != "0") {
            var params = {"photo_id": photo_id};
            var call = function () {
                $.post("photo.api?method=delete", params, function (response) {
                    if (response.status == 200) {
                        toastr.success("删除成功", "", {"progressBar": false});
                        pointer.updateModal.modal('hide');
                        config.callback.deleteCompleted.call(context, context, params); // 回调
                        utils.triggerEvent(config.event.deleteCompleted, photo_id);
                    } else {
                        toastr.error(response.message, "错误", {"progressBar": false});
                        console.warn("Error Code: " + response.status);
                    }
                });
            };
            var allow = utils.triggerEvent(config.event.beforeDelete, params);
            if (allow === false) {
                return;
            }
            var deferred = config.callback.beforeDelete.call(context, context, params);
            if (!(deferred && deferred.promise)) {
                deferred = $.when();
            }
            deferred.done(call);
        }
    };
    var loadPhoto = function (photo_id, success) {
        return $.get("photo.api?method=getPhoto", {"id": photo_id}, function (response) {
            if (response.status == 200) {
                success(response.data.photo);
            } else {
                toastr.error(response.message, "加载失败");
                console.warn("Error Code: " + response.status);
            }
        });
    };
    var loadOrCreateTopic = function (topic, call) {
        return $.get("photo.api?method=getOrCreateTopic", topic, function (response) {
            if (response.status == 200) {
                call(response.data.tagWrapper);
            } else {
                toastr.error(response.message, "加载失败");
                console.warn("Error Code: " + response.status);
            }
        });
    };
    var loadTagWrapper = function (tagWrapper, call) {
        return $.get("photo.api?method=getTagWrapper", tagWrapper, function (response) {
            if (response.status == 200) {
                call(response.data.tagWrapper);
            } else if (response.status != 404) {
                toastr.error(response.message, "加载失败");
                console.warn("Error Code: " + response.status);
            } else if (response.status == 404) {
                console.warn("Error Code: " + response.status);
            }
        });
    };
    var downloadPhoto = function (url, downloadType, fileName) {
        downloadType = downloadType || "url";
        if (downloadType == "ajax") {
            common_utils.ajaxDownload(url, function (blob) {
                common_utils.downloadBlobFile(blob, fileName || url.substring(url.lastIndexOf('/') + 1));
                toastr.success("已下载！", "", {"progressBar": false});
            });
        } else {
            common_utils.downloadUrlFile(url, fileName);
            toastr.success("已下载！", "", {"progressBar": false});
        }
    };
    var openUploadPhotoModal = function (files) {
        if (!login_handle.validateLogin()) {
            toastr.error("你没有登录！");
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
                pointer.uploadModal.find('input[name="photos"]').closest(".form-group").hide();
                pointer.uploadModal.find('.modal-title').text("上传图片（已选择 " + images.length + " 张图片）");
                pointer.uploadPhotos = images;
            } else {
                pointer.uploadModal.find('input[name="photos"]').closest(".form-group").show();
                pointer.uploadModal.find('.modal-title').text("上传图片");
                pointer.uploadPhotos = null;
            }
        } else {
            pointer.uploadModal.find('input[name="photos"]').closest(".form-group").show();
            pointer.uploadModal.find('.modal-title').text("上传图片");
            pointer.uploadPhotos = null;
        }
        var openUploadModal_callback = function (album_id) {
            config.albumId = album_id;
            pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr("disabled");
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
            // load to modal
            var photo_url = "p/detail/" + photo.photo_id;
            pointer.updateModal.find('span[name="photo_id"]').text(photo.photo_id).attr("data-album-id", photo.album_id).parent().attr("href", photo_url);
            pointer.updateModal.find('.copy-input').val(photo.path);
            pointer.updateModal.find('a[name="photo_path"]').attr("path", photo.path);
            pointer.updateModal.find('input[name="photo_refer"]').val(photo.refer);
            pointer.updateModal.find('input[name="photo_name"]').val(photo.name);
            pointer.updateModal.find('textarea[name="photo_desc"]').val(photo.description);
            pointer.updateModal.find('span[name="photo_size"]').html(photo.size + "KB（" + photo.width + "×" + photo.height + "）");
            pointer.updateModal.find('span[name="photo_upload_time"]').html(photo.upload_time);
            if (isAuthor) {
                pointer.updateModal.find('.update-convert-photo-url').attr("title", "原始文件名：" + photo.originName).attr("data-origin-name", photo.originName);
            } else {
                pointer.updateModal.find('.update-convert-photo-url').attr("title", "").attr("data-origin-name", "");
            }

            // css
            var dialogStyle = isAuthor ? "0px" : "30px";
            pointer.updateModal.find('.modal-dialog').css("margin-top", dialogStyle);

            // define btn by user type
            var fileStyle = isAuthor ? "block" : "none";
            var btnStyle = isAuthor ? "inline-block" : "none";
            pointer.updateModal.find('input[name="photo_file"]').val("").closest(".form-group").css("display", fileStyle);
            pointer.updateModal.find('button[name="deletePhoto_trigger"]').css("display", btnStyle);
            pointer.updateModal.find('button[name="updatePhoto_trigger"]').css("display", btnStyle);

            // 照片标签
            photo.tags = photo.tags || "";
            var tags_modify_dom = pointer.updateModal.find('.tags-modify').eq(0).css("height", "");
            if (isAuthor) {
                // show
                tags_modify_dom.closest(".form-group").show().find(".tags-edit-btn").show();
                // css
                tags_modify_dom.addClass("form-control");
                tags_modify_dom.css("overflow-y", "hidden").closest(".form-group").css("padding-top", "").next().css("padding-top", "7px");
                // html
                var tags_str = '';
                $.each(photo.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single"><a class="tag-content" target="_blank" href="p/tag/' + encodeURIComponent(tag) + '">' + tag + '</a>' +
                            '<span class="tag-close">&times</span></span>';
                    }
                });
                tags_str += '<input type="text" class="tag-input" name="tag_input" title="回车完成输入" placeholder="回车完成输入"/>';
                // tags_modify_dom.prop("outerHTML", "");
                // tags_modify_dom.replaceWith(tags_str);
                tags_modify_dom.html(tags_str);
                pointer.updateModal.find('.tags-edit-btn').text("编辑");
            } else if (!isAuthor && photo.tags) {
                // show
                tags_modify_dom.closest(".form-group").show().find(".tags-edit-btn").hide();
                // css
                tags_modify_dom.removeClass("form-control");
                tags_modify_dom.css("overflow-y", "").closest(".form-group").css("padding-top", "7px").next().css("padding-top", "");
                // html
                var tags_str = '';
                $.each(photo.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single" style="margin-right: 6px;"><a class="tag-content"  target="_blank" href="p/tag/' + encodeURIComponent(tag) + '">' + tag + '</a></span>';
                    }
                });
                tags_modify_dom.html(tags_str);
            } else {
                // hide
                tags_modify_dom.closest(".form-group").hide();
                // html
                tags_modify_dom.find(".tag-single").remove();
                // css
                tags_modify_dom.css("overflow-y", "").closest(".form-group").next().css("padding-top", "7px");
            }
            var photoTopic = null;
            if (photo.topic && photo.topic.ptwid) {
                photoTopic = photo.topic;
            }
            if (isAuthor) {
                // 合集名称选择
                var topic_select_dom = pointer.updateModal
                    .find('.form-group .topic-name').text("").parent().attr("href", "").hide()
                    .closest(".form-group").show()
                    .find("label").text("合集名称 / 权限：")
                    .closest(".form-group")
                    .find('.topic-select,.topic-permission-select').parent().show(0).find(".topic-select");
                utils.applyTopicToSelect(topic_select_dom, photo.tags, photoTopic);
                // 合集权限选择
                utils.applyTopicPermissionToSelect(pointer.updateModal.find('.topic-permission-select'), photoTopic, photo.album_id);
            } else if (photoTopic) {
                pointer.updateModal
                    .find('.form-group .topic-name').text(photo.topic.name).parent().attr("href", "p/topic/" + photoTopic.ptwid).show()
                    .closest(".form-group").show()
                    .find("label").text("合集名称：")
                    .closest(".form-group")
                    .find('.topic-select,.topic-permission-select').html("").parent().hide(0);
            } else {
                pointer.updateModal
                    .find('.form-group .topic-name').text("").parent().attr("href", "")
                    .closest(".form-group").hide()
                    .find('.topic-select,.topic-permission-select').html("");
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
            toastr.success("图片地址复制成功！", "提示", {"progressBar": false});
            console.info('已复制Text:', e.text);
            e.clearSelection();
        });
        clipboard.on('error', function (e) {
            console.error('复制错误', "提示", {"progressBar": false});
            console.error('Action:', e.action);
            console.error('Trigger:', e.trigger);
        });
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
            var width = total_width - left_width - 1;
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
                var topic_select_dom = tags_modify_dom.closest(".modal-body").find('.topic-select');
                var insert_text = "";
                $.each(tag.split(/[#×✖,，;；]/), function (i, value) {
                    if (value) {
                        // 标记处还原原始值
                        var match = value.match(/replaceEL_[\d]{1}/);
                        match && (value = value.replace(match[0], elMap[match[0]]));
                        if (value.indexOf("#") == -1) {
                            insert_text += '<span class="tag-single"><a class="tag-content"  target="_blank" href="p/tag/' + encodeURIComponent(value) + '">' + value + '</a><span class="tag-close"">&times</span></span>';
                            if (topic_select_dom.find('option[value="' + value + '"]').length == 0) {
                                topic_select_dom.append('<option value="' + value + '">' + value + '</option>');
                            }
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
                    // input_dom.prevAll().find(".tag-close").unbind("click").click(function (e) {
                    //     utils.deleteTag(tags_modify_dom, $(e.currentTarget.parentNode));
                    // });
                }
                input_dom.val("");
            } else {
                toastr.error("输入的单个标签不能为空或全是空格！，标签栏为空可以", "", {"progressBar": false, "timeOut": 7000});
            }
        },
        "deleteTag": function (tags_modify_dom, tag_single) {
            var tagName = tag_single.find("a").text();
            var tagNameCount = 0;
            tags_modify_dom.find(".tag-content").each(function (i, tag) {
                if (tagName == tag.innerText) {
                    tagNameCount++;
                }
            });
            if (tagNameCount == 1) {
                var topic_select_dom = tags_modify_dom.closest(".modal-body").find('.topic-select');
                topic_select_dom.find('option[value="' + tagName + '"]').remove();
            }
            tag_single.remove();
            utils.calcTagInputWidth(tags_modify_dom);
            tags_modify_dom.autoTextareaHeight({
                maxHeight: 150,
                minHeight: config.tagsAreaHeight,
                runOnce: true
            });
        },
        "applyTopicToSelect": function (topic_select_dom, tags, photoTopic) {
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
            topic_select_dom.html(topic_option_str);
            topic_select_dom.find(".before-topic").prop("selected", true);
        },
        "applyTopicPermissionToSelect": function (topic_permission_select_dom, photoTopic, current_album_id) {
            !current_album_id && (current_album_id = 0);
            var topic_permission_option_str = '';
            if (photoTopic != null && photoTopic.scope > 0 && photoTopic.scope != current_album_id) {
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
            topic_permission_select_dom.html(topic_permission_option_str);
            if (photoTopic != null && photoTopic.scope == 0) {
                topic_permission_select_dom.find('option.permission-no-follow[value="' + photoTopic.permission + '"]')
                    .addClass("before-topic-permission").prop("selected", true);
            } else {
                topic_permission_select_dom.find('option.permission-follow-album[value="' + (photoTopic ? photoTopic.scope : current_album_id) + '"]')
                    .addClass("before-topic-permission").prop("selected", true);
            }
        }
    };
    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "utils": utils,
        "uploadPhoto": uploadPhoto,
        "updatePhoto": updatePhoto,
        "deletePhoto": deletePhoto,
        "loadPhoto": loadPhoto,
        "loadOrCreateTopic": loadOrCreateTopic,
        "loadTagWrapper": loadTagWrapper,
        "downloadPhoto": downloadPhoto,
        "openUploadPhotoModal": openUploadPhotoModal,
        "openUpdatePhotoModal": openUpdatePhotoModal
    };
    return context;

});