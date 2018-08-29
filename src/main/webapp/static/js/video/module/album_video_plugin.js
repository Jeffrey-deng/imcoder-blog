/**
 * 相册详情页面的视频插件
 * @author Jeffrey.deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'bootstrap', 'toastr', 'common_utils', 'login_handle', 'album_photo_page_handle'], factory);
    } else {
        // Browser globals
        window.album_video_plugin = factory(window.jQuery, null, toastr, common_utils, login_handle, album_photo_page_handle);
    }
})(function ($, bootstrap, toastr, common_utils, login_handle, album_photo_page_handle) {

    var pointer = {
        createModal: null,
        updateModal: null
    };

    var config = {
        album_photo_page_handle: album_photo_page_handle,
        mode: "lazyLoad",
        event: {
            "actionForEditPhoto": "photo.edit",
            "pagePaginationClick": "page.jump.click",
            "pageJumpCompleted": "page.jump.completed",
            "pageLoadCompleted": "page.load.completed"
        }
    };

    var init = function (options) {
        $.extend(true, config, options);
        if (options != null && options.album_photo_page_handle && !options.event) {
            config.event = album_photo_page_handle.config.event;
        }
        config.path_params = album_photo_page_handle.config.path_params;
        config.album_photo_page_handle.utils.unbindEvent(config.event.pageJumpCompleted, convertPhotoToVideo);
        config.album_photo_page_handle.utils.bindEvent(config.event.pageJumpCompleted, convertPhotoToVideo);
    };

    var convertPhotoToVideo = function (e, pageNum) {
        var page_handle = config.album_photo_page_handle;
        var photos = page_handle.pointer.album.photos,
            pageSize = page_handle.config.page_params.pageSize,
            start = (pageNum - 1) * pageSize,
            end = start + (photos.length - start < pageSize ? photos.length - start - 1 : pageSize - 1);

        var videoRegex = /^video.*/;
        var videoCovers = [];
        for (var i = start; i <= end; i++) {
            if (videoRegex.test(photos[i].image_type)) {
                videoCovers.push(photos[i].photo_id);
            }
        }
        if (videoCovers.length == 0) {
            return;
        }
        if (config.mode == "preLoad") { //预加载，这种方式视频未播放时会有噪音
            loadVideosByCovers(videoCovers, function (data) {
                if (data && data.videos) {
                    $.each(data.videos, function (i, video) {
                        var currentNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                        var videoNode = makeupVideoNode(currentNode, video);
                        insertVideoNode(currentNode, videoNode);
                    });
                }
            });
        } else { //延迟加载
            $.each(videoCovers, function (i, cover_id) {
                var photoDom = page_handle.utils.getPhotoImageDom(cover_id);
                photoDom.attr("title", "视频: " + photoDom.attr("title"));
                photoDom.find("img").click(function () {
                    common_utils.removeNotify("notify_load_video");
                    common_utils.notify({
                        "progressBar": false,
                        "hideDuration": 0,
                        "timeOut": 0,
                        "closeButton": false
                    }).success("正在加载视频Meta", "", "notify_load_video");
                    loadVideosByCover(cover_id, function (data) {
                        if (data && data.flag == 200) {
                            var video = data.video;
                            var currentNode = page_handle.utils.getPhotoImageDom(video.cover.photo_id);
                            var videoNode = makeupVideoNode(currentNode, video);
                            insertVideoNode(currentNode, videoNode);
                        }
                        common_utils.removeNotify("notify_load_video");
                    });
                    return false;
                });
            });
        }
    };

    var loadVideosByCover = function (cover_id, callback) {
        $.get("video.do?method=detailByAjax", {"cover_id": cover_id}, function (data) {
            if (data.flag != 200) {
                toastr.error(data.info, "加载视频失败");
                console.log("Load video found error, Error Code: " + data.flag);
            }
            callback(data);
        });
    };

    var loadVideosByCovers = function (array, callback) {
        $.ajax({
            type: "GET",
            url: "video.do?method=videoListByAjaxAcceptCovers",
            data: {"covers": array.join()},
            dataType: "json",
            //contentType: "application/json",
            success: function (data) {
                callback(data);
            },
            error: function (xhr, ts) {
                console.log("Load video found error, Error Code: " + ts);
            }
        });
    };

    var makeupVideoNode = function (photoDom, video) {
        var node = document.createElement(video.source_type == 2 ? "div" : "video");
        node.id = "video_" + video.video_id;
        node.setAttribute("video_id", video.video_id);
        if (video.source_type == 0 || video.source_type == 1) {
            node.src = video.source_type == 1 ? video.path : (config.path_params.cloudPath + video.path);
            node.controls = "controls";
            node.poster = config.path_params.cloudPath + video.cover.path;
            node.setAttribute("type", video.video_type);
        } else {
            node.innerHTML = video.code;
            var scale = (photoDom.find("img").width()) / video.width;
            $(node).children().removeAttr("width")
                .css("border", "5px solid #FFFFFF")
                .css("width", "100%")
                //.height(video.height * scale);
                // jquery赋值时会加上border宽度，但是由于该节点还没有实际渲染，jquery识别不到border，所以手动需要加上边框宽度
                // .height(video.height * scale + 10); // 既这样等同于原始的写法：
                .css("height", (video.height * scale + 10) + "px"); // 原始css赋值的宽度会包含border宽度在内
        }
        return node;
    };

    var insertVideoNode = function (photoDom, videoNode, video) {
        photoDom.html(videoNode);
    };

    var utils = {
        "bindEvent": function (object, eventName, func) {
            $(object).bind(eventName, func);
        },
        "triggerEvent": function (object, eventName) {
            $(object).triggerHandler(eventName, Array.prototype.slice.call(arguments, 2));
        },
        "unbindEvent": function (object, eventName, func) {
            $(object).unbind(eventName, func);
        }
    };

    var videoConfig = common_utils.getLocalConfig("album", {"photo_page": {"video_load_mode": "lazyLoad"}});
    init({"mode": videoConfig.photo_page.video_load_mode});

    var context = {
        "reInit": init,
        "config": config,
        "loadVideosByCover": loadVideosByCover,
        "loadVideosByCovers": loadVideosByCovers
    };

    return context;
});