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
            "beforeCreateModalOpen": function (createModal, openCreateModal_callback) {  // 上传窗口打开前回调
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
        }
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
            album.show_col = pointer.createModal.find('input[name="album_show_col"]').val();
            createAlbum(album);
        });

        //提交更新相册事件
        pointer.updateModal.find('button[name="updateAlbum_trigger"]').click(function () {
            var album = {};
            album.album_id = pointer.updateModal.find('span[name="album_id"]').html();
            album.name = pointer.updateModal.find('input[name="album_name"]').val();
            album.description = pointer.updateModal.find('textarea[name="album_desc"]').val();
            album.permission = pointer.updateModal.find('input[name="album_permission"]:checked').val();
            album.cover = pointer.updateModal.find('input[name="album_cover_path"]').val();
            album.show_col = pointer.updateModal.find('input[name="album_show_col"]').val();
            updateAlbum(album);
        });

        //删除相册事件
        pointer.updateModal.find('button[name="deleteAlbum_trigger"]').click(function () {
            var album_id = pointer.updateModal.find('span[name="album_id"]').html();
            deleteAlbum(album_id)
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

    var deleteAlbum = function (album_id) {
        toastr.error("开发中。。。");
        config.callback.deleteCompleted.call(context, album_id);
    };

    var updateAlbum = function (album) {
        $.post("photo.do?method=updateAlbum", album, function (data) {
            if (data.flag == 200) {
                toastr.success("更新成功 ");
                pointer.updateModal.modal('hide');
                config.callback.updateCompleted.call(context, album);
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
            pointer.createModal.find('input[name="album_permission"][value="0"]').prop("checked", true);
            pointer.createModal.find('input[name="album_show_col"]').val(4);
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
            pointer.updateModal.find('input[name="album_cover_path"]').val(album.cover);
            pointer.updateModal.find('input[name="album_show_col"]').val(album.show_col);
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
    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "createAlbum": createAlbum,
        "loadAlbum": loadAlbum,
        "deleteAlbum": deleteAlbum,
        "updateAlbum": updateAlbum,
        "openCreateAlbumModal": openCreateAlbumModal,
        "openUpdateAlbumModal": openUpdateAlbumModal
    };
    return context;
});