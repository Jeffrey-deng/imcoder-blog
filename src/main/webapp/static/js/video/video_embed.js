/**
 * 用户视频IFrame分享引用
 * @author Jeffrey.Deng
 */
(function (factory) {
    /* global define */
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['jquery', 'toastr', 'Plyr', 'common_utils'], factory);
    } else {
        // Browser globals
        factory(jQuery, toastr, Plyr, common_utils);
    }
})(function ($, toastr, Plyr, common_utils) {

    var currentVideo = null;
    var currentPlayer = null;
    var config = {
        path_params: {
            "basePath": $("#basePath").attr("href"),
            "cloudPath": $("#cloudPath").attr("href"),
            "staticPath": $("#staticPath").attr("href")
        },
        callback: {
            "activity_change_calls": [],
            "ratio_change_calls": [],
            "video_page_ready_calls": [],
            "video_dom_ready_calls": [],
            "video_has_played_calls": [],
            "video_play_status_change_calls": [],
        },
        status: {
            videoPageReady: false,
            videoDomReady: false,
            videoHasPlayed: false,
            videoPlayStatus: "pause",
            userActivity: true,
            videoRotate: 0,
            videoFlip: ["0"]
        }
    };

    var videoPageReady = function () {
        if (!config.status.videoPageReady) {
            $.each(config.callback.video_page_ready_calls, function (i, call) {
                try {
                    call.call(currentVideo, currentPlayer);
                } catch (e) {

                }
            });
        }
        config.status.videoPageReady = true;

    };

    var videoDomReady = function () {
        if (!config.status.videoDomReady) {
            $.each(config.callback.video_dom_ready_calls, function (i, call) {
                try {
                    call.call(currentVideo, currentPlayer);
                } catch (e) {

                }
            });
        }
        config.status.videoDomReady = true;
    };

    var videoHasPlayed = function () {
        if (!config.status.videoHasPlayed) {
            $.each(config.callback.video_has_played_calls, function (i, call) {
                try {
                    call.call(currentVideo, currentPlayer);
                } catch (e) {

                }
            });
        }
        config.status.videoHasPlayed = true;
    };

    var videoPlayStatusChange = function (playStatus) {
        $.each(config.callback.video_play_status_change_calls, function (i, call) {
            try {
                call.call(currentVideo, playStatus);
            } catch (e) {

            }
        });
        config.status.videoPlayStatus = playStatus;
    };

    var activityChange = function (isActive) {
        $.each(config.callback.activity_change_calls, function (i, call) {
            try {
                call.call(currentVideo, isActive, currentPlayer);
            } catch (e) {

            }
        });
        config.status.userActivity = isActive;
    };

    var ratioChange = function (eyeRawWidth, eyeRawHeight, angle) {
        $.each(config.callback.ratio_change_calls, function (i, call) {
            try {
                call.call(currentVideo, eyeRawWidth, eyeRawHeight, angle, currentPlayer);
            } catch (e) {
            }
        });
        config.status.videoRotate = angle;
    };

    var request = {
        "loadVideo": function (video_id, callback) {
            var video_param = null;
            if (typeof video_id == "object") {
                video_param = video_id;
            } else {
                video_param = {"video_id": video_id};
            }
            $.get("video.api?method=getVideo", video_param, function (response) {
                if (response.status == 200) {
                    callback(response.data.video);
                } else {
                    console.log("Load video found error, Error Code: " + response.status);
                    toastr.error(response.message, "加载视频出错", {"timeOut": 0});
                }
            });
        },
        "saveVideoHasPlayed": function (video_id, callback) {
            if (!video_id) {
                return;
            }
            var post_param = null;
            if (typeof video_id == "object") {
                post_param = video_id;
            } else {
                post_param = {"video_id": video_id};
            }
            post_param.deep = 1;
            post_param.first_access_referer = document.referrer;
            post_param.first_access_path = document.location.href;
            // if (window.frameElement) {
            //     video_param.first_access_referer = window.parent.document.referrer;
            //     video_param.first_access_path = window.parent.document.location.href;
            // }
            $.post("video.api?method=triggerVideoAccess", post_param, function (response) {
                if (response.status == 200) {
                    callback && callback(response.data.video);
                }
            });
        }
    };

    // 根据比例设置元素宽高，算法以填充宽度优先, box_height为undefined时表示不限制高度
    var calcVideoPix = function ($video, whichCalcFirst, box_width, box_height, scale_width, scale_height) {
        if (whichCalcFirst == "w") { // 当宽度优先时
            var need_height = box_width / scale_width * scale_height; // 设定height的值
            if (box_height && need_height > box_height) {   // 当没`显示设置`值（为undefined）时
                $video.css("height", box_height + "px");
                $video.css("width", "");
                // 高度不够时，设置最大高度，同时寻找合适宽度
                var need_width = ((box_height) / scale_height) * scale_width;
                if (need_width <= box_width) {
                    $video.css("width", need_width + "px");
                }
            } else {
                $video.css("height", need_height + "px");
            }
        } else { // 当高度优先时
            var need_width = box_height / scale_height * scale_width; // 设定width的值
            if (box_width && need_width > box_width) {
                $video.css("width", box_width + "px");
                $video.css("height", "");
                // 宽度不够时，设置最大宽度，同时寻找合适高度
                var need_height = (box_width / scale_width) * scale_height;
                if (need_height <= box_height) {
                    $video.css("height", need_height + "px");
                }
            } else {
                $video.css("width", need_width + "px");
            }
        }
    };

    // 根据引用iframe的属性值来初始化video
    var initIframeSettingInParentPage = function (player, video) {
        var $video_iframe_in_top = window.frameElement ? $(window.frameElement) : null;
        if ($video_iframe_in_top) {
            var isNeedRunScale = true;
            var user_set_width = null;
            var user_set_height = null;
            var whichCalcFirst = "w";
            var setIframeSize = function () {
                if (player.set_iframe_size_running_lock || player.web_fullscreen || player.fullscreen.active) {
                    return;
                }
                player.set_iframe_size_running_lock = true; // 锁
                var scale_type = $video_iframe_in_top.attr("data-scale");   // 保持的比例方式
                switch (true) {
                    case "stay" == scale_type:
                        var style = $video_iframe_in_top.prop("style");
                        if (user_set_height === null) {
                            if (style.height.indexOf('%') != -1) {
                                user_set_height = NaN;
                            } else if (style.height.indexOf('em') != -1) {
                                user_set_height = NaN;
                            } else {
                                user_set_height = parseInt(style.height) || undefined;
                            }
                            if (user_set_height !== undefined) {
                                whichCalcFirst = "h";
                            }
                        }
                        if (user_set_width === null) {
                            if (style.width.indexOf('%') != -1) {
                                user_set_width = NaN;
                            } else if (style.width.indexOf('em') != -1) {
                                user_set_width = NaN;
                            } else {
                                user_set_width = parseInt(style.width) || undefined;
                            }
                            if (user_set_width !== undefined) {
                                whichCalcFirst = "w";
                            }
                        }
                        // 当没`显示设置`值（为undefined）时，另外处理
                        // user_set_width 设置了具体的px值时也要重新获取，因为有的情况css_width值并不代表实际width，例如同时设置width和max-width，且width小于max-width时
                        var clearIframeWidth = user_set_width === undefined ? user_set_width : $video_iframe_in_top.width();
                        var clearIframeHeight = user_set_height === undefined ? user_set_height : $video_iframe_in_top.height();
                        calcVideoPix($video_iframe_in_top, whichCalcFirst, clearIframeWidth, clearIframeHeight, video.width, video.height);
                        break;
                    case /^(\d+):(\d+)$/.test(scale_type):
                        var scale_w = parseInt(RegExp.$1);
                        var scale_h = parseInt(RegExp.$2);
                        var style = $video_iframe_in_top.prop("style");
                        if (user_set_height === null) {
                            if (style.height.indexOf('%') != -1) {
                                user_set_height = NaN;
                            } else if (style.height.indexOf('em') != -1) {
                                user_set_height = NaN;
                            } else {
                                user_set_height = parseInt(style.height) || undefined;
                            }
                            if (user_set_height !== undefined) {
                                whichCalcFirst = "h";
                            }
                        }
                        if (user_set_width === null) {
                            if (style.width.indexOf('%') != -1) {
                                user_set_width = NaN;
                            } else if (style.width.indexOf('em') != -1) {
                                user_set_width = NaN;
                            } else {
                                user_set_width = parseInt(style.width) || undefined;
                            }
                            if (user_set_width !== undefined) {
                                whichCalcFirst = "w";
                            }
                        }
                        // 当没显示设置值（为undefined）时，另外处理
                        var clearIframeWidth = user_set_width === undefined ? user_set_width : $video_iframe_in_top.width();
                        var clearIframeHeight = user_set_height === undefined ? user_set_height : $video_iframe_in_top.height();
                        calcVideoPix($video_iframe_in_top, whichCalcFirst, clearIframeWidth, clearIframeHeight, scale_w, scale_h);
                        break;
                    default:
                        user_set_width = null;
                        user_set_height = null;
                        isNeedRunScale = false;
                }
                player.set_iframe_size_running_lock = false;
            };
            setIframeSize();
            if (true) {
                $($video_iframe_in_top.prop("contentWindow")).resize(setIframeSize);
            }
            var set_autoplay = $video_iframe_in_top.attr("data-autoplay");  // 是否自动播放
            if (set_autoplay == "true") {
                player.autoplay = true;
            } else {
                player.autoplay = false;
            }
            var set_start = $video_iframe_in_top.attr("data-start"); // seek到一个播放时间，单位秒
            if (!isNaN(set_start)) {
                player.startTime = parseFloat(set_start);
            }
        }
    };

    // 视频控制栏显示控制
    var bindVideoControlEvent = function (playerWrapper, player, video) {
        var isAudio = config.isAudio;
        onActivityChange(function (isActive, player) {
            if (player && isAudio) {
                if (isActive) {
                    $(player.elements.container).css("transform", "");
                    if (player.paused) {
                        playerWrapper.find(".audio-play-btn").show(0);
                    }
                } else {
                    $(player.elements.container).css("transform", "translateY(100%)");
                    if (!player.paused) {
                        playerWrapper.find(".audio-play-btn").hide(0);
                    }
                }
            }
        });
        // 这些回调方法在父window中无效，需使用我新创建的API
        // Triggered when the instance is ready for API calls.
        player.on('ready', function (event) {
            if (video.video_type == "video/mp3") {
                $(player.media).addClass('audio-player');
            }
            // var instance = event.detail.plyr;
            var _self = this;
            if (!isAudio) {
                // for popup hide control btn when mouse not moving.
                $(_self).mousemove(function (e) {
                    activityChange(true);
                });
            } else {
                var isMouseMove = true;
                var mouse_timer = null;
                playerWrapper.on("mousemove", ".audio-wrapper", function (e) {
                    activityChange(player, true);
                    isMouseMove = true;
                }).on("mouseenter", ".audio-wrapper", function (e) {
                    mouse_timer && window.clearInterval(mouse_timer);
                    activityChange(player, true);
                    mouse_timer = window.setInterval(function () {  // 定时器隐藏控制条
                        if (!isMouseMove) {
                            activityChange(true);
                        }
                        isMouseMove = false;
                    }, 5000);
                    isMouseMove = true;
                }).on("mouseleave", ".audio-wrapper", function (e) {
                    mouse_timer && window.clearInterval(mouse_timer);
                    activityChange(true);
                    isMouseMove = false;
                }).on("click", ".audio-wrapper", function (e) {
                    if ($(e.target).hasClass("audio-cover") || $(e.target).hasClass("audio-wrapper")) {
                        player.togglePlay();
                    }
                }).on("click", ".audio-play-btn", function () {
                    player.togglePlay();
                });
            }
            // 强制打开字幕，默认即使有字幕也会因为语言不符合而关闭
            if (video.subtitles && video.subtitles.length > 0) {
                player.toggleCaptions(true);
            }
            // add new button
            playerWrapper.find(".audio-play-btn").show();
            initLoopControlHtml(player);
            if (true) {
                initRotateControlHtml(player, video.rotate);
                initFlipControlHtml(player);
            }
            initOpenInSiteControlHtml(player, video);
            initWebFullscreenControlHtml(player, video);
            videoDomReady();
        });
        // The media's metadata has finished loading; all attributes now contain as much useful information as they're going to.
        player.on('loadedmetadata', function (event) {
            // fixed bug
            $(player.elements.controls).find(".plyr__volume").removeAttr("hidden");
            if (player.autoplay) {
                player.play();
            }
            if (player.startTime > 0) {
                player.currentTime = player.startTime;
            }
        });
        player.on('playing', function (event) {
            // fixed bug
            $(player.elements.controls).find(".plyr__volume").removeAttr("hidden");
            activityChange(true);
            videoHasPlayed();
            videoPlayStatusChange("playing");
        });
        player.on("pause", function () {
            activityChange(player, true);
            videoPlayStatusChange("pause");
        });
        player.on("ended", function () {
            videoPlayStatusChange("ended");
        });
    };

    // 视频循环按钮
    var initLoopControlHtml = function (player) {
        var loop_button_html =
            '<button data-plyr="settings" type="button" class="plyr__control plyr__control--forward" role="menuitem" aria-haspopup="true">' +
            '<span>循环<span class="plyr__menu__value">off</span></span>' +
            '</button>';
        var loop_panel_html =
            '<div id="plyr-settings-' + player.id + '-loop" hidden>' +
            '<button type="button" class="plyr__control plyr__control--back"><span aria-hidden="true">循环</span><span class="plyr__sr-only">Go back to previous menu</span></button>' +
            '<div role="menu">' +
            '<button data-plyr="loop" type="button" role="menuitemradio" class="plyr__control plyr__tab-focus" aria-checked="true" value="off"><span>off</span></button>' +
            '<button data-plyr="loop" type="button" role="menuitemradio" class="plyr__control" aria-checked="false" value="on"><span>on</span></button>' +
            '</div></div>';
        var $loop_button = $($.parseHTML(loop_button_html));
        var $loop_panel = $($.parseHTML(loop_panel_html));
        player.elements.settings.buttons.loop = $loop_button[0];
        player.elements.settings.panels.home.firstElementChild.appendChild(player.elements.settings.buttons.loop);
        player.elements.settings.panels.loop = $loop_panel[0];
        player.elements.settings.popup.firstElementChild.appendChild(player.elements.settings.panels.loop);
        $loop_button.on("click", function () {
            player.elements.settings.panels.home.setAttribute("hidden", "");
            $loop_panel.removeAttr("hidden");
        });
        // player.config.classNames.control
        $loop_panel.on("click", "button", function () {
            var _self = $(this);
            if (_self.attr("role") == "menuitemradio") {
                var loopValue = _self.attr("value");
                var loopText = _self.text();
                $loop_panel.find('[role="menuitemradio"]').attr("aria-checked", "false");
                _self.attr("aria-checked", "true");
                $loop_button.find(".plyr__menu__value").text(loopText);
                // set value
                player.loop = loopValue == "on" ? true : false;
            }
            $loop_panel.attr("hidden", "");
            player.elements.settings.panels.home.removeAttribute("hidden");
        });
    };

    // 旋转视频
    var rotateVideo = function (player, angle) {
        var $realVideoDom = config.isAudio ? $("#player-wrapper").find(".audio-cover") : $(player.media);
        if (!config.isAudio && ((currentVideo.width > currentVideo.height) === (currentVideo.cover.width > currentVideo.cover.height))) {
            // $.fn.add函数返回新对象，不修改原来的
            $realVideoDom = $realVideoDom.add(".plyr__poster");
        }
        var clientHeight = document.documentElement.clientHeight;
        var clientWidth = document.documentElement.clientWidth;
        var transform_value, width_value, height_value, margin_top_value, margin_left_value, parent_height_value;
        var eyeRawWidth, eyeRawHeight; // 用户实际看到的宽高
        switch (angle) {
            case "0":
            case "180":
                eyeRawWidth = currentVideo.width;
                eyeRawHeight = currentVideo.height;
                width_value = "";
                height_value = "";
                margin_top_value = "";
                margin_left_value = "";
                parent_height_value = "";
                break;
            case "90":
            case "270":
                eyeRawWidth = currentVideo.height;
                eyeRawHeight = currentVideo.width;
                var newHeight = clientHeight;
                var newWidth = eyeRawWidth / eyeRawHeight * newHeight;
                var newMarginTop;
                var newMarginLeft;
                if (newWidth > clientWidth) {
                    newWidth = clientWidth;
                    newHeight = eyeRawHeight / eyeRawWidth * newWidth;
                    newMarginTop = ((clientHeight - newHeight) / 2) - ((newWidth - newHeight) / 2);
                    newMarginLeft = 0 - ((newHeight - clientWidth) / 2);
                } else {
                    newMarginTop = 0 - ((newWidth - newHeight) / 2);
                    newMarginLeft = (clientWidth - newHeight) / 2;
                }
                width_value = newHeight + "px";
                height_value = newWidth + "px";
                margin_top_value = newMarginTop + "px";
                margin_left_value = newMarginLeft + "px";
                parent_height_value = clientHeight + "px";
                break;
        }
        transform_value = (angle == "0" ? "" : ("rotate(" + angle + "deg)"));
        var before_css_transform_value = $realVideoDom[0].style.transform;
        before_css_transform_value = before_css_transform_value && before_css_transform_value.replace(/\s*rotate\([^)]*\)\s*/g, "");
        if (before_css_transform_value) {
            transform_value = (transform_value ? (transform_value + " ") : "") + before_css_transform_value;
        }
        $realVideoDom.css({
            "transform": transform_value,
            "width": width_value,
            "height": height_value,
            "margin-top": margin_top_value,
            "margin-left": margin_left_value
        });
        $realVideoDom.parent().css("height", parent_height_value);
        if (angle != config.status.videoRotate) {
            ratioChange(eyeRawWidth, eyeRawHeight, angle);
        }
    };

    // 旋转视频按钮
    var initRotateControlHtml = function (player, initAngle) {
        var rotate_button_html =
            '<button data-plyr="settings" type="button" class="plyr__control plyr__control--forward" role="menuitem" aria-haspopup="true">' +
            '<span>旋转<span class="plyr__menu__value">off</span></span>' +
            '</button>';
        var rotate_panel_html =
            '<div id="plyr-settings-' + player.id + '-rotate" hidden>' +
            '<button type="button" class="plyr__control plyr__control--back"><span aria-hidden="true">旋转</span><span class="plyr__sr-only">Go back to previous menu</span></button>' +
            '<div role="menu">' +
            '<button data-plyr="rotate" type="button" role="menuitemradio" class="plyr__control plyr__tab-focus" aria-checked="true" value="0"><span>off</span></button>' +
            '<button data-plyr="rotate" type="button" role="menuitemradio" class="plyr__control" aria-checked="false" value="90"><span>90°</span></button>' +
            '<button data-plyr="rotate" type="button" role="menuitemradio" class="plyr__control" aria-checked="false" value="180"><span>180°</span></button>' +
            '<button data-plyr="rotate" type="button" role="menuitemradio" class="plyr__control" aria-checked="false" value="270"><span>270°</span></button>' +
            '</div></div>';
        var $rotate_button = $($.parseHTML(rotate_button_html));
        var $rotate_panel = $($.parseHTML(rotate_panel_html));
        player.elements.settings.buttons.rotate = $rotate_button[0];
        player.elements.settings.panels.home.firstElementChild.appendChild(player.elements.settings.buttons.rotate);
        player.elements.settings.panels.rotate = $rotate_panel[0];
        player.elements.settings.popup.firstElementChild.appendChild(player.elements.settings.panels.rotate);
        $rotate_button.on("click", function () {
            player.elements.settings.panels.home.setAttribute("hidden", "");
            $rotate_panel.removeAttr("hidden");
        });
        // player.config.classNames.control
        $rotate_panel.on("click", "button", function () {
            var _self = $(this);
            if (_self.attr("role") == "menuitemradio") {
                var angle = _self.attr("value");
                var angleText = _self.text();
                $rotate_panel.find('[role="menuitemradio"]').attr("aria-checked", "false");
                _self.attr("aria-checked", "true");
                $rotate_button.find(".plyr__menu__value").text(angleText);
                rotateVideo(player, angle);
            }
            $rotate_panel.attr("hidden", "");
            player.elements.settings.panels.home.removeAttribute("hidden");
        });
        $(window).resize(function () {
            if (config.status.videoRotate == "90" || config.status.videoRotate == "270") {
                rotateVideo(player, config.status.videoRotate);
            }
        });
        if (initAngle && initAngle != "0") {
            $rotate_panel.find('[role="menuitemradio"][value="' + initAngle + '"]').trigger('click');
        }
    };

    // 翻转视频
    var flipVideo = function (player, flip_directions) {
        var $realVideoDom = config.isAudio ? $("#player-wrapper").find(".audio-cover") : $(player.media);
        if (!config.isAudio && ((currentVideo.width > currentVideo.height) === (currentVideo.cover.width > currentVideo.cover.height))) {
            // $.fn.add函数返回新对象，不修改原来的
            $realVideoDom = $realVideoDom.add(".plyr__poster");
        }
        var css_transform_value = $realVideoDom[0].style.transform ? $realVideoDom[0].style.transform.replace(/\s*rotate[XY]\([^)]*\)\s*/g, "") : "";
        if (flip_directions) {
            for (var i in flip_directions) {
                if (flip_directions[i] == "h") {
                    css_transform_value += " rotateY(180deg)"; // scaleX(-1)
                } else if (flip_directions[i] == "v") {
                    css_transform_value += " rotateX(180deg)"; // scaleY(-1)
                }
            }
        }
        $realVideoDom.css("transform", css_transform_value);
        config.status.videoFlip = flip_directions;
    };

    // 翻转视频按钮
    var initFlipControlHtml = function (player) {
        var flip_button_html =
            '<button data-plyr="settings" type="button" class="plyr__control plyr__control--forward" role="menuitem" aria-haspopup="true">' +
            '<span>镜像<span class="plyr__menu__value">off</span></span>' +
            '</button>';
        var flip_panel_html =
            '<div id="plyr-settings-' + player.id + '-flip" hidden>' +
            '<button type="button" class="plyr__control plyr__control--back"><span aria-hidden="true">镜像</span><span class="plyr__sr-only">Go back to previous menu</span></button>' +
            '<div role="menu">' +
            '<button data-plyr="flip" type="button" role="menuitemradio" class="plyr__control plyr__tab-focus default-value" aria-checked="true" value="0"><span>off</span></button>' +
            '<button data-plyr="flip" type="button" role="menuitemradio" class="plyr__control available-value" aria-checked="false" value="h"><span>水平</span></button>' +
            '<button data-plyr="flip" type="button" role="menuitemradio" class="plyr__control available-value" aria-checked="false" value="v"><span>垂直</span></button>' +
            '</div></div>';
        var $flip_button = $($.parseHTML(flip_button_html));
        var $flip_panel = $($.parseHTML(flip_panel_html));
        player.elements.settings.buttons.flip = $flip_button[0];
        player.elements.settings.panels.home.firstElementChild.appendChild(player.elements.settings.buttons.flip);
        player.elements.settings.panels.flip = $flip_panel[0];
        player.elements.settings.popup.firstElementChild.appendChild(player.elements.settings.panels.flip);
        $flip_button.on("click", function () {
            player.elements.settings.panels.home.setAttribute("hidden", "");
            $flip_panel.removeAttr("hidden");
        });
        // player.config.classNames.control
        $flip_panel.on("click", "button", function () {
            var _self = $(this);
            if (_self.attr("role") == "menuitemradio") {
                var filp_direction = _self.attr("value");
                var filp_text = _self.text();
                if (filp_direction == "0") {
                    $flip_panel.find('[role="menuitemradio"]').attr("aria-checked", "false");
                    _self.attr("aria-checked", "true");
                } else {
                    if (_self.attr("aria-checked") == "true") {
                        _self.attr("aria-checked", "false");
                        var $selectAvailable = $flip_panel.find('[role="menuitemradio"][aria-checked="true"].available-value');
                        if ($selectAvailable.length == 0) {
                            filp_text = $flip_panel.find('[role="menuitemradio"][value="0"]').attr("aria-checked", "true").text();
                        } else {
                            filp_text = $selectAvailable.eq(0).text();
                        }
                    } else {
                        $flip_panel.find('[role="menuitemradio"][value="0"]').attr("aria-checked", "false");
                        _self.attr("aria-checked", "true");
                    }
                }
                $flip_button.find(".plyr__menu__value").text(filp_text);
                var filp_directions = [];
                $flip_panel.find('[role="menuitemradio"][aria-checked="true"]').each(function (i, option) {
                    filp_directions.push(option.getAttribute("value"));
                });
                flipVideo(player, filp_directions, config.status.videoRotate);
            }
            $flip_panel.attr("hidden", "");
            player.elements.settings.panels.home.removeAttribute("hidden");
        });
    };

    // 站内打开视频详情页按钮
    var initOpenInSiteControlHtml = function (player, video) {
        var $pip_button = $(player.elements.buttons.pip);
        var pip_icon_url_prefix = ($("#sprite-plyr").length == 0 ? player.config.iconUrl : "");
        $pip_button.find("svg > use").attr("href", pip_icon_url_prefix + "#plyr-logo-youtube");
        var open_in_site_html = '<button type="button" class="plyr__control" data-plyr="open_in_site">' +
            '<svg role="presentation" focusable="false"><use xlink:href="' + pip_icon_url_prefix + "#plyr-pip" + '"></use></svg>' +
            '<span class="plyr__tooltip">站内打开视频详情页</span></button>';
        var $open_in_site_button = $($.parseHTML(open_in_site_html));
        player.elements.buttons.open_in_site = $open_in_site_button[0];
        player.elements.settings.menu.after(player.elements.buttons.open_in_site);
        $(player.elements.controls).on("click", '[data-plyr="open_in_site"]', function () {
            window.open("video/detail/" + video.video_id);
        });
    };

    // 切换网页全屏
    var switchWebFullscreen = function (player, video, isSwitchToOn) {
        var $video_iframe_in_top = window.frameElement ? $(window.frameElement) : null;
        if ($video_iframe_in_top) {
            if (isSwitchToOn) {
                player.web_fullscreen = true;
                player.backIframeCss = $video_iframe_in_top.attr("style");
                $video_iframe_in_top.css({
                    "position": "fixed",
                    "top": "0",
                    "left": "0",
                    "width": "100%",
                    "height": "100%",
                    "padding": "0px",
                    "margin": "0px",
                    "z-index": "10000"
                });
                if (player.fullscreen.enabled && player.fullscreen.active) {
                    player.fullscreen.exit();
                }
            } else {
                $video_iframe_in_top.css({
                    "position": "",
                    "top": "",
                    "left": "",
                    "width": "",
                    "height": "",
                    "padding": "",
                    "margin": "",
                    "z-index": ""
                });
                player.backIframeCss && $video_iframe_in_top.attr("style", player.backIframeCss);
                player.web_fullscreen = false;
            }
        } else if (!isSwitchToOn) {
            document.location.href = "video/detail/" + video.video_id;
        }
    };

    // 切换网页全屏按钮
    var initWebFullscreenControlHtml = function (player, video) {
        var web_fullscreen_html = '<button type="button" class="plyr__control" data-plyr="web_fullscreen">' +
            '<svg class="icon--not-pressed player-web-fullscreen-on" role="presentation" focusable="false" viewBox="2 2 17 17">' +
            '<path d="M18 4H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM8 15.5a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-' +
            '3a.5.5 0 01.5-.5h1a.5.5 0 01.5.5V14h1.5a.5.5 0 01.5.5v1zm0-8a.5.5 0 01-.5.5H6v1.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-3a.5.5 ' +
            '0 01.5-.5h3a.5.5 0 01.5.5v1zm10 8a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H16v-1.5a.5.5 0 01.5-.5h1a.5.5 0 01.' +
            '5.5v3zm0-6a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5V8h-1.5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3z"></path>' +
            '</svg>' +
            '<svg class="icon--pressed player-web-fullscreen-off" role="presentation" focusable="false" viewBox="2 2 17 17">' +
            '<path d="M18 4H4a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM8 15.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5V14H4' +
            '.5a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v3zm0-6a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-1a.5.5 0 01.5-.5H6V6.5a.5.5 ' +
            '0 01.5-.5h1a.5.5 0 01.5.5v3zm10 4a.5.5 0 01-.5.5H16v1.5a.5.5 0 01-.5.5h-1a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1z' +
            'm0-4a.5.5 0 01-.5.5h-3a.5.5 0 01-.5-.5v-3a.5.5 0 01.5-.5h1a.5.5 0 01.5.5V8h1.5a.5.5 0 01.5.5v1z"></path>' +
            '</svg>' +
            '<span class="label--not-pressed plyr__tooltip player-web-fullscreen-on-tooltip">打开网页全屏</span>' +
            '<span class="label--pressed plyr__tooltip player-web-fullscreen-off-tooltip">退出网页全屏</span>' +
            '</button>';
        var $web_fullscreen_button = $($.parseHTML(web_fullscreen_html));
        player.elements.buttons.web_fullscreen = $web_fullscreen_button[0];
        $(player.elements.buttons.download).before(player.elements.buttons.web_fullscreen);
        $(player.elements.controls).on("click", '[data-plyr="web_fullscreen"]', function () {
            var isSwitchToOn = $web_fullscreen_button.find(".player-web-fullscreen-on").attr("class").indexOf("icon--not-pressed") != -1;
            switchWebFullscreen(player, video, isSwitchToOn);
            if (isSwitchToOn) {
                $web_fullscreen_button.find(".player-web-fullscreen-on").attr("class", "icon--pressed player-web-fullscreen-on");
                $web_fullscreen_button.find(".player-web-fullscreen-off").attr("class", "icon--not-pressed player-web-fullscreen-off");
                $web_fullscreen_button.find(".player-web-fullscreen-on-tooltip").removeClass("label--not-pressed").addClass("label--pressed");
                $web_fullscreen_button.find(".player-web-fullscreen-off-tooltip").removeClass("label--pressed").addClass("label--not-pressed");
            } else {
                $web_fullscreen_button.find(".player-web-fullscreen-on").attr("class", "icon--not-pressed player-web-fullscreen-on");
                $web_fullscreen_button.find(".player-web-fullscreen-off").attr("class", "icon--pressed player-web-fullscreen-off");
                $web_fullscreen_button.find(".player-web-fullscreen-on-tooltip").removeClass("label--pressed").addClass("label--not-pressed");
                $web_fullscreen_button.find(".player-web-fullscreen-off-tooltip").removeClass("label--not-pressed").addClass("label--pressed");
            }
        });
        if (window.frameElement == null) {
            $web_fullscreen_button.click();
        }
    };

    var localVideoConfig = common_utils.getLocalConfig('album', {
       'video_page': {
           'embed': {
               'audio_use_fake_video': true
           }
       }
    }).video_page;
    request.loadVideo($('#video_info_form input[name="video_id"]').val(), function (video) {
        currentVideo = video;
        var playerWrapper = $("#player-wrapper");
        if (video.source_type != 2) {   // 类型为链接
            var player = null;
            var isAudio;
            if (localVideoConfig.embed.audio_use_fake_video) {  // 是否用video标签播放audio
                isAudio = false;
            } else {
                isAudio = (video.video_type == "video/mp3");
            }
            config.isAudio = isAudio;
            // 字幕
            var tracksHtml = "";
            var defaultTrackLang = "auto";
            if (video.subtitles && video.subtitles.length > 0) {
                video.subtitles.forEach(function (subtitle, i) {
                    tracksHtml += '<track kind="subtitles" label="' + subtitle.name + '" src="' + subtitle.path + '" srclang="' + subtitle.lang + '"/>';
                    if (i == 0) {
                        defaultTrackLang = subtitle.lang;
                    }
                });
            }
            if (!isAudio) {  // 视频
                var $video_player = $("#site-player");
                // calcVideoPix($video_player);  // 发现并不需要计算，因为我在外面计算好了，100vh, 100vw即可
                $video_player.attr("poster", video.cover.path);
                if (tracksHtml) {
                    $video_player.append(tracksHtml);
                }
                player = currentPlayer = new Plyr($video_player, {
                    title: video.name,
                    poster: video.cover.path,
                    iconUrl: config.path_params.staticPath + "lib/plyr/plyr.svg",
                    blankVideo: config.path_params.staticPath + "lib/plyr/blank.mp4",
                    disableContextMenu: false,
                    controls: ["play-large", "play", "progress", "current-time", "duration", "volume", "captions", "settings", "pip", "airplay", "fullscreen", "download"],
                    // settings: ['captions', 'quality', 'speed', 'loop'],
                    tooltips: {"controls": true, "seek": true},
                    // ratio: video.height + ":" + video.width,
                    invertTime: false,
                    captions: {"active": true, "language": defaultTrackLang, "update": false}
                });
                // $(window).resize(function () {
                //     calcVideoPix($("#site-player"));
                // });
            } else {
                playerWrapper.html('<div class="audio-wrapper">' +
                    '<div class="audio-cover" style="background-image: url(' + (video.cover.path) + ');"></div>' +
                    '<button type="button" class="audio-play-btn">' +
                    '<svg width="100%" height="100%"><path d="M15.562 8.1L3.87.225c-.818-.562-1.87 0-1.87.9v15.75c0 .9 1.052 1.462 1.87.9L15.563 9.9c.584-.45.584-1.35 0-1.8z"></path></svg>' +
                    '<span>Play</span></button>' +
                    '<audio class="audio-player" id="site-player">' + tracksHtml + '</audio></div>');
                player = currentPlayer = new Plyr($("#site-player"), {
                    title: video.name,
                    iconUrl: config.path_params.staticPath + "lib/plyr/plyr.svg",
                    blankVideo: config.path_params.staticPath + "lib/plyr/blank.mp4",
                    disableContextMenu: false,
                    controls: ["play-large", "play", "progress", "current-time", "duration", "volume", "captions", "settings", "pip", "airplay", "download"],
                    // settings: ['captions', 'quality', 'speed', 'loop'],
                    tooltips: {"controls": true, "seek": true},
                    invertTime: false,
                    captions: {"active": true, "language": defaultTrackLang, "update": false}
                });
            }
            initIframeSettingInParentPage(player, video);
            bindVideoControlEvent(playerWrapper, player, video);
            document.getElementById("site-player").src = video.path;
        } else {    // 类型为嵌入
            playerWrapper.html(video.code);
            var iframeNode = playerWrapper.children().eq(0);
            if (iframeNode && iframeNode.length > 0) {
                iframeNode.prop("id", "site-player");
                var videoHasClickedFunc = function (contentDocument) {
                    $(contentDocument.body).click(function () {
                        videoHasPlayed();
                    });
                };
                if (iframeNode.prop("contentDocument") && iframeNode.prop("contentDocument").readyState == "complete") {
                    videoHasClickedFunc(iframeNode.prop("contentDocument"));
                } else {
                    iframeNode.load(function () { // 等子iframe加载完毕
                        videoHasClickedFunc(this.contentDocument);
                    });
                }
            }
            videoDomReady();
            // 去黑边
            // calcVideoPix(playerWrapper.children(0));
            // $(window).resize(function () {
            //     calcVideoPix($("#player-wrapper").children(0));
            // });
        }
        // document.title = video.name + document.title;
        // $('head meta[name="description"]').attr("content", video.description);
        // $('head meta[name="keywords"]').attr("content", video.tags + $('head meta[name="keywords"]').attr("content"));
        videoPageReady();
        onVideoHasPlayed(function () {
            request.saveVideoHasPlayed(currentVideo.video_id);
        });
    });

    // 视频页面加载完毕
    window.onVideoPageReady = function (call) {
        config.callback.video_page_ready_calls.push(call);
        if (config.status.videoPageReady) {
            call.call(currentVideo, currentPlayer);
        }
        return window;
    };

    // 视频控件、大小加载完毕
    window.onVideoDomReady = function (call) {
        config.callback.video_dom_ready_calls.push(call);
        if (config.status.videoDomReady) {
            call.call(currentVideo, currentPlayer);
        }
        return window;
    };

    // 视频被播放过
    window.onVideoHasPlayed = function (call) {
        config.callback.video_has_played_calls.push(call);
        if (config.status.videoHasPlayed) {
            call.call(currentVideo, currentPlayer);
        }
        return window;
    };

    // 播放状态状态改变 - playing / pause / ended
    window.onVideoPlayStatusChange = function (call) {
        config.callback.video_play_status_change_calls.push(call);
        if (config.status.videoPlayStatus != "pause") {
            call.call(currentVideo, config.status.videoPlayStatus);
        }
        return window;
    };

    // 活跃状态改变
    window.onActivityChange = function (call) {
        config.callback.activity_change_calls.push(call);
        if (config.status.userActivity == false) {
            call.call(currentVideo, config.status.userActivity, currentPlayer);
        }
        return window;
    };

    // 视频显示比例改变
    window.onRatioChange = function (call) {
        config.callback.ratio_change_calls.push(call);
        if (config.status.videoRotate && config.status.videoRotate != '0' && currentPlayer) {
            var eyeRawWidth, eyeRawHeight;
            switch (config.status.videoRotate) {
                case "0":
                case "180":
                    eyeRawWidth = currentVideo.width;
                    eyeRawHeight = currentVideo.height;
                    break;
                case "90":
                case "270":
                    eyeRawWidth = currentVideo.height;
                    eyeRawHeight = currentVideo.width;
            }
            call.call(currentVideo, eyeRawWidth, eyeRawHeight, config.status.videoRotate, currentPlayer);
        }
        return window;
    };

})
;