/**
 * 相册详情页面的视频插件
 * @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'common_utils', 'login_handle', 'album_photo_page_handle', 'websocket_util'], factory);
    } else {
        // Browser globals
        window.album_video_plugin = factory(window.jQuery, null, toastr, common_utils, login_handle, album_photo_page_handle, websocket_util);
    }
})(function ($, bootstrap, toastr, common_utils, login_handle, album_photo_page_handle, websocket_util) {

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
        callback: {
            "loadVideoByCover": function (cover_id, callback) {
                $.get("video.api?method=getVideo", {"cover_id": cover_id}, function (response) {
                    if (response.status != 200) {
                        common_utils.notify({"progressBar": false}).error(response.message, "打开视频失败~", "notify_open_video_fail");
                        console.log("Load video found error, Error Code: " + response.status);
                        callback(null);
                    } else {
                        callback(response.data.video);
                    }
                });
            },
            "loadVideosByCovers": function (array, callback) {
                $.ajax({
                    type: "GET",
                    url: "video.api?method=getVideoListByCovers",
                    data: {"covers": array.join()},
                    dataType: "json",
                    //contentType: "application/json",
                    success: function (response) {
                        if (response.status == 200) {
                            callback(response.data.videos);
                        } else {
                            toastr.error(response.message, "加载视频列表失败~");
                        }
                    },
                    error: function (xhr, ts) {
                        console.log("Load video found error, Error Code: " + ts);
                    }
                });
            }
        }
    };

    var init = function (options) {
        common_utils.extendNonNull(true, config, options);
        if (options != null && options.album_photo_page_handle && !options.event) {
            $.extend(true, config.event, album_photo_page_handle.config.event);
        }
        config.path_params = album_photo_page_handle.config.path_params;
        pointer.hasOpenCheckPhoto = false;
        config.album_photo_page_handle.utils.unbindEvent(config.event.pageJumpCompleted, convertPhotoToVideo);
        config.album_photo_page_handle.utils.bindEvent(config.event.pageJumpCompleted, convertPhotoToVideo);
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
        for (var i = start; i <= end; i++) {
            if (videoRegex.test(photos[i].image_type)) {
                videoCovers.push(photos[i].photo_id);
            }
        }
        pointer.covers = videoCovers;
        if (videoCovers.length == 0) {
            return;
        }
        if (config.load_mode == "preLoad") { //预加载，这种方式视频未播放时会有噪音
            config.callback.loadVideosByCovers.call(context, videoCovers, function (videos) {
                if (videos) {
                    pointer.videos = videos;
                    $.each(videos, function (i, video) {
                        var currentNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                        var videoNode = makeupVideoNode(video);
                        insertVideoNode(currentNode, videoNode, video);
                    });
                }
            });
        } else if (config.load_mode == "lazyLoad") { //延迟加载
            $.each(videoCovers, function (i, cover_id) {
                var photoDom = page_handle.utils.getPhotoImageDom(cover_id);
                photoDom.attr("title", "视频: " + photoDom.attr("title"));
                photoDom.find("img").click(function () {
                    common_utils.removeNotify("notify_load_video");
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "showDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载视频Meta", "", "notify_load_video");
                    config.callback.loadVideoByCover.call(context, cover_id, function (video) {
                        if (video) {
                            var currentNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                            var videoNode = makeupVideoNode(video);
                            insertVideoNode(currentNode, videoNode, video);
                            if (currentNode.find(".video-play-button")) {
                                currentNode.find(".video-play-button").remove();
                            }
                            currentNode.unbind("mouseenter");
                            currentNode.unbind("mouseleave");
                        }
                        common_utils.removeNotify("notify_load_video");
                    });
                    return false;
                });
            });
            addVideoBtnToCover(videoCovers);
        } else { // popupLoad
            //common_utils.addStyle(".mfp-inline-holder .mfp-content {max-width: 1100px;} .mfp-content video {border: 0px;width:100%;}");
            if (!pointer.hasOpenCheckPhoto) { // 当用户指定要查看某个视频时，先插入一个点击事件以阻止打开图片的默认事件
                var stopOpenImage = function (e) {
                    $(e.currentTarget).unbind("click", stopOpenImage);
                    return false;
                };
                // 此时page_handle.utils.openPhotoPopup未被替换，因为是异步的
                pointer.checkPhotoImageDom = page_handle.utils.getPhotoImageDom(page_handle.config.checkPhotoId).find("img");
                pointer.checkPhotoImageDom.click(stopOpenImage);
            }
            var className = config.popup_trigger_class_name;
            var popupTriggerSelector = "#" + page_handle.config.selector.photosContainer_id + " " + page_handle.config.selector.photo_node + " ." + className;
            config.callback.loadVideosByCovers.call(context, videoCovers, function (videos) {
                videos = videos || [];
                pointer.videos = videos;
                if (config.popup_url_check_id_use_by == "video") {  // 此时check为video_id
                    page_handle.utils.openPhotoPopup = utils.openVideoPopup;
                }
                if (videos.length > 0) {
                    $.each(videos, function (i, video) {
                        var photoDom = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                        var refer = photoDom.attr("title").match(/^视频: (Refer@\w+: )/) ? RegExp.$1 : "";
                        var $imageNode = photoDom.attr("title", "视频: " + refer + video.name).find("img");
                        $imageNode.attr("data-video-id", video.video_id);
                    });
                    makePopupAction(videos, (popupTriggerSelector + "[data-video-id]"));
                }
                var openFailFunc = function () {
                    common_utils.notify({"progressBar": false}).error("没有权限~", "打开视频失败~", "notify_open_video_fail");
                };
                $(popupTriggerSelector).each(function (i, img) {
                    if (!img.hasAttribute("data-video-id")) {
                        $(img)
                            .click(openFailFunc)
                            .closest(page_handle.config.selector.photo_node).find('.video-play-button').hide();
                    }
                });
                if (!pointer.hasOpenCheckPhoto) {  // 当用户指定要查看某个视频时，触发之
                    // pointer.checkPhotoImageDom.click(); // 但是为了优雅，不这样直接触发
                    if (config.popup_url_check_id_use_by == "video") {  // 此时checkPhotoId为video_id
                        var checkVideoId = pointer.checkPhotoImageDom.attr("data-video-id");
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
                var photoDom = page_handle.utils.getPhotoImageDom(cover_id);
                photoDom.attr("title", "视频: " + photoDom.attr("title"));
                photoDom.find("img").addClass(className);
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
        var btn = document.createElement("button");
        btn.className = "video-play-button";
        btn.setAttribute("aria-label", "播放");
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); // svg
        svg.setAttribute("version", "1.1");
        svg.setAttribute("viewBox", "0 0 68 48");
        btn.appendChild(svg);
        var path_bg = document.createElementNS('http://www.w3.org/2000/svg', 'path'); // path
        path_bg.setAttribute("class", "video-play-button-bg video-play-button-bg-leave"); // 只能通过setAttribute，不能className
        path_bg.setAttribute("d", "M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4" +
            ".81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-" +
            "0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z");
        var path_arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path_arrow.setAttribute("class", "video-play-button-arrow");
        path_arrow.setAttribute("d", "M 45,24 27,14 27,34");
        svg.appendChild(path_bg);
        svg.appendChild(path_arrow);
        // 插入节点
        $.each(coverIds, function (i, photo_id) {
            var div = page_handle.utils.getPhotoImageDom(photo_id);
            div.addClass("video-cover");
            div.append(btn.cloneNode(true));
        });
        // 绑定事件
        $("#" + page_handle.config.selector.photosContainer_id + " .video-cover").mouseenter(function (e) { // 鼠标进入节点，加红
            e.currentTarget.querySelector("svg > path.video-play-button-bg").setAttribute("class", "video-play-button-bg video-play-button-bg-enter");
        }).mouseleave(function (e) { // 鼠标离开节点，还原灰色
            e.currentTarget.querySelector("svg > path.video-play-button-bg").setAttribute("class", "video-play-button-bg video-play-button-bg-leave");
        }).find(".video-play-button").click(function (e) {
            $(e.currentTarget).parent().find("img").click(); // 点击，触发播放
        });
    };

    // 当视频打开方式为弹出Modal时，构建Modal
    var makePopupAction = function (videos, selector) {
        $(selector).magnificPopup({
            //items: video,
            type: 'inline',
            fixedBgPos: true,
            mainClass: 'mfp-with-zoom',
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
                    var id = item.el[0].getAttribute("data-video-id");
                    item.video = videos.filter(function (v) {
                        return v.video_id == id;
                    })[0];
                },
                markupParse: function (template, values, item) {
                    // optionally apply your own logic - modify "template" element based on data in "values"
                    // console.log('Parsing:', template, values, item);
                    if (template.hasClass("video-set-ready")) { // the bug, markupParse run twice
                        template.removeClass("video-set-ready");
                        return;
                    }
                    var magnificPopup = this; // $.magnificPopup.instance
                    var video = item.video;
                    var height_scale = null; // 容器高度占浏览器高度比
                    var scale = null; // 播放器宽高缩放比例
                    var isNotInline = config.popup_btn_display != "inline"; // 控件显示方式
                    var block_padding = (window.innerWidth >= 1750 ? 81.25 : (window.innerWidth >= 1600 ? 73.822 : 65));
                    var usableHeight = null;    // 可用实际高度

                    if (isNotInline) {
                        magnificPopup.wrap.find(".mfp-container").removeClass("mfp-inline-holder").addClass("mfp-image-holder");
                        // 添加mfp-figure类可以设置未加载完成时背景颜色
                        template.addClass("mfp-figure").find(".include-iframe")
                            .addClass("video-popup-block")
                            .css("max-height", window.innerHeight + "px");
                        template.find(".mfp-video-edit-inline").remove();
                        var video_url = "video/detail/" + video.video_id;
                        template.find(".mfp-title").html('<a href="' + video_url + '" title="' + common_utils.encodeHTML(video.description) + '" target="_blank">' + common_utils.encodeHTML(video.name) + '</a>');
                        var videoHandleBtnHtml =
                            '<a class="mfp-video-open-detail" title="点击打开视频详情页" style="margin-right: 7px;" target="_blank" href="video/detail/' + video.video_id + '#addComment">评论</a>' +
                            '<a class="mfp-video-edit" title="点击编辑视频信息">编辑</a>';
                        template.find(".mfp-counter").html(videoHandleBtnHtml);
                        height_scale = 1;
                        usableHeight = window.innerHeight - block_padding;
                        scale = usableHeight / video.height; // 设定为固定的height，width按视频变化
                    } else {
                        template.find(".mfp-bottom-bar").remove();
                        height_scale = config.popup_height_scale;
                        usableHeight = window.innerHeight * height_scale;
                        scale = usableHeight / video.height; // 设定为固定的height，width按视频变化
                    }
                    var vd = template.find(".include-iframe");
                    var generalWidth = usableHeight / 9 * 16;
                    if (generalWidth < window.innerWidth) {
                        magnificPopup.contentContainer.css("max-width", generalWidth + "px");
                    }
                    var need_width = scale * video.width; // 设定width的值
                    if (config.use_site_iframe || video.source_type == 2) {
                        vd.parent().removeClass("mfp-video-scaler").addClass("mfp-iframe-scaler");
                        vd.html(video.code || ('<iframe src="video/embed/' + video.video_id + '"></iframe>'));
                        vd.children().eq(0).addClass("mfp-iframe");
                        if (window.innerWidth < need_width) { // 如果width大于窗口的宽度，则取消设置
                            magnificPopup.contentContainer.css("width", "");
                            magnificPopup.contentContainer.css("height", "");
                            // 宽度不够时，设置最大宽度，同时寻找合适高度
                            var need_height = ((window.innerWidth - 12) / video.width) * video.height;
                            if (isNotInline && need_height <= usableHeight) {
                                magnificPopup.contentContainer.css("height", (need_height + block_padding) + "px");
                            } else if (!isNotInline && need_height <= usableHeight) {
                                magnificPopup.contentContainer.css("height", need_height + "px");
                            }
                        } else if (config.popup_iframe_border) {
                            magnificPopup.contentContainer.css("height", (height_scale * 100) + "%");
                            magnificPopup.contentContainer.css("width", "");
                        } else { // IFrame设置宽度去除黑边
                            magnificPopup.contentContainer.css("height", (height_scale * 100) + "%");
                            magnificPopup.contentContainer.css("width", need_width + "px");
                        }
                        // 未加载时背景色改为通过 .mfp-figure:after 解决
                        // if (false && isNotInline) {
                        //     // 此方法还可解决mousemove遇到iframe不生效问题 config.popup_hide_btn，z-index: 700;opacity: 0;
                        //     // 或者直接给iframe加pointer-events: none;隔绝事件，但是一样的，这样就触发不了iframe里的事件了
                        //     vd.children().eq(0).css("z-index", "600");
                        //     vd.append('<div class="real-video" style="z-index: 500;background: #000;position: absolute;top: 0;left: 0;width: 100%;height: calc(100% - 65px);margin-top: 32.5px;"></div>');
                        // }
                    } else {
                        // mfp-iframe-scaler这个类未指定高度时会使div向下偏移
                        vd.parent().removeClass("mfp-iframe-scaler").addClass("mfp-video-scaler");
                        var sourceNode = makeupVideoNode(video);
                        vd.html(sourceNode);
                        magnificPopup.contentContainer.css("height", ""); // 不指定就会居中
                        if (window.innerWidth < need_width) {
                            magnificPopup.contentContainer.css("width", "");
                        } else if (config.popup_video_border) { // 添加黑边
                            magnificPopup.contentContainer.css("width", "");
                            sourceNode.style.width = need_width + "px";
                            if (!isNotInline) {
                                vd.parent().addClass("mfp-figure mfp-figure-inline");
                            }
                        } else {
                            magnificPopup.contentContainer.css("width", need_width + "px");
                        }
                    }

                    var video_edit_node = template.find(".mfp-video-edit");
                    var video_edit_inline_node = template.find(".mfp-video-edit-inline").css("opacity", "0.65");
                    if (!login_handle.equalsLoginUser(video.user.uid)) {
                        video_edit_node.attr("title", "View video info");
                        if (isNotInline) {
                            video_edit_node.text("信息");
                        }
                        video_edit_inline_node.css("padding-top", "2px").find("span").attr("class", "glyphicon glyphicon-info-sign");
                    }
                    video_edit_node.click(function (e) {
                        utils.triggerEvent(context, config.event.actionForEditVideo, video); // 触发编辑事件
                        try {
                            var events = $._data(context, "events"); // 如果未绑定 video.edit 事件，则打开一个网页显示video信息
                            var isSet = false;
                            if (events && events.video && events.video.length > 0) {
                                var set = events.video.filter(function (e) {
                                    return e.namespace == "edit";
                                });
                                if (set && set.length > 0) {
                                    isSet = true;
                                }
                            }
                            if (!isSet) {
                                window.open("video/detail/" + video.video_id + "?mark=" + (login_handle.equalsLoginUser(video.user.uid) ? "edit" : "meta"));
                            }
                        } catch (e) {
                            console.log("打开信息页失败", e);
                        }
                        e.preventDefault();
                        return false;
                    });
                    template.addClass("video-set-ready");
                },
                change: function () {
                    if (!this.content.hasClass("video-set-ready")) {
                        return;
                    }
                    var video = this.currItem.video;
                    if (config.popup_btn_display != "inline") {
                        this.content.find(".mfp-close").removeClass("video-popup-block-close").addClass("video-popup-block-close");
                    }
                    // 鼠标不动一段时间后隐藏视频弹窗的控件
                    if (config.popup_hide_btn) {
                        // 暴露设置变量方法的引用，让子类iframe调用，解决子类iframe中移动不触发mousemove问题
                        if (config.use_site_iframe && video.source_type != 2) {
                            var insertFrameEvent = function (childWindow) {
                                var searchFuncInter = window.setInterval(function () {
                                    if (childWindow.onActivityChange) {
                                        searchFuncInter && window.clearInterval(searchFuncInter);
                                        childWindow.onActivityChange(function (isActive, currentVideo) {
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
                            var childFrame = this.content.find(".include-iframe iframe");
                            if (childFrame.prop("contentDocument") && childFrame.prop("contentDocument").readyState == "complete") {
                                insertFrameEvent(childFrame.prop("contentWindow"));
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
                    this.updateStatus('ready', 'The video ready...');
                    // 修改地址栏, 改变check, 在切换图片的时候
                    var page_handle = config.album_photo_page_handle;
                    if (page_handle.config.isMagnificPopupOpen) { // 灯箱打开的时候不替换，切换的时候替换, 回调markupParse,change在open之前运行
                        var params = common_utils.parseURL(document.location.href).params;
                        var search = "";
                        $.each(params, function (key, value) {
                            if (key != "method" && key != "check") {
                                search += "&" + key + "=" + value;
                            }
                        });
                        search += "&check=" + (config.popup_url_check_id_use_by == "video" ? video.video_id : video.cover.photo_id);
                        search = (search ? ("?" + search.substring(1)) : "");
                        history.replaceState(
                            {"mark": "check"},
                            document.title,
                            location.pathname + search
                        );
                    }
                    page_handle.utils.triggerEvent(page_handle.config.event.popupChanged, video.cover.photo_id, video.video_id);
                },
                open: function () {
                    // Will fire when this exact popup is opened
                    // this - is Magnific Popup object
                    // 修改地址栏, 增加check, 在打开的时候
                    var video = this.currItem.video;
                    var page_handle = config.album_photo_page_handle;
                    page_handle.config.isMagnificPopupOpen = true;
                    var params = common_utils.parseURL(document.location.href).params;
                    var check = params.check;
                    if (!check) { // 当已经到详情页，就不运行
                        var search = "";
                        $.each(params, function (key, value) {
                            if (key != "method" && key != "check") {
                                search += "&" + key + "=" + value;
                            }
                        });
                        check = (config.popup_url_check_id_use_by == "video" ? video.video_id : video.cover.photo_id);
                        search += "&check=" + check;
                        search = (search ? ("?" + search.substring(1)) : "");
                        history.pushState(
                            {"mark": "check"},
                            document.title,
                            location.pathname + search
                        );
                    }
                    page_handle.utils.triggerEvent(page_handle.config.event.popupOpened, video.cover.photo_id, video.video_id);
                },
                beforeClose: function () {
                    // Callback available since v0.9.0
                    if (config.popup_hide_btn) {
                        config.mouse_timer && window.clearInterval(config.mouse_timer); // prevent clear timer not run in "mouseleave not run when dom was removed"
                    }
                    if (this.content) {
                        this.content.find(".include-iframe video").trigger('pause').remove();
                        var $iframe = this.content.find(".include-iframe iframe");
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
                    page_handle.utils.triggerEvent(page_handle.config.event.popupClosed, video.cover.photo_id, video.video_id);
                    var $checkOriginNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                    if ($checkOriginNode.length > 0 && !common_utils.isOnScreen($checkOriginNode.get(0), 150, 150)) {
                        $('html, body').animate({
                            scrollTop: $checkOriginNode.offset().top - ($(window).height() / 2 - 300)
                        }, 260);
                    }
                },
            }
        });
    };

    // ------ After clicking video to open, make up the video node. ------

    // 构建等同于封面大小的视频节点
    var makeupVideoNode = function (video) {
        var node = document.createElement(video.source_type == 2 ? "div" : "video");
        node.id = "video_" + video.video_id;
        node.setAttribute("data-video-id", video.video_id);
        if (video.source_type == 0 || video.source_type == 1) {
            node.src = video.path
            node.controls = "controls";
            node.poster = video.cover.path;
            node.setAttribute("type", video.video_type);
        } else {
            node.innerHTML = video.code;
        }
        return node;
    };

    // 将照片节点替换为视频节点
    var insertVideoNode = function (photoDom, videoNode, video) {
        if (video.source_type == 2) {
            var scale = (photoDom.find("img").width()) / video.width;
            var borderWidth = 0; // 新样式不采用border了
            $(videoNode).children().removeAttr("width")
            //.css("border", borderWidth + "px solid #FFFFFF")
                .css("width", "100%")
                //.height(video.height * scale);
                // jquery赋值时会加上border宽度，但是由于该节点还没有实际渲染，jquery识别不到border，所以手动需要加上边框宽度
                // .height(video.height * scale + borderWidth*2); // 既这样等同于原始的写法：
                .css("height", (video.height * scale + borderWidth * 2) + "px"); // 原始css赋值的宽度会包含border宽度在内
        }
        photoDom.html(videoNode);
    };

    var utils = {
        "once": function (object, eventName, func, bindFirst) {
            var funcWrapper = function () {
                try {
                    func.apply(object, arguments);
                } finally {
                    utils.unbindEvent(object, eventName, funcWrapper);
                }
            };
            utils.bindEvent(object, eventName, funcWrapper, bindFirst);
        },
        "bindEvent": function (object, eventName, func, bindFirst) {
            if (bindFirst == true) {
                $(object).onfirst(eventName, func);
            } else {
                $(object).bind(eventName, func);
            }
        },
        "triggerEvent": function (object, eventName) {
            return $(object).triggerHandler(eventName, Array.prototype.slice.call(arguments, 2));
        },
        "unbindEvent": function (object, eventName, func) {
            $(object).unbind(eventName, func);
        },
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
            $("#" + page_handle.config.selector.photosContainer_id + " " + page_handle.config.selector.photo_node +
                " ." + config.popup_trigger_class_name + '[data-video-id="' + checkVideoId + '"]').click();
        },
        "closeVideoPopup": function () {
            $.magnificPopup.close();
        },
        "showPopupControlBar": function () {
            if (!config.isControlBarShow) {
                $.magnificPopup.instance.contentContainer.find(".mfp-bottom-bar,.mfp-close,.mfp-video-edit-inline").css("visibility", "visible");
                config.isControlBarShow = true;
            }
        },
        "hidePopupControlBar": function () {
            if (config.isControlBarShow) {
                $.magnificPopup.instance.contentContainer.find(".mfp-bottom-bar,.mfp-close,.mfp-video-edit-inline").css("visibility", "hidden");
                config.isControlBarShow = false;
            }
        }
    };

    var videoConfig = common_utils.getLocalConfig("album", {
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
        "utils": utils
    };

    return context;
});