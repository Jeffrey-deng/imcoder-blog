/**
 * 相册处理模块
 * @author Jeffery.deng
 * @date 2018/1/11
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'globals', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.album_handle = factory(window.jQuery, null, toastr, globals, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, globals, common_utils, login_handle) {

    var pointer = {
        createModal: null,
        updateModal: null
    };

    var config = {
        path_params: globals.path_params,
        selector: {
            "createAlbumModal": "#createAlbumModal",
            "updateAlbumModal": "#updateAlbumModal"
        },
        callback: {
            "createCompleted": function (album) {  // 在相册创建完成后回调
                return;
            },
            "updateCompleted": function (album) {  // 在相册更新完成后回调
                return;
            },
            "deleteCompleted": function (postData) {  // 在相册删除完成后回调
                return;
            },
            "beforeCreateModalOpen": function (createModal, openCreateModal_callback) {  // 创建窗口打开前回调
                openCreateModal_callback();
            },
            "beforeUpdateModalOpen": function (updateModal, formatAlbumToModal_callback, album) {  // 更新窗口打开前回调
                // 如果openUpdateAlbumModal传入的参数为album对象，直接使用
                if (typeof album == 'object') {
                    formatAlbumToModal_callback(album);
                    // 如果传入的参数为album_id，异步获取album对象
                } else {
                    this.request.loadAlbums(album, function (album) {
                        formatAlbumToModal_callback(album);
                    });
                }
            }
        },
        event: { // 以事件方式添加回调，以便支持多个回调，这时定义的是事件名
            "createCompleted": "album.create.completed",
            "updateCompleted": "album.update.completed",
            "deleteCompleted": "album.delete.completed",
            "beforeDelete": "album.delete.before"
        },
        "album_default_col": "0"
    };

    var init = function (options) {
        $.extendNotNull(true, config, options);
        pointer.createModal = $(config.selector.createAlbumModal);
        pointer.updateModal = $(config.selector.updateAlbumModal);

        //提交创建相册事件
        pointer.createModal.find('button[name="createAlbum_trigger"]').click(function () {
            var album = {};
            album.name = pointer.createModal.find('input[name="album_name"]').val();
            album.description = pointer.createModal.find('textarea[name="album_desc"]').val();
            album.mount = pointer.createModal.find('input[name="album_mount"]').val();
            album.permission = pointer.createModal.find('select[name="album_permission"]').val();
            album.show_col = pointer.createModal.find('select[name="album_show_col"]').val();
            if (!album.name) {
                toastr.info('输入相册的名称', '');
                return;
            }
            request.createAlbum(album, function () {
                toastr.success('创建成功 ');
                pointer.createModal.modal('hide');
            });
        });

        // 提交更新相册事件
        pointer.updateModal.find('button[name="updateAlbum_trigger"]').click(function () {
            var album = {}, dfd = $.Deferred();
            album.album_id = pointer.updateModal.find('span[name="album_id"]').html();
            album.name = pointer.updateModal.find('input[name="album_name"]').val();
            album.description = pointer.updateModal.find('textarea[name="album_desc"]').val();
            album.mount = pointer.updateModal.find('input[name="album_mount"]').val();
            album.permission = pointer.updateModal.find('select[name="album_permission"]').val();
            album.show_col = pointer.updateModal.find('select[name="album_show_col"]').val();
            var coverUrl = pointer.updateModal.find('input[name="album_cover_path"]').val().trim();
            var beforeCoverUrl = pointer.updateModal.find('input[name="album_cover_path"]').attr('data-re-cover-url');
            var beforeCoverId = pointer.updateModal.find('input[name="album_cover_path"]').attr('data-re-cover-id');
            album.cover = {"photo_id": beforeCoverId};
            // 检查
            if (coverUrl) {
                if (coverUrl != beforeCoverUrl) {   // 如果用户修改封面图片地址，则查询数据库，是否有该图片
                    if (coverUrl.match(/^(https?:\/\/[a-z0-9\.:]+\/([\x21-\x7e]*\/)?)?(user\/\w+\/photos\/\w+\/[0-9a-zA-Z_\.]+\.(gif|jpe?g|png|bmp|svg|ico))(\?[\x21-\x7e]*)?$/)) {
                        $.get(globals.api.getPhotoList, {"path": RegExp.$3}, function (response) {
                            if (response.status == 200) {
                                var data = response.data;
                                if (data.photos.length > 0) {
                                    var photo = data.photos[0];
                                    album.cover.photo_id = photo.photo_id;
                                    dfd.resolve(album);
                                    return;
                                }
                            }
                            dfd.reject('你输入相册封面不存在或没有权限或格式错误');
                        });
                    } else {
                        dfd.reject('你输入相册封面格式错误');
                    }
                }
            } else {    // 如果用户清空了输入框代表用户要使用默认封面
                album.cover.photo_id = 0;
            }
            if (!coverUrl || coverUrl == beforeCoverUrl) {
                dfd.resolve(album); // 不需要查询数据库就直接更新

            }
            dfd.final(function (postData) {
                request.updateAlbum(postData, function (album) {
                    toastr.success('更新成功 ');
                    pointer.updateModal.modal('hide');
                });
            }, function (error) {
                toastr.error(error, '请重新输入');
            });
        });

        // 删除相册事件
        pointer.updateModal.find('button[name="deleteAlbum_trigger"]').click(function () {
            var album_id = pointer.updateModal.find('span[name="album_id"]').html();
            var album_name = pointer.updateModal.find('input[name="album_name"]').val();
            var input = prompt('为防止误删，请输入本相册完整名称', '');
            if (input != null) {
                if (input == album_name) {
                    globals.notify().progress('正在移动到回收站~', '删除中', 'notify_delete_album');
                    request.deleteAlbum(album_id, input, true).always(function () {
                        globals.removeNotify('notify_delete_album');
                    }).final(function (data) {
                        toastr.success('已移至回收站，可请求管理员恢复~', '相册删除成功', {"timeOut": 10000});
                        pointer.updateModal.modal('hide');
                    });
                } else {
                    toastr.error('输入错误');
                }
            }
        });

        // 新标签打开封面
        pointer.updateModal.find('.open-album-cover').click(function () {
            var $input = $(this).prev();
            var cover_id = $input.attr('data-re-cover-id');
            if (cover_id && cover_id != '0') {
                window.open(('redirect?model=album&photo_id=' + cover_id).toURL());
            } else {
                window.open(config.path_params.cloudPath + $input.attr('data-re-cover-url'));
            }
        });

        // desc textArea 自适应高度
        config.textareaInputHeight = pointer.updateModal.find('textarea[name="album_desc"]').outerHeight();
        pointer.updateModal.find('textarea[name="album_desc"]').autoTextareaHeight({
            maxHeight: 100,
            minHeight: config.textareaInputHeight
        });
        pointer.createModal.find('textarea[name="album_desc"]').autoTextareaHeight({
            maxHeight: 100,
            minHeight: config.textareaInputHeight
        });
    };

    const request = globals.extend(globals.request, {
        album_handle: {
            'createAlbum': function (postData, success) {
                return globals.request.post(globals.api.createAlbum, postData, success, ['album'], success && '创建失败').final(function (album) {
                    config.callback.createCompleted.call(context, album);
                    context.trigger(config.event.createCompleted, album);
                });
            },
            'loadAlbum': function (album_id, success) {
                let postData = {"id": album_id, "photos": false};
                return globals.request.get(globals.api.getAlbum, postData, success, ['album'], success && '加载相册信息失败');
            },
            'updateAlbum': function (album, success) {
                let postData = $.extend(true, {}, album);
                if (postData.cover) {
                    postData["cover.photo_id"] = postData.cover.photo_id;
                    delete postData.cover;
                }
                if (postData.user) {
                    postData["user.uid"] = postData.user.uid;
                    delete postData.user;
                }
                return globals.request.post(globals.api.updateAlbum, postData, success, ['album'], success && '更新失败').final(function (album) {
                    config.callback.updateCompleted.call(context, album);
                    context.trigger(config.event.updateCompleted, album);
                });
            },
            'deleteAlbum': function (album_id, album_name, success) {
                let postData = {
                    "album_id": album_id,
                    "name": album_name,
                    "deleteFromDisk": true
                };
                return $.Deferred(function (dfd) {
                    let runDelete = function (allowDelete) {
                        if (allowDelete) {
                            globals.request.post(globals.api.deleteAlbum, postData, success, success && '相册删除失败').final(function (data) {
                                config.callback.deleteCompleted.call(context, postData);
                                context.trigger(config.event.deleteCompleted, postData);
                                dfd.resolveWith(this, arguments);
                            }, function () {
                                dfd.rejectWith(this, arguments);
                            });
                        } else {
                            globals.request.rejectedResp({'message': '删除被取消', 'type': -1}, success && '相册删除失败', null, false, dfd);
                        }
                    };
                    common_utils.wrapAsyncResult.call(context, context.trigger)(config.event.beforeDelete, postData).final(function (allowDelete) {
                        runDelete(allowDelete !== false);
                    }, function () {
                        runDelete(false);
                    });
                });
            },
        }
    }).album_handle;

    var openCreateAlbumModal = function () {
        if (!login_handle.validateLogin()) {
            toastr.error('你没有登录！');
            login_handle.jumpLogin();
            return false;
        }
        let openCreateModal_callback = function () {
            pointer.createModal.find('select[name="album_permission"]').val('10');
            pointer.createModal.find('select[name="album_show_col"]').val(config.album_default_col).parent().css('display', 'none');
            pointer.createModal.modal();
        };
        config.callback.beforeCreateModalOpen.call(context, pointer.createModal, openCreateModal_callback);
    };

    /**
     * 打开照片信息更新窗口
     * @param {Integer|Object} album - 可为album_id或album对象
     *          默认处理：对于窗口所需album对象，如果传入为album对象则直接使用，如果为album_id则调用loadAlbum异步获取；
     *                    如需修改可重写回调方法beforeUpdateModalOpen，该方法的参数album由此处的album参数传入；
     *          异步获取：异步获取album对象参考beforeUpdateModalOpen默认写法；
     *                    或异步获取完album对象后再将该对象传入此方法；
     */
    var openUpdateAlbumModal = function (album) {
        var formatAlbumToModal_callback = function (album) {
            var isAuthor = login_handle.equalsLoginUser(album.user.uid);
            pointer.updateModal.find('span[name="album_id"]').html(album.album_id);
            pointer.updateModal.find('input[name="album_name"]').val(album.name);
            pointer.updateModal.find('textarea[name="album_desc"]').val(album.description);
            pointer.updateModal.find('input[name="album_mount"]').val(album.mount);
            pointer.updateModal.find('select[name="album_permission"]').val(album.permission);
            pointer.updateModal.find('input[name="album_cover_path"]')
                .val((album.cover.photo_id && album.cover.photo_id != '0') ? album.cover.path : '').attr('data-re-cover-id', album.cover.photo_id || 0).attr('data-re-cover-url', album.cover.path)
                .closest('.form-group').find('label').parent().url('href', 'redirect?model=album&photo_id=' + album.cover.photo_id);
            pointer.updateModal.find('select[name="album_show_col"]').val(album.show_col);
            pointer.updateModal.find('span[name="album_size"]').html(album.size);
            pointer.updateModal.find('span[name="album_create_time"]').html(album.create_time);

            var btnStyle = isAuthor ? 'inline-block' : 'none';
            pointer.updateModal.find('button[name="updateAlbum_trigger"]').css('display', btnStyle);
            pointer.updateModal.find('button[name="deleteAlbum_trigger"]').css('display', btnStyle);

            // 计算一次desc高度
            pointer.updateModal.unbind('shown.bs.modal').on('shown.bs.modal', function () {
                pointer.updateModal.find('textarea[name="album_desc"]').autoTextareaHeight({
                    maxHeight: 100,
                    minHeight: config.textareaInputHeight,
                    runOnce: true
                });
            });
            pointer.updateModal.modal();
        };
        config.callback.beforeUpdateModalOpen.call(context, pointer.updateModal, formatAlbumToModal_callback, album)
    };

    var utils = {};

    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "utils": utils,
        "request": request,
        "openCreateAlbumModal": openCreateAlbumModal,
        "openUpdateAlbumModal": openUpdateAlbumModal,
        "on": globals.on,
        "once": globals.once,
        "trigger": globals.trigger,
        "off": globals.off
    };
    return context;
});