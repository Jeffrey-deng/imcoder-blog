/**
 * 用户相册中心
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'common_utils', 'login_handle'], factory);
    } else {
        // Browser globals
        window.album_handle = factory(window.jQuery, null, toastr, common_utils, login_handle);
    }
})(function ($, bootstrap, toastr, common_utils, login_handle) {

    var pointer = {
        createModal: null,
        updateModal: null
    };

    var config = {
        path_params: {
            "basePath": "https://imcoder.site/",
            "cloudPath": "https://cloud.imcoder.site/",
            "staticPath": "https://static.imcoder.site/"
        },
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
            "deleteCompleted": function (album_id) {  // 在相册删除完成后回调
                return;
            },
            "beforeCreateModalOpen": function (createModal, openCreateModal_callback) {  // 创建窗口打开前回调
                openCreateModal_callback();
            },
            "beforeUpdateModalOpen": function (updateModal, formatAlbumToModal_callback, album) {  // 更新窗口打开前回调
                // 如果openUpdateAlbumModal传入的参数为album对象，直接使用
                if (typeof album == "object") {
                    formatAlbumToModal_callback(album);
                    // 如果传入的参数为album_id，异步获取album对象
                } else {
                    this.loadAlbum(album, function (data) {
                        var album = data.album;
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
        $.extend(true, config, options);
        pointer.createModal = $(config.selector.createAlbumModal);
        pointer.updateModal = $(config.selector.updateAlbumModal);

        //提交创建相册事件
        pointer.createModal.find('button[name="createAlbum_trigger"]').click(function () {
            var album = {};
            album.name = pointer.createModal.find('input[name="album_name"]').val();
            album.description = pointer.createModal.find('textarea[name="album_desc"]').val();
            album.permission = pointer.createModal.find('input[name="album_permission"]:checked').val();
            album.show_col = pointer.createModal.find('select[name="album_show_col"]').val();
            if (!album.name) {
                toastr.info("输入相册的名称", "");
                return;
            }
            createAlbum(album);
        });

        //提交更新相册事件
        pointer.updateModal.find('button[name="updateAlbum_trigger"]').click(function () {
            var album = {};
            album.album_id = pointer.updateModal.find('span[name="album_id"]').html();
            album.name = pointer.updateModal.find('input[name="album_name"]').val();
            album.description = pointer.updateModal.find('textarea[name="album_desc"]').val();
            album.permission = pointer.updateModal.find('input[name="album_permission"]:checked').val();
            album.show_col = pointer.updateModal.find('select[name="album_show_col"]').val();
            var coverUrl = pointer.updateModal.find('input[name="album_cover_path"]').val().trim();
            var beforeCoverUrl = pointer.updateModal.find('input[name="album_cover_path"]').attr("data-re-cover-url");
            var beforeCoverId = parseInt(pointer.updateModal.find('input[name="album_cover_path"]').attr("data-re-cover-id"));
            album.cover = {"photo_id": beforeCoverId};
            // 检查
            if (coverUrl) {
                if (coverUrl != beforeCoverUrl) {   // 如果用户修改封面图片地址，则查询数据库，是否有该图片
                    if (coverUrl.match(/^(https?:\/\/.*?\/(blog\/)?)?(user\/\d+\/album\/\d+\/\d+\/[0-9a-zA-Z_\.]+\.(gif|jpe?g|png|bmp|svg|ico))(\?[\x21-\x7e]*)?$/)) {
                        $.get("photo.do?method=photoListByAjax", {"path": RegExp.$3}, function (data) {
                            if (data.flag == 200 && data.photos.length > 0) {
                                var photo = data.photos[0];
                                album.cover.photo_id = photo.photo_id;
                                updateAlbum(album);
                            } else {
                                toastr.error("你输入相册封面不存在或没有权限或格式错误", "请重新输入");
                            }
                        });
                    } else {
                        toastr.error("你输入相册封面格式错误", "请重新输入");
                    }
                }
            } else {    // 如果用户清空了输入框代表用户要使用默认封面
                album.cover.photo_id = 0;
            }
            if (!coverUrl || coverUrl == beforeCoverUrl) {
                updateAlbum(album); // 不需要查询数据库就直接更新
            }
        });

        //删除相册事件
        pointer.updateModal.find('button[name="deleteAlbum_trigger"]').click(function () {
            var album_id = pointer.updateModal.find('span[name="album_id"]').html();
            var album_name = pointer.updateModal.find('input[name="album_name"]').val();
            var input = prompt("为防止误删，请输入本相册完整名称", "");
            if (input != null) {
                if (input == album_name) {
                    deleteAlbum(album_id, input)
                } else {
                    toastr.error("输入错误");
                }
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
        config.textareaInputHeight = pointer.updateModal.find('textarea[name="album_desc"]').outerHeight();
        pointer.updateModal.find('textarea[name="album_desc"]').autoTextarea({
            maxHeight: 100,
            minHeight: config.textareaInputHeight
        });
        pointer.createModal.find('textarea[name="album_desc"]').autoTextarea({
            maxHeight: 100,
            minHeight: config.textareaInputHeight
        });
    };

    var createAlbum = function (album) {
        $.post("photo.do?method=createAlbum", album, function (data) {
            if (data.flag == 200) {
                toastr.success("创建成功 ");
                pointer.createModal.modal('hide');
                config.callback.createCompleted.call(context, data.album);
                utils.triggerEvent(config.event.createCompleted, data.album);
            } else {
                toastr.error(data.info, "创建失败");
                console.warn("Error Code: " + data.flag);
            }
        });
    };

    var loadAlbum = function (album_id, success) {
        $.get("photo.do?method=albumByAjax", {"id": album_id}, function (data) {
            if (data.flag == 200) {
                success(data);
            } else {
                toastr.error(data.info, "加载相册信息失败!");
                console.warn("Error Code: " + data.flag);
            }
        });
    };

    var deleteAlbum = function (album_id, album_name) {
        var allow = utils.triggerEvent(config.event.beforeDelete, album_id, album_name);
        if (allow === false) {
            return;
        }
        common_utils.notify({
            "progressBar": false,
            "hideDuration": 0,
            "timeOut": 0,
            "closeButton": false
        }).success("正在移动到回收站~", "删除中", "notify_delete_album");
        var postData = {
            "album_id": album_id,
            "name": album_name,
            "deleteFromDisk": true
        };
        $.post("photo.do?method=deleteAlbum", postData, function (data) {
            common_utils.removeNotify("notify_delete_album");
            if (data.flag == 200) {
                toastr.success("已移至回收站，可请求管理员恢复~", "相册删除成功", {"timeOut": 10000});
                pointer.updateModal.modal('hide');
                config.callback.deleteCompleted.call(context, album_id);
                utils.triggerEvent(config.event.deleteCompleted, album_id);
            } else {
                toastr.error(data.info, "相册删除失败!");
                console.warn("Error Code: " + data.flag);
            }
        });
    };

    var updateAlbum = function (album) {
        var postAlbum = $.extend(true, {}, album);
        delete postAlbum.cover;
        postAlbum["cover.photo_id"] = album.cover.photo_id;
        $.post("photo.do?method=updateAlbum", postAlbum, function (data) {
            if (data.flag == 200) {
                toastr.success("更新成功 ");
                pointer.updateModal.modal('hide');
                config.callback.updateCompleted.call(context, data.album);
                utils.triggerEvent(config.event.updateCompleted, data.album);
            } else {
                toastr.error(data.info, "更新失败");
                console.warn("Error Code: " + data.flag);
            }
        });
    };
    var openCreateAlbumModal = function () {
        if (!login_handle.validateLogin()) {
            toastr.error("你没有登录！");
            login_handle.jumpLogin();
            return false;
        }
        var openCreateModal_callback = function () {
            pointer.createModal.find('input[name="album_permission"][value="2"]').prop("checked", true);
            pointer.createModal.find('select[name="album_show_col"]').val(config.album_default_col).parent().css("display", "none");
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
            pointer.updateModal.find('input[name="album_permission"]').each(function () {
                if ($(this).val() == album.permission) {
                    $(this).prop("checked", true);
                }
            });
            pointer.updateModal.find('input[name="album_cover_path"]')
                .val(album.cover.photo_id == 0 ? "" : album.cover.path).attr("data-re-cover-id", album.cover.photo_id).attr("data-re-cover-url", album.cover.path);
            pointer.updateModal.find('select[name="album_show_col"]').val(album.show_col);
            pointer.updateModal.find('span[name="album_size"]').html(album.size);
            pointer.updateModal.find('span[name="album_create_time"]').html(album.create_time);

            var btnStyle = isAuthor ? "inline-block" : "none";
            pointer.updateModal.find('button[name="updateAlbum_trigger"]').css("display", btnStyle);
            pointer.updateModal.find('button[name="deleteAlbum_trigger"]').css("display", btnStyle);

            // 计算一次desc高度
            pointer.updateModal.unbind("shown.bs.modal").on('shown.bs.modal', function () {
                pointer.updateModal.find('textarea[name="album_desc"]').autoTextarea({
                    maxHeight: 100,
                    minHeight: config.textareaInputHeight,
                    runOnce: true
                });
            });
            pointer.updateModal.modal();
        };
        config.callback.beforeUpdateModalOpen.call(context, pointer.updateModal, formatAlbumToModal_callback, album)
    };

    var utils = {
        "bindEvent": function (eventName, func) {
            $(context).bind(eventName, func);
        },
        "triggerEvent": function (eventName) {
            return $(context).triggerHandler(eventName, Array.prototype.slice.call(arguments, 1));
        },
        "unbindEvent": function (eventName, func) {
            $(context).unbind(eventName, func);
        }
    };

    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "utils": utils,
        "createAlbum": createAlbum,
        "loadAlbum": loadAlbum,
        "deleteAlbum": deleteAlbum,
        "updateAlbum": updateAlbum,
        "openCreateAlbumModal": openCreateAlbumModal,
        "openUpdateAlbumModal": openUpdateAlbumModal
    };
    return context;
});