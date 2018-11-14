/**
 * 视频处理模块
 * @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'clipboard', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.video_handle = factory(window.jQuery, null, toastr, Clipboard, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, Clipboard, common_utils, login_handle) {

    var pointer = {
        uploadModal: null,
        updateModal: null
    };
    var config = {
        path_params: {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        },
        selector: {
            "uploadModal": "#uploadVideoModal",
            "updateModal": "#updateVideoModal",
            "copyVideoUrlTrigger": ".copyVideoUrl_btn"
        },
        callback: {
            "uploadCompleted": function (context, video) {  // 视频上传完成后回调
                return;
            },
            "updateCompleted": function (context, video) {  // 更新完成后回调
                return;
            },
            "deleteCompleted": function (context, video_id) {  // 删除完成后回调
                return;
            },
            "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {  // 上传窗口打开前回调
                var hostUser = context.config.hostUser;
                context.loadAlbums(hostUser, function (data) {
                    openUploadModal_callback(data.albums);
                });
            },
            "beforeUpdateModalOpen": function (context, updateModal, formatVideoToModal_callback, video) {  // 更新窗口打开前回调
                // 如果openUpdateVideoModal传入的参数为video对象，直接使用
                if (typeof video == "object") {
                    formatVideoToModal_callback(video);
                    // 如果传入的参数为video_id，异步获取video对象
                } else {
                    context.loadVideo(video, function (data) {
                        var video = data.video;
                        formatVideoToModal_callback(video);
                    });
                }
            }
        },
        event: { // 以事件方式添加回调，以便支持多个回调，这时定义的是事件名
            "uploadCompleted": "video.upload.completed",
            "updateCompleted": "video.update.completed",
            "deleteCompleted": "video.delete.completed"
        },
        hostUser: 0,
        downloadType: "url",
        maxUploadSize: 1024 * 1024 * 1024
    };
    var init = function (options) {

        $.extend(true, config, options);

        pointer.uploadModal = $(config.selector.uploadModal);
        pointer.updateModal = $(config.selector.updateModal);

        pointer.uploadModal.find('input[name="video_permission"][value="0"]').prop("checked", true);
        pointer.video_permission = 0;
        pointer.uploadModal.find('input[name="video_permission"]').click(function (e) {
            pointer.video_permission = $(this).val();
        });

        // 切换视频上传的类型
        pointer.uploadModal.find('select[name="video_source_type"]').change(function (e) {
            var key = $(this).val();
            if (key == 0) {
                pointer.uploadModal.find('input[name="video_file"]').parent().show(100);
                pointer.uploadModal.find('textarea[name="video_code"]').parent().hide(100);
            } else if (key == 1) {
                pointer.uploadModal.find('input[name="video_file"]').parent().hide(100);
                pointer.uploadModal.find('textarea[name="video_code"]').parent().show(100);
            } else {
                pointer.uploadModal.find('input[name="video_file"]').parent().hide(100);
                pointer.uploadModal.find('textarea[name="video_code"]').parent().show(100);
            }
        });

        // 定义上传视频时切换 “封面使用 相册中已上传的图片 还是 上传新的图片” 的事件，以封面ID输入框值是否为0作为判断依据
        pointer.uploadModal.find('input[name="cover_file"]').prev().find(".convert-upload-cover").click(function (e) {
            $(this).css("font-weight", "bold").parent().find(".convert-select-cover").css("font-weight", "normal");
            pointer.uploadModal.find('select[name="cover_album_id"]').parent().show(100);
            pointer.uploadModal.find('input[name="cover_photo_id"]').css("display", "none");
            pointer.uploadModal.find('input[name="cover_file"]').css("display", "block");
        });
        pointer.uploadModal.find('input[name="cover_file"]').prev().find(".convert-select-cover").click(function (e) {
            $(this).css("font-weight", "bold").parent().find(".convert-upload-cover").css("font-weight", "normal");
            pointer.uploadModal.find('select[name="cover_album_id"]').parent().hide(100);
            pointer.uploadModal.find('input[name="cover_file"]').css("display", "none");
            pointer.uploadModal.find('input[name="cover_photo_id"]').css("display", "block").val("0"); // point!
        });

        //提交上传事件
        pointer.uploadModal.find('button[name="uploadVideo_trigger"]').click(function () {
            var videoInfo = {};
            var coverInfo = {};
            var cover_id = parseInt(pointer.uploadModal.find('input[name="cover_photo_id"]').val());
            if (cover_id && cover_id > 0) {
                coverInfo.photo_id = cover_id;
            } else {
                var coverFiles = pointer.uploadModal.find('input[name="cover_file"]')[0].files;
                if (coverFiles == null || coverFiles[0] == undefined || coverFiles[0] == null) {
                    toastr.error("未选择封面文件呢");
                    return;
                }
            }
            videoInfo.source_type = pointer.uploadModal.find('select[name="video_source_type"]').val();
            if (videoInfo.source_type == 0) {
                var files = pointer.uploadModal.find('input[name="video_file"]')[0].files;
                if (files == null || files[0] == undefined || files[0] == null) {
                    toastr.error("未选择文件呢");
                    return;
                }
            } else if (videoInfo.source_type == 1) {
                videoInfo.path = pointer.uploadModal.find('textarea[name="video_code"]').val();
            } else {
                videoInfo.code = pointer.uploadModal.find('textarea[name="video_code"]').val();
            }
            videoInfo.name = pointer.uploadModal.find('input[name="video_name"]').val();
            videoInfo.description = pointer.uploadModal.find('textarea[name="video_desc"]').val();
            videoInfo.permission = pointer.uploadModal.find('input[name="video_permission"]:checked').val();
            var tags = "";
            pointer.uploadModal.find(".tags-modify").find(".tag-content").each(function (i, tag) {
                tags += "#" + tag.innerText;
            });
            videoInfo.tags = (tags == "#" ? "" : tags);

            coverInfo.album_id = pointer.uploadModal.find('select[name="cover_album_id"]').val();
            coverInfo.name = videoInfo.name;
            coverInfo.description = videoInfo.description;
            if (videoInfo.tags.indexOf("#视频") == -1) {
                coverInfo.tags = "#视频" + videoInfo.tags;
            } else {
                coverInfo.tags = videoInfo.tags;
            }
            videoInfo.cover = coverInfo;

            if (videoInfo.description.length >= 1000) {
                toastr.error("描述字数" + videoInfo.description.length + "过长, 应在1000字内", "错误", {"progressBar": false});
                this.removeAttribute("disabled");
                return;
            }
            if (coverInfo.album_id == 0) {
                toastr.error("未选择相册", "错误", {"progressBar": false});
                return;
            }
            if (videoInfo.source_type == 1 && !videoInfo.path) {
                toastr.error("未输入视频链接", "错误", {"progressBar": false});
                return;
            }
            if (videoInfo.source_type == 2 && !videoInfo.code) {
                toastr.error("未输入引用代码块", "错误", {"progressBar": false});
                return;
            }

            this.setAttribute("disabled", "disabled");
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    uploadVideo((videoInfo.source_type == 0 ? files[0] : null), ((cover_id && cover_id > 0) ? null : coverFiles[0]), videoInfo);
                } else {
                    toastr.error("登陆状态失效，请重新登录！");
                    this.removeAttribute("disabled");
                }
            }, true);
        });

        // 切换更新视频时上传的类型
        pointer.updateModal.find('select[name="video_source_type"]').change(function (e) {
            var key = $(this).val();
            if (key == 0) {
                pointer.updateModal.find('input[name="video_file"]').parent().show(100);
                pointer.updateModal.find('textarea[name="video_code"]').parent().hide(100);
                var video_href_node = pointer.updateModal.find('.copy-input').parent();
                if (video_href_node.hasClass("user-upload-video")) { // 如果该视频是用户上传的（不是引用的），则显示链接
                    video_href_node.show(0);
                } else {
                    video_href_node.hide(0);
                }
            } else if (key == 1) {
                pointer.updateModal.find('input[name="video_file"]').parent().hide(100);
                pointer.updateModal.find('textarea[name="video_code"]').parent().show(100);
                pointer.updateModal.find('.copy-input').parent().hide(0);
            } else {
                pointer.updateModal.find('input[name="video_file"]').parent().hide(100);
                pointer.updateModal.find('textarea[name="video_code"]').parent().show(100);
                pointer.updateModal.find('.copy-input').parent().hide(0);
            }
        });

        // 定义更新视频时切换 “封面使用 相册中已上传的图片 还是 上传新的图片” 的事件，以是否选择了图片文件为判断依据
        pointer.updateModal.find('input[name="cover_file"]').prev().find(".convert-upload-cover").click(function (e) {
            $(this).css("font-weight", "bold").parent().find(".convert-select-cover").css("font-weight", "normal");
            pointer.updateModal.find('select[name="cover_album_id"]').parent().show(100);
            pointer.updateModal
                .find('input[name="cover_photo_id"]').css("display", "none")
                .parent().find('input[name="cover_file"]').css("display", "block").val(""); // point!
        });
        pointer.updateModal.find('input[name="cover_file"]').prev().find(".convert-select-cover").click(function (e) {
            $(this).css("font-weight", "bold").parent().find(".convert-upload-cover").css("font-weight", "normal");
            pointer.updateModal.find('select[name="cover_album_id"]').parent().hide(100);
            pointer.updateModal
                .find('input[name="cover_file"]').css("display", "none")
                .parent().find('input[name="cover_photo_id"]').css("display", "block");
        });

        //更新视频事件
        pointer.updateModal.find('button[name="updateVideo_trigger"]').click(function () {
            var videoInfo = {};
            var coverInfo = {};
            videoInfo.video_id = pointer.updateModal.find('span[name="video_id"]').html().trim();
            if (!videoInfo.video_id) {
                toastr.error("代码出错~");
                return;
            }
            var coverFiles = pointer.updateModal.find('input[name="cover_file"]')[0].files;
            var uploadNewCover = false;
            if (coverFiles == null || coverFiles[0] == undefined || coverFiles[0] == null) {
                var cover_id = parseInt(pointer.updateModal.find('input[name="cover_photo_id"]').val()) || 0;
                if (cover_id && cover_id > 0) {
                    coverInfo.photo_id = cover_id;
                } else {
                    coverInfo.photo_id = 0;
                    toastr.error("你既未选择新封面文件，又未指定已上传的封面ID呢");
                    return;
                }
            } else {
                uploadNewCover = true;
            }
            videoInfo.source_type = pointer.updateModal.find('select[name="video_source_type"]').val();
            var uploadNewVideo = false;
            if (videoInfo.source_type == 0) {
                var files = pointer.updateModal.find('input[name="video_file"]')[0].files;
                if (files == null || files[0] == undefined || files[0] == null) {
                    if (!pointer.updateModal.find('.copy-input').parent().hasClass("user-upload-video")) {
                        toastr.error("未选择视频文件呢");
                        return;
                    }
                } else {
                    uploadNewVideo = true;
                }
            } else if (videoInfo.source_type == 1) {
                videoInfo.path = pointer.updateModal.find('textarea[name="video_code"]').val();
            } else {
                videoInfo.code = pointer.updateModal.find('textarea[name="video_code"]').val();
            }
            videoInfo.name = pointer.updateModal.find('input[name="video_name"]').val();
            videoInfo.description = pointer.updateModal.find('textarea[name="video_desc"]').val();
            videoInfo.permission = pointer.updateModal.find('input[name="video_permission"]:checked').val();
            var tags = "";
            pointer.updateModal.find(".tags-modify").find(".tag-content").each(function (i, tag) {
                tags += "#" + tag.innerText;
            });
            videoInfo.tags = (tags == "#" ? "" : tags);

            coverInfo.album_id = parseInt(pointer.updateModal.find('select[name="cover_album_id"]').val()) || 0;
            coverInfo.name = videoInfo.name;
            coverInfo.description = videoInfo.description;
            if (videoInfo.tags.indexOf("#视频") == -1) {
                coverInfo.tags = "#视频" + videoInfo.tags;
            } else {
                coverInfo.tags = videoInfo.tags;
            }
            videoInfo.cover = coverInfo;

            if (videoInfo.description.length >= 1000) {
                toastr.error("描述字数" + videoInfo.description.length + "过长, 应在1000字内", "错误", {"progressBar": false});
                this.removeAttribute("disabled");
                return;
            }
            if (uploadNewCover && !(coverInfo.album_id > 0)) {
                toastr.error("未选择相册", "错误", {"progressBar": false});
                return;
            }
            if (videoInfo.source_type == 1 && !videoInfo.path) {
                toastr.error("未输入视频链接", "错误", {"progressBar": false});
                return;
            }
            if (videoInfo.source_type == 2 && !videoInfo.code) {
                toastr.error("未输入引用代码块", "错误", {"progressBar": false});
                return;
            }

            /*            console.log("videoInfo: ", videoInfo);
             console.log("coverFiles: ", coverFiles);
             console.log("files: ", files);*/

            this.setAttribute("disabled", "disabled");
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    updateVideo((uploadNewVideo ? files[0] : null), (uploadNewCover ? coverFiles[0] : null), videoInfo);
                } else {
                    toastr.error("登陆状态失效，请重新登录！");
                    this.removeAttribute("disabled");
                }
            }, true);
        });

        //删除视频事件
        pointer.updateModal.find('button[name="deleteVideo_trigger"]').click(function () {
            var video_id = pointer.updateModal.find('span[name="video_id"]').html().trim();
            deleteVideo(video_id);
        });

        //复制视频地址
        initClipboard(config.selector.copyVideoUrlTrigger, config.selector.updateModal);

        //下载视频事件
        pointer.updateModal.find('a[name="video_path"]').click(function () {
            //downloadVideo(this.getAttribute("path"), config.downloadType);
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
        config.textareaInputHeight = pointer.updateModal.find('textarea[name="video_desc"]').outerHeight();
        pointer.updateModal.find('textarea[name="video_desc"]').autoTextarea({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });
        pointer.uploadModal.find('textarea[name="video_desc"]').autoTextarea({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });
        pointer.updateModal.find('textarea[name="video_code"]').autoTextarea({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });
        pointer.uploadModal.find('textarea[name="video_code"]').autoTextarea({
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

    var uploadVideo = function (file, coverFile, videoInfo) {
        var photoInfo = videoInfo.cover;
        var data = new FormData();
        // video
        data.append("name", videoInfo.name);
        data.append("description", videoInfo.description);
        data.append("tags", videoInfo.tags);
        data.append("source_type", videoInfo.source_type);
        if (videoInfo.source_type == 1) {
            data.append("path", videoInfo.path);
        } else if (videoInfo.source_type == 2) {
            data.append("code", videoInfo.code);
        } else {
            data.append("videoFile", file);
            data.append("originName", (file.name.lastIndexOf(".") != -1 ? file.name : (file.name + ".mp4")));
        }
        data.append("permission", videoInfo.permission);
        // photo
        if (photoInfo.photo_id && photoInfo.photo_id > 0) {
            data.append("cover.photo_id", photoInfo.photo_id);
        } else {
            data.append("coverFile", coverFile);
            data.append("cover.originName", (coverFile.name.lastIndexOf(".") != -1 ? coverFile.name : (coverFile.name + ".jpg")));
            data.append("cover.album_id", photoInfo.album_id);
            data.append("cover.name", photoInfo.name);
            data.append("cover.description", photoInfo.description);
            data.append("cover.tags", photoInfo.tags);
            data.append("cover.iscover", 0);
        }
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("正在上传视频", "", "notify_uploading");
        $.ajax({
            url: "video.do?method=upload",
            data: data,
            type: "POST",
            contentType: false,
            cache: false,
            processData: false,
            success: function (data) {
                pointer.uploadModal.find('input[name="cover_photo_id"]').val("0");
                if (data.flag == 200) {
                    common_utils.removeNotify("notify_uploading");
                    toastr.success("上传完成！");
                    config.callback.uploadCompleted.call(context, context, data.video); // 回调
                    utils.triggerEvent(config.event.uploadCompleted, data.video);
                    pointer.uploadModal.modal('hide');
                    pointer.uploadModal.find('button[name="uploadVideo_trigger"]').removeAttr("disabled");
                    pointer.uploadModal.find('input[name="video_file"]').val("");
                    pointer.uploadModal.find('input[name="cover_file"]').val("");
                } else {
                    file == null && (file = {"name": "文件为空"});
                    common_utils.removeNotify("notify_uploading");
                    toastr.error(data.info, file.name + ", 上传失败", {timeOut: 0});
                    console.log("Error Code: " + file.name + " upload fail - " + data.flag);
                    pointer.uploadModal.find('button[name="uploadVideo_trigger"]').removeAttr("disabled");
                }
            },
            error: function () {
                file == null && (file = {"name": "文件为空"});
                common_utils.removeNotify("notify_uploading");
                toastr.error(file.name + " 上传失败", "未知错误", {timeOut: 0});
                pointer.uploadModal.find('button[name="uploadVideo_trigger"]').removeAttr("disabled");
                pointer.uploadModal.find('input[name="cover_photo_id"]').val("0");
            }
        });
    };
    var updateVideo = function (videoFile, coverFile, videoInfo) {
        console.log(videoFile, coverFile, videoInfo);
        pointer.updateModal.find('button[name="updateVideo_trigger"]').removeAttr("disabled");
        toastr.error("更新功能开发中~");
    };
    var deleteVideo = function (video_id) {
        toastr.error("删除功能开发中~");
    };

    var loadVideo = function (video_id, callback) {
        var video_param = null;
        if (typeof video_id == "object") {
            video_param = video_id;
        } else {
            video_param = {"video_id": video_id};
        }
        $.get("video.do?method=detailByAjax", video_param, function (data) {
            if (data.flag != 200) {
                toastr.error(data.info, "加载视频失败");
                console.log("Load video found error, Error Code: " + data.flag);
            }
            callback(data);
        });
    };

    var loadAlbums = function (uid, success) {
        $.get("photo.do?method=albumListByAjax", {"user.uid": uid}, function (data) {
            if (data.flag == 200) {
                success(data);
            } else {
                toastr.error(data.info, "加载相册列表失败");
                console.warn("Error Code: " + data.flag);
            }
        });
    };

    var openUploadVideoModal = function (files) {
        if (!login_handle.validateLogin()) {
            toastr.error("你没有登录！");
            login_handle.jumpLogin();
            return false;
        }
        var openUploadModal_callback = function (albums) {
            var album_select_dom = pointer.uploadModal.find('select[name="cover_album_id"]');
            var options_str = '';
            var selectValue = "0";
            if (albums == null || albums.length == 0) {
                options_str = '<option value="0">无相册</option>';
            } else {
                $.each(albums, function (index, album) {
                    options_str += '<option value="' + album.album_id + '">' + album.name + '</option>';
                });
                if (album_select_dom[0].options.length > 0) {
                    selectValue = album_select_dom.val();
                } else {
                    selectValue = albums[0].album_id + "";
                }
            }
            album_select_dom.html(options_str).val(selectValue);
            pointer.uploadModal.find('input[name="video_permission"]').each(function () {
                if ($(this).val() == pointer.video_permission) {
                    $(this).prop("checked", true);
                }
            });
            pointer.uploadModal.find('button[name="uploadVideo_trigger"]').removeAttr("disabled");
            pointer.uploadModal.modal('show');
        };
        config.callback.beforeUploadModalOpen.call(context, context, pointer.uploadModal, openUploadModal_callback); // 回调
        return true;
    };

    /**
     * 打开视频信息更新窗口
     * @param {Integer|Object} video - 可为video_id或video对象
     *          默认处理：对于窗口所需video对象，如果传入为video对象则直接使用，如果为video_id则调用loadVideo异步获取；
     *                    如需修改可重写回调方法beforeUpdateModalOpen，该方法的参数video由此处的video参数传入；
     *          异步获取：异步获取video对象参考beforeUpdateModalOpen默认写法；
     *                    或异步获取完video对象后再将该对象传入此方法；
     */
    var openUpdateVideoModal = function (video) {
        var formatVideoToModal_callback = function (video) {
            var isAuthor = login_handle.equalsLoginUser(video.user.uid);
            // load to modal
            var video_url = "redirect.do?model=album&photo_id=" + video.cover.photo_id;
            pointer.updateModal.find('span[name="video_id"]').text(video.video_id).parent().attr("href", video_url);
            pointer.updateModal.find('input[name="video_name"]').val(video.name);
            pointer.updateModal.find('textarea[name="video_desc"]').val(video.description);
            pointer.updateModal.find('input[name="video_permission"]').each(function () {
                if ($(this).val() == video.permission) {
                    $(this).prop("checked", true);
                }
            });
            pointer.updateModal.find('select[name="video_source_type"]').val(video.source_type);
            if (video.source_type == 1) {
                pointer.updateModal.find('.copy-input').val("").parent().removeClass("user-upload-video").hide();
                pointer.updateModal.find('textarea[name="video_code"]').val(video.path).parent().show();
            } else if (video.source_type == 2) {
                pointer.updateModal.find('.copy-input').val("").parent().removeClass("user-upload-video").hide();
                pointer.updateModal.find('textarea[name="video_code"]').val(video.code).parent().show();
            } else {
                pointer.updateModal.find('textarea[name="video_code"]').val("").parent().hide();
                pointer.updateModal
                    .find('.copy-input').val(config.path_params.cloudPath + video.path)
                    .parent().addClass("user-upload-video").show().// 如果该视频是用户上传的（不是引用的），则添加标记类: .user-upload-video
                find('a[name="video_path"]').attr("path", config.path_params.cloudPath + video.path);
            }
            pointer.updateModal.find('span[name="video_size"]').html(video.size + "MB（" + video.width + "×" + video.height + "）");
            pointer.updateModal.find('span[name="video_upload_time"]').html(video.upload_time);
            pointer.updateModal.find('select[name="cover_album_id"]').parent().hide(0);
            pointer.updateModal
                .find('input[name="cover_file"]').css("display", "none")
                .parent().css("display", (isAuthor ? "block" : "none")).find('input[name="cover_photo_id"]').css("display", "block").val(video.cover.photo_id);
            if (isAuthor && video.source_type == 0) {
                pointer.updateModal.find('.copy-input').prev().attr("title", "原始文件名：" + video.originName)
            }

            // css
            var dialogStyle = isAuthor ? "0px" : "30px";
            pointer.updateModal.find('.modal-dialog').css("margin-top", dialogStyle);

            // define btn by user type
            var fileStyle = isAuthor && (video.source_type == 0) ? "block" : "none";
            var btnStyle = isAuthor ? "inline-block" : "none";
            pointer.updateModal.find('input[name="video_file"]').val("").parent().css("display", fileStyle);
            pointer.updateModal.find('button[name="deleteVideo_trigger"]').css("display", btnStyle);
            pointer.updateModal.find('button[name="updateVideo_trigger"]').css("display", btnStyle);

            // 视频标签
            video.tags = video.tags || "";
            var tags_modify_dom = pointer.updateModal.find('.tags-modify').eq(0);
            if (isAuthor) {
                // show
                tags_modify_dom.parent().show();
                // css
                tags_modify_dom.addClass("form-control");
                tags_modify_dom.css("overflow-y", "hidden").parent().css("padding-top", "").next().css("padding-top", "7px");
                // html
                var tags_str = '';
                $.each(video.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single"><a class="tag-content" target="_blank" href="video.do?method=dashboard&model=video&tags=' + tag + '">' + tag + '</a>' +
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
            } else if (!isAuthor && video.tags) {
                // show
                tags_modify_dom.parent().show();
                // css
                tags_modify_dom.removeClass("form-control");
                tags_modify_dom.css("overflow-y", "").parent().css("padding-top", "7px").next().css("padding-top", "");
                // html
                var tags_str = '';
                $.each(video.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single" style="margin-right: 6px;"><a class="tag-content"  target="_blank" href="video.do?method=dashboard&model=video&tags=' + tag + '">' + tag + '</a></span>';
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
                pointer.updateModal.find('textarea[name="video_desc"]').autoTextarea({
                    maxHeight: 200,
                    minHeight: config.textareaInputHeight,
                    runOnce: true
                });
                if (isAuthor) {
                    pointer.updateModal.find('textarea[name="video_code"]').autoTextarea({
                        maxHeight: 200,
                        minHeight: config.textareaInputHeight,
                        runOnce: true
                    });
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
        config.callback.beforeUpdateModalOpen.call(context, context, pointer.updateModal, formatVideoToModal_callback, video); // 回调
    };
    var initClipboard = function (bindElementSelector, containerId) {
        if ($(containerId).find(bindElementSelector).length <= 0) {
            return;
        }
        var clipboard = new Clipboard(bindElementSelector, {
            container: $(containerId).get(0) //html所在模态框ID
        });

        /*if(!clipboard.isSupported()) {
         console.error('该浏览器不支持Clipboard复制');
         }*/
        clipboard.on('success', function (e) {
            toastr.success("视频地址复制成功！", "提示", {"progressBar": false});
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
                        insert_text += '<span class="tag-single"><a class="tag-content"  target="_blank" href="video.do?method=dashboard&model=video&tags=' + value + '">' + value + '</a><span class="tag-close"">X</span></span>';
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
        "uploadVideo": uploadVideo,
        "updateVideo": updateVideo,
        "deleteVideo": deleteVideo,
        "loadVideo": loadVideo,
        "loadAlbums": loadAlbums,
        "openUploadVideoModal": openUploadVideoModal,
        "openUpdateVideoModal": openUpdateVideoModal
    };
    return context;

});