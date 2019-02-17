/**
 * 用户视频IFrame分享引用
 * @author Jeffrey.Deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'toastr', 'Plyr'], factory);
    } else {
        // Browser globals
        factory(jQuery, toastr, Plyr);
    }
})(function (jQuery, toastr, Plyr) {

    var cloudPath = $("#cloudPath").attr("href");
    var staticPath = $("#staticPath").attr("href");
    var staticPath = $("#staticPath").attr("href");
    var currentVideo = null;

    var loadVideo = function (video_id, callback) {
        var video_param = null;
        if (typeof video_id == "object") {
            video_param = video_id;
        } else {
            video_param = {"video_id": video_id};
        }
        $.get("video.do?method=detailByAjax", video_param, function (data) {
            if (data.flag != 200) {
                console.log("Load video found error, Error Code: " + data.flag);
            }
            callback(data);
        });
    };

    var calcVideoPix = function ($player) {
        var scale = window.innerHeight / currentVideo.height;
        var need_width = scale * currentVideo.width; // 设定width的值
        if (window.innerWidth < need_width) {
            $player.css("width", "100%");
            $player.css("height", "");
            // 宽度不够时，设置最大宽度，同时寻找合适高度
            var need_height = ((window.innerWidth) / currentVideo.width) * currentVideo.height;
            if (need_height <= window.innerHeight) {
                $player.css("height", need_height + "px");
            }
        } else {
            $player.css("width", need_width + "px")
        }
    };

    loadVideo($('#video_info_form input[name="video_id"]').val(), function (data) {
        if (data.flag == 200) {
            var video = data.video;
            currentVideo = video;
            if (video.source_type != 2) {
                var $site_player = $("#site-player");
                // calcVideoPix($site_player);  // 发现并不需要计算，因为我在外面计算好了，100vh, 100vw即可
                var realVideoDom = $site_player[0];
                realVideoDom.poster = cloudPath + video.cover.path;
                var player = new Plyr($site_player, {
                    title: video.name,
                    poster: cloudPath + video.cover.path,
                    iconUrl: staticPath + "lib/plyr/plyr.svg",
                    blankVideo: staticPath + "lib/plyr/blank.mp4",
                    disableContextMenu: false,
                    controls: ["play-large", "play", "progress", "current-time", "volume", "captions", "settings", "pip", "airplay", "fullscreen", "download"],
                    // settings: ['captions', 'quality', 'speed', 'loop'],
                    tooltips: {"controls": true, "seek": true}
                });
                player.on('ready', function (event) {
                    // var instance = event.detail.plyr;
                    var _self = this;
                    setTimeout(function () {
                        $(player.elements.controls).find(".plyr__volume").removeAttr("hidden");  // fixed bug
                        if (window.top && window.top.set_video_popup_mouse_move) {
                            $(_self).mousemove(function (e) {   // for popup hide control btn when mouse not moving.
                                window.top.set_video_popup_mouse_move(true);
                            });
                        }
                    }, 400);
                });
                player.on('playing', function (event) { // fixed bug
                    $(player.elements.controls).find(".plyr__volume").removeAttr("hidden");
                    if (window.top && window.top.set_video_popup_mouse_move) {
                        window.top.set_video_popup_mouse_move(false);
                    }
                });
                player.on('pause', function (event) {
                    if (window.top && window.top.set_video_popup_mouse_move) {
                        window.top.set_video_popup_mouse_move(true);
                    }
                });
                document.getElementById("site-player").src = video.source_type == 1 ? video.path : (cloudPath + video.path);
                // $(window).resize(function () {
                //     calcVideoPix($("#site-player"));
                // });
            } else {
                $("#player-wrapper").html(video.code);
                // 去黑边
                // calcVideoPix($("#player-wrapper").children(0));
                // $(window).resize(function () {
                //     calcVideoPix($("#player-wrapper").children(0));
                // });
            }
            document.title = video.name + document.title;
            $('head meta[name="description"]').attr("content", video.description);
            $('head meta[name="keywords"]').attr("content", video.tags + $('head meta[name="keywords"]').attr("content"));
        } else {
            toastr.error(data.info, "加载视频出错", {"timeOut": 0});
        }
    });

});