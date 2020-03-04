/**
 * 相册详情页面的视频插件
 * @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'globals', 'common_utils', 'login_handle', 'album_photo_page_handle', 'websocket_util'], factory);
    } else {
        // Browser globals
        window.album_video_plugin = factory(window.jQuery, null, toastr, globals, common_utils, login_handle, album_photo_page_handle, websocket_util);
    }
})(function ($, bootstrap, toastr, globals, common_utils, login_handle, album_photo_page_handle, websocket_util) {

    var pointer = {
        createModal: null,
        updateModal: null
    };

    var config = {
        album_photo_page_handle: album_photo_page_handle,
        load_mode: "popupLoad", // lazyLoad、preLoad、popupLoad
        popup_iframe_border: true, // IFrame打开时保留黑边
        popup_video_border: false, // 普通video打开时保留黑边
        popup_btn_display: "block", // 视频窗口上按钮的显示方式 block,inline
        popup_hide_btn: true, // 视频窗口上失焦时隐藏编辑按钮
        popup_height_scale: 0.91, // 视频高度占窗口高的比例
        popup_url_check_id_use_by: "photo", // 弹出视频时使用photo_id还是video_id，值 photo 或 video，只有纯视频列表页面才能使用video，不然可能会出问题
        popup_trigger_class_name: "video-popup",
        use_site_iframe: true, // 本站的视频也使用ifame方式加载
        event: {
            "actionForEditPhoto": "photo.edit",
            "pagePaginationClick": "page.jump.click",
            "pageJumpCompleted": "page.jump.completed",
            "pageLoadCompleted": "page.load.completed",
            "actionForEditVideo": "video.edit"
        },
        callback: {}
    };

    const request = globals.extend(globals.request, {
        album_video_plugin: {
            'loadVideosByCovers': function (coverArray, success) {
                let postData = {"covers": coverArray.join()};
                return globals.request.ajax({
                    type: 'get',
                    dataType: "json",
                    // contentType: "application/json",
                }, globals.api.getVideoListByCovers, postData, success, ['videos'], success && '加载视频列表失败~');
            },
            'loadVideoByCover': function (cover_id, success) {
                let postData = {"cover_id": cover_id};
                return globals.request.get(globals.api.getVideo, postData, success, ['video'], success && '视频加载失败');
            },
            'likeVideo': function (video_id, undo, success) {
                let postData = {"video_id": video_id, 'undo': undo};
                return globals.request.post(globals.api.likeVideo, postData, success, ['video', 'type'], success && '点赞失败');
            },
        }
    }).album_video_plugin;

    var init = function (options) {
        $.extendNotNull(true, config, options);
        if (options != null && options.album_photo_page_handle && !options.event) {
            $.extend(true, config.event, album_photo_page_handle.config.event);
        }
        config.path_params = album_photo_page_handle.config.path_params;
        pointer.hasOpenCheckPhoto = false;
        config.album_photo_page_handle.off(config.event.pageJumpCompleted, convertPhotoToVideo);
        config.album_photo_page_handle.on(config.event.pageJumpCompleted, convertPhotoToVideo);
    };

    var convertPhotoToVideo = function (e, pageNum) {
        var page_handle = config.album_photo_page_handle;
        var photos = page_handle.pointer.album.photos,
            pageSize = page_handle.config.page_params.pageSize,
            start = (pageNum - 1) * pageSize,
            end = start + (photos.length - start < pageSize ? photos.length - start - 1 : pageSize - 1);
        pointer.videos = null;

        if (!page_handle.config.checkPhotoId) {
            pointer.hasOpenCheckPhoto = true;
        }

        var videoRegex = /^video.*/;
        var videoCovers = [];
        for (let i = start; i <= end; i++) {
            if (videoRegex.test(photos[i].image_type)) {
                videoCovers.push(photos[i].photo_id);
            }
        }
        pointer.covers = videoCovers;
        if (videoCovers.length == 0) {
            return;
        }
        if (config.load_mode == 'preLoad') { //预加载，这种方式视频未播放时会有噪音
            request.loadVideosByCovers(videoCovers, function (videos) {
                if (videos) {
                    pointer.videos = videos;
                    $.each(videos, function (i, video) {
                        var $photoNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                        $photoNode.data('video', video);
                        $photoNode.toggleClass('has-trigger-photo-access', true);
                        var videoNode = makeupVideoNode(video);
                        insertVideoNode($photoNode, videoNode, video);
                        $photoNode.find('> .photo-detail-link').url('href', 'video/detail/' + video.video_id);
                    });
                }
            });
        } else if (config.load_mode == 'lazyLoad') { //延迟加载
            $.each(videoCovers, function (i, cover_id) {
                var photoDom = page_handle.utils.getPhotoImageDom(cover_id);
                photoDom.attr('title', '视频: ' + photoDom.attr('title'));
                photoDom.find('img').off('click').on('click', function () {
                    globals.removeNotify('notify_load_video');
                    globals.notify().progress('正在加载视频Meta', '', 'notify_load_video');
                    request.loadVideoByCover(cover_id).always(function () {
                        globals.removeNotify('notify_load_video');
                    }).final(function (video) {
                        let $photoNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                        $photoNode.data('video', video);
                        $photoNode.toggleClass('has-trigger-photo-access', true);
                        let videoNode = makeupVideoNode(video);
                        insertVideoNode($photoNode, videoNode, video);
                        if ($photoNode.find('.video-play-button')) {
                            $photoNode.find('.video-play-button').remove();
                        }
                        if (page_handle.config.photoNodeLinkUsePhotoDetail) {
                            $photoNode.find('> .photo-detail-link').url('href', 'video/detail/' + video.video_id);
                        }
                        $photoNode.off('mouseenter');
                        $photoNode.off('mouseleave');
                    }, function (status, message, type) {
                        globals.notify({"progressBar": false}).error(message, '打开视频失败~', 'notify_open_video_fail');
                    });
                    return false;
                });
            });
            addVideoBtnToCover(videoCovers);
        } else { // popupLoad
            // common_utils.addStyle('.mfp-inline-holder .mfp-content {max-width: 1100px;} .mfp-content video {border: 0px;width:100%;}');
            if (!pointer.hasOpenCheckPhoto) { // 当用户指定要查看某个视频时，先插入一个点击事件以阻止打开图片的默认事件
                var stopOpenImage = function (e) {
                    $(e.currentTarget).off('click', stopOpenImage);
                    e.stopImmediatePropagation();
                    return false;
                };
                // 此时page_handle.utils.openPhotoPopup未被替换，因为是异步的
                pointer.checkPhotoImageDom = page_handle.utils.getPhotoImageDom(page_handle.config.checkPhotoId).find('img');
                pointer.checkPhotoImageDom.on('click', stopOpenImage);
            }
            var className = config.popup_trigger_class_name;
            var popupTriggerSelector = '#' + page_handle.config.selector.photosContainer_id + ' ' + page_handle.config.selector.photo_node + ' .' + className;
            request.loadVideosByCovers.call(context, videoCovers, function (videos) {
                videos = videos || [];
                pointer.videos = videos;
                if (config.popup_url_check_id_use_by == 'video') {  // 此时check为video_id
                    page_handle.utils.openPhotoPopup = utils.openVideoPopup;
                }
                if (videos.length > 0) {
                    $.each(videos, function (i, video) {
                        var $photoNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                        $photoNode.toggleClass('has-trigger-photo-access', true); // 防止打开视频弹窗时会记录一次封面照片的访问记录
                        $photoNode.data('video', video);
                        var refer = $photoNode.attr('title').match(/^视频: (Refer@\w+: )/) ? RegExp.$1 : '';
                        $photoNode.attr('title', '视频: ' + refer + video.name);
                        if (page_handle.config.photoNodeLinkUsePhotoDetail) {
                            var $link = $photoNode.find('> .photo-detail-link');
                            $link.url('href', 'video/detail/' + video.video_id);
                        }
                        var $imageNode = $photoNode.find('img');
                        $imageNode.attr('data-video-id', video.video_id);
                    });
                    makePopupAction(videos, popupTriggerSelector);
                }
                // 隐藏没有权限的视频的播放按钮
                $(popupTriggerSelector + ':not([data-video-id])').closest(page_handle.config.selector.photo_node).find('.video-play-button').hide();
                if (!pointer.hasOpenCheckPhoto) {  // 当用户指定要查看某个视频时，触发之
                    // pointer.checkPhotoImageDom.click(); // 但是为了优雅，不这样直接触发
                    if (config.popup_url_check_id_use_by == 'video') {  // 此时checkPhotoId为video_id
                        var checkVideoId = pointer.checkPhotoImageDom.attr('data-video-id');
                        if (checkVideoId) {
                            utils.openVideoPopup(checkVideoId);
                        }
                    } else {
                        page_handle.utils.openPhotoPopup(page_handle.config.checkPhotoId);
                    }
                    pointer.checkPhotoImageDom = null;
                    pointer.hasOpenCheckPhoto = true; // 置为true，让其只触发一次
                }
            });
            addVideoBtnToCover(videoCovers);
            $.each(videoCovers, function (i, cover_id) {
                var $photoNode = page_handle.utils.getPhotoImageDom(cover_id);
                $photoNode.attr('title', '视频: ' + $photoNode.attr('title'));
                $photoNode.find('img').addClass(className);
            });
        }
    };

    // ------ before video open (show diff from video with photo) ------

    // 给为视频封面的照片添加一个提示视频播放的按钮
    var addVideoBtnToCover = function (coverIds) {
        if (!coverIds || coverIds.length == 0) {
            return;
        }
        var page_handle = config.album_photo_page_handle;
        // 构建按钮
        var btn = document.createElement('button');
        btn.className = "video-play-button";
        btn.setAttribute('aria-label', '播放');
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); // svg
        svg.setAttribute('version', '1.1');
        svg.setAttribute('viewBox', '0 0 68 48');
        btn.appendChild(svg);
        var path_bg = document.createElementNS('http://www.w3.org/2000/svg', 'path'); // path
        path_bg.setAttribute('class', 'video-play-button-bg video-play-button-bg-leave'); // 只能通过setAttribute，不能className
        path_bg.setAttribute('d', 'M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4' +
            '.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-' +
            '0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z');
        var path_arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path_arrow.setAttribute('class', 'video-play-button-arrow');
        path_arrow.setAttribute('d', 'M 45,24 27,14 27,34');
        svg.appendChild(path_bg);
        svg.appendChild(path_arrow);
        // 插入节点
        $.each(coverIds, function (i, photo_id) {
            var div = page_handle.utils.getPhotoImageDom(photo_id);
            div.addClass('video-cover');
            div.find('> .photo-detail-link').append(btn.cloneNode(true));
        });
        // 绑定事件
        $('#' + page_handle.config.selector.photosContainer_id + ' .video-cover').mouseenter(function (e) { // 鼠标进入节点，加红
            e.currentTarget.querySelector('svg > path.video-play-button-bg').setAttribute('class', 'video-play-button-bg video-play-button-bg-enter');
        }).mouseleave(function (e) { // 鼠标离开节点，还原灰色
            e.currentTarget.querySelector('svg > path.video-play-button-bg').setAttribute('class', 'video-play-button-bg video-play-button-bg-leave');
        }).find('.video-play-button').click(function (e) {
            $(e.currentTarget).closest('.video-cover').find('img').trigger('click'); // 点击，触发播放
        });
    };

    // 当视频打开方式为弹出Modal时，构建Modal
    var makePopupAction = function (videos, selector) {
        var popupOptions = {
            //items: video,
            type: 'inline',
            fixedBgPos: true,
            mainClass: 'mfp-fade',
            removalDelay: 300,
            inline: {
                markup: '<div class="mfp-iframe-scaler">' +
                '<div title="Edit video" class="mfp-video-edit mfp-video-edit-inline"><span aria-hidden="true" class="glyphicon glyphicon-edit"></span></div>' +
                '<div class="mfp-close"></div>' +
                '<figure class="include-iframe"></figure>' +
                '<div class="mfp-bottom-bar video-popup-block-bottom-bar">' +
                '<div class="mfp-title"></div>' +
                '<div class="mfp-counter"></div></div>' +
                '</div>' // HTML markup of popup, `mfp-close` will be replaced by the close button
            },
            callbacks: {
                elementParse: function (item) {
                    // Function will fire for each target element
                    // "item.el" is a target DOM element (if present)
                    // "item.src" is a source that you may modify
                    var $el = item.$el = $(item.el[0]), $photoNode = $el.closest('.video-cover');
                    item.video = $photoNode.data('video');
                    if (!item.video) {
                        var id = $el.attr('data-video-id');
                        item.video = videos.filter(function (v) {
                            return v.video_id == id;
                        })[0];
                        $photoNode.data('video', item.video);
                    }
                },
                markupParse: function (template, values, item) {
                    // optionally apply your own logic - modify "template" element based on data in "values"
                    // console.log('Parsing:', template, values, item);
                    if (template.hasClass('video-set-ready')) { // the bug, markupParse run twice
                        template.removeClass('video-set-ready'); // 此bug已修复，当同时使用事件和委托事件，该插件关闭不了事件，使得执行两次，第二次只调用了updateItemHTML()
                        return;
                    }
                    var mfp = this; // $.magnificPopup.instance
                    var video = item.video;
                    var isAuthor = login_handle.equalsLoginUser(video.user.uid);
                    var isBlockStyle = config.popup_btn_display != "inline"; // 控件显示方式
                    if (isBlockStyle) {
                        mfp.wrap.find('.mfp-container').removeClass('mfp-inline-holder').addClass('mfp-image-holder');
                        // 添加mfp-figure类可以设置未加载完成时背景颜色
                        template.addClass('mfp-figure').find('.include-iframe')
                            .addClass('video-popup-block')
                            .css('max-height', window.innerHeight + 'px');
                        template.find('.mfp-video-edit-inline').remove();
                        var video_url = ('video/detail/' + video.video_id).toURL();
                        template.find('.mfp-title').html('<a href="' + video_url + '" title="' + common_utils.encodeHTML(video.description).replace(/&amp;(?=#\d+;)/g, '&') + '" target="_blank">' +
                            common_utils.encodeHTML(video.name).replace(/&amp;(?=#\d+;)/g, '&') + '</a>');
                        var videoHandleBtnHtml =
                            '<a class="mfp-video-like' + (video.liked ? ' video-has-liked' : '') + '" title="添加到喜欢" style="margin-right: 7px;" target="_blank" ' +
                            'href="' + ('u/likes/videos').toURL() + '" role="button">' + (video.liked ? '已赞' : '赞') + '</a>' +
                            '<a class="mfp-video-open-detail" title="点击打开视频详情页" style="margin-right: 7px;" target="_blank" href="' + video_url + '#comments" role="button">评论</a>' +
                            '<a class="mfp-video-edit" title="点击编辑视频信息" target="_blank" href="' + video_url + '?mark=' + (isAuthor ? 'edit' : 'meta') + '" role="button">编辑</a>';
                        template.find('.mfp-counter').html(videoHandleBtnHtml);
                    } else {
                        template.find('.mfp-bottom-bar').remove();
                    }
                    var $playerWrap = template.find('.include-iframe');
                    if (config.use_site_iframe || video.source_type == 2) {
                        $playerWrap.parent().removeClass('mfp-video-scaler').addClass('mfp-iframe-scaler');
                        $playerWrap.html(video.code || ('<iframe src="' + ('video/embed/' + video.video_id).toURL() + '" allowfullscreen="true"></iframe>'));
                        $playerWrap.children().eq(0).addClass('mfp-iframe take-over-css').attr('allowfullscreen', 'true');
                        // 未加载时背景色改为通过 .mfp-figure:after 解决
                        // if (false && isNotInline) {
                        //     // 此方法还可解决mousemove遇到iframe不生效问题 config.popup_hide_btn，z-index: 700;opacity: 0;
                        //     // 或者直接给iframe加pointer-events: none;隔绝事件，但是一样的，这样就触发不了iframe里的事件了
                        //     vd.children().eq(0).css('z-index', '600');
                        //     vd.append('<div class="real-video" style="z-index: 500;background: #000;position: absolute;top: 0;left: 0;width: 100%;height: calc(100% - 65px);margin-top: 32.5px;"></div>');
                        // }
                    } else {
                        // mfp-iframe-scaler这个类未指定高度时会使div向下偏移
                        $playerWrap.parent().removeClass('mfp-iframe-scaler').addClass('mfp-video-scaler');
                        var sourceNode = makeupVideoNode(video);
                        $playerWrap.html(sourceNode);
                    }
                    var video_edit_node = template.find('.mfp-video-edit');
                    if (!isAuthor) { // 非作者访问时
                        video_edit_node.attr('title', 'View video info');
                        if (isBlockStyle) {
                            video_edit_node.text('信息');
                        }
                        var video_edit_inline_node = template.find('.mfp-video-edit-inline').css('opacity', '0.65');
                        video_edit_inline_node.css('padding-top', '2px').find('span').attr('class', 'glyphicon glyphicon-info-sign');
                    }
                    template.addClass('video-set-ready');
                },
                change: function () {   // mfp-container: 只有打开时才会重新创建，mfp-content: 更新时也会删除重建
                    if (!this.content.hasClass('video-set-ready')) {
                        return;
                    }
                    var mfp = this;
                    var video = mfp.currItem.video;
                    if (config.popup_btn_display != 'inline') {
                        mfp.content.find('.mfp-close').toggleClass('video-popup-block-close', true);
                    }
                    mfp.content.on('click', '.mfp-video-edit', function (e) {
                        context.trigger(config.event.actionForEditVideo, video); // 触发编辑事件
                        try {
                            var events = $._data(context, 'events'); // 如果未绑定 video.edit 事件，则打开一个网页显示video信息
                            var isSet = false;
                            if (events && events['video'] && events['video'].length > 0) {
                                var set = events['video'].filter(function (e) {
                                    return e.namespace == "edit";
                                });
                                if (set && set.length > 0) {
                                    isSet = true;
                                }
                            }
                            if (!isSet) {
                                window.open(('video/detail/' + video.video_id + '?mark=' + (login_handle.equalsLoginUser(video.user.uid) ? 'edit' : 'meta')).toURL());
                            }
                        } catch (e) {
                            console.log('打开信息页失败', e);
                        }
                        e.preventDefault();
                        return false;
                    }).on('click', '.mfp-video-like', function (e) {
                        e.preventDefault();
                        var $likeBtn = $(this);
                        var video = mfp.currItem.video;
                        var undo = $likeBtn.hasClass('video-has-liked');
                        request.likeVideo(video.video_id, undo, function (newVideo, type) {
                            var newValue = newVideo.like_count, response = this;
                            if (type == 1) {
                                if (undo) {
                                    toastr.success('已移除赞~');
                                } else {
                                    if (login_handle.validateLogin()) {
                                        toastr.success('点击查看赞过的列表', "已添加到赞", {
                                            "timeOut": 12000,
                                            "onclick": function () {
                                                window.open('u/likes/videos'.toURL());
                                            }
                                        });
                                    }
                                }
                            } else {
                                toastr.success(response.message);
                            }
                            $likeBtn.toggleClass('video-has-liked', !undo).text(!undo ? '已赞' : '赞');
                            video.like_count = newValue;
                            video.liked = !undo;
                        });
                    });
                    // 修改地址栏, 改变check, 在切换图片的时候
                    var page_handle = config.album_photo_page_handle;
                    if (page_handle.config.isMagnificPopupOpen) { // 灯箱打开的时候不替换，切换的时候替换, 回调markupParse,change在open之前运行
                        var params = common_utils.parseURL(document.location.href).params;
                        var search = '';
                        $.each(params, function (key, value) {
                            if (key != 'method' && key != 'check') {
                                search += '&' + key + '=' + value;
                            }
                        });
                        search += '&check=' + (config.popup_url_check_id_use_by == 'video' ? video.video_id : video.cover.photo_id);
                        search = (search ? ('?' + search.substring(1)) : '');
                        history.replaceState(
                            {"mark": "check"},
                            document.title,
                            location.pathname + search
                        );
                    }
                    page_handle.trigger(page_handle.config.event.popupChanged, video.cover.photo_id, video.video_id);
                },
                afterChange: function () {  // 组件在事件change之后才会添加到body中，所以需要计算渲染属性的须在事件afterChange中执行
                    if (!this.content.hasClass('video-set-ready')) {
                        return;
                    }
                    // 注意，在打开的情况下（不是切换），mfp.wrap没有添加到body
                    // 从关闭到打开时，运行afterChange的时候，this.isOpen值为false
                    if (this.isOpen) {
                        this.st.callbacks['calcWidthStyle'].call(this);
                    }
                    this.updateStatus('ready', 'The video ready...');
                },
                open: function () {
                    // Will fire when this exact popup is opened
                    // this - is Magnific Popup object
                    this.st.callbacks['calcWidthStyle'].call(this); // open回调只会在打开时运行
                    var video = this.currItem.video;
                    var page_handle = config.album_photo_page_handle;
                    page_handle.config.isMagnificPopupOpen = true;
                    // 鼠标不动一段时间后隐藏视频弹窗的控件，
                    // 弹窗组件会在打开时重新创建，切换时不变，所以此事件放在这里比较合适
                    if (config.popup_hide_btn) {
                        // 暴露设置变量方法的引用，让子类iframe调用，解决子类iframe中移动不触发mousemove问题
                        if (config.use_site_iframe && video.source_type != 2) {
                            var insertFrameEvent = function (childWindow) {
                                var searchFuncInter = window.setInterval(function () {
                                    if (childWindow.onActivityChange) {
                                        searchFuncInter && window.clearInterval(searchFuncInter);
                                        childWindow.onActivityChange(function (isActive, player) {
                                            if (isActive) {
                                                !config.isControlBarShow && utils.showPopupControlBar();
                                                config.isMouseMove = true;
                                            } else {
                                                config.isMouseMove = false;
                                                config.isControlBarShow && utils.hidePopupControlBar();
                                            }
                                        });
                                        childWindow.onVideoPlayStatusChange(function (playStatus) {
                                            switch (playStatus) {
                                                case "playing":
                                                    if (context.setPageActiveTimer) {
                                                        window.clearInterval(context.setPageActiveTimer);
                                                    }
                                                    websocket_util.utils.setPageActive(true);
                                                    context.setPageActiveTimer = window.setInterval(function () {
                                                        websocket_util.utils.setPageActive(true);
                                                    }, 5000);
                                                    break;
                                                case "pause":
                                                    if (context.setPageActiveTimer) {
                                                        window.clearInterval(context.setPageActiveTimer);
                                                    }
                                                    break;
                                                case "ended":
                                                    if (context.setPageActiveTimer) {
                                                        window.clearInterval(context.setPageActiveTimer);
                                                    }
                                                    break;
                                            }
                                        });
                                    }
                                }, 50);
                                setTimeout(function () {
                                    searchFuncInter && window.clearInterval(searchFuncInter);
                                }, 30000);
                            };
                            var childFrame = this.content.find('.include-iframe iframe');
                            if (childFrame.prop('contentDocument') && childFrame.prop('contentDocument').readyState == 'complete') {
                                insertFrameEvent(childFrame.prop('contentWindow'));
                            } else {
                                childFrame.load(function () { // 等子iframe加载完毕
                                    insertFrameEvent(this.contentWindow);
                                });
                            }
                        }
                        config.isControlBarShow = true;
                        config.isMouseMove = false;
                        config.mouse_timer = null;
                        this.contentContainer.mouseenter(function () {
                            config.mouse_timer && window.clearInterval(config.mouse_timer);
                            config.mouse_timer = window.setInterval(function () {
                                if (!config.isMouseMove && config.isControlBarShow) {
                                    utils.hidePopupControlBar();
                                }
                                config.isMouseMove = false;
                            }, 5000); // 5s检测一次
                            config.isControlBarShow || utils.showPopupControlBar();
                        }).mousemove(function () {
                            if (!config.isControlBarShow) {
                                utils.showPopupControlBar();
                            }
                            config.isMouseMove = true;
                        }).mouseleave(function () {
                            config.isMouseMove = false;
                            window.clearInterval(config.mouse_timer);
                            config.isControlBarShow && utils.hidePopupControlBar();
                        });
                    }
                    // 修改地址栏, 增加check, 在打开的时候
                    var params = common_utils.parseURL(document.location.href).params;
                    var check = params.check;
                    if (!check) { // 当已经到详情页，就不运行
                        var search = '';
                        $.each(params, function (key, value) {
                            if (key != 'method' && key != 'check') {
                                search += '&' + key + '=' + value;
                            }
                        });
                        check = (config.popup_url_check_id_use_by == 'video' ? video.video_id : video.cover.photo_id);
                        search += '&check=' + check;
                        search = (search ? ('?' + search.substring(1)) : '');
                        history.pushState(
                            {"mark": "check"},
                            document.title,
                            location.pathname + search
                        );
                    }
                    page_handle.trigger(page_handle.config.event.popupOpened, video.cover.photo_id, video.video_id);
                },
                resize: function (winHeight) {
                    var mfp = this;
                    if (mfp.isOpen && !winHeight) {
                        mfp.st.callbacks['calcWidthStyle'].call(mfp);
                        setTimeout(function () {
                            mfp.st.callbacks['calcWidthStyle'].call(mfp);
                        }, 260);
                    }
                },
                calcWidthStyle: function () {
                    var mfp = this; // $.magnificPopup.instance
                    var video = this.currItem.video;
                    var $playerWrap = this.content.find('.include-iframe');
                    var $player = $playerWrap.children().eq(0);
                    var isBlockStyle = config.popup_btn_display == "block"; // 控件显示方式
                    var usableHeight = null;    // 可用实际高度
                    var usableWidth = this.container.width();   // 可用实际宽度
                    var height_scale = null; // 容器高度占浏览器高度比
                    var scale = null; // 播放器宽高缩放比例
                    var block_padding = null;
                    if (isBlockStyle) {
                        height_scale = 1;
                        var computedStyle = getComputedStyle($player[0]);
                        block_padding = parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
                        usableHeight = window.innerHeight - block_padding;
                        scale = usableHeight / video.height; // 设定为固定的height，width按视频变化
                    } else {
                        height_scale = config.popup_height_scale;
                        block_padding = 0;
                        usableHeight = window.innerHeight * height_scale;
                        scale = usableHeight / video.height; // 设定为固定的height，width按视频变化
                    }
                    var need_width = scale * video.width; // 设定width的值
                    // 通用比例宽度（16:9）
                    var generalWidth = usableHeight / 9 * 16;
                    var setMaxWidth = null;
                    if (need_width <= usableWidth && (need_width > generalWidth || generalWidth > usableWidth)) {
                        setMaxWidth = need_width;
                    } else if (generalWidth >= need_width && generalWidth < usableWidth) {
                        setMaxWidth = generalWidth;
                    } else {
                        setMaxWidth = usableWidth > 1000 ? (usableWidth - 175) : usableWidth;
                    }
                    mfp.contentContainer.css('max-width', setMaxWidth + 'px');
                    if (config.use_site_iframe || video.source_type == 2) {
                        if (need_width > usableWidth) { // 如果width大于窗口的宽度，则取消设置
                            mfp.contentContainer.css('width', '');
                            mfp.contentContainer.css('height', '');
                            // 宽度不够时，设置最大宽度，同时寻找合适高度
                            var need_height = ((setMaxWidth) / video.width) * video.height;
                            if (need_height <= usableHeight) {
                                mfp.contentContainer.css('height', (need_height + block_padding) + 'px');
                            }
                        } else if (config.popup_iframe_border) { // 添加黑边
                            mfp.contentContainer.css('height', (height_scale * 100) + '%');
                            mfp.contentContainer.css('width', '');
                        } else { // IFrame设置宽度去除黑边
                            mfp.contentContainer.css('height', (height_scale * 100) + '%');
                            mfp.contentContainer.css('width', need_width + 'px');
                        }
                    } else {
                        mfp.contentContainer.css('height', ''); // 不指定就会居中
                        if (need_width > usableWidth) {
                            mfp.contentContainer.css('width', '');
                        } else if (config.popup_video_border) { // 添加黑边
                            mfp.contentContainer.css('width', '');
                            $player.get(0).style.width = need_width + 'px';
                            if (!isBlockStyle) {
                                $playerWrap.parent().addClass('mfp-figure mfp-figure-inline');
                            }
                        } else { // 取除黑边
                            mfp.contentContainer.css('width', need_width + 'px');
                        }
                    }
                },
                beforeClose: function () {
                    // Callback available since v0.9.0
                    if (config.popup_hide_btn) {
                        config.mouse_timer && window.clearInterval(config.mouse_timer); // prevent clear timer not run in "mouseleave not run when dom was removed"
                    }
                    if (this.content) {
                        this.content.find('.include-iframe video').trigger('pause').remove();
                        var $iframe = this.content.find('.include-iframe iframe');
                        if ($iframe.length > 0) {
                            $iframe[0].src = "//about:blank";
                            // $iframe[0].contentWindow.document.write(""); // 清空iframe的内容
                            $iframe[0].contentWindow.close(); // 避免iframe内存泄漏
                            $iframe.remove();
                        }
                    }
                },
                close: function () {
                    // Will fire when popup is closed
                    // 修改地址栏, 去掉check, 在关闭图片的时候
                    var video = this.currItem.video;
                    var page_handle = config.album_photo_page_handle;
                    page_handle.config.isMagnificPopupOpen = false;
                    var params = common_utils.parseURL(document.location.href).params;
                    var check = params.check;
                    if (check) { // 当已经到列表页就不运行
                        history.back();
                    }
                    page_handle.trigger(page_handle.config.event.popupClosed, video.cover.photo_id, video.video_id);
                    var $checkOriginNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                    if ($checkOriginNode.length > 0 && !common_utils.isOnScreen($checkOriginNode.get(0), 150, 150)) {
                        $('html, body').animate({
                            scrollTop: $checkOriginNode.offset().top - ($(window).height() / 2 - 300)
                        }, 260);
                    }
                },
            }
        };
        popupOptions.isObj = false;
        popupOptions.mainEl = popupOptions.items = $(selector).onfirst('click', function (e) {
            var $el = $(this);
            if ($el.attr('data-video-id')) {
                popupOptions.el = $el;
                $.magnificPopup.instance.open(popupOptions);
                e.stopImmediatePropagation(); // 禁止绑定的照片弹窗打开
                e.preventDefault(); // 由于禁止了冒泡，所以这里仍然需要处理一次禁止a标签的默认行为
            } else {
                globals.notify({"progressBar": false}).error('没有权限~', '打开视频失败~', 'notify_open_video_fail');
            }
        }).data('magnificPopup', popupOptions);
    };

    // ------ After clicking video to open, make up the video node. ------

    // 构建等同于封面大小的视频节点
    var makeupVideoNode = function (video) {
        var node = document.createElement(video.source_type == 2 ? 'div' : 'video');
        node.id = 'video_' + video.video_id;
        node.setAttribute('data-video-id', video.video_id);
        if (video.source_type == 0 || video.source_type == 1) {
            node.src = video.path;
            node.controls = "controls";
            node.poster = video.cover.path;
            node.setAttribute('type', video.video_type);
        } else {
            node.innerHTML = video.code;
        }
        return node;
    };

    // 将照片节点替换为视频节点
    var insertVideoNode = function (photoDom, videoNode, video) {
        if (video.source_type == 2) {
            var scale = (photoDom.find('img').width()) / video.width;
            var borderWidth = 0; // 新样式不采用border了
            $(videoNode).children().removeAttr('width')
            //.css('border', borderWidth + 'px solid #FFFFFF')
                .css('width', '100%')
                //.height(video.height * scale);
                // jquery赋值时会加上border宽度，但是由于该节点还没有实际渲染，jquery识别不到border，所以手动需要加上边框宽度
                // .height(video.height * scale + borderWidth * 2); // 既这样等同于原始的写法：
                .css('height', (video.height * scale + borderWidth * 2) + 'px'); // 原始css赋值的宽度会包含border宽度在内
        }
        photoDom.find('> .photo-detail-link').html(videoNode);
    };

    var utils = {
        "getVideoByCache": function (video_id) {
            var video = null;
            pointer.videos && $.each(pointer.videos, function (i, value) {
                if (value.video_id == video_id) {
                    video = value;
                    return false;
                }
            });
            return video;
        },
        "openVideoPopup": function (checkVideoId) {
            var page_handle = config.album_photo_page_handle;
            $('#' + page_handle.config.selector.photosContainer_id + ' ' + page_handle.config.selector.photo_node +
                " ." + config.popup_trigger_class_name + '[data-video-id="' + checkVideoId + '"]').trigger('click');
        },
        "closeVideoPopup": function () {
            $.magnificPopup.close();
        },
        "showPopupControlBar": function () {
            if (!config.isControlBarShow) {
                $.magnificPopup.instance.contentContainer.find('.mfp-bottom-bar,.mfp-close,.mfp-video-edit-inline').css('visibility', 'visible');
                config.isControlBarShow = true;
            }
        },
        "hidePopupControlBar": function () {
            if (config.isControlBarShow) {
                $.magnificPopup.instance.contentContainer.find('.mfp-bottom-bar,.mfp-close,.mfp-video-edit-inline').css('visibility', 'hidden');
                config.isControlBarShow = false;
            }
        }
    };

    var videoConfig = globals.getLocalConfig('album', {
        "photo_page": {
            "video": {
                "load_mode": "popupLoad",
                "popup_iframe_border": true,
                "popup_video_border": false,
                "popup_btn_display": "block",
                "popup_hide_btn": true,
                "popup_height_scale": 0.91,
                "use_site_iframe": true
            }
        }
    }).photo_page.video;
    init(videoConfig);

    var context = {
        "reInit": init,
        "config": config,
        "request": request,
        "utils": utils,
        "on": globals.on,
        "once": globals.once,
        "trigger": globals.trigger,
        "off": globals.off
    };

    return context;
});