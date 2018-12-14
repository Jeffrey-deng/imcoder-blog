/**
 * 相册照片处理模块
 * Created by Jeffrey.Deng on 2018/1/11.
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
            "eachUploadCompleted": function (context, photo) {  // 每一个图片上传完成后回调
                return;
            },
            "allUploadCompleted": function (context, photos) {  // 所有图片上传完成后回调
                return;
            },
            "updateCompleted": function (context, photo) {  // 更新完成后回调
                return;
            },
            "deleteCompleted": function (context, photo_id) {  // 删除完成后回调
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
                    context.loadPhoto(photo, function (data) {
                        var photo = data.photo;
                        formatPhotoToModal_callback(photo);
                    });
                }
            }
        },
        event: { // 以事件方式添加回调，以便支持多个回调，这时定义的是事件名
            "eachUploadCompleted": "photo.upload.completed",
            "allUploadCompleted": "photo.upload.all.completed",
            "updateCompleted": "photo.update.completed",
            "deleteCompleted": "photo.delete.completed"
        },
        albumId: 0,
        downloadType: "url",
        maxUploadSize: 10 * 1024 * 1024
    };
    var init = function (options) {

        $.extend(true, config, options);

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
            photoInfo.description = pointer.uploadModal.find('textarea[name="photo_desc"]').val();
            photoInfo.iscover = pointer.uploadModal.find('input[name="photo_cover"]:checked').val();
            (files.length > 1) && (photoInfo.iscover = 0);
            var tags = "";
            pointer.uploadModal.find(".tags-modify").find(".tag-content").each(function (i, tag) {
                var tags_value = tag.innerText;
                if (/^mount@\d+$/.test(tags_value)) {
                    tags = "#" + tags_value + tags;
                } else {
                    tags += "#" + tags_value;
                }
            });
            photoInfo.tags = (tags == "#" ? "" : tags);
            if (photoInfo.description.length >= 1000) {
                toastr.error("描述字数" + photoInfo.description.length + "过长, 应在1000字内", "错误", {"progressBar": false});
                this.removeAttribute("disabled");
                return;
            }
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    uploadPhoto(files, photoInfo);
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
            photo.description = pointer.updateModal.find('textarea[name="photo_desc"]').val();
            photo.iscover = pointer.updateModal.find('input[name="photo_cover"]:checked').val();
            var tags = "";
            tags_modify_dom.find(".tag-content").each(function (i, tag) {
                var tags_value = tag.innerText;
                if (/^mount@\d+$/.test(tags_value)) {
                    tags = "#" + tags_value + tags;
                } else {
                    tags += "#" + tags_value;
                }
            });
            photo.tags = (tags == "#" ? "" : tags);
            if (photo.description.length >= 1000) {
                toastr.error("描述字数" + photo.description.length + "过长, 应在1000字内", "错误", {"progressBar": false});
                return;
            }
            var file = pointer.updateModal.find('input[name="photo_file"]')[0].files[0];
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    updatePhoto(photo, file);
                } else {
                    toastr.error("登陆状态失效，请重新登录！");
                }
            }, false);
        });

        //删除图片事件
        pointer.updateModal.find('button[name="deletePhoto_trigger"]').click(function () {
            var photo_id = pointer.updateModal.find('span[name="photo_id"]').html().trim();
            deletePhoto(photo_id);
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
        upload_tags_modify_dom.find(".tag-input").keydown(function (e) {
            e.defaultPrevented;
            var theEvent = e || window.event;
            var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
            if (code == 13) {
                utils.addTagFromInput(upload_tags_modify_dom, $(e.currentTarget));
                //防止触发表单提交 返回false
                return false;
            }
        }).blur(function (e) {
            var input_dom = $(e.currentTarget);
            if (upload_tags_modify_dom.find(".tag-single").length == 0 && input_dom.val() != "") {
                utils.addTagFromInput(upload_tags_modify_dom, input_dom);
            }
        });

        // div 自适应高度
        $.fn.autoTextarea = function (options) {
            var defaults = {
                maxHeight: null,//文本框是否自动撑高，默认：null，不自动撑高；如果自动撑高必须输入数值，该值作为文本框自动撑高的最大高度
                minHeight: $(this).height(), //默认最小高度，也就是文本框最初的高度，当内容高度小于这个高度的时候，文本以这个高度显示
                runOnce: false // false 为绑定事件 true 为 计算一次高度，不绑定事件
            };
            var opts = $.extend({}, defaults, options);
            var updateHeight = function () {
                var height, style = this.style;
                this.style.height = opts.minHeight + 'px';
                if (this.scrollHeight >= opts.minHeight) {
                    if (opts.maxHeight && this.scrollHeight > opts.maxHeight) {
                        height = opts.maxHeight;
                        style.overflowY = 'scroll';
                    } else {
                        height = this.scrollHeight;
                        style.overflowY = 'hidden';
                    }
                    style.height = height + 'px';
                }
            };
            if (opts.runOnce) {
                $(this).each(function () {
                    updateHeight.call(this);
                });
            } else {
                $(this).each(function () {
                    $(this).bind("input paste cut keydown keyup focus blur", function () {
                        updateHeight.call(this);
                    });
                });
            }
        };

        //  desc textArea 自适应高度
        config.textareaInputHeight = pointer.updateModal.find('textarea[name="photo_desc"]').outerHeight();
        pointer.updateModal.find('textarea[name="photo_desc"]').autoTextarea({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });
        pointer.uploadModal.find('textarea[name="photo_desc"]').autoTextarea({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });

        // tags 输入框自适应高度
        config.tagsAreaHeight = pointer.updateModal.find('.tags-modify').eq(0).outerHeight();
        pointer.updateModal.find('.tags-modify').autoTextarea({
            maxHeight: 100,
            minHeight: config.tagsAreaHeight
        });
        pointer.uploadModal.find('.tags-modify').css("overflow-y", "hidden").autoTextarea({
            maxHeight: 100,
            minHeight: config.tagsAreaHeight
        });
    };
    var uploadPhoto = function (files, photoInfo, index, photos) {
        index = arguments[2] || 0;
        photos = arguments[3] || [];

        var file = files[index];
        if (file.size > config.maxUploadSize) {
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
                pointer.uploadModal.find('input[name="photo_cover"][value="0"]').prop("checked", true);
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
        data.append("album_id", photoInfo.album_id);
        data.append("name", photoInfo.name);
        data.append("description", photoInfo.description);
        data.append("tags", photoInfo.tags);
        data.append("iscover", photoInfo.iscover);
        var notify_uploading = common_utils.getNotify("notify_uploading");
        if (notify_uploading) {
            notify_uploading.find(".toast-message").text("正在上传第 " + (index + 1) + " 张");
        } else {
            common_utils.notify({
                "progressBar": false,
                "hideDuration": 0,
                "timeOut": 0,
                "closeButton": false
            }).success("正在上传第 " + (index + 1) + " 张", "", "notify_uploading");
        }
        $.ajax({
            url: "photo.do?method=upload",
            data: data,
            type: "POST",
            contentType: false,
            cache: false,
            processData: false,
            success: function (data) {
                if (data.flag == 200) {
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
                        pointer.uploadModal.find('input[name="photo_cover"][value="0"]').prop("checked", true);
                        pointer.uploadModal.find('input[name="photos"]').val("");
                        config.callback.allUploadCompleted.call(context, context, photos); // 回调
                        utils.triggerEvent(config.event.allUploadCompleted, photos);
                        pointer.uploadPhotos = null;
                    } else {
                        uploadPhoto(files, photoInfo, index, photos);
                    }
                } else {
                    common_utils.removeNotify("notify_uploading");
                    toastr.error(data.info, file['name'] + ", 上传失败", {timeOut: 0});
                    console.warn("Error Code: " + file['name'] + " upload fail - " + data.flag);
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
    var updatePhoto = function (photo, file) {
        if (photo != null && photo.photo_id > 0) {
            if (file && /^image.*/.test(file.type)) { // 如果指定了文件，则更新图片文件
                var formData = new FormData();
                formData.append("file", file);
                formData.append("originName", (file.name.lastIndexOf(".") != -1 ? file.name : (file.name + ".jpg")));
                $.each(photo, function (key, value) {
                    formData.append(key, value);
                });
                $.ajax({
                    url: "photo.do?method=update",
                    data: formData,
                    type: "POST",
                    contentType: false,
                    cache: false,
                    processData: false,
                    success: function (data) {
                        if (data.flag == 200) {
                            toastr.success("更新成功", "", {"progressBar": false});
                            loadPhoto(photo.photo_id, function (data) {
                                config.callback.updateCompleted.call(context, context, data.photo);
                                utils.triggerEvent(config.event.updateCompleted, data.photo);
                            });
                            pointer.updateModal.modal('hide');
                        } else {
                            toastr.error(data.info, "错误", {"progressBar": false});
                            console.warn("Error Code: " + data.flag);
                        }
                        pointer.updateModal.find('input[name="photo_file"]').val("");
                    },
                    error: function (XHR, TS) {
                        toastr.error(TS, "错误", {"progressBar": false});
                        console.warn("Error Code: " + TS);
                    }
                });
            } else { // 如果没有指定了文件
                $.post("photo.do?method=update", photo, function (data) {
                    if (data.flag == 200) {
                        toastr.success("更新成功", "", {"progressBar": false});
                        pointer.updateModal.modal('hide');
                        config.callback.updateCompleted.call(context, context, photo); // 回调
                        utils.triggerEvent(config.event.updateCompleted, photo);
                    } else {
                        toastr.error(data.info, "错误", {"progressBar": false});
                        console.warn("Error Code: " + data.flag);
                    }
                    pointer.updateModal.find('input[name="photo_file"]').val("")
                });
            }
        }
    };
    var deletePhoto = function (photo_id) {
        if (window.confirm("确定要删除此图片吗？")) {
            $.post("photo.do?method=delete", {"photo_id": photo_id}, function (data) {
                if (data.flag == 200) {
                    toastr.success("删除成功", "", {"progressBar": false});
                    pointer.updateModal.modal('hide');
                    config.callback.deleteCompleted.call(context, context, photo_id); // 回调
                    utils.triggerEvent(config.event.deleteCompleted, photo_id);
                } else {
                    toastr.error(data.info, "错误", {"progressBar": false});
                    console.warn("Error Code: " + data.flag);
                }
            });
        }
    };
    var loadPhoto = function (photo_id, success) {
        $.get("photo.do?method=detailByAjax", {"id": photo_id}, function (data) {
            if (data.flag == 200) {
                success(data);
            } else {
                toastr.error(data.info, "加载失败");
                console.warn("Error Code: " + data.flag);
            }
        });
    };
    var downloadPhoto = function (url, downloadType) {
        downloadType = downloadType || "url";
        if (downloadType == "ajax") {
            common_utils.ajaxDownload(url, function (blob) {
                common_utils.downloadBlobFile(blob, url.substring(url.lastIndexOf('/') + 1));
                toastr.success("已下载！", "", {"progressBar": false});
            });
        } else {
            common_utils.downloadUrlFile(url);
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
                pointer.uploadModal.find('input[name="photos"]').parent().hide();
                pointer.uploadModal.find('.modal-title').text("上传图片（已选择 " + images.length + " 张图片）");
                pointer.uploadPhotos = images;
            } else {
                pointer.uploadModal.find('input[name="photos"]').parent().show();
                pointer.uploadModal.find('.modal-title').text("上传图片");
                pointer.uploadPhotos = null;
            }
        } else {
            pointer.uploadModal.find('input[name="photos"]').parent().show();
            pointer.uploadModal.find('.modal-title').text("上传图片");
            pointer.uploadPhotos = null;
        }
        var openUploadModal_callback = function (album_id) {
            config.albumId = album_id;
            pointer.uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr("disabled");
            pointer.uploadModal.find('input[name="photo_cover"][value="0"]').prop("checked", true);
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
            var photo_album_url = "photo.do?method=album_detail&id=" + photo.album_id + "&check=" + photo.photo_id;
            pointer.updateModal.find('span[name="photo_id"]').text(photo.photo_id).parent().attr("href", photo_album_url);
            pointer.updateModal.find('.copy-input').val(config.path_params.cloudPath + photo.path);
            pointer.updateModal.find('a[name="photo_path"]').attr("path", config.path_params.cloudPath + photo.path);
            pointer.updateModal.find('input[name="photo_name"]').val(photo.name);
            pointer.updateModal.find('textarea[name="photo_desc"]').val(photo.description);
            pointer.updateModal.find('input[name="photo_cover"]').each(function () {
                if ($(this).val() == photo.iscover) {
                    $(this).prop("checked", true);
                }
            });
            pointer.updateModal.find('span[name="photo_size"]').html(photo.size + "KB（" + photo.width + "×" + photo.height + "）");
            pointer.updateModal.find('span[name="photo_upload_time"]').html(photo.upload_time);
            if (isAuthor) {
                pointer.updateModal.find('.copy-input').prev().attr("title", "原始文件名：" + photo.originName)
            }

            // css
            var dialogStyle = isAuthor ? "0px" : "30px";
            pointer.updateModal.find('.modal-dialog').css("margin-top", dialogStyle);

            // define btn by user type
            var fileStyle = isAuthor ? "block" : "none";
            var btnStyle = isAuthor ? "inline-block" : "none";
            pointer.updateModal.find('input[name="photo_file"]').val("").parent().css("display", fileStyle);
            pointer.updateModal.find('button[name="deletePhoto_trigger"]').css("display", btnStyle);
            pointer.updateModal.find('button[name="updatePhoto_trigger"]').css("display", btnStyle);

            // 照片标签
            photo.tags = photo.tags || "";
            var tags_modify_dom = pointer.updateModal.find('.tags-modify').eq(0);
            if (isAuthor) {
                // show
                tags_modify_dom.parent().show();
                // css
                tags_modify_dom.addClass("form-control");
                tags_modify_dom.css("overflow-y", "hidden").parent().css("padding-top", "").next().css("padding-top", "7px");
                // html
                var tags_str = '';
                $.each(photo.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single"><a class="tag-content" target="_blank" href="photo.do?method=dashboard&model=photo&tags=' + tag + '">' + tag + '</a>' +
                            '<span class="tag-close">X</span></span>';
                    }
                });
                tags_str += '<input type="text" class="tag-input" name="tag_input"/>';
                //tags_modify_dom.prop("outerHTML", "");
                //tags_modify_dom.replaceWith(tags_str);
                tags_modify_dom.html(tags_str);
                // 事件
                tags_modify_dom.find(".tag-close").click(function (e) {
                    utils.deleteTag(tags_modify_dom, $(e.currentTarget.parentNode));
                });
                tags_modify_dom.find(".tag-input").keydown(function (e) {
                    e.defaultPrevented;
                    var theEvent = e || window.event;
                    var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                    if (code == 13) {
                        utils.addTagFromInput(tags_modify_dom, $(e.currentTarget));
                        //防止触发表单提交 返回false
                        return false;
                    }
                }).blur(function (e) {
                    var input_dom = $(e.currentTarget);
                    if (tags_modify_dom.find(".tag-single").length == 0 && input_dom.val() != "") {
                        utils.addTagFromInput(tags_modify_dom, input_dom);
                    }
                });
            } else if (!isAuthor && photo.tags) {
                // show
                tags_modify_dom.parent().show();
                // css
                tags_modify_dom.removeClass("form-control");
                tags_modify_dom.css("overflow-y", "").parent().css("padding-top", "7px").next().css("padding-top", "");
                // html
                var tags_str = '';
                $.each(photo.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single" style="margin-right: 6px;"><a class="tag-content"  target="_blank" href="photo.do?method=dashboard&model=photo&tags=' + tag + '">' + tag + '</a></span>';
                    }
                });
                tags_modify_dom.html(tags_str);
            } else {
                // hide
                tags_modify_dom.parent().hide();
                // html
                tags_modify_dom.find(".tag-single").remove();
                // css
                tags_modify_dom.css("overflow-y", "").parent().next().css("padding-top", "7px");
            }
            // 计算输入框宽度
            pointer.updateModal.unbind("shown.bs.modal");
            pointer.updateModal.on('shown.bs.modal', function () {
                pointer.updateModal.find('textarea[name="photo_desc"]').autoTextarea({
                    maxHeight: 200,
                    minHeight: config.textareaInputHeight,
                    runOnce: true
                });
                if (isAuthor) {
                    utils.calcTagInputWidth(tags_modify_dom);
                    //console.log(tags_modify_dom.outerHeight(true) + "_ " + tags_modify_dom.prop("scrollHeight"));
                    tags_modify_dom.autoTextarea({
                        maxHeight: 100,
                        minHeight: config.tagsAreaHeight,
                        runOnce: true
                    });
                }
            });
            pointer.updateModal.modal('show');
        };
        config.callback.beforeUpdateModalOpen.call(context, context, pointer.updateModal, formatPhotoToModal_callback, photo); // 回调
    };
    var initClipboard = function (bindElementSelector, containerId) {
        var clipboard = new Clipboard(bindElementSelector, {
            container: $(containerId).get(0) //html所在模态框ID
        });

        /*if(!clipboard.isSupported()) {
         console.error('该浏览器不支持Clipboard复制');
         }*/
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
        "bindEvent": function (eventName, func) {
            $(context).bind(eventName, func);
        },
        "triggerEvent": function (eventName) {
            $(context).triggerHandler(eventName, Array.prototype.slice.call(arguments, 1));
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
            tag_single_nodes.each(function (i, tag_single) {
                if (tag_single.offsetTop == maxOffset) {
                    left_width += $(tag_single).width();
                }
            });
            var width = total_width - left_width - 70;
            tags_modify_dom.find(".tag-input").width(width > 20 ? width : total_width);
        },
        "addTagFromInput": function (tags_modify_dom, input_dom) {
            var tag = input_dom.val();
            if (tag && !/^[ ]+$/.test(tag)) {
                // 如果要使用分割字符, 用 ""、{}、${} 包裹
                var elMap = {};
                tag = common_utils.replaceByEL(tag, function (index, key) {
                    var replaceFlag = "replaceEL_" + index;
                    elMap[replaceFlag] = key;
                    return replaceFlag;
                });
                var insert_text = "";
                $.each(tag.split(/[#,，;；X]/), function (i, value) {
                    if (value) {
                        // 标记处还原原始值
                        var match = value.match(/replaceEL_[\d]{1}/);
                        match && (value = value.replace(match[0], elMap[match[0]]));
                        insert_text += '<span class="tag-single"><a class="tag-content"  target="_blank" href="photo.do?method=dashboard&model=photo&tags=' + value + '">' + value + '</a><span class="tag-close"">X</span></span>';
                    }
                });
                if (insert_text) {
                    input_dom.before(insert_text);
                    utils.calcTagInputWidth(tags_modify_dom);
                    input_dom.prevAll().find(".tag-close").unbind("click").click(function (e) {
                        utils.deleteTag(tags_modify_dom, $(e.currentTarget.parentNode));
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
            tags_modify_dom.autoTextarea({
                maxHeight: 100,
                minHeight: config.tagsAreaHeight,
                runOnce: true
            });
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
        "downloadPhoto": downloadPhoto,
        "openUploadPhotoModal": openUploadPhotoModal,
        "openUpdatePhotoModal": openUpdatePhotoModal
    };
    return context;

});