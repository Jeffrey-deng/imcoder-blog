/**
 * 包装标签PhotoTagWrapper管理
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'common_utils', 'login_handle', 'period_cache'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, common_utils, login_handle, PeriodCache);
    }
})(function ($, bootstrap, domReady, toastr, common_utils, login_handle, PeriodCache) {

    var pointer = {
        tagWrappers: [],
        createModal: null,
        updateModal: null,
    };

    var config = {
        selector: {
            "createModal": "#createTagWrapperModal",
            "updateModal": "#updateTagWrapperModal",
            "tagWrapperLineIdPrefix": "ptw_",
            "commonWrappersPanel": "#common_wrappers_panel",
            "searchWrappersPanel": "#search_wrappers_panel",
            "markWrappersPanel": "#mark_wrappers_panel",
        },
        callback: {
            "loadPhotoTagWrappers": function (config, callback) {
                common_utils.notify({
                    "progressBar": false,
                    "hideDuration": 0,
                    "showDuration": 0,
                    "timeOut": 0,
                    "closeButton": false
                }).success("正在加载数据", "", "notify_tag_wrappers_loading");
                var params = $.extend(true, {}, config.load_condition);
                return $.get("photo.api?method=getTagWrappers", params, function (response) {
                    common_utils.removeNotify("notify_tag_wrappers_loading");
                    if (response.status == 200) {
                        callback.call(context, response.data.tagWrappers);
                    } else {
                        toastr.error(response.message, response.status);
                        console.warn("Error Code: " + response.status);
                    }
                }).fail(function (XHR, TS) {
                    common_utils.removeNotify("notify_tag_wrappers_loading");
                    toastr.error(TS, "错误", {"progressBar": false});
                    console.warn("Error Code: " + TS);
                });
            },
            "beforeCreateModalOpen": function (createModal) {
                var context = this;
                return $.Deferred(function (dfd) {
                    request.loadAlbums(context.config.load_condition.uid, function (albums) {
                        dfd.resolveWith(context, [albums]);
                    });
                });
            },
            "beforeUpdateModalOpen": function (updateModal, tagWrapper) {
                var context = this;
                return $.Deferred(function (dfd) {
                    request.loadAlbums(context.config.load_condition.uid, function (albums) {
                        // 如果openUpdateTagWrapperModal传入的参数为tagWrapper对象，直接使用
                        if (typeof tagWrapper == "object") {
                            dfd.resolveWith(context, [tagWrapper, albums]);
                        } else {
                            dfd.resolveWith(context, [context.utils.getTagWrapperInPage(tagWrapper), albums]);
                        }
                    });
                });
            },
            "createCompleted": function (saveTagWrapper) {

            },
            "updateCompleted": function (saveTagWrapper) {

            },
        },
        permissionMap: {
            "0": "游客可见",
            "1": "游客可见，但不公开",
            "2": "登陆可见",
            "3": "登陆可见，但不公开",
            "4": "粉丝可见",
            "5": "粉丝可见，但不公开",
            "6": "关注的用户可见",
            "7": "关注的用户可见，但不公开",
            "8": "好友可见",
            "9": "好友可见，但不公开",
            "10": "私有"
        }
    };

    var init = function (options) {
        $.extend(true, config, options);
        pointer.createModal = $(config.selector.createModal);
        pointer.updateModal = $(config.selector.updateModal);

        // 创建窗口事件
        pointer.createModal.find(".tag-wrapper-type-group .tag-wrapper-type").change(function () {
            var createModal = pointer.createModal;
            var type = $(this).val();
            if (type == "0") {
                createModal.find(".tag-wrapper-match-mode-group").hide();
                createModal.find(".tag-wrapper-pattern-group").hide();
                createModal.find(".tag-wrapper-action-group").hide();
                createModal.find(".tag-wrapper-extra-group").hide();
                createModal.find(".tag-wrapper-weight-group").hide();
                createModal.find(".tag-wrapper-common-value-group").hide();
                createModal.find(".tag-wrapper-topic-group").show();
            } else if (type == "1") {
                createModal.find(".tag-wrapper-match-mode-group").show();
                createModal.find(".tag-wrapper-pattern-group").show();
                createModal.find(".tag-wrapper-action-group").show();
                createModal.find(".tag-wrapper-extra-group").show();
                createModal.find(".tag-wrapper-weight-group").show();
                createModal.find(".tag-wrapper-common-value-group").show();
                createModal.find(".tag-wrapper-topic-group").hide();
            }
        });
        pointer.createModal.find(".tag-wrapper-scope-group .tag-wrapper-scope").change(function () {
            var type = $(this).val();
            if (type == "0") {
                pointer.createModal.find(".tag-wrapper-permission-group").show();
            } else {
                pointer.createModal.find(".tag-wrapper-permission-group").hide();
            }
        });
        pointer.createModal.find(".tag-wrapper-common-value-group .tag-wrapper-common-value").click(function () {
            var createModal = pointer.createModal;
            var type = $(this).val();
            if (type == "0") {
                createModal.find(".tag-wrapper-scope-group").show();
            } else if (type == "1") {
                createModal.find(".tag-wrapper-scope-group").hide();
                createModal.find(".tag-wrapper-permission-group").show();
            }
        });
        pointer.createModal.find(".tag-wrapper-topic-group .tag-wrapper-topic").click(function () {
            var type = $(this).val();
            if (type == "0") {
                pointer.createModal
                    .find(".sync-topic-to-photos-group").hide()
                    .find('.sync-topic-to-photos[value="0"]').trigger("click");
            } else if (type == "1") {
                pointer.createModal
                    .find(".sync-topic-to-photos-group").show()
                    .find('.sync-topic-to-photos[value="0"]').trigger("click");
            }
        });
        pointer.createModal.find(".sync-topic-to-photos-group .sync-topic-to-photos").click(function () {
            var type = $(this).val();
            if (type == "0") {
                pointer.createModal
                    .find(".sync-topic-to-photos-mode-group").hide()
                    .find('.sync-topic-to-photos-mode[value="0"]').prop("checked", true);
            } else if (type == "1") {
                pointer.createModal
                    .find(".sync-topic-to-photos-mode-group").show()
                    .find('.sync-topic-to-photos-mode[value="0"]').prop("checked", true);
            }
        });
        pointer.createModal.find(".create-tag-wrapper-trigger").click(function () {
            var createModal = pointer.createModal;
            var wrapper = {};
            wrapper.type = parseInt(createModal.find(".tag-wrapper-type-group .tag-wrapper-type").val());
            wrapper.name = createModal.find(".tag-wrapper-name-group .tag-wrapper-name").val();
            wrapper.match_mode = parseInt(createModal.find(".tag-wrapper-match-mode-group .tag-wrapper-match-mode").val());
            wrapper.pattern = createModal.find(".tag-wrapper-pattern-group .tag-wrapper-pattern").val();
            wrapper.action = parseInt(createModal.find('.tag-wrapper-action-group .tag-wrapper-action:checked').val());
            wrapper.extra = parseInt(createModal.find('.tag-wrapper-extra-group .tag-wrapper-extra:checked').val());
            wrapper.weight = parseInt(createModal.find(".tag-wrapper-weight-group .tag-wrapper-weight").val());
            wrapper.scope = createModal.find(".tag-wrapper-scope-group .tag-wrapper-scope").val();
            wrapper.permission = parseInt(createModal.find(".tag-wrapper-permission-group .tag-wrapper-permission").val());
            wrapper.description = createModal.find(".tag-wrapper-desc-group .tag-wrapper-desc").val();
            wrapper.common_value = parseInt(createModal.find('.tag-wrapper-common-value-group .tag-wrapper-common-value:checked').val());
            wrapper.topic = parseInt(createModal.find('.tag-wrapper-topic-group .tag-wrapper-topic:checked').val());
            wrapper.syncTopicToPhotos = createModal.find('.sync-topic-to-photos-group .sync-topic-to-photos:checked').val() == "0" ? false : true;
            wrapper.syncTopicToPhotosMode = parseInt(createModal.find('.sync-topic-to-photos-mode-group .sync-topic-to-photos-mode:checked').val());
            if (wrapper.type == 0) {
                wrapper.match_mode = 0;
                wrapper.pattern = wrapper.name;
                wrapper.weight = 0;
                wrapper.action = 0;
                wrapper.extra = 0;
                wrapper.common_value = 0;
            } else {
                if (wrapper.common_value == 1) {
                    wrapper.scope = "0";
                }
                wrapper.topic = 0;
            }
            if (wrapper.scope != "0") {
                wrapper.permission = parseInt(createModal.find(".tag-wrapper-scope-group .tag-wrapper-scope option:selected").attr("data-album-permission"));
            }
            if (wrapper.topic == 0 || wrapper.syncTopicToPhotos == false) {
                delete wrapper.syncTopicToPhotos;
                delete wrapper.syncTopicToPhotosMode;
            }
            if (!wrapper.name) {
                toastr.error("未输入标签name", "错误", {"progressBar": false});
                return;
            }
            if (wrapper.type == 1 && !wrapper.pattern) {
                toastr.error("未输入标签匹配内容pattern", "错误", {"progressBar": false});
                return;
            }
            if (isNaN(wrapper.weight)) {
                toastr.error("标签权重需要是数字，且是整数~", "错误", {"progressBar": false});
                return;
            }
            request.createTagWrapper(wrapper, function (saveTagWrapper, response) {
                toastr.success("创建成功~");
                if (wrapper.syncTopicToPhotos) {
                    var syncTopicToPhotosResult = response.data.syncTopicToPhotosResult;
                    var syncTopicToPhotosAffectedRows = response.data.syncTopicToPhotosAffectedRows;
                    if (syncTopicToPhotosResult == 200 || syncTopicToPhotosResult == 404) {
                        toastr.success("影响的照片数：" + syncTopicToPhotosAffectedRows, "topicId同步到照片成功~");
                    } else {
                        toastr.error("topicId同步到照片失败~", syncTopicToPhotosResult);
                    }
                }
                createModal.modal('hide');
                config.callback.createCompleted.call(context, saveTagWrapper, response);
            });
        });

        // 更新窗口事件
        pointer.updateModal.find(".tag-wrapper-type-group .tag-wrapper-type").change(function () {
            var updateModal = pointer.updateModal;
            var type = $(this).val();
            if (type == "0") {
                updateModal.find(".tag-wrapper-match-mode-group").hide();
                updateModal.find(".tag-wrapper-pattern-group").hide();
                updateModal.find(".tag-wrapper-action-group").hide();
                updateModal.find(".tag-wrapper-extra-group").hide();
                updateModal.find(".tag-wrapper-weight-group").hide();
                updateModal.find(".tag-wrapper-common-value-group").hide();
                updateModal.find(".tag-wrapper-topic-group").show();
            } else if (type == "1") {
                updateModal.find(".tag-wrapper-match-mode-group").show();
                updateModal.find(".tag-wrapper-pattern-group").show();
                updateModal.find(".tag-wrapper-action-group").show();
                updateModal.find(".tag-wrapper-extra-group").show();
                updateModal.find(".tag-wrapper-weight-group").show();
                updateModal.find(".tag-wrapper-common-value-group").show();
                updateModal.find(".tag-wrapper-topic-group").hide();
            }
        });
        pointer.updateModal.find(".tag-wrapper-scope-group .tag-wrapper-scope").change(function () {
            var type = $(this).val();
            if (type == "0") {
                pointer.updateModal.find(".tag-wrapper-permission-group").show();
            } else {
                pointer.updateModal.find(".tag-wrapper-permission-group").hide();
            }
        });
        pointer.updateModal.find(".tag-wrapper-common-value-group .tag-wrapper-common-value").click(function () {
            var updateModal = pointer.updateModal;
            var type = $(this).val();
            if (type == "0") {
                updateModal.find(".tag-wrapper-scope-group").show();
            } else if (type == "1") {
                updateModal.find(".tag-wrapper-scope-group").hide();
                updateModal.find(".tag-wrapper-permission-group").show();
            }
        });
        pointer.updateModal.find(".tag-wrapper-topic-group .tag-wrapper-topic").click(function () {
            var type = $(this).val();
            if (type == "0") {
                pointer.updateModal
                    .find(".sync-topic-to-photos-group").hide()
                    .find('.sync-topic-to-photos[value="0"]').trigger("click");
            } else if (type == "1") {
                pointer.updateModal
                    .find(".sync-topic-to-photos-group").show()
                    .find('.sync-topic-to-photos[value="0"]').trigger("click");
            }
        });
        pointer.updateModal.find(".sync-topic-to-photos-group .sync-topic-to-photos").click(function () {
            var type = $(this).val();
            if (type == "0") {
                pointer.updateModal
                    .find(".sync-topic-to-photos-mode-group").hide()
                    .find('.sync-topic-to-photos-mode[value="0"]').prop("checked", true);
            } else if (type == "1") {
                pointer.updateModal
                    .find(".sync-topic-to-photos-mode-group").show()
                    .find('.sync-topic-to-photos-mode[value="0"]').prop("checked", true);
            }
        });
        pointer.updateModal.find(".update-tag-wrapper-trigger").click(function () {
            var updateModal = pointer.updateModal;
            var wrapper = {};
            wrapper.ptwid = updateModal.find(".tag-wrapper-id-group .tag-wrapper-id").attr("data-ptwid");
            wrapper.type = parseInt(updateModal.find(".tag-wrapper-type-group .tag-wrapper-type").val());
            wrapper.name = updateModal.find(".tag-wrapper-name-group .tag-wrapper-name").val();
            wrapper.match_mode = parseInt(updateModal.find(".tag-wrapper-match-mode-group .tag-wrapper-match-mode").val());
            wrapper.pattern = updateModal.find(".tag-wrapper-pattern-group .tag-wrapper-pattern").val();
            wrapper.action = parseInt(updateModal.find('.tag-wrapper-action-group .tag-wrapper-action:checked').val());
            wrapper.extra = parseInt(updateModal.find('.tag-wrapper-extra-group .tag-wrapper-extra:checked').val());
            wrapper.weight = parseInt(updateModal.find(".tag-wrapper-weight-group .tag-wrapper-weight").val());
            wrapper.scope = updateModal.find(".tag-wrapper-scope-group .tag-wrapper-scope").val();
            wrapper.permission = parseInt(updateModal.find(".tag-wrapper-permission-group .tag-wrapper-permission").val());
            wrapper.description = updateModal.find(".tag-wrapper-desc-group .tag-wrapper-desc").val();
            wrapper.common_value = parseInt(updateModal.find('.tag-wrapper-common-value-group .tag-wrapper-common-value:checked').val());
            wrapper.topic = parseInt(updateModal.find('.tag-wrapper-topic-group .tag-wrapper-topic:checked').val());
            wrapper.syncTopicToPhotos = updateModal.find('.sync-topic-to-photos-group .sync-topic-to-photos:checked').val() == "0" ? false : true;
            wrapper.syncTopicToPhotosMode = parseInt(updateModal.find('.sync-topic-to-photos-mode-group .sync-topic-to-photos-mode:checked').val());
            if (wrapper.type == 0) {
                wrapper.match_mode = 0;
                wrapper.pattern = wrapper.name;
                wrapper.action = 0;
                wrapper.extra = 0;
                wrapper.common_value = 0;
            } else {
                if (wrapper.common_value == 1) {
                    wrapper.scope = "0";
                }
                wrapper.topic = 0;
            }
            if (wrapper.scope != "0") {
                wrapper.permission = parseInt(updateModal.find(".tag-wrapper-scope-group .tag-wrapper-scope option:selected").attr("data-album-permission"));
            }
            if (wrapper.topic == 0 || wrapper.syncTopicToPhotos == false) {
                delete wrapper.syncTopicToPhotos;
                delete wrapper.syncTopicToPhotosMode;
            }
            if (!wrapper.name) {
                toastr.error("未输入标签name", "错误", {"progressBar": false});
                return;
            }
            if (wrapper.type == 1 && !wrapper.pattern) {
                toastr.error("未输入标签匹配内容pattern", "错误", {"progressBar": false});
                return;
            }
            if (isNaN(wrapper.weight)) {
                toastr.error("标签权重需要是数字，且是整数~", "错误", {"progressBar": false});
                return;
            }
            request.updateTagWrapper(wrapper, function (saveTagWrapper, response) {
                toastr.success("更新成功~");
                if (wrapper.syncTopicToPhotos) {
                    var syncTopicToPhotosResult = response.data.syncTopicToPhotosResult;
                    var syncTopicToPhotosAffectedRows = response.data.syncTopicToPhotosAffectedRows;
                    var batchReplacePhotoTagResult = response.data.batchReplacePhotoTagResult;
                    var batchReplacePhotoTagAffectedRows = response.data.batchReplacePhotoTagAffectedRows;
                    if (batchReplacePhotoTagResult) {
                        if (batchReplacePhotoTagResult == 200 || batchReplacePhotoTagResult == 404) {
                            toastr.success("影响的照片数：" + batchReplacePhotoTagAffectedRows, "topicName同步到照片成功~");
                        } else {
                            toastr.error("topicName同步到照片失败~", batchReplacePhotoTagResult);
                        }
                    }
                    if (syncTopicToPhotosResult == 200 || syncTopicToPhotosResult == 404) {
                        toastr.success("影响的照片数：" + syncTopicToPhotosAffectedRows, "topicId同步到照片成功~");
                    } else {
                        toastr.error("topicId同步到照片失败~", syncTopicToPhotosResult);
                    }
                }
                updateModal.modal('hide');
                config.callback.updateCompleted.call(context, saveTagWrapper, response);
            });
        });
        config.callback.loadPhotoTagWrappers.call(context, config, function (tagWrappers) {
            pointer.tagWrappers = tagWrappers.filter(function (w) {
                return w.uid == config.load_condition.uid;
            });
            jumpPage(1);
        });
    };

    var jumpPage = function (pageNum) {
        assembleCurrentTableHtml(pointer.tagWrappers);
    };

    var assembleCurrentTableHtml = function (tagWrapperList) {
        var commonWrappersHtml = "", searchWrappersHtml = "", markWrappersHtml = "", isAuthor = login_handle.equalsLoginUser(config.load_condition.uid);
        for (var i = 0, size = tagWrapperList.length; i < size; i++) {
            var wrapper = tagWrapperList[i];
            // commonWrappersHtml
            if (wrapper.common_value == 1) {
                var wrapperUrl = "p/tag/" + wrapper.name;
                var childTagUrl = "p/tags_square?" + (wrapper.match_mode == 5 ? "" : ("tags=<" + wrapper.name + ">&extend=true&")) + "filter=" + wrapper.name;
                commonWrappersHtml += '<tbody id="' + config.selector.tagWrapperLineIdPrefix + wrapper.ptwid + '" data-ptwid="' + wrapper.ptwid + '"><tr>';
                commonWrappersHtml += '<td><a href="' + wrapperUrl + '" target="_blank"><b>' + wrapper.ptwid + '</b></a></td>';
                commonWrappersHtml += '<td title="' + wrapper.description + '"><b>' + wrapper.name + '</b></td>';
                commonWrappersHtml += '<td>' + wrapper.match_mode + '</td>';
                commonWrappersHtml += '<td><a href="' + childTagUrl + '" target="_blank" title="点击查看匹配的标签">' + wrapper.pattern + '</a></td>';
                commonWrappersHtml += '<td>' + (wrapper.action == 0 ? "continue" : "break") + '</td>';
                commonWrappersHtml += '<td>' + (wrapper.extra == 0 ? "否" : "组") + '</td>';
                commonWrappersHtml += '<td>' + wrapper.weight + '</td>';
                isAuthor && (commonWrappersHtml += '<td title="' + wrapper.permission + '">' + config.permissionMap[wrapper.permission] + '</td>');
                commonWrappersHtml += '</tr></tbody>';
            }
            // searchWrappersHtml
            else if (wrapper.type == 1 && isAuthor) {
                var wrapperUrl = "p/tag/" + wrapper.name + "?uid=" + wrapper.uid;
                var childTagUrl = "p/tags_square?" + (wrapper.match_mode == 5 ? "" : ("tags=<" + wrapper.name + ">&extend=true&")) + "uid=" + wrapper.uid +
                    (wrapper.scope == 0 ? "" : ("&album_id=" + wrapper.scope + "&from=album_detail")) +
                    "&filter=" + wrapper.name;
                searchWrappersHtml += '<tbody id="' + config.selector.tagWrapperLineIdPrefix + wrapper.ptwid + '" data-ptwid="' + wrapper.ptwid + '"><tr>';
                searchWrappersHtml += '<td><a href="' + wrapperUrl + '" target="_blank"><b>' + wrapper.ptwid + '</b></a></td>';
                searchWrappersHtml += '<td title="' + wrapper.description + '"><b>' + wrapper.name + '</b></td>';
                searchWrappersHtml += '<td>' + wrapper.match_mode + '</td>';
                searchWrappersHtml += '<td><a href="' + childTagUrl + '" target="_blank" title="点击查看匹配的标签">' + wrapper.pattern + '</a></td>';
                searchWrappersHtml += '<td>' + (wrapper.action == 0 ? "continue" : "break") + '</td>';
                searchWrappersHtml += '<td>' + (wrapper.extra == 0 ? "否" : "组") + '</td>';
                searchWrappersHtml += '<td>' + wrapper.weight + '</td>';
                searchWrappersHtml += '<td>' + (wrapper.scope != '0' ? ('<a href="p/album/' + wrapper.scope + '" target="_blank"><b>' + wrapper.scope + '</b></a>') : wrapper.scope) + '</td>';
                isAuthor && (searchWrappersHtml += '<td title="' + wrapper.permission + '">' + config.permissionMap[wrapper.permission] + '</td>');
                searchWrappersHtml += '</tr></tbody>';
            }
            // markWrappersHtml
            else if (wrapper.type == 0) {
                var wrapperUrl = wrapper.topic == 1 ? ("p/topic/" + wrapper.ptwid) : ("p/tag/" + wrapper.name + "?uid=" + wrapper.uid);
                markWrappersHtml += '<tbody id="' + config.selector.tagWrapperLineIdPrefix + wrapper.ptwid + '" data-ptwid="' + wrapper.ptwid + '"><tr>';
                markWrappersHtml += '<td><a href="' + wrapperUrl + '" target="_blank"><b>' + wrapper.ptwid + '</b></a></td>';
                markWrappersHtml += '<td title="' + wrapper.description + '"><b>' + wrapper.name + '</b></td>';
                markWrappersHtml += '<td>' + (wrapper.description || "无") + '</td>';
                markWrappersHtml += '<td>' + (wrapper.topic == 0 ? "否" : "是") + '</td>';
                markWrappersHtml += '<td>' + (wrapper.scope != '0' ? ('<a href="p/album/' + wrapper.scope + '" target="_blank"><b>' + wrapper.scope + '</b></a>') : wrapper.scope) + '</td>';
                isAuthor && (markWrappersHtml += '<td title="' + wrapper.permission + '">' + config.permissionMap[wrapper.permission] + '</td>');
                markWrappersHtml += '</tr></tbody>';
            }
        }
        if (commonWrappersHtml) {
            var commonWrappersHeaderHtml = '<thead><tr>'
                + '<th>id</th>'
                + '<th>name</th>'
                + '<th>match_mode</th>'
                + '<th>pattern</th>'
                + '<th>action</th>'
                + '<th>extra</th>'
                + '<th>weight</th>'
                + (isAuthor ? '<th>permission</th>' : '')
                + '</tr></thead>';
            $(config.selector.commonWrappersPanel).show().find("table").html(commonWrappersHeaderHtml + commonWrappersHtml).end().prev().show();
        } else {
            $(config.selector.commonWrappersPanel).hide().prev().hide();
        }
        if (searchWrappersHtml) {
            var searchWrappersHeaderHtml = '<thead><tr>'
                + '<th>id</th>'
                + '<th>name</th>'
                + '<th>match_mode</th>'
                + '<th>pattern</th>'
                + '<th>action</th>'
                + '<th>extra</th>'
                + '<th>weight</th>'
                + '<th>scope</th>'
                + (isAuthor ? '<th>permission</th>' : '')
                + '</tr></thead>';
            $(config.selector.searchWrappersPanel).show().find("table").html(searchWrappersHeaderHtml + searchWrappersHtml).end().prev().show();
        } else {
            $(config.selector.searchWrappersPanel).hide().prev().hide();
        }
        if (markWrappersHtml) {
            var markWrappersHeaderHtml = '<thead><tr>'
                + '<th>id</th>'
                + '<th>name</th>'
                + '<th>description</th>'
                + '<th>topic</th>'
                + '<th>scope</th>'
                + (isAuthor ? '<th>permission</th>' : '')
                + '</tr></thead>';
            $(config.selector.markWrappersPanel).show().find("table").html(markWrappersHeaderHtml + markWrappersHtml).end().prev().show();;
        } else {
            $(config.selector.markWrappersPanel).hide().prev().hide();
        }
    };

    var openCreateTagWrapperModal = function () {
        var assignTagWrapperToModal_callback = function (albums) {
            var createModal = pointer.createModal;
            var albums_options_html = '<option value="0">全局</option>';
            albums && $.each(albums, function (index, album) {
                albums_options_html += '<option value="' + album.album_id + '" data-album-permission="' + album.permission + '">相册：' + album.name + '</option>';
            });
            createModal.find(".tag-wrapper-scope-group .tag-wrapper-scope").html(albums_options_html).val("0").trigger("change");
            createModal.find(".tag-wrapper-type-group .tag-wrapper-type").val("1").trigger("change");
            createModal.find(".tag-wrapper-weight-group .tag-wrapper-weight").val("0");
            createModal.find('.tag-wrapper-action-group .tag-wrapper-action[value="' + 0 + '"]').prop("checked", true);
            createModal.find('.tag-wrapper-extra-group .tag-wrapper-extra[value="' + 0 + '"]').prop("checked", true);
            createModal.find('.tag-wrapper-common-value-group .tag-wrapper-common-value[value="' + 0 + '"]').prop("checked", true).trigger("click");
            createModal.find('.tag-wrapper-topic-group .tag-wrapper-topic[value="0"]').prop("checked", true).trigger("click");
            createModal.modal('show');
        };
        // 回调
        common_utils.wrapAsyncResult.call(context, config.callback.beforeCreateModalOpen)(pointer.createModal).then(assignTagWrapperToModal_callback);
    };

    var openUpdateTagWrapperModal = function (tagWrapper) {
        var assignTagWrapperToModal_callback = function (wrapper, albums) {
            var updateModal = pointer.updateModal;
            var tag_link = wrapper.topic == 1 ? ("p/topic/" + wrapper.ptwid) : ("p/tag/" + wrapper.name + (wrapper.common_value == 0 ? ("?uid=" + wrapper.uid) : ""));
            updateModal.find(".tag-wrapper-id-group .tag-wrapper-id").text(wrapper.ptwid).attr("data-ptwid", wrapper.ptwid).parent().attr("href", tag_link);
            updateModal.find(".tag-wrapper-type-group .tag-wrapper-type").val(wrapper.type).trigger("change");
            updateModal.find(".tag-wrapper-name-group .tag-wrapper-name").val(wrapper.name).attr("data-source-name", wrapper.name);
            updateModal.find(".tag-wrapper-match-mode-group .tag-wrapper-match-mode").val(wrapper.match_mode);
            updateModal.find(".tag-wrapper-pattern-group .tag-wrapper-pattern").val(wrapper.pattern);
            updateModal.find('.tag-wrapper-action-group .tag-wrapper-action[value="' + wrapper.action + '"]').prop("checked", true);
            updateModal.find('.tag-wrapper-extra-group .tag-wrapper-extra[value="' + wrapper.extra + '"]').prop("checked", true);
            updateModal.find(".tag-wrapper-weight-group .tag-wrapper-weight").val(wrapper.weight);
            var albums_options_html = '<option value="0">全局</option>';
            albums && $.each(albums, function (index, album) {
                albums_options_html += '<option value="' + album.album_id + '" data-album-permission="' + album.permission + '">相册：' + album.name + '</option>';
            });
            updateModal.find(".tag-wrapper-scope-group .tag-wrapper-scope").html(albums_options_html).val(wrapper.scope).trigger("change");
            updateModal.find(".tag-wrapper-permission-group .tag-wrapper-permission").val(wrapper.permission);
            updateModal.find(".tag-wrapper-desc-group .tag-wrapper-desc").val(wrapper.description);
            updateModal.find('.tag-wrapper-common-value-group .tag-wrapper-common-value[value="' + wrapper.common_value + '"]').prop("checked", true).trigger("click");
            updateModal.find('.tag-wrapper-topic-group .tag-wrapper-topic[value="' + wrapper.topic + '"]').prop("checked", true).trigger("click");
            updateModal.modal('show');
        };
        // 回调
        common_utils.wrapAsyncResult.call(context, config.callback.beforeUpdateModalOpen)(pointer.updateModal, tagWrapper).then(assignTagWrapperToModal_callback);
    };

    var request = {
        "createTagWrapper": function (tagWrapper, success) {
            if (!tagWrapper) {
                toastr.error("提交的tagWrapper为空~");
                return;
            }
            $.post("photo.api?method=saveTagWrapper", tagWrapper, function (response) {
                if (response.status == 200) {
                    success.call(context, response.data.tagWrapper, response);
                } else {
                    toastr.error(response.message, response.status);
                    console.warn("Error Code: " + response.status);
                }
            }).fail(function (XHR, TS) {
                toastr.error(TS, "错误", {"progressBar": false});
                console.warn("Error Code: " + TS);
            });
        },
        "updateTagWrapper": function (tagWrapper, success) {
            if (!tagWrapper) {
                toastr.error("提交的tagWrapper为空~");
                return;
            }
            $.post("photo.api?method=updateTagWrapper", tagWrapper, function (response) {
                if (response.status == 200) {
                    success.call(context, response.data.tagWrapper, response);
                } else {
                    toastr.error(response.message, response.status);
                    console.warn("Error Code: " + response.status);
                }
            }).fail(function (XHR, TS) {
                toastr.error(TS, "错误", {"progressBar": false});
                console.warn("Error Code: " + TS);
            });
        },
        "loadAlbums": function (uid, success) {
            $.get("photo.api?method=getAlbumList", {"user.uid": uid}, function (response) {
                if (response.status == 200) {
                    success(response.data.albums);
                } else {
                    success([]);
                    toastr.error(response.message, "加载相册列表失败");
                    console.warn("Error Code: " + response.status);
                }
            });
        }
    };

    var utils = {
        "getTagWrapper": function (ptwid, tagWrappers) {
            var tagWrapper = null;
            for (var i = 0, length = tagWrappers.length; i < length; i++) {
                var wrapper = tagWrappers[i];
                if (wrapper.ptwid == ptwid) {
                    tagWrapper = wrapper;
                    break;
                }
            }
            return tagWrapper;
        },
        "getTagWrapperInPage": function (ptwid) {
            return this.getTagWrapper(ptwid, pointer.tagWrappers);
        }
    };

    var context = {
        "pointer": pointer,
        "config": config,
        "init": init,
        "jumpPage": jumpPage,
        "utils": utils,
        "openUpdateTagWrapperModal": openUpdateTagWrapperModal,
        "openCreateTagWrapperModal": openCreateTagWrapperModal
    };

    domReady(function () {

        var params = common_utils.parseURL(window.location.href).params;
        var load_condition = {};
        $.each(params, function (key, value) {
            params[key] = value && decodeURIComponent(decodeURIComponent(value));
            if (key != "method" && key != "size" && key != "col" && key != "page" && key != "check" && key != "model") {
                load_condition[key] = params[key];
            }
        });
        var hostUser = $("#first").find(".slogan_name").attr("data-host-user");
        load_condition.uid = hostUser;
        var isClearTopicsPage = false;
        var clearPageMatch = document.location.pathname.match(/.*\/(u\/([^/]*)\/?(topics))/);
        if (clearPageMatch != null) {
            isClearTopicsPage = true;
            load_condition.type = 0;
            load_condition.topic = 1;
        }

        // 创建一个定期刷新的内存缓存实例
        var memoryPeriodCache = new PeriodCache({
            cacheCtx: { // 重写cacheCtx，修改存储的位置
                "ctx": {},
                "setItem": function (key, value) {
                    this.ctx[key] = value;
                },
                "getItem": function (key) {
                    return this.ctx[key];
                },
                "removeItem": function (key) {
                    delete this.ctx[key];
                }
            }
        });
        // 从内存缓存实例中得到用户相册列表组连接
        var secureUserAlbumListConn = memoryPeriodCache.getOrCreateGroup({
            "groupName": "user_album_list_cache",
            "timeOut": 180000,
            "reload": {
                "url": "photo.api?method=getAlbumList",
                "params": function (groupName, key) {
                    return {"user.uid": key};
                },
                "parse": function (cacheCtx, groupName, key, old_object_value, response) {
                    if (response.status == 200) {
                        return response.data.albums;
                    } else {
                        return null;
                    }
                }
            }
        });
        context.init({
            "load_condition": load_condition,
            "callback": {
                "beforeCreateModalOpen": function (createModal) {
                    var context = this;
                    return $.Deferred(function (dfd) {
                        secureUserAlbumListConn.get(context.config.load_condition.uid, function (albums) {
                            dfd.resolveWith(context, [albums]);
                        });
                    });
                },
                "beforeUpdateModalOpen": function (updateModal, tagWrapper) {
                    var context = this;
                    return $.Deferred(function (dfd) {
                        secureUserAlbumListConn.get(context.config.load_condition.uid, function (albums) {
                            // 如果openUpdateTagWrapperModal传入的参数为tagWrapper对象，直接使用
                            if (typeof tagWrapper == "object") {
                                dfd.resolveWith(context, [tagWrapper, albums]);
                            } else {
                                dfd.resolveWith(context, [context.utils.getTagWrapperInPage(tagWrapper), albums]);
                            }
                        });
                    });
                },
                "createCompleted": function (saveTagWrapper) {
                    this.pointer.tagWrappers.push(saveTagWrapper);
                    context.jumpPage();
                },
                "updateCompleted": function (saveTagWrapper) {
                    $.extend(true, context.utils.getTagWrapperInPage(saveTagWrapper.ptwid), saveTagWrapper);
                    context.jumpPage();
                }
            }
        });

        $("#tag-wrappers-container").on("click", "table tbody", function (e) {
            if ($(e.target).closest('a').length > 0) {
                return true;
            }
            var $line = $(this);
            var isAuthor = login_handle.equalsLoginUser(context.config.load_condition.uid);
            if (isAuthor) {
                context.openUpdateTagWrapperModal($line.attr("data-ptwid"));
            } else {
                window.open($line.find('tr td a').eq(0).attr('href'));
            }
        });

        if (login_handle.equalsLoginUser(context.config.load_condition.uid)) {
            $("#create_tag_wrapper").click(function () {
                context.openCreateTagWrapperModal();
            });
        } else {
            $("#create_tag_wrapper").hide();
        }

    });
});