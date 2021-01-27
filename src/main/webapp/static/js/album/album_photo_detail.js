/**
 * 相册详情页
 * Created by Jeffrey.Deng on 2018/1/11.
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'domReady', 'toastr', 'blowup', 'globals', 'common_utils', 'login_handle', 'toolbar', 'period_cache', 'album_photo_handle', 'album_photo_page_handle', 'album_video_plugin', 'album_handle', 'comment_plugin', 'websocket_util'], factory);
    } else {
        // Browser globals
        factory(window.jQuery, null, $(document).ready, toastr, null, globals, common_utils, login_handle, toolbar, PeriodCache, album_photo_handle, album_photo_page_handle, album_video_plugin, album_handle, comment_plugin, websocket_util);
    }
})(function ($, bootstrap, domReady, toastr, blowup, globals, common_utils, login_handle, toolbar, PeriodCache, album_photo_handle, album_photo_page_handle, album_video_plugin, album_handle, comment_plugin, websocket_util) {

    /**
     * 放大镜
     */
    function bindBlowup(config) {
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent)) {
            $('#blowup_trigger').hide();
        } else {
            var $blowup = $('#blowup_trigger');
            var blowup = null;
            var isBlowup = false;
            config.originScale = config.scale;
            var switchBlowupBtn = function (open) {
                config.scale = config.originScale;
                if (open) {
                    blowup && blowup.destroy();
                    blowup = $.blowup({
                        selector: "#masonryContainer .photo .image-widget",
                        width: config.width,
                        height: config.height,
                        scale: config.scale
                    });
                    var mfpContent = album_photo_page_handle.pointer.magnificPopup.content;
                    if (mfpContent) {
                        album_photo_page_handle.pointer.blowup = $.blowup({
                            selector: mfpContent.find('.image-widget'),
                            width: config.width,
                            height: config.height,
                            scale: config.scale
                        });
                    }
                    $blowup.attr('data-blowup', 'on').text('关闭放大镜');
                    toastr.success('Z: 开关，X: 缩小，C: 放大', '已开启放大镜，热键如下', {"progressBar": false, "timeOut": 4200});
                } else {
                    blowup.destroy();
                    blowup = null;
                    if (album_photo_page_handle.pointer.blowup) {
                        album_photo_page_handle.pointer.blowup.destroy();
                        album_photo_page_handle.pointer.blowup = null;
                    }
                    $blowup.attr('data-blowup', 'off').text('放大镜');
                    toastr.success('已关闭放大镜', '', {"progressBar": false});
                }
                isBlowup = open;
            };
            $blowup.on('click', function (e) {
                e.preventDefault();
                switchBlowupBtn(!($blowup.attr('data-blowup') === 'on'));
            });
            album_photo_page_handle.on(album_photo_page_handle.config.event.popupChanged, function (e) {
                if (isBlowup) {
                    var mfpContent = album_photo_page_handle.pointer.magnificPopup.content;
                    if (mfpContent) {
                        album_photo_page_handle.pointer.blowup = $.blowup({
                            selector: mfpContent.find('.image-widget'),
                            width: config.width,
                            height: config.height,
                            scale: config.scale
                        });
                    }
                }
            });
            $(document).on('keydown.img.blowup', function (e) {
                var theEvent = e || window.event;
                var code = theEvent.keyCode || theEvent.which || theEvent.charCode;
                var tagName = e.target.tagName;
                if (!e.target.isContentEditable && tagName !== 'INPUT' && tagName !== 'TEXTAREA') { // S键或F键
                    if (!isBlowup) {
                        switch (code) {
                            case 90: // Z键 - 打开放大镜
                                switchBlowupBtn(true);
                                break;
                        }
                    } else {
                        switch (code) {
                            case 90: // Z键 - 关闭放大镜
                                switchBlowupBtn(false);
                                break;
                            case 88: // X键 - 减小放大倍数
                                config.scale = config.scale - 0.1;
                                if (config.scale < 1) {
                                    config.scale = 1;
                                }
                                if (blowup) {
                                    blowup.options.scale = config.scale;
                                    blowup.refresh();
                                }
                                if (album_photo_page_handle.pointer.blowup) {
                                    album_photo_page_handle.pointer.blowup.options.scale = config.scale;
                                    album_photo_page_handle.pointer.blowup.refresh();
                                }
                                break;
                            case 67: // C键 - 增加放大倍数
                                config.scale = config.scale + 0.1;
                                if (blowup) {
                                    blowup.options.scale = config.scale;
                                    blowup.refresh();
                                }
                                if (album_photo_page_handle.pointer.blowup) {
                                    album_photo_page_handle.pointer.blowup.options.scale = config.scale;
                                    album_photo_page_handle.pointer.blowup.refresh();
                                }
                                break;
                        }
                    }
                }
            });
        }
    }

    // function addFeaturedBtnBasedRemote(album_id) {
    //     var callback = function (album_id) {
    //         $('#main .album_options .options_right').prepend(
    //             '<a class="option_featured" itemtype="url" href="' + ('p/dashboard?model=photo&album_id=' + album_id + '&tags=精选').toURL() + '" target="_blank">精选</a>'
    //         );
    //     };
    //     var isLoadNew = true;
    //     var featured_info_cache = globals.storage.getItem('featured_info_cache');
    //     if (featured_info_cache) {
    //         featured_info_cache = JSON.parse(featured_info_cache);
    //         var featured_info_album = featured_info_cache[album_id];
    //         if (featured_info_album) {
    //             var interval = new Date().getTime() - parseInt(featured_info_album.time);
    //             if (interval < 1800000) {
    //                 isLoadNew = false;
    //                 if (featured_info_album.featured == 'true') {
    //                     callback(album_id);
    //                 }
    //             }
    //         }
    //     } else {
    //         globals.storage.setItem('featured_info_cache', '{}');
    //         featured_info_cache = {};
    //     }
    //     if (isLoadNew) {
    //         $.get(globals.api.getPhotoList, {"album_id": album_id, "tags": "精选"}, function (response) {
    //             if (response.status == 200 && response.data.photos && response.data.photos.length > 0) {
    //                 featured_info_cache[album_id] = {
    //                     "album_id": album_id,
    //                     "featured": "true",
    //                     "time": new Date().getTime()
    //                 };
    //                 globals.storage.setItem('featured_info_cache', JSON.stringify(featured_info_cache));
    //                 callback(album_id);
    //             } else {
    //                 featured_info_cache[album_id] = {
    //                     "album_id": album_id,
    //                     "featured": "false",
    //                     "time": new Date().getTime()
    //                 };
    //                 globals.storage.setItem('featured_info_cache', JSON.stringify(featured_info_cache));
    //             }
    //         });
    //     }
    // }

    function addFeaturedBtnBasedLocal(album) {
        if ($('#main .album_options .options_right .option_featured').length > 0) {
            return;
        }
        if (!album) {
            return;
        }
        var album_id = album.album_id;
        var photos = album.photos;
        if (photos && photos.length > 0) {
            var hasFeatured = false;
            var hasVideo = false;
            $.each(photos, function (i, photo) {
                if (photo.tags && photo.tags.indexOf('精选') != -1) {
                    hasFeatured = true;
                }
                if (photo.image_type && photo.image_type.indexOf('video') != -1) {
                    hasVideo = true;
                }
                if (hasFeatured && hasVideo) {
                    return false;
                }
            });
            if (hasVideo && $('#main .album_options .options_right .option_video').length == 0) {
                $('#main .album_options .options_right').prepend(
                    '<a class="option_videos" style="margin-left: 5px;" itemtype="url" href="' +
                    ('u/' + album.user.uid + '/videos?cover.album_id=' + album_id + '&from=album_detail').toURL() + '" target="_blank" title="查看本相册中的视频">相册视频</a>'
                );
            }
            if (hasFeatured) {
                $('#main .album_options .options_right').prepend(
                    '<a class="option_featured" style="margin-left: 5px;" itemtype="url" href="' + ('p/tag/精选?album_id=' + album_id +
                    '&from=album_detail').toURL() + '" target="_blank" title="查看本相册中的精选">相册精选</a>'
                );
            }
        }
    }

    var updateAlbumCover = function (album, cover_id, call) {
        var params = {
            "album_id": album.album_id,
            "name": album.name,
            "description": album.description,
            "user.uid": album.user.uid,
            "cover.photo_id": cover_id,
            "permission": album.permission,
            "mount": album.mount,
            "show_col": album.show_col
        };
        $.post(globals.api.updateAlbum, params, function (response) {
            if (response.status == 200) {
                album.cover = response.data.album.cover;
                call(true);
            } else {
                call(false);
                toastr.error(response.message, '相册封面更新失败');
                console.warn('Error Code: ' + response.status);
            }
        }).fail(function () {
            call(false);
        });
    };

    var initCommentPlugin = function (album) {
        // 如果页面打开时需要进行hash滚动，则去掉隐藏
        comment_plugin.on(comment_plugin.config.event.loadCommentListCompleted, function (e) {
            let $area = $(comment_plugin.config.selector.commentListArea).parent(), fold = $area.hasClass('hidden');
            if (fold) {
                $area.removeClass('hidden');
                $('#comment-switch').text('折叠');
            }
            comment_plugin.hasInit = true;
        });
        // 添加动画
        comment_plugin.on(comment_plugin.config.event.commentHtmlBuildCompleted, function (e, list, pageIndex, buildReason) {
            if (list.length < 50 && (buildReason == 'init' || buildReason == 'refresh')) {
                $(comment_plugin.config.selector.commentListArea).find('.comment-list').removeClass('animated bounceInLeft bounceInRight').addClass('animated bounceInLeft');
            }
        });
        // 评论模块初始化
        comment_plugin.init({
            creationType: 3, // 1代表相册评论
            creationIdVariableName: "creationId",
            creationId: album.album_id,
            hostUserId: album.user.uid,
            autoScrollOnPageOpen: true, // 开启在页面打开时根据url的#hash值自动滚到对应位置
        });
    };

    // 注册监控服务器的未读评论消息推送
    function initWsReceiveServerPush() {
        if (login_handle.validateLogin()) {
            var notify_ws_opts = {
                "progressBar": false,
                "positionClass": "toast-top-right",
                "iconClass": "toast-success-no-icon",
                "timeOut": 0,
                "onclick": function (e) {
                    if ($(e.target).closest('a').length > 0) {
                        e.preventDefault();
                        window.open(e.target.href);
                        return false;
                    }
                },
                "onShown": function () {
                    $(this).css('opacity', '1');
                },
                "onHidden": function (toastElement, closeType) {
                    if (closeType != 0 && toastElement.hasClass('wsMessage') && !toastElement.hasClass('not-sync-ws-message')) {
                        websocket_util.post({
                            "mapping": "transfer_data_in_tabs",
                            "metadata": {
                                "handle": "remove_ws_message",
                                "ws_message_id": parseInt(toastElement.attr('data-wsid'))
                            }
                        });
                    }
                }
            };
            // 收到新评论，取消login.js中的默认处理
            websocket_util.onPush('receive_comment', function (e, wsMessage, wsEvent) {
                var comment = wsMessage.metadata.comment;
                var notify_opts = null;
                var msg = null;
                switch (comment.creationType) {
                    case 3:
                        var album = wsMessage.metadata.album;
                        notify_opts = $.extend({}, notify_ws_opts, {
                            "onclick": function (e) {
                                ($(e.target).closest('a').length > 0) && e.preventDefault();
                                if (album.album_id == album_photo_page_handle.pointer.album.album_id) {   // 当前视频页就是这个视频的详情页
                                    let $area = $(comment_plugin.config.selector.commentListArea).parent(), fold = $area.hasClass('hidden');
                                    if (comment_plugin.hasInit) {
                                        if (fold) {
                                            $('#comment-switch').trigger('click');
                                        }
                                        comment_plugin.utils.scrollToSpecialComment(comment);
                                    } else {
                                        comment_plugin.once(comment_plugin.config.event.commentHtmlBuildCompleted, function () {
                                            comment_plugin.utils.scrollToSpecialComment(comment);
                                        });
                                        $('#comment-switch').trigger('click');
                                    }
                                } else {
                                    window.open(('p/album/' + album.album_id + '#comment_' + comment.cid).toURL());
                                }
                            }
                        });
                        if (comment_plugin.hasInit && album.album_id == album_photo_page_handle.pointer.album.album_id) {   // 当前视频页就是这个视频的详情页
                            // 直接显示
                            comment_plugin.utils.appendCommentInPage(comment);
                        }
                        msg = null;
                        if (comment.parentId == 0) {
                            msg = comment.user.nickname + ' 对你的相册<br><b>“' + album.name + '”</b><br>发表了评论~';
                        } else {
                            msg = '<b>“' + comment.user.nickname + '”</b><br>回复了你的评论~';
                        }
                        e.stopImmediatePropagation(); // 阻止login中绑定的事件, stopImmediatePropagation能阻止委托事件
                        break;
                }
                if (msg) {
                    globals.notify(notify_opts)
                        .success(msg, '', 'receive_comment' + '_' + comment.cid)
                        .addClass('wsMessage receive_comment').attr('data-wsid', wsMessage.id).attr('data-cid', comment.cid);
                }
            }, true); // 插入到事件队列第一个
        }
    }

    /**
     * main
     */
    domReady(function () {

        var albumConfig = globals.getLocalConfig('album', {
            "photo_page": {
                "full_background": true,
                "default_col": {
                    "2000+": 6,
                    "2000": 6,
                    "1800": 5,
                    "1600": 4,
                    "940": 3,
                    "720": 2
                },
                "default_size": 0,
                "photo_node_link_use_by": 'photo_detail',
                "preview_compress": true,
                "blow_up": {
                    "width": 600,
                    "height": 600,
                    "scale": 1.6
                }
            }
        }), $firstArea = $(globals.selector.firstArea);
        if (albumConfig.photo_page.full_background) {
            $('body').css('background-image', $firstArea.css('background-image'));
            $firstArea.css('background-image', '');
        }

        var album_id = $firstArea.find('.slogan-name').attr('data-album-id');

        var params = common_utils.parseURL(window.location.href).params;
        var pageSize = params.size ? params.size : albumConfig.photo_page.default_size;
        var pageNum = params.page ? params.page : 1;
        var loadMount = params.mount == 'false' ? false : true;
        var col = params.col && parseInt(params.col);
        var checkPhotoId = params.check ? params.check : 0;
        var cloud_photo_preview_args = '';
        var open_preview_compress = albumConfig.photo_page.preview_compress;

        // 照片页面布局模块初始化
        album_photo_page_handle.on(album_photo_page_handle.config.event.popupChanged, function (e, check) {
            var handle = this;
            if (check) {
                setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                    document.title = handle.pointer.album.name + '_' + check + ' - ' + handle.pointer.album.user.nickname + "的相册 | ImCoder's 博客";
                }, 50);
            }
        });
        album_photo_page_handle.on(album_photo_page_handle.config.event.popupClosed, function (e, check) {
            var handle = this;
            setTimeout(function () { // 要设置一个延迟地址栏与历史才会生效
                document.title = handle.pointer.album.name + ' - ' + handle.pointer.album.user.nickname + "的相册 | ImCoder's 博客";
            }, 50);
        });
        album_photo_page_handle.init({
            selector: {
                "photosContainer_id": "masonryContainer",
                "page_nav": ".page-navigator",
                "photo_id_prefix": "photo_",
                "album_size": "#album_size"
            },
            page_params: {
                "pageSize": pageSize,
                "pageNum": pageNum,
                "col": col,
                "default_col": albumConfig.photo_page.default_col
            },
            checkPhotoId: checkPhotoId,
            page_method_address: "album_detail",
            load_condition: {
                "album_id": album_id,
                "mount": loadMount
            },
            photoNodeLinkUsePhotoDetail: albumConfig.photo_page.photo_node_link_use_by == 'photo_detail',
            allowZipPhotos: true,
            allowZipPhotosMaxLength: 30,
            callback: {
                "loadPhotos_callback": function (config, success) {
                    globals.notify().progress('正在加载数据', '', 'notify_photos_loading');
                    let condition = $.extend(true, {}, config.load_condition), context = this;
                    return globals.request.get(globals.api.getAlbum, {
                        "id": condition.album_id,
                        "mount": condition.mount
                    }, true, '加载相册信息失败').always(function () {
                        globals.removeNotify('notify_photos_loading');
                    }).final(function (data) {
                        cloud_photo_preview_args = data.cloud_photo_preview_args;
                        success.call(context, data);
                        // 添加精选按钮
                        addFeaturedBtnBasedLocal(data.album);
                    });
                },
                "generatePhotoPreviewUrl": function (source, hitCol) { // 生成预览图片url的函数
                    if (open_preview_compress && cloud_photo_preview_args) {
                        return source + cloud_photo_preview_args.replace('{col}', hitCol);
                    } else {
                        return source;
                    }
                },
                "parsePhotosZipName": function (config) {
                    config.zipPhoto_sortByFact = confirm('点击是以当前显示结果排序，点击否按原文件名排序');
                    config.zipPhoto_groupWithMirrorPath = confirm('是否需要以路径镜像划分文件夹？');
                    var zipName = 'album_' + config.load_condition.album_id + '_' + common_utils.formatDate(new Date(), 'yyMMddhhmmss');
                    return zipName;
                },
                "beforeZipPhotos": function (options) {
                    let context = this;
                    let superParseFilesCall = options.callback.parseFiles_callback;
                    options.callback.parseFiles_callback = function (location_info, options) {
                        let photo_arr = superParseFilesCall(location_info, options);
                        return $.Deferred(function (dfd) {
                            let resolveCall = function (user) {
                                if (user && user.userGroup.gid == -1) {
                                    dfd.resolve(photo_arr);
                                } else if (context.config.allowZipPhotos == true) {
                                    let maxValue = context.config.allowZipPhotosMaxLength;
                                    if (maxValue && maxValue < photo_arr.length) {
                                        globals.notify({
                                            "timeOut": 0,
                                            "showDuration": 0
                                        }).success('下载更多需要向管理员\n【申请权限】方可~', '本次只准下载 ' + maxValue + ' 张', 'notify_only_allow_download_little');
                                        dfd.resolve(photo_arr.slice(0, maxValue));
                                    } else {
                                        dfd.resolve(photo_arr);
                                    }
                                } else {
                                    dfd.reject('打包下载需要向管理员\n【申请权限】方可~');
                                }
                            };
                            login_handle.getCurrentUser(false).final(function (user) {
                                resolveCall.call(this, user);
                            }, function () {
                                resolveCall.call(this, null);
                            });
                        });
                    };
                    let superEachFileOnloadCall = options.callback.eachFileOnload_callback;
                    options.callback.eachFileOnload_callback = function (blob, photo, location_info, options, zipFileLength, zip, main_folder, folder) {
                        var returnValue = superEachFileOnloadCall(blob, photo, location_info, options, zipFileLength, zip, main_folder, folder);
                        var fileName = photo.path.substring(photo.path.lastIndexOf('/') + 1);
                        if (album_photo_page_handle.config.zipPhoto_sortByFact) {
                            fileName = photo.sort + '_' + fileName;
                        }
                        photo.fileName = fileName;
                        return returnValue;
                    }
                },
                "actionForEditPhoto": function (photo, triggerType) {
                    if (photo.image_type.indexOf('video') == -1 || login_handle.equalsLoginUser(photo.uid)) {
                        triggerType == 'btn' && $.magnificPopup.close();
                        album_photo_handle.openUpdatePhotoModal(photo);
                    }
                },
                "makeupNode_callback": function (photo_node, photo) {
                    if (photo.tags && photo.tags.match(new RegExp('\\bmount@' + this.config.load_condition.album_id + '\\b'))) {
                        photo_node.title = 'Refer@' + photo.album_id + ': ' + photo_node.title;
                    }
                }
            }
        });

        // 等页面高度出来后再初始化评论插件，以使评论滚动正确
        album_photo_page_handle.once(album_photo_page_handle.config.event.pageJumpCompleted, function (e) {
            initCommentPlugin(album_photo_page_handle.pointer.album);
            album_photo_page_handle.pointer.hasInitCommentPlugin = true;
        });

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
        // 从内存缓存实例中得到相册基本信息组连接
        var secureAlbumInfoConn = memoryPeriodCache.getOrCreateGroup({
            "groupName": "album_info_cache",
            "timeOut": 1800000,
            "reload": {
                "url": "photo.api?method=getAlbum",
                "params": function (groupName, key) {
                    return {"id": key, "photos": false};
                },
                "parse": function (cacheCtx, groupName, key, old_object_value, response) {
                    if (response.status == 200) {
                        return response.data.album;
                    } else {
                        return null;
                    }
                }
            }
        });
        // 相册照片处理模块初始化
        album_photo_handle.init({
            "selector": {
                "uploadModal": "#uploadPhotoModal",
                "updateModal": "#updatePhotoModal"
            },
            callback: {
                "eachUploadCompleted": function (context, photo) {
                    photo.sort = common_utils.convertRadix62to10(photo.photo_id);
                    album_photo_page_handle.utils.appendPhotoToPage(photo);
                },
                "allUploadCompleted": function (context, photos) {
                    var dfd = $.Deferred();
                    if (photos && photos.length == 1) {
                        let album = album_photo_page_handle.pointer.album;
                        let isCover = album_photo_handle.pointer.uploadModal.find('input[name="photo_cover"]:checked').val() == '1';
                        if (isCover) {
                            album_handle.request.updateAlbum({'album_id': album.album_id, 'cover.photo_id': photos[0].photo_id}, true).final(function (newestAlbum) {
                                PeriodCache.utils.removeCache('user_albums_cache', album.user.uid);
                                PeriodCache.utils.removeCache('user_albums_cache', '0_' + album.user.uid);
                                // album.permission = newestAlbum.permission; // album_handle.request.updateAlbum里面会触发相册更新完成回调，故这里不需要了
                            }).always(function () {
                                dfd.resolve();
                            });
                        } else {
                            dfd.resolve();
                        }
                    } else {
                        dfd.resolve();
                    }
                    dfd.done(function () {
                        album_photo_page_handle.jumpPage(album_photo_page_handle.utils.calcPageCount());
                        photos = null;
                    });
                },
                "beforeUpdate": function (context, photo) {  // 更新之前回调，返回一个Deferred对象可以异步执行
                    return $.Deferred(function (dfd) {
                        let album, before_cover_id, new_cover_id;
                        album = album_photo_page_handle.pointer.album;
                        before_cover_id = album.cover.photo_id;
                        new_cover_id = album_photo_handle.pointer.updateModal.find('input[name="photo_cover"]:checked').val() == '0' ? 0 : photo.photo_id;
                        // (new_cover_id == 0 && before_cover_id == photo.photo_id) || (new_cover_id && new_cover_id != '0' && before_cover_id != new_cover_id)
                        if (!(before_cover_id && before_cover_id != '0' && before_cover_id != photo.photo_id && new_cover_id == 0) && before_cover_id != new_cover_id) {
                            album_handle.request.updateAlbum({'album_id': album.album_id, 'cover.photo_id': new_cover_id}, true).final(function (newestAlbum) {
                                PeriodCache.utils.removeCache('user_albums_cache', album.user.uid);
                                PeriodCache.utils.removeCache('user_albums_cache', '0_' + album.user.uid);
                            }).always(function () {
                                dfd.resolve();
                            });
                        } else {
                            dfd.resolve();
                        }
                    });
                },
                "updateCompleted": function (context, photo) {
                    let photo_source, isUpdateFile, album_id, umount, apph = album_photo_page_handle;
                    photo_source = apph.utils.getPhotoByCache(photo.photo_id);
                    isUpdateFile = photo_source.path != photo.path;
                    apph.utils.updatePhotoInPage(photo);
                    album_id = apph.config.load_condition.album_id;
                    // 如果其他相册的图片取消挂载在本相册，重新构建布局
                    umount = false;
                    if (photo_source.album_id != album_id) {
                        if (apph.pointer.album.mount) {
                            umount = photo.tags.match(new RegExp('\\bnot-mount@' + album_id + '\\b')) != null;
                        } else {
                            umount = photo.tags.match(new RegExp('\\bmount@' + album_id + '\\b')) == null;
                        }
                    }
                    if (umount) {
                        apph.utils.deletePhotoInPage(photo.photo_id);
                    } else if (photo_source.album_id != album_id) {
                        apph.utils.getPhotoImageDom(photo.photo_id).attr('title', 'Refer@' + photo_source.album_id + ': ' + photo.name);
                    }
                    // 如果更新了图片文件，重新构建布局
                    if (!umount && isUpdateFile) {
                        apph.jumpPage(apph.config.page_params.pageNum);
                    }
                },
                "deleteCompleted": function (context, postData) {
                    album_photo_page_handle.utils.deletePhotoInPage(postData.photo_id);
                },
                "beforeUploadModalOpen": function (context, uploadModal, openUploadModal_callback) {
                    const queue = new common_utils.TaskQueue(function (task) {
                        return task();
                    }), album_id = context.config.albumId;
                    queue.append(function () {
                        // 添加设置当前照片为当前相册按钮
                        if (uploadModal.find('input[name="photo_cover"]').length == 0) {
                            uploadModal.find('input[name="photo_refer"]').closest('.form-group').after(
                                '<div class="form-group" style="padding-top: 7px;">' +
                                '<label class="control-label">是否作为封面</label>' +
                                '<label class="radio-inline" style="margin-left:10px;"> <input type="radio" name="photo_cover" value="1"> 是 </label>' +
                                '<label class="radio-inline"><input type="radio" name="photo_cover" value="0"> 否 </label>' +
                                '</div>'
                            );
                        }
                        uploadModal.find('input[name="photo_cover"][value="0"]').prop('checked', true);
                    });
                    queue.append(function () {
                        // 传入的参数可以修改上传的相册ID
                        openUploadModal_callback(album_id);
                    });
                    queue.append(function () {
                        // 加载上传参数及配置，判断该用户是否允许上传
                        return $.get(globals.api.getPhotoUploadConfigInfo, function (response) {
                            if (response && response.status == 200) {
                                let uploadConfigInfo = response.data;
                                album_photo_handle.config.uploadConfigInfo = uploadConfigInfo;
                                album_photo_handle.config.maxUploadSize = uploadConfigInfo.uploadArgs.maxPhotoUploadSize;
                                if (!uploadConfigInfo || uploadConfigInfo.isAllowUpload) {
                                    // 允许上传才打开上传按钮
                                    uploadModal.find('button[name="uploadPhoto_trigger"]').removeAttr('disabled');
                                    globals.removeNotify('notify-no-allow-upload');
                                } else {
                                    let users = null;
                                    switch (uploadConfigInfo.allowUploadLowestLevel) {
                                        case 1:
                                            users = "高级会员与管理员";
                                            break;
                                        case -1:
                                            users = "管理员";
                                            break
                                    }
                                    globals.notify({timeOut: 0}).info('系统当前配置为只允许<br>【<b>' + users + '</b>】上传照片', '您暂时不能上传', 'notify-no-allow-upload');
                                    // 禁用上传按钮
                                    uploadModal.find('button[name="uploadPhoto_trigger"]').attr('disabled', 'disabled');
                                }
                            } else {
                                toastr.error('加载上传配置失败', '错误');
                            }
                        });
                    });
                },
                "beforeUpdateModalOpen": function (context, updateModal, formatPhotoToModal_callback, photo) {
                    const queue = new common_utils.TaskQueue(function (task) {
                        return task();
                    });
                    queue.append(function () {
                        // 切换回来显示照片链接
                        updateModal.find('.update-convert-photo-url').trigger('click');
                        // 照片排序
                        updateModal.find('input[name="photo_sort"]').val(photo.sort).attr('data-val-sort', photo.sort);
                        // 添加设置当前照片为当前相册封面按钮
                        if (updateModal.find('input[name="photo_cover"]').length == 0) {
                            updateModal.find('.tags-modify').closest('.form-group').after(
                                '<div class="form-group" style="padding-top: 7px;">' +
                                '<label class="control-label">是否作为封面</label>' +
                                '<label class="radio-inline" style="margin-left:15px;"> <input type="radio" name="photo_cover" value="1"> 是 </label>' +
                                '<label class="radio-inline"> <input type="radio" name="photo_cover" value="0"> 否 </label>' +
                                '</div>'
                            );
                        }
                        var isCover = (album_photo_page_handle.pointer.album.cover.photo_id == photo.photo_id ? '1' : '0');
                        updateModal.find('input[name="photo_cover"][value="' + isCover + '"]').prop('checked', true);
                    });
                    queue.append(function () {
                        // 如果图片为视频的封面，则添加视频链接
                        const video_id = album_photo_page_handle.utils.getPhotoImageDom(photo.photo_id).find('img').attr('data-video-id');
                        if (video_id && video_id != '0') {
                            let $videoLinkText = updateModal.find('span[name="video_id"]');
                            if ($videoLinkText.length == 0) {
                                updateModal.find('span[name="photo_id"]').closest('.form-group').after(
                                    '<div class="form-group"><label class="control-label">视频ID：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                    '<a target="_blank" style="color: #666; cursor: pointer" title="点击查看关联视频" >' +
                                    '<span name="video_id" class="control-label"></span></a></div>'
                                );
                                $videoLinkText = updateModal.find('span[name="video_id"]');
                            } else {
                                $videoLinkText.closest('.form-group').show(0);
                            }
                            $videoLinkText.text(video_id).parent().url('href', 'video/detail/' + video_id);
                        } else {
                            updateModal.find('span[name="video_id"]').closest('.form-group').hide(0);
                        }
                    });
                    queue.append(function () {
                        return $.Deferred(function (dfd) {
                            // 如果是引用别的相册的照片
                            if (album_photo_page_handle.config.load_condition.album_id != photo.album_id) {
                                // 引用的照片 添加照片所属相册链接
                                let $albumLinkText = updateModal.find('span[name="album_id"]');
                                if ($albumLinkText.length == 0) {
                                    updateModal.find('span[name="photo_id"]').closest('.form-group').after(
                                        '<div class="form-group"><label class="control-label">所属簿：&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</label>' +
                                        '<a target="_blank" style="color: #666; cursor: pointer" title="在相簿中查看" >' +
                                        '<span name="album_id" class="control-label"></span></a></div>'
                                    );
                                    $albumLinkText = updateModal.find('span[name="album_id"]');
                                } else {
                                    $albumLinkText.closest('.form-group').show(0);
                                }
                                secureAlbumInfoConn.get(photo.album_id, function (album) {
                                    let album_url = 'p/album/' + photo.album_id + '?check=' + photo.photo_id;
                                    if (album) {
                                        $albumLinkText.text(album.name).parent().url('href', album_url);
                                    } else {
                                        $albumLinkText.text(photo.album_id).parent().url('href', album_url);
                                    }
                                    dfd.resolve();
                                });
                            } else {
                                updateModal.find('span[name="album_id"]').closest('.form-group').hide(0);
                                dfd.resolve();
                            }
                        });
                    });
                    queue.append(function () {
                        formatPhotoToModal_callback(photo);
                    });
                }
            },
            "albumId": album_id,
            "downloadType": (/Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent) ? 'url' : 'ajax')
        });

        album_photo_handle.on(album_photo_handle.config.event.tagClick, function (_e, tag, photo_id, clickEvt) {
            clickEvt.preventDefault();
            window.open(('p/tag/' + encodeURIComponent(tag) + '?uid=' + album_photo_page_handle.pointer.album.user.uid).toURL());
        });

        // 绑定特殊标签的扩展点击反应事件
        album_photo_handle.on(album_photo_handle.config.event.tagExtendClick, function (_e, tag, photo_id, clickEvt, keyEvt) {
            switch (true) {
                case /^#?mount@(.*)/i.test(tag): // 挂载
                    window.open(('p/album/' + RegExp.$1 + '?check=' + photo_id).toURL());
                    break;
                case /^#?weibo@(.*)/i.test(tag): // 微博用户
                    var weiboUserKey = RegExp.$1;
                    if (/\d{8,}/.test(weiboUserKey)) {
                        window.open('https://weibo.com/u/' + weiboUserKey);
                    } else {
                        window.open('https://weibo.com/' + weiboUserKey);
                    }
                    break;
                case /^#?weibo-(.*)/i.test(tag): // 微博详情
                    window.open('https://m.weibo.cn/detail/' + RegExp.$1);
                    break;
                case /^#?ytb-(.*)/i.test(tag): // Youtube
                    window.open('https://www.youtube.com/watch?v=' + RegExp.$1);
                    break;
                default: // 默认打开当前相册的该标签
                    var album_id = album_photo_page_handle.config.load_condition.album_id;
                    window.open(('p/tag/' + tag + '?album_id=' + album_id + '&from=album_detail').toURL());
            }
        });

        // 增加保存照片在相册内排序权重按钮
        album_photo_handle.pointer.updateModal.find('.update-photo-refer').after('<div class="update-photo-sort" style="display: none">' +
            '<div class="input-group"><input title="默认值为照片id大小，最多支持三位小数" class="form-control" type="text" name="photo_sort">' +
            '<span class="input-group-addon btn btn-sm save-update-photo-sort">保存</span></div></div>');
        album_photo_handle.pointer.updateModal.find('.update-convert-photo-refer')
            .after(' / <div class="update-convert-photo-sort" style="font-weight: normal;display: inline;">图片排序</div>');
        // 切换按钮
        album_photo_handle.pointer.updateModal.find('.update-convert-photo-url').off('click').click(function (e) {
            var _self = $(this);
            _self.css('font-weight', 'bold')
                .parent().find('.update-convert-photo-refer').css('font-weight', 'normal')
                .parent().find('.update-convert-photo-sort').css('font-weight', 'normal');
            _self.closest('.form-group')
                .find('.update-photo-url').css('display', 'block')
                .parent().find('.update-photo-refer').css('display', 'none')
                .parent().find('.update-photo-sort').css('display', 'none');
        });
        album_photo_handle.pointer.updateModal.find('.update-convert-photo-refer').off('click').click(function (e) {
            var _self = $(this);
            _self.css('font-weight', 'bold')
                .parent().find('.update-convert-photo-url').css('font-weight', 'normal')
                .parent().find('.update-convert-photo-sort').css('font-weight', 'normal');
            _self.closest('.form-group')
                .find('.update-photo-refer').css('display', 'block')
                .parent().find('.update-photo-sort').css('display', 'none')
                .parent().find('.update-photo-url').css('display', 'none');
        });
        album_photo_handle.pointer.updateModal.find('.update-convert-photo-sort').click(function (e) {
            var _self = $(this);
            _self.css('font-weight', 'bold')
                .parent().find('.update-convert-photo-url').css('font-weight', 'normal')
                .parent().find('.update-convert-photo-refer').css('font-weight', 'normal');
            _self.closest('.form-group')
                .find('.update-photo-sort').css('display', 'block')
                .parent().find('.update-photo-url').css('display', 'none')
                .parent().find('.update-photo-refer').css('display', 'none');
        });
        // 保存照片在相册内的排序
        album_photo_handle.pointer.updateModal.find('.save-update-photo-sort').click(function (e) {
            let apr = {
                "album_id": album_photo_handle.config.albumId,
                "photo_id": album_photo_handle.pointer.updateModal.find('span[name="photo_id"]').text(),
                "sort": album_photo_handle.pointer.updateModal.find('input[name="photo_sort"]').val() || 0,
                "before_sort": album_photo_handle.pointer.updateModal.find('input[name="photo_sort"]').attr('data-val-sort') || 0
            };
            if (!(apr.album_id && apr.photo_id)) {
                toastr.error('相册id或照片id参数错误~');
                return;
            } else {
                apr.before_sort = parseInt(apr.before_sort) || common_utils.convertRadix62to10(apr.photo_id);
            }
            if (!/^[0-9]+$/.test(apr.sort)) {
                toastr.error('请输入整数数字~');
                return;
            } else {
                apr.sort = parseInt(apr.sort);
                // apr.sort = parseInt(parseFloat(apr.sort) * 1000); // 原来的最多支持小数点后三位方式
            }
            if (apr.before_sort == apr.sort) {
                toastr.info('已是默认值，无需更新~');
                return;
            } else if (apr.sort == common_utils.convertRadix62to10(apr.photo_id)) {
                apr.sort = 0;
            }
            globals.request.post(globals.api.saveAlbumPhotoRelation, apr, function () {
                toastr.success('保存成功~');
                album_photo_page_handle.utils.getPhotoByCache(apr.photo_id).sort = (apr.sort || common_utils.convertRadix62to10(apr.photo_id));
                album_photo_page_handle.pointer.album.photos.sort(function (a, b) {
                    return (a.sort || common_utils.convertRadix62to10(a.photo_id)) - (b.sort || common_utils.convertRadix62to10(b.photo_id));
                });
                album_photo_page_handle.jumpPage(album_photo_page_handle.utils.getPhotoPageNum(apr.photo_id));
                album_photo_handle.pointer.updateModal.modal('hide');
            }, '保存失败');
        });

        // 绑定事件打开上传窗口
        $('#uploadPhoto').click(function () {
            album_photo_handle.openUploadPhotoModal();
        });

        // dragenter
        navigator.browser.firefox() && $(document.body).on('dragstart', '.photo a.photo-detail-link', function (e) {
            e.originalEvent.dataTransfer.setData('isDragPhotoLink', true);
        });
        $(document.body).on('dragenter', function (e) {
            if (e.target.getAttribute('type') !== 'file') { // 排除文件输入框
                e.stopPropagation();
                e.preventDefault();
            }
        });
        // dragover
        $(document.body).on('dragover', function (e) {
            if (e.target.getAttribute('type') !== 'file') {
                if (navigator.browser.firefox()) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                if (e.originalEvent.dataTransfer) {
                    let types = e.originalEvent.dataTransfer.types;
                    if (types && types.length > 0 && types[0] == 'Files') {
                        e.originalEvent.dataTransfer.dropEffect = 'copy';
                        e.stopPropagation();
                        e.preventDefault();
                        if (!globals.getNotify('dragUpload_notify')) {
                            globals.notify({
                                "timeOut": 8000,
                                "progressBar": false
                            }).success('松开鼠标上传', '', 'dragUpload_notify');
                        }
                    }
                }
            }
        });
        // drop
        $(document.body).on('drop', function (e) {
            globals.removeNotify('dragUpload_notify');
            if (e.target.getAttribute('type') !== 'file') {
                if (navigator.browser.firefox() && e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.getData('isDragPhotoLink')) {
                    e.preventDefault();
                    e.stopPropagation();
                }
                let files = e.originalEvent.dataTransfer.files;
                if (files && files.length > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                    album_photo_handle.openUploadPhotoModal(files);
                }
            }
        });

        // 相册处理模块初始化
        album_handle.init({
            selector: {
                "createAlbumModal": "#createAlbumModal",
                "updateAlbumModal": "#updateAlbumModal"
            },
            callback: {
                "createCompleted": function (album) {  // 在相册创建完成后回调

                },
                "updateCompleted": function (album) {  // 在相册更新完成后回调
                    var cacheAlbum = album_photo_page_handle.pointer.album;
                    if (cacheAlbum.mount != album.mount) {
                        $firstArea.find('.album-name').dblclick();
                    }
                    $.extendNotNull(cacheAlbum, album);
                    $firstArea.find('.album-name').text(cacheAlbum.name);
                    $firstArea.find('.album-description').text(cacheAlbum.description);
                    PeriodCache.utils.removeCache('user_albums_cache', cacheAlbum.user.uid);
                    PeriodCache.utils.removeCache('user_albums_cache', '0_' + cacheAlbum.user.uid);
                },
                "deleteCompleted": function (postData) {  // 在相册删除完成后回调
                    toastr.success('此页面刷新后将不可用~', '', {"timeOut": 0});
                },
                "beforeCreateModalOpen": function (createModal, openCreateModal_callback) {  // 创建窗口打开前回调
                    openCreateModal_callback();
                },
                "beforeUpdateModalOpen": function (updateModal, formatAlbumToModal_callback, album) {  // 更新窗口打开前回调
                    formatAlbumToModal_callback(album);
                }
            }
        });
        // 要删除的相册中包含视频时提示用户
        album_handle.on(album_handle.config.event.beforeDelete, function (e, postData) {
            var photos = album_photo_page_handle.pointer.album.photos;
            var videoCount = 0;
            for (let i in photos) {
                if (photos[i].image_type.indexOf('video') != -1) {
                    videoCount++;
                }
            }
            if (videoCount > 0) {
                if (!window.confirm('你删除的相册包含' + videoCount + '个视频，确定要继续吗？（建议先删除视频）')) {
                    return false;
                }
            }
            return true;
        });

        // 消息推送
        initWsReceiveServerPush();

        $('#album_create_time').on('click', function () {
            album_handle.openUpdateAlbumModal(album_photo_page_handle.pointer.album);
        });

        $('#comment-switch').on('click', function () {
            let $self = $(this), $area = $(comment_plugin.config.selector.commentListArea).parent(), switchShow = $area.hasClass('hidden');
            $area.toggleClass('hidden', !switchShow);
            $self.text(switchShow ? '折叠' : '展开');
        });

        $firstArea.find('.album-name').on('dblclick', function () { // 注意是dbl
            album_photo_page_handle.loadAlbumWithPhotos(album_photo_page_handle.config, function (data) {
                album_photo_page_handle.pointer.album = data.album;
                toastr.success('数据刷新成功');
                album_photo_page_handle.jumpPage(album_photo_page_handle.config.page_params.pageNum);
                album_photo_page_handle.utils.updateAlbumSizeInPage();
            });
        });

        // 搜索本相册照片
        toolbar.rewriteSearch({
            placeholder: "搜索本相册照片",
            model_action: function (key) {
                var context = this;
                var hasAlbum = false;
                var hasFrom = false;
                var isFindSpecial = false;
                context.utils.eachEntry(key, ["album"], function (entry) {
                    hasAlbum = true;
                });
                context.utils.eachEntry(key, ["from"], function (entry) {
                    hasFrom = true;
                });
                // 如果不是直接输入的本站图片URL
                if (!/^https?:\/\/[a-z0-9\.:]+\/([\x21-\x7e]*\/)?(user\/\w+\/photos\/\w+\/[0-9a-zA-Z_\.]+\.(gif|jpe?g|png|bmp|svg|ico))(\?[\x21-\x7e]*)?$/.test(key)) {
                    context.utils.eachEntry(key, context.config.special_search_object.photo_schema, function (entry) {
                        isFindSpecial = true;
                    });
                    if (!isFindSpecial) {
                        if (/^[\d]+$/.test(key)) {
                            key = 'photo_id=' + key + '&name=' + key + '&description=' + key + '&tags=' + key + "&logic_conn=or"
                        } else if (key) {
                            var encodeKey = encodeURIComponent(key);
                            key = 'name=' + encodeKey + '&description=' + encodeKey + '&tags=' + encodeKey + '&logic_conn=or';
                        } else {
                            key = '';
                        }
                    }
                } else { // 直接输入的本站图片URL则直接查找该图片
                    key = 'path=' + encodeURIComponent(RegExp.$2);
                }
                if (!hasAlbum) {
                    key = 'album_id=' + album_photo_page_handle.config.load_condition.album_id + (key ? ('&' + key) : '');
                }
                if (!hasFrom) {
                    key += '&from=album_detail';
                }
                if (!isFindSpecial) {
                    window.open(('p/dashboard?model=photo&' + key).toURL());
                } else {
                    context.config.callback.photo_search.call(context, key);
                }
            },
            modelMapping: ["page"],
            setDefaultMapping: true
        });

        // 添加精选按钮   replaceWith addFeaturedBtnBasedLocal(album)
        //addFeaturedBtnBasedRemote(album_id);

        bindBlowup(albumConfig.photo_page.blow_up);
    });
});