/**
 * 视频处理模块
 * @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'clipboard', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.video_handle = factory(window.jQuery, null, toastr, Clipboard, globals, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, Clipboard, globals, common_utils, login_handle) {

    var pointer = {
        uploadModal: null,
        updateModal: null,
        uploadSubtitleModal: null
    };
    var config = {
        path_params: globals.path_params,
        selector: {
            "uploadModal": "#uploadVideoModal",
            "updateModal": "#updateVideoModal",
            "uploadSubtitleModal": "#uploadSubtitleModal",
            "copyVideoUrlTrigger": ".copyVideoUrl_btn"
        },
        callback: {
            "beforeUpload": function (context, videoData, videoFile, coverFile, postData) {  // 每一个图片上传之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "uploadCompleted": function (context, video) {  // 视频上传完成后回调
                return;
            },
            "beforeUpdate": function (context, videoData, videoFile, coverFile, postData) {  // 更新之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "updateCompleted": function (context, video) {  // 更新完成后回调
                return;
            },
            "beforeDelete": function (context, postData) {  // 删除之前回调，返回一个Deferred对象可以异步执行
                return;
            },
            "deleteCompleted": function (context, postData) {  // 删除完成后回调
                return;
            },
            "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {  // 上传窗口打开前回调
                var hostUser = context.config.hostUser;
                context.request.loadAlbums(hostUser, function (albums) {
                    openUploadModal_callback(albums);
                });
            },
            "beforeUpdateModalOpen": function (context, updateModal, formatVideoToModal_callback, video) {  // 更新窗口打开前回调
                var dfd = $.Deferred();
                // 如果openUpdateVideoModal传入的参数为video对象，直接使用
                if (typeof video == 'object' && video.video_id) {
                    dfd.resolve(video);
                } else {    // 如果传入的参数为video_id，异步获取video对象
                    context.request.loadVideo(video, function (video) {
                        if (video) {
                            dfd.resolve(video);
                        } else {
                            dfd.reject();
                        }
                    });
                }
                dfd.done(function (video) {
                    if (login_handle.equalsLoginUser(video.user.uid)) {
                        context.request.loadAlbums(video.user.uid, function (albums) {
                            formatVideoToModal_callback(video, albums);
                        });
                    } else {
                        formatVideoToModal_callback(video);
                    }
                });
            }
        },
        event: { // 以事件方式添加回调，以便支持多个回调，这时定义的是事件名
            "beforeUpload": "video.upload.before",
            "uploadCompleted": "video.upload.completed",
            "beforeUpdate": "video.update.before",
            "updateCompleted": "video.update.completed",
            "beforeDelete": "video.delete.before",
            "deleteCompleted": "video.delete.completed",
            "tagClick": "video.tag.click", // 标签被点击
            "tagExtendClick": "video.tag.extendclick", // 标签按住alt被点击,
            "subtitleUploadCompleted": "video.subtitle.upload.completed",
        },
        hostUser: 0,
        downloadType: "url",
        maxUploadSize: 1024 * 1024 * 1024
    };
    var init = function (options) {

        $.extendNotNull(true, config, options);

        pointer.uploadModal = $(config.selector.uploadModal);
        pointer.updateModal = $(config.selector.updateModal);
        pointer.uploadSubtitleModal = $(config.selector.uploadSubtitleModal);

        pointer.remember_video_permission = "10";
        pointer.uploadModal.find('select[name="video_permission"]').val(pointer.remember_video_permission);

        pointer.uploadModal.find('select[name="video_permission"]').change(function (e) {
            pointer.remember_video_permission = $(this).val();
        });

        // 切换视频上传的类型
        pointer.uploadModal.find('select[name="video_source_type"]').change(function (e) {
            var key = $(this).val();
            if (key == 0) {
                pointer.uploadModal.find('input[name="video_file"]').closest('.form-group').show(100);
                pointer.uploadModal.find('textarea[name="video_code"]').closest('.form-group').hide(100);
            } else if (key == 1) {
                pointer.uploadModal.find('input[name="video_file"]').closest('.form-group').hide(100);
                pointer.uploadModal.find('textarea[name="video_code"]').closest('.form-group').show(100);
            } else {
                pointer.uploadModal.find('input[name="video_file"]').closest('.form-group').hide(100);
                pointer.uploadModal.find('textarea[name="video_code"]').closest('.form-group').show(100);
            }
        });

        // 定义上传视频时切换 “封面使用 相册中已上传的图片 还是 上传新的图片” 的事件，以封面ID输入框值是否为0作为判断依据
        pointer.uploadModal.find('input[name="cover_file"]').prev().find('.convert-upload-cover').click(function (e) {
            var $group = $(this).css('font-weight', 'bold').closest('.form-group');
            $group.find('.convert-select-cover').css('font-weight', 'normal');
            pointer.uploadModal.find('select[name="cover_album_id"]').closest('.form-group').show(100);
            $group.find('input[name="cover_photo_id"]').parent().css('display', 'none');
            $group.find('input[name="cover_file"]').css('display', 'block');
        });
        pointer.uploadModal.find('input[name="cover_file"]').prev().find('.convert-select-cover').click(function (e) {
            var $group = $(this).css('font-weight', 'bold').closest('.form-group');
            $group.find('.convert-upload-cover').css('font-weight', 'normal');
            pointer.uploadModal.find('select[name="cover_album_id"]').closest('.form-group').hide(100);
            $group.find('input[name="cover_file"]').css('display', 'none');
            $group.find('input[name="cover_photo_id"]').val('0').parent().css('display', 'table'); // point!
        });

        //提交上传事件
        pointer.uploadModal.find('button[name="uploadVideo_trigger"]').click(function () {
            var $btn = $(this),
                videoInfo = {},
                coverInfo = {},
                cover_id = pointer.uploadModal.find('input[name="cover_photo_id"]').val();
            if (cover_id && cover_id != '0') {
                coverInfo.photo_id = cover_id;
            } else {
                var coverFiles = pointer.uploadModal.find('input[name="cover_file"]')[0].files;
                if (coverFiles == null || coverFiles[0] == undefined || coverFiles[0] == null) {
                    toastr.error('未选择封面文件呢');
                    return;
                }
            }
            videoInfo.source_type = pointer.uploadModal.find('select[name="video_source_type"]').val();
            if (videoInfo.source_type == 0) {
                var files = pointer.uploadModal.find('input[name="video_file"]')[0].files;
                if (files == null || files[0] == undefined || files[0] == null) {
                    toastr.error('未选择文件呢');
                    return;
                }
            } else if (videoInfo.source_type == 1) {
                videoInfo.path = pointer.uploadModal.find('textarea[name="video_code"]').val();
            } else {
                videoInfo.code = pointer.uploadModal.find('textarea[name="video_code"]').val();
            }
            videoInfo.name = pointer.uploadModal.find('input[name="video_name"]').val();
            videoInfo.description = pointer.uploadModal.find('textarea[name="video_desc"]').val();
            videoInfo.permission = pointer.uploadModal.find('select[name="video_permission"]').val();
            videoInfo.refer = pointer.uploadModal.find('input[name="video_refer"]').val() || '';
            var tags = '';
            pointer.uploadModal.find('.tags-modify').find('.tag-content').each(function (i, tag) {
                tags += '#' + tag.innerText + '#';
            });
            videoInfo.tags = (tags == '##' ? '' : tags);

            coverInfo.album_id = pointer.uploadModal.find('select[name="cover_album_id"]').val();
            coverInfo.name = videoInfo.name;
            coverInfo.description = videoInfo.description;
            coverInfo.refer = videoInfo.refer;
            if (videoInfo.tags.indexOf('#视频#') == -1) {
                coverInfo.tags = '#视频#' + videoInfo.tags;
            } else {
                coverInfo.tags = videoInfo.tags;
            }
            videoInfo.cover = coverInfo;

            if (videoInfo.description.length >= 2000) {
                toastr.error('描述字数' + videoInfo.description.length + '过长, 应在2000字内', '错误', {"progressBar": false});
                $btn.removeAttr('disabled');
                return;
            }
            if (!coverInfo.album_id || coverInfo.album_id == '0') {
                toastr.error('未选择相册', '错误', {"progressBar": false});
                return;
            }
            if (videoInfo.source_type == 1 && !videoInfo.path) {
                toastr.error('未输入视频链接', '错误', {"progressBar": false});
                return;
            }
            if (videoInfo.source_type == 2 && !videoInfo.code) {
                toastr.error('未输入引用代码块', '错误', {"progressBar": false});
                return;
            }

            $btn.attr('disabled', 'disabled');
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    let $notify_uploading = globals.notify().progress('<progress value="0" max="100" style="width:100%;"></progress>', '正在上传视频~', 'notify_video_uploading'),
                        $progress = $notify_uploading.find('progress');
                    request.uploadVideo((videoInfo.source_type == 0 ? files[0] : null), ((cover_id && cover_id != '0') ? null : coverFiles[0]), videoInfo, true).progress(function (percent, finalized) {
                        if (percent < 100) {
                            $notify_uploading.title(`正在上传视频~ <span style="font-weight:normal;float:right;">已完成 ${percent}%</span>`);
                        } else if (finalized !== true) {
                            $notify_uploading.title('上传完成 <span style="font-weight:normal;float:right;">处理数据中~</span>');
                        } else {
                            $notify_uploading.title('上传完成 <span style="font-weight:normal;float:right;">处理数据完成</span>');
                        }
                        $progress.val(percent);
                    }).always(function () {
                        pointer.uploadModal.find('input[name="cover_photo_id"]').val('0');
                        $btn.removeAttr('disabled');
                        globals.removeNotify('notify_video_uploading');
                    }).final(function () {
                        toastr.success('上传完成！');
                        pointer.uploadModal.modal('hide');
                        pointer.uploadModal.find('input[name="video_file"]').val('');
                        pointer.uploadModal.find('input[name="cover_file"]').val('');
                    }, function (status, message, type) {
                        if (type != 0) {
                            pointer.uploadModal.find('input[name="video_file"]').val('');
                            pointer.uploadModal.find('input[name="cover_file"]').val('');
                        }
                    });
                } else {
                    $btn.removeAttr('disabled');
                    toastr.error('登陆状态失效，请重新登录！');
                }
            }, true);
        });

        pointer.uploadModal.find('.tags-modify').prev().dblclick(function () {
            pointer.uploadModal.find('.tags-modify .tag-single').remove();
        });

        // 切换更新视频时上传的类型
        pointer.updateModal.find('select[name="video_source_type"]').change(function (e) {
            var key = $(this).val();
            if (key == 0) {
                pointer.updateModal.find('input[name="video_file"]').closest('.form-group').show(100);
                pointer.updateModal.find('textarea[name="video_code"]').closest('.form-group').hide(100);
                var video_href_group = pointer.updateModal.find('.copy-input').closest('.form-group');
                if (video_href_group.hasClass('user-upload-video')) { // 如果该视频是用户上传的（不是引用的），则显示链接
                    video_href_group.show(0);
                } else {
                    video_href_group.hide(0);
                }
            } else if (key == 1) {
                pointer.updateModal.find('input[name="video_file"]').closest('.form-group').hide(100);
                pointer.updateModal.find('textarea[name="video_code"]').closest('.form-group').show(100);
                pointer.updateModal.find('.copy-input').closest('.form-group').hide(0);
            } else {
                pointer.updateModal.find('input[name="video_file"]').closest('.form-group').hide(100);
                pointer.updateModal.find('textarea[name="video_code"]').closest('.form-group').show(100);
                pointer.updateModal.find('.copy-input').closest('.form-group').hide(0);
            }
        });

        // 定义更新视频时切换 “封面使用 相册中已上传的图片 还是 上传新的图片” 的事件，以是否选择了图片文件为判断依据
        pointer.updateModal.find('input[name="cover_file"]').prev()
            .on('click', '.convert-upload-cover', function (e) {
                $(this).css('font-weight', 'bold').closest('.form-group').find('.convert-select-cover').css('font-weight', 'normal');
                pointer.updateModal.find('select[name="cover_album_id"]').closest('.form-group').show(100);
                pointer.updateModal
                    .find('input[name="cover_photo_id"]').parent().css('display', 'none')
                    .closest('.form-group').find('input[name="cover_file"]').css('display', 'block').val(''); // point!
            })
            .on('click', '.convert-select-cover', function (e) {
                $(this).css('font-weight', 'bold').closest('.form-group').find('.convert-upload-cover').css('font-weight', 'normal');
                pointer.updateModal.find('select[name="cover_album_id"]').closest('.form-group').hide(100);
                pointer.updateModal
                    .find('input[name="cover_file"]').css('display', 'none')
                    .closest('.form-group').find('input[name="cover_photo_id"]').parent().css('display', 'table');
            });

        //更新视频事件
        pointer.updateModal.find('button[name="updateVideo_trigger"]').click(function () {
            var $btn = $(this), videoInfo = {}, coverInfo = {};
            videoInfo.video_id = pointer.updateModal.find('span[name="video_id"]').html().trim();
            if (!videoInfo.video_id || videoInfo.video_id == '0') {
                toastr.error('代码出错~');
                return;
            }
            var coverFiles = pointer.updateModal.find('input[name="cover_file"]')[0].files;
            var uploadNewCover = false;
            if (coverFiles == null || coverFiles[0] == undefined || coverFiles[0] == null) {
                var cover_id = pointer.updateModal.find('input[name="cover_photo_id"]').val() || 0;
                if (cover_id && cover_id != '0') {
                    coverInfo.photo_id = cover_id;
                } else {
                    coverInfo.photo_id = 0;
                    toastr.error('你既未选择新封面文件，又未指定已上传的封面ID呢');
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
                    if (!pointer.updateModal.find('.copy-input').closest('.form-group').hasClass('user-upload-video')) {
                        toastr.error('未选择视频文件呢');
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
            videoInfo.permission = pointer.updateModal.find('select[name="video_permission"]').val();
            videoInfo.refer = pointer.updateModal.find('input[name="video_refer"]').val() || '';
            var tags = '';
            pointer.updateModal.find('.tags-modify').find('.tag-content').each(function (i, tag) {
                tags += '#' + tag.innerText + '#';
            });
            videoInfo.tags = (tags == '##' ? '' : tags);

            coverInfo.album_id = pointer.updateModal.find('select[name="cover_album_id"]').val() || 0;
            coverInfo.name = videoInfo.name;
            coverInfo.description = videoInfo.description;
            coverInfo.refer = videoInfo.refer;
            if (videoInfo.tags.indexOf('#视频#') == -1) {
                coverInfo.tags = '#视频#' + videoInfo.tags;
            } else {
                coverInfo.tags = videoInfo.tags;
            }
            videoInfo.cover = coverInfo;

            if (videoInfo.description.length >= 2000) {
                toastr.error('描述字数' + videoInfo.description.length + '过长, 应在2000字内', '错误', {"progressBar": false});
                $btn.removeAttr('disabled');
                return;
            }
            if (uploadNewCover && (!coverInfo.album_id || coverInfo.album_id == '0')) {
                toastr.error('未选择相册', '错误', {"progressBar": false});
                return;
            }
            if (videoInfo.source_type == 1 && !videoInfo.path) {
                toastr.error('未输入视频链接', '错误', {"progressBar": false});
                return;
            }
            if (videoInfo.source_type == 2 && !videoInfo.code) {
                toastr.error('未输入引用代码块', '错误', {"progressBar": false});
                return;
            }

            $btn.attr('disabled', 'disabled');
            login_handle.runOnLogin(function (isLogin) {
                if (isLogin) {
                    let $notify_updating = globals.notify().progress('<progress value="0" max="100" style="width:100%;"></progress>', '正在更新视频~', 'notify_video_updating'),
                        $progress = $notify_updating.find('progress');
                    request.updateVideo((uploadNewVideo ? files[0] : null), (uploadNewCover ? coverFiles[0] : null), videoInfo, true).progress(function (percent, finalized) {
                        let titleValue, percentValue = finalized ? 100 : percent;
                        if (percent < 100) {
                            titleValue = `正在上传视频~ <span style="font-weight:normal;float:right;">已完成 ${percent}%</span>`;
                        } else if (finalized !== true) {
                            titleValue = '上传完成 <span style="font-weight:normal;float:right;">处理数据中~</span>';
                        } else {
                            titleValue = '上传完成 <span style="font-weight:normal;float:right;">处理数据完成</span>';
                        }
                        $notify_updating.title(titleValue);
                        $progress.val(percentValue);
                    }).always(function () {
                        $btn.removeAttr('disabled');
                        globals.removeNotify('notify_video_updating');
                    }).final(function () {
                        toastr.success('更新完成！');
                        pointer.updateModal.modal('hide');
                        pointer.updateModal.find('input[name="video_file"]').val('');
                        pointer.updateModal.find('input[name="cover_file"]').val('');
                    });
                } else {
                    $btn.removeAttr('disabled');
                    toastr.error('登陆状态失效，请重新登录！');
                }
            }, true);
        });

        //删除视频事件
        pointer.updateModal.find('button[name="deleteVideo_trigger"]').click(function () {
            let video_id = pointer.updateModal.find('span[name="video_id"]').html().trim();
            request.deleteVideo(video_id, true);
        });

        //复制视频地址
        initClipboard(config.selector.copyVideoUrlTrigger, config.selector.updateModal);

        //下载视频事件
        pointer.updateModal.find('a[name="video_path"]').click(function () {
            // downloadVideo(this.getAttribute('path'), config.downloadType);
            common_utils.downloadUrlFile(this.getAttribute('path'), '');
        }).closest('.form-group').find('label').on('dblclick', function () {
            let isAuthor = pointer.updateModal.data('isAuthor'), $label = $(this), $group = $label.closest('.form-group');
            if (isAuthor) {
                let video = pointer.updateModal.data('video'), originName = video.originName, current_show = $label.attr('data-current-show') || 'url';
                if (current_show == 'url') {
                    $group.find('.copy-input').val(originName);
                    current_show = 'originName';
                } else {
                    $group.find('.copy-input').val($group.find('a[name="video_path"]').attr('path'));
                    current_show = 'url';
                }
                $label.attr('data-current-show', current_show);
            }
        });

        // 打开照片的相关链接
        pointer.updateModal.find('.open-update-video-refer').click(function () {
            var url = $(this).prev().val();
            if (url) {
                window.open(url);
            } else {
                toastr.info('你还没有设置相关页面呢~');
            }
        });

        // 打开封面页面
        pointer.uploadModal.find('.open-upload-video-cover').click(function () {
            var photo_id = $(this).prev().val();
            if (photo_id && photo_id != '0') {
                window.open(('p/detail/' + photo_id).toURL());
            } else {
                toastr.info('请先输入照片id呢~');
            }
        });
        pointer.updateModal.find('.open-update-video-cover').click(function () {
            var photo_id = $(this).prev().val();
            if (photo_id && photo_id != '0') {
                window.open(('p/detail/' + photo_id).toURL());
            } else {
                toastr.info('请先输入照片id呢~');
            }
        });

        // upload modal tags 输入框 绑定事件
        var $upload_tags_modify = pointer.uploadModal.find('.tags-modify');
        pointer.uploadModal.on('shown.bs.modal', function () {
            utils.calcTagInputWidth($upload_tags_modify);
        });
        $upload_tags_modify.on('click', '.tag-close', function (e) {
            utils.deleteTag($upload_tags_modify, $(e.currentTarget.parentNode));
        });
        $upload_tags_modify.on({
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
            }
        });

        // update modal tags 输入框 绑定事件
        var $update_tags_modify = pointer.updateModal.find('.tags-modify');
        pointer.updateModal.on('shown.bs.modal', function () { // 计算输入框宽度
            pointer.updateModal.find('textarea[name="video_desc"]').autoTextareaHeight({
                maxHeight: 200,
                minHeight: config.textareaInputHeight,
                runOnce: true
            });
            if ($update_tags_modify.find('.tag-input').length > 0) {
                pointer.updateModal.find('textarea[name="video_code"]').autoTextareaHeight({
                    maxHeight: 200,
                    minHeight: config.textareaInputHeight,
                    runOnce: true
                });
                utils.calcTagInputWidth($update_tags_modify);
                //console.log(tags_modify_dom.outerHeight(true) + '_ ' + tags_modify_dom.prop('scrollHeight'));
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
                    utils.addTagFromInput($update_tags_modify, input_dom);
                    $update_tags_modify.closest('.form-group').find('.tags-edit-btn').text('编辑');
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
                var video_id = pointer.updateModal.find('span[name="video_id"]').html().trim();
                var tag = _self.text();
                if (config.tagExtendClickEvent) {  // 是否按住alt点击
                    clickEvt.preventDefault();
                    context.trigger(config.event.tagExtendClick, tag, video_id, clickEvt, config.tagExtendClickEvent);
                } else {
                    context.trigger(config.event.tagClick, tag, video_id, clickEvt);
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
        config.textareaInputHeight = pointer.updateModal.find('textarea[name="video_desc"]').outerHeight();
        pointer.updateModal.find('textarea[name="video_desc"]').autoTextareaHeight({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });
        pointer.uploadModal.find('textarea[name="video_desc"]').autoTextareaHeight({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });
        pointer.updateModal.find('textarea[name="video_code"]').autoTextareaHeight({
            maxHeight: 200,
            minHeight: config.textareaInputHeight
        });
        pointer.uploadModal.find('textarea[name="video_code"]').autoTextareaHeight({
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

        // 字幕
        pointer.updateModal.find('.form-btn-upload-subtitle-modal-open').on('click', function (e) {
            var modal = pointer.uploadSubtitleModal;
            var video_id = pointer.updateModal.find('span[name="video_id"]').html().trim();
            modal.find('.form-group-subtitle-video-id .form-subtitle-video-id').text(video_id).attr('data-video-id', video_id)
                .closest('a').url('href', 'video/detail/' + video_id);
            modal.find('.form-group-subtitle-file .form-subtitle-file').val('');
            modal.find('.form-group-subtitle-name .form-subtitle-name').val('');
            modal.find('.form-group-subtitle-lang .form-subtitle-lang').val('');
            modal.modal('show');
        });
        pointer.uploadSubtitleModal.find('.form-btn-upload-subtitle-submit').on('click', function (e) {
            e.preventDefault();
            var $submitBtn = $(this);
            var modal = pointer.uploadSubtitleModal;
            var subtitle = {};
            subtitle.video_id = modal.find('.form-group-subtitle-video-id .form-subtitle-video-id').attr('data-video-id');
            subtitle.name = modal.find('.form-group-subtitle-name .form-subtitle-name').val();
            subtitle.lang = modal.find('.form-group-subtitle-lang .form-subtitle-lang').val();
            var file = modal.find('.form-group-subtitle-file .form-subtitle-file')[0].files;
            if (file == null || file[0] == undefined || file[0] == null) {
                toastr.error('请选择字幕文件~');
                return;
            } else {
                file = file[0];
            }
            if (subtitle.name.length >= 30) {
                toastr.error('name字数' + subtitle.name.length + '过长, 应在30字内', '错误', {"progressBar": false});
                return;
            }
            if (subtitle.lang.length >= 30) {
                toastr.error('lang字数' + subtitle.lang.length + '过长, 应在30字内', '错误', {"progressBar": false});
                return;
            }
            if (!subtitle.name) {
                toastr.error('未输入name', '错误', {"progressBar": false});
                return;
            }
            if (!subtitle.lang) {
                toastr.error('未输入lang', '错误', {"progressBar": false});
                return;
            }
            $submitBtn.attr('disabled', 'disabled');
            globals.notify().progress('正在上传', '', 'notify_subtitle_uploading');
            request.uploadSubtitle(file, subtitle, true).always(function () {
                $submitBtn.removeAttr('disabled');
                globals.removeNotify('notify_subtitle_uploading');
            }).final(function () {
                toastr.success('字幕上传成功', '提示');
                modal.find('.form-group-subtitle-file .form-subtitle-file').val('');
                modal.modal('hide');
            });
        });
    };

    const request = globals.extend(globals.request, {
        video_handle: {
            'uploadVideo': function (videoFile, coverFile, videoData, success) {
                return $.Deferred(function (dfd) {
                    let postData = new FormData(), photoData = videoData.cover, runUpload, loadPercent;
                    // video
                    switch (parseInt(videoData.source_type)) {
                        case 0:
                            if (config.maxUploadSize != -1 && videoFile.size > config.maxUploadSize) {
                                globals.request.rejectedResp({'message': `视频文件超出大小，最大 ${(maxUploadSize / (1024 * 1024)).toFixed(2)} M`, 'type': -2},
                                    success && '上传失败', null, false, dfd);
                                return;
                            }
                            postData.append('videoFile', videoFile);
                            postData.append('originName', (videoFile.name.lastIndexOf('.') != -1 ? videoFile.name : (videoFile.name + '.mp4')));
                            break;
                        case 1:
                            postData.append('path', videoData.path);
                            break;
                        case 2:
                            postData.append('code', videoData.code);
                            break;
                        default:
                            globals.request.rejectedResp({'message': `视频类型 ${videoData.source_type} 不支持`, 'type': -1}, success && '上传失败', null, false, dfd);
                            return;
                    }
                    $.each(videoData, function (k, v) {
                        if (['path', 'code', 'originName', 'cover'].indexOf(k) === -1) {
                            postData.append(k, v);
                        }
                    });
                    // cover
                    if (photoData.photo_id) {
                        postData.append('cover.photo_id', photoData.photo_id);
                    } else {
                        postData.append('coverFile', coverFile);
                        postData.append('cover.originName', (coverFile.name.lastIndexOf('.') != -1 ? coverFile.name : (coverFile.name + '.jpg')));
                        if (photoData.topic) {
                            for (let k of ['ptwid', 'name', 'scope', 'permission', 'description']) {
                                let v = photoData.topic[k];
                                if (v !== null && v !== undefined) {
                                    photoData["topic." + k] = v;
                                }
                            }
                            delete photoData.topic;
                        }
                        $.each(photoData, function (k, v) {
                            postData.append('cover.' + k, v);
                        });
                    }
                    runUpload = function (allowUpload, cancelMessage) {
                        if (allowUpload) {
                            globals.request.ajax({
                                type: 'post',
                                contentType: false,
                                cache: false,
                                processData: false,
                                progress: function (e) {
                                    // 如果e.lengthComputable不为真，则e.total等于0
                                    if (e.lengthComputable) {
                                        // e.total是需要传输的总字节，e.loaded是已经传输的字节
                                        let percent = Math.floor(e.loaded / e.total * 100);
                                        if (loadPercent == undefined || loadPercent !== percent) {
                                            loadPercent = percent;
                                            dfd.notifyWith(postData, [percent, false]);
                                        }
                                    }
                                }
                            }, globals.api.uploadVideo, postData, success, ['video'], success && '上传失败').final(function (video) {
                                dfd.notifyWith(postData, [100, true]);
                                config.callback.uploadCompleted.call(context, context, video); // 回调
                                context.trigger(config.event.uploadCompleted, video);
                                dfd.resolveWith(this, arguments);
                            }, function () {
                                dfd.rejectWith(this, arguments);
                            });
                        } else {
                            globals.request.rejectedResp({'message': `${cancelMessage || '删除被取消'}`, 'type': -3}, success && '上传失败', null, false, dfd);
                        }
                    };
                    common_utils.wrapAsyncResult(config.callback.beforeUpload)(context, videoData, videoFile, coverFile, postData).final(function (allowUpload, message) {
                        allowUpload = (allowUpload !== false && context.trigger(config.event.beforeUpload, videoData, videoFile, coverFile, postData) !== false);
                        runUpload(allowUpload, message);
                    }, function (message) {
                        runUpload(false, message);
                    });
                });
            },
            'updateVideo': function (videoFile, coverFile, videoData, success) {
                return $.Deferred(function (dfd) {
                    let postData = new FormData(), photoData = videoData.cover, runUpdate, loadPercent;
                    // video
                    switch (parseInt(videoData.source_type)) {
                        case 0:
                            if (videoFile) {
                                if (config.maxUploadSize != -1 && videoFile.size > config.maxUploadSize) {
                                    globals.request.rejectedResp({'message': `视频文件超出大小，最大 ${(maxUploadSize / (1024 * 1024)).toFixed(2)} M`, 'type': -2},
                                        success && '更新失败', null, false, dfd);
                                    return;
                                }
                                postData.append('videoFile', videoFile);
                                postData.append('originName', (videoFile.name.lastIndexOf('.') != -1 ? videoFile.name : (videoFile.name + '.mp4')));
                            }
                            break;
                        case 1:
                            postData.append('path', videoData.path);
                            break;
                        case 2:
                            postData.append('code', videoData.code);
                            break;
                        default:
                            globals.request.rejectedResp({'message': `视频类型值 ${videoData.source_type} 不支持`, 'type': -1}, success && '更新失败', null, false, dfd);
                            return;
                    }
                    $.each(videoData, function (k, v) {
                        if (['path', 'code', 'originName', 'cover'].indexOf(k) === -1) {
                            postData.append(k, v);
                        }
                    });
                    // cover
                    if (photoData.photo_id) {
                        postData.append('cover.photo_id', photoData.photo_id);
                    } else {
                        postData.append('coverFile', coverFile);
                        postData.append('cover.originName', (coverFile.name.lastIndexOf('.') != -1 ? coverFile.name : (coverFile.name + '.jpg')));
                        if (photoData.topic) {
                            for (let k of ['ptwid', 'name', 'scope', 'permission', 'description']) {
                                let v = photoData.topic[k];
                                if (v !== null && v !== undefined) {
                                    photoData["topic." + k] = v;
                                }
                            }
                            delete photoData.topic;
                        }
                        $.each(photoData, function (k, v) {
                            postData.append('cover.' + k, v);
                        });
                    }
                    runUpdate = function (allowUpdate, cancelMessage) {
                        if (allowUpdate) {
                            globals.request.ajax({
                                type: 'post',
                                contentType: false,
                                cache: false,
                                processData: false,
                                progress: function (e) {
                                    // 如果event.lengthComputable不为真，则event.total等于0
                                    if (e.lengthComputable) {
                                        // e.total是需要传输的总字节，e.loaded是已经传输的字节
                                        let percent = Math.floor(e.loaded / e.total * 100);
                                        if (loadPercent == undefined || loadPercent !== percent) {
                                            loadPercent = percent;
                                            dfd.notifyWith(postData, [percent, false]);
                                        }
                                    }
                                }
                            }, globals.api.updateVideo, postData, success, ['video'], success && '更新失败').final(function (video) {
                                dfd.notifyWith(postData, [100, true]);
                                config.callback.updateCompleted.call(context, context, video); // 回调
                                context.trigger(config.event.updateCompleted, video);
                                dfd.resolveWith(this, arguments);
                            }, function () {
                                dfd.rejectWith(this, arguments);
                            });
                        } else {
                            globals.request.rejectedResp({'message': `${cancelMessage || '删除被取消'}`, 'type': -3}, success && '更新失败', null, false, dfd);
                        }
                    };
                    common_utils.wrapAsyncResult(config.callback.beforeUpdate)(context, videoData, videoFile, coverFile, postData).final(function (allowUpdate, message) {
                        allowUpdate = (allowUpdate !== false && context.trigger(config.event.beforeUpdate, videoData, videoFile, coverFile, postData) !== false);
                        runUpdate(allowUpdate, message);
                    }, function (message) {
                        runUpdate(false, message);
                    });
                });
            },
            'deleteVideo': function (video_id, success) {
                return $.Deferred(function (dfd) {
                    if (true) {
                        globals.request.rejectedResp({'message': '删除功能开发中', 'type': 0}, success && '视频删除失败', null, false, dfd);
                        return;
                    }
                    if (video_id && video_id != '0') {
                        let runDelete, postData = {"video_id": video_id};
                        runDelete = function (allowDelete, cancelMessage) {
                            if (allowDelete) {
                                globals.request.post(globals.api.deleteVideo, postData, success, success && '视频删除失败').final(function () {
                                    config.callback.deleteCompleted.call(context, context, postData); // 回调
                                    context.trigger(config.event.deleteCompleted, postData);
                                    dfd.resolveWith(this, arguments);
                                }, function () {
                                    dfd.rejectWith(this, arguments);
                                });
                            } else {
                                globals.request.rejectedResp({'message': cancelMessage || '删除被取消', 'type': -2}, success && '视频删除失败', null, false, dfd);
                            }
                        };
                        // 删除之前回调
                        common_utils.wrapAsyncResult.call(context, config.callback.beforeDelete)(context, postData).final(function (allowDelete, message) {
                            allowDelete = (allowDelete !== false && context.trigger(config.event.beforeDelete, postData) !== false);
                            runDelete(allowDelete, message);
                        }, function (message) {
                            runDelete(false, message);
                        });
                    } else {
                        globals.request.rejectedResp({'message': '提交video_id为空', 'type': -1}, success && '视频删除失败', null, false, dfd);
                    }
                });
            },
            'loadVideo': function (video_id, success) {
                let postData = typeof video_id === 'object' ? video_id : {"video_id": video_id};
                return globals.request.get(globals.api.getVideo, postData, success, ['video'], success && '加载视频失败');
            },
            'loadAlbums': function (uid, success) {
                return globals.request.get(globals.api.getAlbumList, {'user.uid': uid}, success, ['albums'], success && '加载相册列表失败').fail(function () {
                    $.isFunction(success) && success.call(this, []);
                });
            },
            'uploadSubtitle': function (file, subtitle, success) {
                return $.Deferred(function (dfd) {
                    if (file && subtitle) {
                        let postData = new FormData();
                        postData.append('file', file);
                        $.each(subtitle, function (k, v) {
                            postData.append(k, v);
                        });
                        globals.request.ajax({
                            type: 'post',
                            contentType: false,
                            cache: false,
                            processData: false,
                        }, globals.api.uploadSubtitle, postData, success, ['subtitle'], success && '字幕上传失败').final(function (subtitle) {
                            context.trigger(config.event.subtitleUploadCompleted, subtitle);
                            dfd.resolveWith(this, arguments);
                        }, function () {
                            dfd.rejectWith(this, arguments);
                        });
                    } else {
                        globals.request.rejectedResp({'message': '提交的file或subtitle为空', 'type': -1}, success && '字幕上传失败', null, false, dfd);
                    }
                });
            }
        }
    }).video_handle;

    var openUploadVideoModal = function (files) {
        if (!login_handle.validateLogin()) {
            toastr.error('你没有登录！');
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
                if (album_select_dom[0].options.length > 0) {   // 记住上一次的选择
                    selectValue = album_select_dom.val();
                } else if (pointer.remember_cover_album_id) {
                    selectValue = pointer.remember_cover_album_id;
                } else {
                    selectValue = albums[0].album_id + '';
                }
            }
            album_select_dom.html(options_str).val(selectValue);
            pointer.uploadModal.find('select[name="video_permission"]').val(pointer.remember_video_permission);
            pointer.uploadModal.find('button[name="uploadVideo_trigger"]').removeAttr('disabled');
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
        var formatVideoToModal_callback = function (video, albums) {
            var isAuthor = login_handle.equalsLoginUser(video.user.uid);
            pointer.updateModal.data('video', video).data('isAuthor', isAuthor);
            if (albums && isAuthor) {
                var album_select_dom = pointer.updateModal.find('select[name="cover_album_id"]');
                var options_str = '';
                var selectValue = '' + video.cover.album_id;
                if (albums == null || albums.length == 0) {
                    options_str = '<option value="0">无相册</option>';
                } else {
                    $.each(albums, function (index, album) {
                        options_str += '<option value="' + album.album_id + '">' + album.name + '</option>';
                    });
                }
                album_select_dom.html(options_str).val(selectValue);
            }
            // load to modal
            var video_url = 'video/detail/' + video.video_id;
            pointer.updateModal.find('.form-group span[name="video_id"]').text(video.video_id).parent().url('href', video_url);
            pointer.updateModal.find('.form-group span[name="user_id"]').text(video.user.nickname).parent().url('href', 'u/' + video.user.uid + '/home');
            pointer.updateModal.find('.form-group input[name="video_name"]').val(video.name);
            pointer.updateModal.find('.form-group textarea[name="video_desc"]').val(video.description);
            pointer.updateModal.find('.form-group select[name="video_permission"]').val(video.permission);
            pointer.updateModal.find('.form-group select[name="video_source_type"]').val(video.source_type);
            if (video.source_type == 1) {
                pointer.updateModal.find('.copy-input').val('').closest('.form-group').removeClass('user-upload-video').hide();
                pointer.updateModal.find('.form-group textarea[name="video_code"]').val(video.path).closest('.form-group').show();
            } else if (video.source_type == 2) {
                pointer.updateModal.find('.copy-input').val('').closest('.form-group').removeClass('user-upload-video').hide();
                pointer.updateModal.find('.form-group textarea[name="video_code"]').val(video.code).closest('.form-group').show();
            } else {
                pointer.updateModal.find('.form-group textarea[name="video_code"]').val('').closest('.form-group').hide();
                let downloadUrl = isAuthor ? video.path : utils.generateVideoSignatureUrl(video.video_id, 10800000, true);
                pointer.updateModal
                    .find('.copy-input').val(downloadUrl)
                    .closest('.form-group').addClass('user-upload-video').show() // 如果该视频是用户上传的（不是引用的），则添加标记类: .user-upload-video
                    .find('a[name="video_path"]').attr('path', downloadUrl);
            }
            pointer.updateModal.find('.form-group span[name="video_size"]').html(video.size + 'MB（' + video.width + '×' + video.height + '）');
            pointer.updateModal.find('.form-group span[name="video_upload_time"]').html(video.upload_time);
            pointer.updateModal.find('.form-group input[name="video_refer"]').val(video.refer);
            pointer.updateModal.find('.form-group select[name="cover_album_id"]').closest('.form-group').hide(0);
            pointer.updateModal
                .find('.form-group input[name="cover_file"]').css('display', 'none')
                .closest('.form-group').css('display', (isAuthor ? 'block' : 'none')).find('input[name="cover_photo_id"]').val(video.cover.photo_id).parent().css('display', 'table')
                .closest('.form-group').find('.convert-select-cover').click();
            if (isAuthor && video.source_type == 0) {
                pointer.updateModal.find('.copy-input').prev().attr('title', '原始文件名：' + video.originName).attr('data-origin-name', video.originName);
            } else {
                pointer.updateModal.find('.copy-input').prev().attr('title', "").attr('data-origin-name', '');
            }

            // css
            var dialogStyle = isAuthor ? '0px' : '30px';
            pointer.updateModal.find('.modal-dialog').css('margin-top', dialogStyle);

            // define btn by user type
            var fileStyle = isAuthor && (video.source_type == 0) ? 'block' : 'none';
            var btnStyle = isAuthor ? 'inline-block' : 'none';
            pointer.updateModal.find('.form-group input[name="video_file"]').val('').closest('.form-group').css('display', fileStyle);
            pointer.updateModal.find('button[name="deleteVideo_trigger"]').css('display', btnStyle);
            pointer.updateModal.find('button[name="updateVideo_trigger"]').css('display', btnStyle);
            pointer.updateModal.find('.form-btn-upload-subtitle-modal-open').css('display', btnStyle);

            // 视频标签
            video.tags = video.tags || '';
            var tags_modify_dom = pointer.updateModal.find('.tags-modify').eq(0).css('height', '');
            if (isAuthor) {
                // show
                tags_modify_dom.closest('.form-group').show().find('.tags-edit-btn').show();
                // css
                tags_modify_dom.addClass('form-control');
                tags_modify_dom.css('overflow-y', 'hidden').closest('.form-group').css('padding-top', "").next().css('padding-top', '7px');
                // html
                var tags_str = '';
                $.each(video.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single"><a class="tag-content" target="_blank" href="' + ('video/dashboard?tags=&lt;' + tag + '&gt;').toURL() + '">' + tag + '</a>' +
                            '<span class="tag-close">&times</span></span>';
                    }
                });
                tags_str += '<input type="text" class="tag-input" name="tag_input" title="回车完成输入" placeholder="回车完成输入"/>';
                // tags_modify_dom.prop('outerHTML', '');
                // tags_modify_dom.replaceWith(tags_str);
                tags_modify_dom.html(tags_str);
                pointer.updateModal.find('.tags-edit-btn').text('编辑');
            } else if (!isAuthor && video.tags) {
                // show
                tags_modify_dom.closest('.form-group').show().find('.tags-edit-btn').hide();
                // css
                tags_modify_dom.removeClass('form-control');
                tags_modify_dom.css('overflow-y', "").closest('.form-group').css('padding-top', '7px').next().css('padding-top', '');
                // html
                var tags_str = '';
                $.each(video.tags.split('#'), function (i, tag) {
                    if (tag) {
                        tags_str += '<span class="tag-single" style="margin-right: 6px;"><a class="tag-content"  target="_blank" ' +
                            'href="' + ('video/dashboard?tags=&lt;' + tag + '&gt;').toURL() + '">' + tag + '</a></span>';
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
        // if (!clipboard.isSupported()) {
        //     console.error('该浏览器不支持Clipboard复制');
        // }
        clipboard.on('success', function (e) {
            toastr.success('视频地址复制成功！', '提示', {"progressBar": false});
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
                var insert_text = '';
                $.each(tag.split(/[#×✖,，;；]/), function (i, value) {
                    if (value) {
                        // 标记处还原原始值
                        var match = value.match(/replaceEL_[\d]{1}/);
                        match && (value = value.replace(match[0], elMap[match[0]]));
                        if (value.indexOf('#') == -1) {
                            insert_text += '<span class="tag-single"><a class="tag-content"  target="_blank" ' +
                                'href="' + ('video/dashboard?tags=&lt;' + value + '&gt;').toURL() + '">' + value + '</a><span class="tag-close"">&times</span></span>';
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
            $tag_single.remove();
            utils.calcTagInputWidth($tags_modify);
            $tags_modify.autoTextareaHeight({
                maxHeight: 150,
                minHeight: config.tagsAreaHeight,
                runOnce: true
            });
        },
        'generateVideoSignatureUrl': function (video_id, allowAge, check) {
            let ul, vl, t, et, at, signature, expires, age;
            ul = parseInt(common_utils.cookieUtil.get('identifier') || common_utils.cookieUtil.get('guest_identifier'));
            vl = common_utils.convertRadix62to10(video_id);
            t = new Date().getTime();
            et = t + allowAge;
            signature = common_utils.convertRadix10to62(t - ul);
            expires = common_utils.convertRadix10to62(et - vl);
            at = Math.abs(vl - ul) + allowAge;
            if ((check && at % 2 !== 0) || (!check && at % 2 !== 1)) {
                at++;
            }
            age = common_utils.convertRadix10to62(at);
            return `video.api?method=downloadVideo&video_id=${video_id}&signature=${signature}&expires=${expires}&age=${age}`.toURL();
        }
    };
    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "utils": utils,
        "request": request,
        "openUploadVideoModal": openUploadVideoModal,
        "openUpdateVideoModal": openUpdateVideoModal,
        "on": globals.on,
        "once": globals.once,
        "trigger": globals.trigger,
        "off": globals.off
    };
    return context;

});